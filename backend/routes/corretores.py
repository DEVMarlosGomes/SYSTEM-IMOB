"""Corretor stats and commission management routes."""
from __future__ import annotations

from collections import defaultdict
from datetime import date

from fastapi import APIRouter, Depends, HTTPException

from core import AuthUser, db, get_current_user, get_tenant_filter, now_utc, require_roles, serialize
from models import Comissao, ComissaoCreate, ComissaoUpdate, UserPublic

router = APIRouter(prefix="/corretores", tags=["corretores"])


@router.get("/{corretor_id}/stats")
async def corretor_stats(
    corretor_id: str,
    current: AuthUser = Depends(require_roles("admin", "superadmin")),
):
    flt = await get_tenant_filter(current)

    corretor = await db.users.find_one({"id": corretor_id}, {"_id": 0, "password_hash": 0})
    if not corretor or corretor.get("tenant_id") != current.tenant_id:
        raise HTTPException(404, "Corretor não encontrado.")

    # Properties
    props = await db.properties.find({**flt, "corretor_id": corretor_id}, {"_id": 0}).to_list(5000)
    by_status: dict[str, int] = defaultdict(int)
    for p in props:
        by_status[p.get("status", "disponivel")] += 1

    # Appointments
    appts = await db.appointments.find({**flt, "corretor_id": corretor_id}, {"_id": 0}).to_list(5000)
    appt_by_status: dict[str, int] = defaultdict(int)
    for a in appts:
        appt_by_status[a.get("status", "agendado")] += 1

    # Commissions
    comissoes = await db.comissoes.find({**flt, "corretor_id": corretor_id}, {"_id": 0}).to_list(5000)
    total_pendente = sum(c["valor"] for c in comissoes if c.get("status") == "pendente")
    total_pago = sum(c["valor"] for c in comissoes if c.get("status") == "pago")

    # Commissions by month (last 12 months)
    today = date.today()
    monthly: list[dict] = []
    cur = today.replace(day=1)
    for _ in range(12):
        key = cur.strftime("%Y-%m")
        pendente = sum(c["valor"] for c in comissoes if c.get("mes_referencia") == key and c.get("status") == "pendente")
        pago = sum(c["valor"] for c in comissoes if c.get("mes_referencia") == key and c.get("status") == "pago")
        monthly.append({"mes": key, "pendente": pendente, "pago": pago})
        if cur.month == 1:
            cur = cur.replace(year=cur.year - 1, month=12)
        else:
            cur = cur.replace(month=cur.month - 1)
    monthly.reverse()

    # Recent appointments (last 20)
    recent_appts = sorted(appts, key=lambda a: (a["data"], a["hora_inicio"]), reverse=True)[:20]
    # Attach property title
    prop_ids = list({a["property_id"] for a in recent_appts if a.get("property_id")})
    if prop_ids:
        props_map = {p["id"]: p for p in await db.properties.find({"id": {"$in": prop_ids}}, {"_id": 0, "id": 1, "titulo": 1, "endereco": 1}).to_list(100)}
        for a in recent_appts:
            a["property"] = props_map.get(a.get("property_id", ""))

    return serialize({
        "corretor": corretor,
        "kpis": {
            "imoveis_captados": len(props),
            "imoveis_alugados": by_status["alugado"],
            "imoveis_disponiveis": by_status["disponivel"],
            "agendamentos_total": len(appts),
            "agendamentos_realizados": appt_by_status["realizado"],
            "agendamentos_pendentes": appt_by_status["agendado"],
            "agendamentos_cancelados": appt_by_status["cancelado"],
            "comissao_pendente": total_pendente,
            "comissao_paga": total_pago,
        },
        "comissao_mensal": monthly,
        "agendamentos_recentes": recent_appts,
    })


# ── Comissões CRUD ──────────────────────────────────────────────────────────

@router.get("/{corretor_id}/comissoes")
async def list_comissoes(
    corretor_id: str,
    current: AuthUser = Depends(require_roles("admin", "superadmin")),
):
    flt = await get_tenant_filter(current)
    rows = await db.comissoes.find({**flt, "corretor_id": corretor_id}, {"_id": 0}).sort("data_prevista", -1).to_list(1000)
    return serialize(rows)


@router.post("/{corretor_id}/comissoes")
async def create_comissao(
    corretor_id: str,
    payload: ComissaoCreate,
    current: AuthUser = Depends(require_roles("admin", "superadmin")),
):
    if payload.corretor_id != corretor_id:
        raise HTTPException(400, "corretor_id no body deve coincidir com a URL.")
    flt = await get_tenant_filter(current)
    corretor = await db.users.find_one({"id": corretor_id, **flt}, {"_id": 0})
    if not corretor:
        raise HTTPException(404, "Corretor não encontrado.")

    doc = Comissao(
        tenant_id=current.tenant_id,
        corretor_id=corretor_id,
        contrato_id=payload.contrato_id,
        imovel_id=payload.imovel_id,
        tipo=payload.tipo,
        descricao=payload.descricao,
        percentual=payload.percentual,
        valor_base=payload.valor_base,
        valor=payload.valor,
        mes_referencia=payload.mes_referencia,
        data_prevista=payload.data_prevista,
        observacoes=payload.observacoes,
    ).model_dump()
    doc["created_at"] = now_utc().isoformat()
    await db.comissoes.insert_one(doc)
    return serialize(doc)


@router.put("/comissoes/{comissao_id}")
async def update_comissao(
    comissao_id: str,
    payload: ComissaoUpdate,
    current: AuthUser = Depends(require_roles("admin", "superadmin")),
):
    existing = await db.comissoes.find_one({"id": comissao_id}, {"_id": 0})
    if not existing or existing.get("tenant_id") != current.tenant_id:
        raise HTTPException(404, "Comissão não encontrada.")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates:
        await db.comissoes.update_one({"id": comissao_id}, {"$set": updates})
    updated = await db.comissoes.find_one({"id": comissao_id}, {"_id": 0})
    return serialize(updated)


@router.delete("/comissoes/{comissao_id}")
async def delete_comissao(
    comissao_id: str,
    current: AuthUser = Depends(require_roles("admin", "superadmin")),
):
    existing = await db.comissoes.find_one({"id": comissao_id}, {"_id": 0})
    if not existing or existing.get("tenant_id") != current.tenant_id:
        raise HTTPException(404, "Comissão não encontrada.")
    await db.comissoes.delete_one({"id": comissao_id})
    return {"ok": True}
