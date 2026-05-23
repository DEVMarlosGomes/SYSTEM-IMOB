"""
ImobSys backend entry point.

Responsibilities:
- Boot FastAPI app, attach CORS, mount /api router
- Initialise Mongo indexes and run idempotent seed on startup
- Expose health endpoint and static uploads under /api/uploads
- Register WebSocket endpoint for realtime chat
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, APIRouter
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware

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

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger("imobsys")


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("Starting ImobSys backend…")
    await ensure_indexes()
    await run_seed()
    logger.info("ImobSys backend ready.")
    yield
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

app.include_router(api)
