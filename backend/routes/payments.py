"""Payment + payout routes."""
from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from core import (
    AuthUser,
    add_business_days,
    db,
    get_current_user,
    get_tenant_filter,
    now_utc,
    require_roles,
    serialize,
)
from models import PaymentUpdate
from routes.notifications import create_notification

router = APIRouter(prefix="/payments", tags=["payments"])


async def _enrich_payments(rows: list[dict]) -> list[dict]:
    locat_ids = list({r["locatario_id"] for r in rows})
    locador_ids = list({r["locador_id"] for r in rows})
    contract_ids = list({r["contract_id"] for r in rows})
    user_ids = list(set(locat_ids + locador_ids))
    users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0, "id": 1, "nome": 1, "telefone": 1, "email": 1, "role": 1}).to_list(500) if user_ids else []
    by_user = {u["id"]: u for u in users}
    contracts = await db.contracts.find({"id": {"$in": contract_ids}}, {"_id": 0}).to_list(500) if contract_ids else []
    by_c = {c["id"]: c for c in contracts}
    prop_ids = list({c["property_id"] for c in contracts})
    props = await db.properties.find({"id": {"$in": prop_ids}}, {"_id": 0, "id": 1, "titulo": 1, "endereco": 1, "bairro": 1}).to_list(500) if prop_ids else []
    by_p = {p["id"]: p for p in props}
    for r in rows:
        r["locatario"] = by_user.get(r["locatario_id"])
        r["locador"] = by_user.get(r["locador_id"])
        c = by_c.get(r["contract_id"]) or {}
        r["contract"] = c
        r["property"] = by_p.get(c.get("property_id"))
    return rows


@router.get("")
async def list_payments(
    status_locatario: Optional[str] = None,
    status_locador: Optional[str] = None,
    dia_vencimento: Optional[int] = None,
    current: AuthUser = Depends(get_current_user),
):
    flt = await get_tenant_filter(current)
    if current.role == "locatario":
        flt["locatario_id"] = current.id
    elif current.role == "locador":
        flt["locador_id"] = current.id
    elif current.role == "corretor":
        # corretor sees payments of properties he manages -> via contracts
        contracts = await db.contracts.find({"corretor_id": current.id}, {"_id": 0, "id": 1}).to_list(1000)
        flt["contract_id"] = {"$in": [c["id"] for c in contracts]}
    if status_locatario:
        flt["status_locatario"] = status_locatario
    if status_locador:
        flt["status_locador"] = status_locador
    rows = await db.payments.find(flt, {"_id": 0}).sort("data_vencimento", 1).to_list(5000)
    if dia_vencimento:
        rows = [r for r in rows if r["data_vencimento"].split("-")[2] == f"{dia_vencimento:02d}"]
    rows = await _enrich_payments(rows)
    # auto-flag overdue
    today = date.today().isoformat()
    for r in rows:
        if r["status_locatario"] == "pendente" and r["data_vencimento"] < today:
            r["status_locatario"] = "atrasado"
    return serialize(rows)


@router.get("/kanban")
async def kanban(
    mes_referencia: Optional[str] = None,
    current: AuthUser = Depends(require_roles("admin", "superadmin", "corretor")),
):
    """Return payments grouped by dia de vencimento (5/10/15/20/25/30)."""
    flt = await get_tenant_filter(current)
    if current.role == "corretor":
        contracts = await db.contracts.find({"corretor_id": current.id}, {"_id": 0, "id": 1}).to_list(1000)
        flt["contract_id"] = {"$in": [c["id"] for c in contracts]}
    if mes_referencia:
        flt["mes_referencia"] = mes_referencia
    rows = await db.payments.find(flt, {"_id": 0}).sort("data_vencimento", 1).to_list(5000)
    rows = await _enrich_payments(rows)
    today = date.today().isoformat()
    out = {d: {"a_cobrar": [], "pago": [], "atrasado": []} for d in (5, 10, 15, 20, 25, 30)}
    for r in rows:
        try:
            day = int(r["data_vencimento"].split("-")[2])
        except Exception:
            continue
        bucket = None
        for d in (5, 10, 15, 20, 25, 30):
            if day <= d:
                bucket = d
                break
        if bucket is None:
            bucket = 30
        status = r["status_locatario"]
        if status == "pago":
            out[bucket]["pago"].append(r)
        elif status in ("pendente", "comprovante_enviado") and r["data_vencimento"] < today:
            r["status_locatario"] = "atrasado"
            out[bucket]["atrasado"].append(r)
        elif status == "atrasado":
            out[bucket]["atrasado"].append(r)
        else:
            out[bucket]["a_cobrar"].append(r)
    return serialize(out)


