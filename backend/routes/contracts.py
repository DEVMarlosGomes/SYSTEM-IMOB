"""Contract routes: create contract (auto-generates payments) + status changes."""
from __future__ import annotations

from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from core import (
    AuthUser,
    db,
    get_current_user,
    get_tenant_filter,
    next_business_day,
    now_utc,
    require_roles,
    serialize,
)
from models import Contract, ContractCreate, Payment

router = APIRouter(prefix="/contracts", tags=["contracts"])

VALID_DUE_DAYS = {5, 10, 15, 20, 25, 30}


def _months_between(start: date, end: date) -> list[date]:
    out = []
    cur = start.replace(day=1)
    last = end.replace(day=1)
    while cur <= last:
        out.append(cur)
        if cur.month == 12:
            cur = cur.replace(year=cur.year + 1, month=1)
        else:
            cur = cur.replace(month=cur.month + 1)
    return out


@router.get("")
async def list_contracts(current: AuthUser = Depends(get_current_user)):
    flt = await get_tenant_filter(current)
    if current.role == "corretor":
        flt["corretor_id"] = current.id
    elif current.role == "locatario":
        flt["locatario_id"] = current.id
    elif current.role == "locador":
        flt["locador_id"] = current.id
    rows = await db.contracts.find(flt, {"_id": 0}).sort("created_at", -1).to_list(1000)
    # enrich with property + parties
    prop_ids = list({r["property_id"] for r in rows})
    props = await db.properties.find({"id": {"$in": prop_ids}}, {"_id": 0}).to_list(500) if prop_ids else []
    by_prop = {p["id"]: p for p in props}
    user_ids = list({u for r in rows for u in (r.get("locatario_id"), r.get("locador_id"), r.get("corretor_id")) if u})
    users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0, "id": 1, "nome": 1, "telefone": 1, "email": 1, "role": 1}).to_list(500) if user_ids else []
    by_user = {u["id"]: u for u in users}
    for r in rows:
        r["property"] = by_prop.get(r["property_id"])
        r["locatario"] = by_user.get(r.get("locatario_id"))
        r["locador"] = by_user.get(r.get("locador_id"))
        r["corretor"] = by_user.get(r.get("corretor_id"))
    return serialize(rows)


@router.get("/{contract_id}")
async def get_contract(contract_id: str, current: AuthUser = Depends(get_current_user)):
    c = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Contrato nao encontrado.")
    if current.role == "corretor" and c["corretor_id"] != current.id and current.role != "admin":
        raise HTTPException(403, "Acesso negado.")
    p = await db.properties.find_one({"id": c["property_id"]}, {"_id": 0})
    owner = await db.owner_profiles.find_one({"id": c.get("owner_profile_id") or (p or {}).get("owner_profile_id")}, {"_id": 0}) if p else None
    locatario = await db.users.find_one({"id": c["locatario_id"]}, {"_id": 0, "password_hash": 0})
    locador = await db.users.find_one({"id": c["locador_id"]}, {"_id": 0, "password_hash": 0})
    corretor = await db.users.find_one({"id": c["corretor_id"]}, {"_id": 0, "password_hash": 0})
    tenant = await db.tenants.find_one({"id": c["tenant_id"]}, {"_id": 0})
    c.update({
        "property": p,
        "owner_profile": owner,
        "locatario": locatario,
        "locador": locador,
        "corretor": corretor,
        "tenant": tenant,
    })
    return serialize(c)


@router.post("")
async def create_contract(payload: ContractCreate, current: AuthUser = Depends(require_roles("corretor", "admin", "superadmin"))):
    if payload.dia_vencimento not in VALID_DUE_DAYS:
        raise HTTPException(400, "Dia de vencimento invalido. Use 5, 10, 15, 20, 25 ou 30.")
    prop = await db.properties.find_one({"id": payload.property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(404, "Imovel nao encontrado.")
    if not current.tenant_id:
        raise HTTPException(400, "Imobiliaria nao definida.")
    if current.role == "corretor" and prop["corretor_id"] != current.id:
        raise HTTPException(403, "Voce so pode criar contratos para seus imoveis.")

    di = date.fromisoformat(payload.data_inicio)
    df = date.fromisoformat(payload.data_fim)
    if df <= di:
        raise HTTPException(400, "Data final deve ser posterior a data inicial.")

    contract = Contract(
        tenant_id=current.tenant_id,
        property_id=payload.property_id,
        locatario_id=payload.locatario_id,
        locador_id=payload.locador_id,
        corretor_id=prop["corretor_id"],
        owner_profile_id=prop.get("owner_profile_id"),
        data_inicio=payload.data_inicio,
        data_fim=payload.data_fim,
        valor_aluguel=payload.valor_aluguel,
        dia_vencimento=payload.dia_vencimento,
        indice_reajuste=payload.indice_reajuste or "IGPM",
        clausulas=payload.clausulas,
        status="ativo",
    ).model_dump()
    contract["created_at"] = now_utc().isoformat()
    await db.contracts.insert_one(contract)

    # link locatario/locador to corretor for contact card visibility
    await db.users.update_many(
        {"id": {"$in": [payload.locatario_id, payload.locador_id]}},
        {"$set": {"corretor_id": prop["corretor_id"]}},
    )

    # Mark property as 'alugado'
    await db.properties.update_one({"id": payload.property_id}, {"$set": {"status": "alugado"}})

    # Generate monthly payments
    months = _months_between(di, df)
    for m in months:
        try:
            due = m.replace(day=payload.dia_vencimento)
        except ValueError:
            due = m.replace(day=28)
        due = next_business_day(due)
        mes_ref = m.strftime("%Y-%m")
        pay = Payment(
            tenant_id=current.tenant_id,
            contract_id=contract["id"],
            locatario_id=payload.locatario_id,
            locador_id=payload.locador_id,
            mes_referencia=mes_ref,
            valor=payload.valor_aluguel,
            data_vencimento=due.isoformat(),
        ).model_dump()
        pay["created_at"] = now_utc().isoformat()
        await db.payments.update_one(
            {"contract_id": contract["id"], "mes_referencia": mes_ref},
            {"$setOnInsert": pay},
            upsert=True,
        )
    return serialize(contract)


@router.post("/{contract_id}/encerrar")
async def encerrar_contract(contract_id: str, current: AuthUser = Depends(require_roles("corretor", "admin", "superadmin"))):
    c = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Contrato nao encontrado.")
    await db.contracts.update_one({"id": contract_id}, {"$set": {"status": "encerrado"}})
    await db.properties.update_one({"id": c["property_id"]}, {"$set": {"status": "disponivel"}})
    return {"ok": True}


@router.put("/{contract_id}/pdf-url")
async def set_pdf_url(contract_id: str, body: dict, current: AuthUser = Depends(get_current_user)):
    url = body.get("pdf_url")
    if not url:
        raise HTTPException(400, "pdf_url obrigatorio.")
    await db.contracts.update_one({"id": contract_id}, {"$set": {"pdf_url": url}})
    return {"ok": True}
