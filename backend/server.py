"""
ImobSys backend entry point.

Responsibilities:
- Boot FastAPI app, attach CORS, mount /api router
- Initialise Mongo indexes and run idempotent seed on startup
- Expose health endpoint and static uploads under /api/uploads
- Register WebSocket endpoint for realtime chat
"""
from __future__ import annotations

import asyncio
import json
import logging
import logging.config
from contextlib import asynccontextmanager
from datetime import date
from pathlib import Path

from fastapi import FastAPI, APIRouter, Request
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware


class _JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        data: dict = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S"),
            "level": record.levelname,
            "name": record.name,
            "message": record.getMessage(),
        }
        for key in ("user_id", "tenant_id", "action"):
            if hasattr(record, key):
                data[key] = getattr(record, key)
        if record.exc_info:
            data["exc"] = self.formatException(record.exc_info)
        return json.dumps(data, ensure_ascii=False)

from core import settings, db, ensure_indexes
from seed import run_seed
from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.properties import router as properties_router
from routes.owner_profiles import router as owner_profiles_router
from routes.appointments import router as appointments_router
from routes.contracts import router as contracts_router
from routes.payments import router as payments_router
from routes.crm import router as crm_router
from routes.dashboard import router as dashboard_router
from routes.uploads import router as uploads_router
from routes.chat import router as chat_router
from routes.tenants import router as tenants_router
from routes.notifications import router as notifications_router
from routes.fichas_locatario import router as fichas_locatario_router
from routes.corretores import router as corretores_router
from routes.reports import router as reports_router

_json_handler = logging.StreamHandler()
_json_handler.setFormatter(_JSONFormatter())
logging.root.setLevel(logging.INFO)
logging.root.handlers = [_json_handler]
logger = logging.getLogger("imobsys")


async def _overdue_notifier():
    """Background task: every hour, notify locatários with overdue payments (once per payment)."""
    from routes.notifications import create_notification
    while True:
        try:
            today = date.today().isoformat()
            overdue = await db.payments.find(
                {"status_locatario": "pendente", "data_vencimento": {"$lt": today}, "overdue_notified": {"$ne": True}},
                {"_id": 0},
            ).to_list(500)
            for p in overdue:
                await create_notification(
                    tenant_id=p.get("tenant_id", ""),
                    recipient_id=p["locatario_id"],
                    type="info",
                    title="Pagamento em atraso",
                    body=f"Seu aluguel de {p.get('mes_referencia', '')} está vencido desde {p['data_vencimento']}. Regularize para evitar multas.",
                    link="/locatario/pagamentos",
                )
                await db.payments.update_one({"id": p["id"]}, {"$set": {"overdue_notified": True}})
        except Exception:
            pass
        await asyncio.sleep(3600)  # check every hour


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("Starting ImobSys backend…")
    await ensure_indexes()
    await run_seed()
    task = asyncio.create_task(_overdue_notifier())
    logger.info("ImobSys backend ready.")
    yield
    task.cancel()
    db.client.close()
    logger.info("ImobSys backend stopped.")


app = FastAPI(title="ImobSys API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next) -> Response:
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: blob:; "
        "connect-src 'self' ws: wss:;"
    )
    return response

# Static files for uploaded media (served under /api/uploads/*)
UPLOADS_DIR = Path("/app/backend/uploads")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/api/uploads/static", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads-static")

api = APIRouter(prefix="/api")


@api.get("/health")
async def health():
    """Liveness probe + quick Mongo ping."""
    try:
        await db.command("ping")
        return {"status": "ok", "mongo": "connected"}
    except Exception as exc:
        logger.exception("Mongo ping failed")
        return {"status": "degraded", "mongo": str(exc)}


@api.get("/")
async def root():
    return {"name": "ImobSys API", "version": "1.0.0"}


api.include_router(auth_router)
api.include_router(users_router)
api.include_router(tenants_router)
api.include_router(properties_router)
api.include_router(owner_profiles_router)
api.include_router(appointments_router)
api.include_router(contracts_router)
api.include_router(payments_router)
api.include_router(crm_router)
api.include_router(dashboard_router)
api.include_router(uploads_router)
api.include_router(chat_router)
api.include_router(notifications_router)
api.include_router(fichas_locatario_router)
api.include_router(corretores_router)
api.include_router(reports_router)

app.include_router(api)
