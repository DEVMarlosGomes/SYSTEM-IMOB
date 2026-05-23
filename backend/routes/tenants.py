"""Tenants (imobiliarias) management."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from core import AuthUser, db, get_current_user, require_roles, serialize, now_utc
from models import Tenant, TenantUpsert

router = APIRouter(prefix="/tenants", tags=["tenants"])


@router.get("")
async def list_tenants(current: AuthUser = Depends(get_current_user)):
    if current.role == "superadmin":
        rows = await db.tenants.find({}, {"_id": 0}).to_list(500)
    elif current.tenant_id:
        rows = await db.tenants.find({"id": current.tenant_id}, {"_id": 0}).to_list(10)
    else:
        rows = []
    return serialize(rows)


@router.get("/me")
async def my_tenant(current: AuthUser = Depends(get_current_user)):
    if not current.tenant_id:
        raise HTTPException(404, "Usuario sem imobiliaria.")
    t = await db.tenants.find_one({"id": current.tenant_id}, {"_id": 0})
    if not t:
        raise HTTPException(404, "Imobiliaria nao encontrada.")
    return serialize(t)


@router.post("")
async def create_tenant(payload: TenantUpsert, _: AuthUser = Depends(require_roles("superadmin"))):
    doc = Tenant(**payload.model_dump()).model_dump()
    doc["created_at"] = now_utc().isoformat()
    await db.tenants.insert_one(doc)
    return serialize(doc)


@router.put("/{tenant_id}")
async def update_tenant(tenant_id: str, payload: TenantUpsert, current: AuthUser = Depends(get_current_user)):
    if current.role not in ("superadmin", "admin"):
        raise HTTPException(403, "Acesso negado.")
    if current.role == "admin" and current.tenant_id != tenant_id:
        raise HTTPException(403, "Voce so pode alterar sua propria imobiliaria.")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    res = await db.tenants.find_one_and_update({"id": tenant_id}, {"$set": updates}, return_document=True)
    if not res:
        raise HTTPException(404, "Imobiliaria nao encontrada.")
    return serialize({**res})