@router.post("/{payment_id}/upload-comprovante")
async def set_comprovante_locatario(payment_id: str, body: dict, current: AuthUser = Depends(get_current_user)):
    url = body.get("url")
    if not url:
        raise HTTPException(400, "url obrigatorio.")
    p = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Pagamento nao encontrado.")
    if current.role == "locatario" and p["locatario_id"] != current.id:
        raise HTTPException(403, "Acesso negado.")
    await db.payments.update_one({"id": payment_id}, {"$set": {
        "comprovante_locatario_url": url,
        "status_locatario": "comprovante_enviado",
    }})
    # Notify all admins of this tenant that a comprovante was submitted
    admins = await db.users.find(
        {"tenant_id": p.get("tenant_id"), "role": {"$in": ["admin", "superadmin"]}},
        {"_id": 0, "id": 1},
    ).to_list(50)
    locatario = await db.users.find_one({"id": p["locatario_id"]}, {"_id": 0, "nome": 1})
    locatario_nome = (locatario or {}).get("nome", "Locatário")
    for admin in admins:
        await create_notification(
            tenant_id=p.get("tenant_id", ""),
            recipient_id=admin["id"],
            type="comprovante_enviado",
            title="Comprovante enviado",
            body=f"{locatario_nome} enviou comprovante de pagamento — {p.get('mes_referencia', '')}.",
            link="/admin/pagamentos",
        )
    return serialize(await db.payments.find_one({"id": payment_id}, {"_id": 0}))


@router.post("/{payment_id}/aprovar")
async def approve_payment(payment_id: str, current: AuthUser = Depends(require_roles("admin", "superadmin"))):
    p = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Pagamento nao encontrado.")
    payout_date = add_business_days(date.today(), 5)
    await db.payments.update_one({"id": payment_id}, {"$set": {
        "status_locatario": "pago",
        "data_pagamento": date.today().isoformat(),
        "status_locador": "em_esteira",
        "data_repasse_prevista": payout_date.isoformat(),
    }})
    # Notify locatário and locador of the approval
    await create_notification(
        tenant_id=p.get("tenant_id", ""),
        recipient_id=p["locatario_id"],
        type="pagamento_aprovado",
        title="Pagamento aprovado",
        body=f"Seu pagamento de {p.get('mes_referencia', '')} foi confirmado. Repasse previsto: {payout_date.isoformat()}.",
        link="/locatario/pagamentos",
    )
    await create_notification(
        tenant_id=p.get("tenant_id", ""),
        recipient_id=p["locador_id"],
        type="pagamento_aprovado",
        title="Repasse agendado",
        body=f"O aluguel de {p.get('mes_referencia', '')} foi pago. Repasse previsto para {payout_date.isoformat()}.",
        link="/locador/portal",
    )
    return serialize(await db.payments.find_one({"id": payment_id}, {"_id": 0}))


@router.post("/{payment_id}/rejeitar")
async def reject_payment(payment_id: str, body: dict, current: AuthUser = Depends(require_roles("admin", "superadmin"))):
    motivo = body.get("motivo") or "Comprovante inválido ou ilegível."
    p = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Pagamento nao encontrado.")
    await db.payments.update_one({"id": payment_id}, {"$set": {
        "status_locatario": "rejeitado",
        "motivo_rejeicao": motivo,
    }})
    await create_notification(
        tenant_id=p.get("tenant_id", ""),
        recipient_id=p["locatario_id"],
        type="info",
        title="Comprovante rejeitado",
        body=f"Seu comprovante de {p.get('mes_referencia', '')} foi rejeitado. Motivo: {motivo}. Por favor, envie novamente.",
        link="/locatario/pagamentos",
    )
    return serialize(await db.payments.find_one({"id": payment_id}, {"_id": 0}))


@router.put("/{payment_id}")
async def update_payment(payment_id: str, payload: PaymentUpdate, current: AuthUser = Depends(require_roles("admin", "superadmin"))):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, "Nada a atualizar.")
    res = await db.payments.find_one_and_update({"id": payment_id}, {"$set": updates}, return_document=True)
    if not res:
        raise HTTPException(404, "Pagamento nao encontrado.")
    return serialize({**res})
