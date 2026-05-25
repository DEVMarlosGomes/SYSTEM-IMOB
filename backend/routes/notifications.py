"""Notification routes + helper used by other routes to fire notifications."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends

from core import AuthUser, db, get_current_user, now_utc, serialize
from models import Notification, NotificationType

router = APIRouter(prefix="/notifications", tags=["notifications"])


# ── Public helper — import this in other routes ──────────────────────────────

async def create_notification(
    *,
    tenant_id: str,
    recipient_id: str,
    type: NotificationType,
    title: str,
    body: str,
    link: Optional[str] = None,
) -> None:
    """Insert one notification document.  Fire-and-forget — never raises."""
    try:
        doc = Notification(
            tenant_id=tenant_id,
            recipient_id=recipient_id,
            type=type,
            title=title,
            body=body,
            link=link,
        ).model_dump()
        doc["created_at"] = now_utc().isoformat()
        await db.notifications.insert_one(doc)
    except Exception:
        pass  # notifications must never break the main flow


# ── API endpoints ─────────────────────────────────────────────────────────────

@router.get("")
async def list_notifications(current: AuthUser = Depends(get_current_user)):
    """Return the 60 most recent notifications for the calling user."""
    rows = (
        await db.notifications.find(
            {"recipient_id": current.id}, {"_id": 0}
        )
        .sort("created_at", -1)
        .to_list(60)
    )
    return serialize(rows)


@router.post("/{notification_id}/read")
async def mark_one_read(notification_id: str, current: AuthUser = Depends(get_current_user)):
    await db.notifications.update_one(
        {"id": notification_id, "recipient_id": current.id},
        {"$set": {"lida": True}},
    )
    return {"ok": True}


@router.post("/read-all")
async def mark_all_read(current: AuthUser = Depends(get_current_user)):
    await db.notifications.update_many(
        {"recipient_id": current.id, "lida": False},
        {"$set": {"lida": True}},
    )
    return {"ok": True}
