"""Generic upload endpoint serving files via /api/uploads/static/*."""
from __future__ import annotations

import os
import uuid
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form

from core import AuthUser, get_current_user

router = APIRouter(prefix="/uploads", tags=["uploads"])

UPLOADS_DIR = Path("/app/backend/uploads")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXT = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}
MAX_SIZE = 10 * 1024 * 1024  # 10 MB

# ── Per-user upload rate limit: 10 uploads / 1 min ───────────────────────────
_upload_timestamps: dict[str, list[datetime]] = defaultdict(list)
_UPLOAD_MAX = 10
_UPLOAD_WINDOW_SEC = 60


def _check_upload_rate(user_id: str) -> None:
    now = datetime.utcnow()
    window = now - timedelta(seconds=_UPLOAD_WINDOW_SEC)
    _upload_timestamps[user_id] = [t for t in _upload_timestamps[user_id] if t > window]
    if len(_upload_timestamps[user_id]) >= _UPLOAD_MAX:
        raise HTTPException(
            status_code=429,
            detail=f"Limite de {_UPLOAD_MAX} uploads por minuto excedido. Aguarde e tente novamente.",
        )
    _upload_timestamps[user_id].append(now)


@router.post("")
async def upload(
    file: UploadFile = File(...),
    kind: str | None = Form(default="misc"),
    current: AuthUser = Depends(get_current_user),
):
    """Upload an arbitrary file (max 10 MB, 10/min per user)."""
    _check_upload_rate(current.id)

    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, f"Extensão não permitida: {ext}.")

    subdir = (kind or "misc").strip("/")[:32] or "misc"
    target_dir = UPLOADS_DIR / subdir
    target_dir.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}{ext}"
    target = target_dir / name

    size = 0
    async with aiofiles.open(target, "wb") as out:
        while True:
            chunk = await file.read(64 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_SIZE:
                await out.close()
                try:
                    os.unlink(target)
                except Exception:
                    pass
                raise HTTPException(413, f"Arquivo maior que o limite de {MAX_SIZE // (1024*1024)}MB.")
            await out.write(chunk)

    url = f"/api/uploads/static/{subdir}/{name}"
    return {
        "url": url,
        "filename": file.filename,
        "size": size,
        "content_type": file.content_type,
    }
