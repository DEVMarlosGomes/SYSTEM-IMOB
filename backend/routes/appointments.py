"""Appointment routes with conflict detection."""
from __future__ import annotations

from datetime import datetime, time, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from core import AuthUser, db, get_current_user, get_tenant_filter, now_utc, require_roles, serialize
from models import Appointment, AppointmentUpsert

router = APIRouter(prefix="/appointments", tags=["appointments"])


def _parse_time(s: str) -> time:
    return datetime.strptime(s, "%H:%M").time()


def _add_hour(hora: str) -> str:
    t = _parse_time(hora)
    dt = datetime.combine(datetime.today(), t) + timedelta(hours=1)
    return dt.strftime("%H:%M")


async def _has_conflict(corretor_id: str, data: str, hora_inicio: str, hora_fim: str, exclude_id: Optional[str] = None) -> bool:
    flt = {"corretor_id": corretor_id, "data": data, "status": {"$ne": "cancelado"}}
    if exclude_id:
        flt["id"] = {"$ne": exclude_id}
    same_day = await db.appointments.find(flt, {"_id": 0}).to_list(50)
    h0 = _parse_time(hora_inicio)
    h1 = _parse_time(hora_fim)
    for a in same_day:
        a0 = _parse_time(a["hora_inicio"])
        a1 = _parse_time(a["hora_fim"])
        if h0 < a1 and a0 < h1:
            return True
    return False


@router.get("")
async def list_appointments(
    corretor_id: Optional[str] = None,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    current: AuthUser = Depends(get_current_user),
):
    flt = await get_tenant_filter(current)
    if current.role == "corretor":
        flt["corretor_id"] = current.id
    elif corretor_id:
        flt["corretor_id"] = corretor_id
    if data_inicio and data_fim:
        flt["data"] = {"$gte": data_inicio, "$lte": data_fim}
    rows = await db.appointments.find(flt, {"_id": 0}).sort([("data", 1), ("hora_inicio", 1)]).to_list(5000)
    # attach corretor name for admin views
    ids = list({r["corretor_id"] for r in rows})
    if ids:
        users = await db.users.find({"id": {"$in": ids}}, {"_id": 0, "id": 1, "nome": 1}).to_list(100)
        by_id = {u["id"]: u for u in users}
        for r in rows:
            r["corretor"] = by_id.get(r["corretor_id"])
    return serialize(rows)


@router.post("")
async def create_appointment(payload: AppointmentUpsert, current: AuthUser = Depends(require_roles("corretor", "admin", "superadmin"))):
    if not current.tenant_id:
        raise HTTPException(400, "Imobiliaria nao definida.")

    corretor_id = payload.corretor_id if current.role != "corretor" else current.id
    if not corretor_id:
        corretor_id = current.id

    hora_fim = payload.hora_fim or _add_hour(payload.hora_inicio)
    if await _has_conflict(corretor_id, payload.data, payload.hora_inicio, hora_fim):
        raise HTTPException(409, "Conflito de horario: ja existe agendamento neste intervalo.")

    doc = Appointment(
        tenant_id=current.tenant_id,
        corretor_id=corretor_id,
        nome_cliente=payload.nome_cliente,
        property_id=payload.property_id,
        data=payload.data,
        hora_inicio=payload.hora_inicio,
        hora_fim=hora_fim,
        observacoes=payload.observacoes,
        status=payload.status or "agendado",
    ).model_dump()
    doc["created_at"] = now_utc().isoformat()
    await db.appointments.insert_one(doc)
    return serialize(doc)


@router.put("/{app_id}")
async def update_appointment(app_id: str, payload: AppointmentUpsert, current: AuthUser = Depends(get_current_user)):
    a = await db.appointments.find_one({"id": app_id}, {"_id": 0})
    if not a:
        raise HTTPException(404, "Agendamento nao encontrado.")
    if current.role == "corretor" and a["corretor_id"] != current.id:
        raise HTTPException(403, "Voce so pode editar seus agendamentos.")
    if current.role not in ("corretor", "admin", "superadmin"):
        raise HTTPException(403, "Acesso negado.")
    hora_fim = payload.hora_fim or _add_hour(payload.hora_inicio)
    if await _has_conflict(a["corretor_id"], payload.data, payload.hora_inicio, hora_fim, exclude_id=app_id):
        raise HTTPException(409, "Conflito de horario: ja existe agendamento neste intervalo.")
    updates = {
        "nome_cliente": payload.nome_cliente,
        "property_id": payload.property_id,
        "data": payload.data,
        "hora_inicio": payload.hora_inicio,
        "hora_fim": hora_fim,
        "observacoes": payload.observacoes,
        "status": payload.status or a.get("status", "agendado"),
    }
    await db.appointments.update_one({"id": app_id}, {"$set": updates})
    return serialize(await db.appointments.find_one({"id": app_id}, {"_id": 0}))


@router.delete("/{app_id}")
async def delete_appointment(app_id: str, current: AuthUser = Depends(get_current_user)):
    a = await db.appointments.find_one({"id": app_id}, {"_id": 0})
    if not a:
        raise HTTPException(404, "Agendamento nao encontrado.")
    if current.role == "corretor" and a["corretor_id"] != current.id:
        raise HTTPException(403, "Voce so pode remover seus agendamentos.")
    await db.appointments.delete_one({"id": app_id})
    return {"ok": True}
