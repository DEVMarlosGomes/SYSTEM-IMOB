"""Authentication routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from core import (
    AuthUser,
    create_access_token,
    db,
    get_current_user,
    require_roles,
    verify_password,
)
from models import LoginInput, TokenOut, UserPublic

router = APIRouter(prefix="/auth", tags=["auth"])


async def _build_token(user_doc: dict) -> TokenOut:
    token = create_access_token({"sub": user_doc["id"], "role": user_doc["role"]})
    return TokenOut(access_token=token, user=UserPublic(**user_doc))


@router.post("/login", response_model=TokenOut)
async def login(payload: LoginInput):
    user = await db.users.find_one({"email": payload.email.lower()}, {"_id": 0})
    if not user or not user.get("active", True) or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais invalidas.")
    user.pop("password_hash", None)
    return await _build_token(user)


@router.get("/me", response_model=UserPublic)
async def me(current: AuthUser = Depends(get_current_user)):
    return UserPublic(**current)


@router.post("/impersonate/{user_id}", response_model=TokenOut)
async def impersonate(user_id: str, current: AuthUser = Depends(require_roles("superadmin"))):
    user = await db.users.find_one({"id": user_id, "active": True}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(404, detail="Usuario nao encontrado.")
    return await _build_token(user)
