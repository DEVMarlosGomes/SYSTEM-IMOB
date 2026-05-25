"""Authentication routes."""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status

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

# ── In-memory rate limiter (5 attempts / 10 min → block 15 min) ──────────────
_login_attempts: dict[str, list[datetime]] = defaultdict(list)
_blocked_until: dict[str, datetime] = {}

_MAX_ATTEMPTS = 5
_WINDOW_MIN = 10
_BLOCK_MIN = 15


def _check_login_rate(email: str) -> None:
    now = datetime.utcnow()
    if email in _blocked_until and _blocked_until[email] > now:
        secs = int((_blocked_until[email] - now).total_seconds())
        mins = max(1, secs // 60)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Conta bloqueada temporariamente. Tente novamente em {mins} minuto(s).",
        )
    window = now - timedelta(minutes=_WINDOW_MIN)
    _login_attempts[email] = [t for t in _login_attempts[email] if t > window]
    _login_attempts[email].append(now)
    if len(_login_attempts[email]) > _MAX_ATTEMPTS:
        _blocked_until[email] = now + timedelta(minutes=_BLOCK_MIN)
        _login_attempts[email] = []
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Muitas tentativas de login. Conta bloqueada por {_BLOCK_MIN} minutos.",
        )


# ── Helpers ──────────────────────────────────────────────────────────────────

async def _build_token(user_doc: dict) -> TokenOut:
    token = create_access_token({"sub": user_doc["id"], "role": user_doc["role"]})
    return TokenOut(access_token=token, user=UserPublic(**user_doc))


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenOut)
async def login(payload: LoginInput, request: Request):
    key = payload.email.lower()
    _check_login_rate(key)
    user = await db.users.find_one({"email": key}, {"_id": 0})
    if not user or not user.get("active", True) or not verify_password(payload.password, user["password_hash"]):
        # still count as a failed attempt
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas.")
    # reset on success
    _login_attempts.pop(key, None)
    _blocked_until.pop(key, None)
    user.pop("password_hash", None)
    return await _build_token(user)


@router.get("/me", response_model=UserPublic)
async def me(current: AuthUser = Depends(get_current_user)):
    return UserPublic(**current)


@router.post("/impersonate/{user_id}", response_model=TokenOut)
async def impersonate(user_id: str, current: AuthUser = Depends(require_roles("superadmin"))):
    user = await db.users.find_one({"id": user_id, "active": True}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(404, detail="Usuário não encontrado.")
    return await _build_token(user)
