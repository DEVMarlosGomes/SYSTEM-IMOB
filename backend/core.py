"""
Shared infrastructure: settings, Mongo client, security primitives, deps and utils.

Kept as a single module to minimise import boilerplate in routes.
"""
from __future__ import annotations

import os
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone, date
from pathlib import Path
from typing import Any

import bcrypt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------
@dataclass
class Settings:
    mongo_url: str = os.environ["MONGO_URL"]
    db_name: str = os.environ.get("DB_NAME", "imobsys")
    cors_origins: list[str] = None  # type: ignore[assignment]
    jwt_secret: str = os.environ.get("JWT_SECRET", secrets.token_urlsafe(48))
    jwt_algorithm: str = "HS256"
    jwt_exp_hours: int = 24 * 7

    def __post_init__(self):
        origins = os.environ.get("CORS_ORIGINS", "*")
        self.cors_origins = [o.strip() for o in origins.split(",") if o.strip()] or ["*"]


settings = Settings()

# ---------------------------------------------------------------------------
# Mongo client
# ---------------------------------------------------------------------------
client = AsyncIOMotorClient(settings.mongo_url)
db = client[settings.db_name]


async def ensure_indexes() -> None:
    """Create indexes used across the app (idempotent)."""
    await db.users.create_index("email", unique=True)
    await db.users.create_index([("tenant_id", 1), ("role", 1)])
    await db.tenants.create_index("slug", unique=True, sparse=True)
    await db.properties.create_index([("tenant_id", 1), ("status", 1)])
    await db.properties.create_index([("corretor_id", 1)])
    await db.owner_profiles.create_index([("tenant_id", 1), ("corretor_id", 1)])
    await db.appointments.create_index([("corretor_id", 1), ("data", 1)])
    await db.contracts.create_index([("tenant_id", 1), ("status", 1)])
    await db.payments.create_index([("tenant_id", 1), ("data_vencimento", 1)])
    await db.payments.create_index([("locatario_id", 1), ("data_vencimento", -1)])
    await db.payments.create_index([("locador_id", 1), ("data_vencimento", -1)])
    await db.chat_messages.create_index([("locador_id", 1), ("created_at", 1)])


# ---------------------------------------------------------------------------
# Security: passwords + JWT
# ---------------------------------------------------------------------------
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(payload: dict[str, Any], hours: int | None = None) -> str:
    to_encode = payload.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=hours or settings.jwt_exp_hours)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# ---------------------------------------------------------------------------
# Auth dependencies
# ---------------------------------------------------------------------------
class AuthUser(dict):
    """Dict-like wrapper so we can call current_user["role"] directly."""

    @property
    def id(self) -> str:
        return self["id"]

    @property
    def role(self) -> str:
        return self["role"]

    @property
    def tenant_id(self) -> str | None:
        return self.get("tenant_id")


async def get_current_user(token: str | None = Depends(oauth2_scheme)) -> AuthUser:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token ausente.")
    try:
        payload = decode_token(token)
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido.") from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido.")

    user = await db.users.find_one({"id": user_id, "active": True}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario nao encontrado ou inativo.")
    return AuthUser(user)


def require_roles(*allowed: str):
    async def _dep(user: AuthUser = Depends(get_current_user)) -> AuthUser:
        if user.role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado para o seu perfil.")
        return user
    return _dep


# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------
BR_HOLIDAYS: set[str] = {
    # MVP: alguns feriados nacionais fixos. Pode ser expandido depois.
    "01-01", "04-21", "05-01", "09-07", "10-12", "11-02", "11-15", "12-25",
}


def is_business_day(d: date) -> bool:
    if d.weekday() >= 5:  # 5=Sat, 6=Sun
        return False
    return d.strftime("%m-%d") not in BR_HOLIDAYS


def next_business_day(d: date) -> date:
    while not is_business_day(d):
        d = d + timedelta(days=1)
    return d


def add_business_days(d: date, n: int) -> date:
    current = d
    added = 0
    while added < n:
        current = current + timedelta(days=1)
        if is_business_day(current):
            added += 1
    return current


def serialize(doc: Any) -> Any:
    """Recursively coerce datetimes -> ISO strings and dates -> ISO strings; strip Mongo _id."""
    if isinstance(doc, list):
        return [serialize(x) for x in doc]
    if isinstance(doc, dict):
        out = {}
        for k, v in doc.items():
            if k == "_id":
                continue
            out[k] = serialize(v)
        return out
    if isinstance(doc, datetime):
        if doc.tzinfo is None:
            doc = doc.replace(tzinfo=timezone.utc)
        return doc.isoformat()
    if isinstance(doc, date):
        return doc.isoformat()
    return doc


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


async def get_tenant_filter(user: AuthUser) -> dict:
    """Return a Mongo filter scoped to the user's tenant (superadmin sees everything)."""
    if user.role == "superadmin":
        return {}
    if not user.tenant_id:
        raise HTTPException(status_code=400, detail="Usuario sem imobiliaria associada.")
    return {"tenant_id": user.tenant_id}
