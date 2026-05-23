"""Owner profile (ficha do proprietario) routes.
Privacy: a corretor only sees the owner profiles he created."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from core import AuthUser, db, get_current_user, get_tenant_filter, now_utc, require_roles, serialize
from models import OwnerProfile, OwnerProfileUpsert

router = APIRouter(prefix="/owner-profiles", tags=["owner_profiles"])


@router.get("")
async def list_owner_profiles(current: AuthUser = Depends(get_current_user)):
    if current.role not in ("admin", "superadmin", "corretor"):
        raise HTTPException(403, "Acesso negado.")
    flt = await get_tenant_filter(current)
    if current.role == "corretor":
        flt["corretor_id"] = current.id
    rows = await db.owner_profiles.find(flt, {"_id": 0}).sort("nome", 1).to_list(2000)
    return serialize(rows)


@router.get("/{op_id}")
async def get_owner_profile(op_id: str, current: AuthUser = Depends(get_current_user)):
    o = await db.owner_profiles.find_one({"id": op_id}, {"_id": 0})
    if not o:
        raise HTTPException(404, "Ficha nao encontrada.")
    if current.role == "corretor" and o["corretor_id"] != current.id:
        raise HTTPException(403, "Voce nao pode ver esta ficha.")
    if current.role not in ("admin", "superadmin", "corretor"):
        raise HTTPException(403, "Acesso negado.")
    return serialize(o)


@router.post("")
async def create_owner_profile(payload: OwnerProfileUpsert, current: AuthUser = Depends(require_roles("corretor", "admin", "superadmin"))):
    if not current.tenant_id:
        raise HTTPException(400, "Imobiliaria nao definida.")
    doc = OwnerProfile(
        tenant_id=current.tenant_id,
        corretor_id=current.id,
        **payload.model_dump(),
    ).model_dump()
    doc["created_at"] = now_utc().isoformat()
    await db.owner_profiles.insert_one(doc)
    return serialize(doc)


@router.put("/{op_id}")
async def update_owner_profile(op_id: str, payload: OwnerProfileUpsert, current: AuthUser = Depends(get_current_user)):
    o = await db.owner_profiles.find_one({"id": op_id}, {"_id": 0})
    if not o:
        raise HTTPException(404, "Ficha nao encontrada.")
    if current.role == "corretor" and o["corretor_id"] != current.id:
        raise HTTPException(403, "Voce nao pode editar esta ficha.")
    if current.role not in ("admin", "superadmin", "corretor"):
        raise HTTPException(403, "Acesso negado.")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    await db.owner_profiles.update_one({"id": op_id}, {"$set": updates})
    return serialize(await db.owner_profiles.find_one({"id": op_id}, {"_id": 0}))
