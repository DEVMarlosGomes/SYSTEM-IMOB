"""User management routes."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from core import (
    AuthUser,
    db,
    get_current_user,
    get_tenant_filter,
    hash_password,
    now_utc,
    require_roles,
    serialize,
)
from models import User, UserCreate, UserPublic, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserPublic])
async def list_users(
    role: Optional[str] = None,
    current: AuthUser = Depends(get_current_user),
):
    if current.role not in ("admin", "superadmin", "corretor"):
        raise HTTPException(403, "Acesso negado.")
    flt = await get_tenant_filter(current)
    if role:
        flt["role"] = role
    if current.role == "corretor":
        # corretor only sees other corretors + own clients
        flt["$or"] = [{"role": "corretor"}, {"corretor_id": current.id}]
    rows = await db.users.find(flt, {"_id": 0, "password_hash": 0}).sort("nome", 1).to_list(2000)
    return [UserPublic(**r) for r in rows]


@router.get("/{user_id}", response_model=UserPublic)
async def get_user(user_id: str, current: AuthUser = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(404, "Usuario nao encontrado.")
    # privacy: only same-tenant or superadmin
    if current.role != "superadmin" and user.get("tenant_id") != current.tenant_id and user["id"] != current.id:
        raise HTTPException(403, "Acesso negado.")
    return UserPublic(**user)


@router.post("", response_model=UserPublic)
async def create_user(payload: UserCreate, current: AuthUser = Depends(get_current_user)):
    if current.role not in ("admin", "superadmin"):
        raise HTTPException(403, "Acesso negado.")
    if current.role == "admin":
        if payload.role == "superadmin":
            raise HTTPException(403, "Admin nao pode criar superadmin.")
        tenant_id = current.tenant_id
    else:
        tenant_id = payload.tenant_id

    if not tenant_id and payload.role != "superadmin":
        raise HTTPException(400, "tenant_id obrigatorio.")

    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(409, "E-mail ja cadastrado.")

    user_doc = User(
        role=payload.role,
        nome=payload.nome,
        email=payload.email.lower(),
        telefone=payload.telefone,
        tenant_id=tenant_id,
        corretor_id=payload.corretor_id,
    ).model_dump()
    user_doc["created_at"] = now_utc().isoformat()
    user_doc["password_hash"] = hash_password(payload.password)
    user_doc["active"] = True
    await db.users.insert_one(user_doc)
    user_doc.pop("password_hash", None)
    return UserPublic(**serialize(user_doc))


@router.put("/{user_id}", response_model=UserPublic)
async def update_user(user_id: str, payload: UserUpdate, current: AuthUser = Depends(get_current_user)):
    target = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(404, "Usuario nao encontrado.")
    # permission: self OR admin (same tenant) OR superadmin
    same_tenant = target.get("tenant_id") == current.tenant_id
    if not (current.role == "superadmin" or (current.role == "admin" and same_tenant) or current.id == user_id):
        raise HTTPException(403, "Acesso negado.")

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if "password" in updates:
        updates["password_hash"] = hash_password(updates.pop("password"))
    if updates:
        await db.users.update_one({"id": user_id}, {"$set": updates})
    updated = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return UserPublic(**updated)


@router.delete("/{user_id}")
async def deactivate_user(user_id: str, current: AuthUser = Depends(require_roles("admin", "superadmin"))):
    target = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(404, "Usuario nao encontrado.")
    if current.role == "admin" and target.get("tenant_id") != current.tenant_id:
        raise HTTPException(403, "Acesso negado.")
    await db.users.update_one({"id": user_id}, {"$set": {"active": False}})
    return {"ok": True}
