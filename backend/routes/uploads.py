"""Generic upload endpoint serving files via /api/uploads/static/*."""
from __future__ import annotations

import os
import uuid
from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse

from core import AuthUser, get_current_user

router = APIRouter(prefix="/uploads", tags=["uploads"])

UPLOADS_DIR = Path("/app/backend/uploads")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXT = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}
MAX_SIZE = 8 * 1024 * 1024  # 8 MB


@router.post("")
async def upload(
    file: UploadFile = File(...),
    kind: str | None = Form(default="misc"),
    current: AuthUser = Depends(get_current_user),
):
    """Upload an arbitrary file. Returns a URL accessible via /api/uploads/static/{path}."""
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, f"Extensao nao permitida: {ext}.")
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
                raise HTTPException(413, "Arquivo maior que o limite de 8MB.")
            await out.write(chunk)

    url = f"/api/uploads/static/{subdir}/{name}"
    return {
        "url": url,
        "filename": file.filename,
        "size": size,
        "content_type": file.content_type,
    }
