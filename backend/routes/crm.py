"""CRM endpoints for locatarios and locadores (joined views)."""
from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from core import AuthUser, db, get_current_user, get_tenant_filter, require_roles, serialize

router = APIRouter(prefix="/crm", tags=["crm"])


@router.get("/locatarios")
async def crm_locatarios(
    search: Optional[str] = None,
    current: AuthUser = Depends(require_roles("admin", "superadmin", "corretor")),
):
    flt = await get_tenant_filter(current)
    flt["role"] = "locatario"
    if search:
        flt["$or"] = [
            {"nome": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    users = await db.users.find(flt, {"_id": 0, "password_hash": 0}).sort("nome", 1).to_list(2000)
    if current.role == "corretor":
        # only locatarios linked to corretor's contracts
        contracts = await db.contracts.find({"corretor_id": current.id}, {"_id": 0, "locatario_id": 1}).to_list(2000)
        linked = {c["locatario_id"] for c in contracts}
        users = [u for u in users if u["id"] in linked]
    contracts = await db.contracts.find({"locatario_id": {"$in": [u["id"] for u in users]}, "status": "ativo"}, {"_id": 0}).to_list(2000)
    by_locat = {c["locatario_id"]: c for c in contracts}
    props = await db.properties.find({"id": {"$in": [c["property_id"] for c in contracts]}}, {"_id": 0}).to_list(2000)
    by_prop = {p["id"]: p for p in props}
    today = date.today().isoformat()
    for u in users:
        c = by_locat.get(u["id"])
        u["contract"] = c
        u["property"] = by_prop.get(c["property_id"]) if c else None
        # last payment status
        if c:
            last_payment = await db.payments.find_one(
                {"contract_id": c["id"]},
                sort=[("data_vencimento", -1)],
                projection={"_id": 0},
            )
            if last_payment:
                if last_payment["status_locatario"] == "pendente" and last_payment["data_vencimento"] < today:
                    last_payment["status_locatario"] = "atrasado"
                u["last_payment"] = last_payment
    return serialize(users)


@router.get("/locadores")
async def crm_locadores(
    search: Optional[str] = None,
    current: AuthUser = Depends(require_roles("admin", "superadmin", "corretor")),
):
    flt = await get_tenant_filter(current)
    flt["role"] = "locador"
    if search:
        flt["$or"] = [
            {"nome": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    users = await db.users.find(flt, {"_id": 0, "password_hash": 0}).sort("nome", 1).to_list(2000)
    if current.role == "corretor":
        contracts = await db.contracts.find({"corretor_id": current.id}, {"_id": 0, "locador_id": 1}).to_list(2000)
        linked = {c["locador_id"] for c in contracts}
        users = [u for u in users if u["id"] in linked]

    contracts = await db.contracts.find({"locador_id": {"$in": [u["id"] for u in users]}, "status": "ativo"}, {"_id": 0}).to_list(2000)
    by_locador = {c["locador_id"]: c for c in contracts}
    props = await db.properties.find({"id": {"$in": [c["property_id"] for c in contracts]}}, {"_id": 0}).to_list(2000)
    by_prop = {p["id"]: p for p in props}
    for u in users:
        c = by_locador.get(u["id"])
        u["contract"] = c
        u["property"] = by_prop.get(c["property_id"]) if c else None
        if c:
            last_payment = await db.payments.find_one(
                {"contract_id": c["id"]},
                sort=[("data_vencimento", -1)],
                projection={"_id": 0},
            )
            if last_payment:
                u["last_payout"] = last_payment
    return serialize(users)
