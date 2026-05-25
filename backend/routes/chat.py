"""Chat (locador <-> imobiliaria) routes + WebSocket endpoint."""
from __future__ import annotations

import json
import logging
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from jose import JWTError

from core import (
    AuthUser,
    db,
    decode_token,
    get_current_user,
    get_tenant_filter,
    now_utc,
    serialize,
)
from models import ChatMessage, ChatMessageCreate
from ws_manager import chat_manager

logger = logging.getLogger("imobsys.chat")

router = APIRouter(prefix="/chat", tags=["chat"])

# ── WebSocket rate limit: 10 messages / 10 seconds per user ──────────────────
_ws_timestamps: dict[str, list[datetime]] = defaultdict(list)
_WS_MAX = 10
_WS_WINDOW_SEC = 10


def _check_ws_rate(user_id: str) -> bool:
    """Return True if allowed, False if rate-limited."""
    now = datetime.utcnow()
    window = now - timedelta(seconds=_WS_WINDOW_SEC)
    _ws_timestamps[user_id] = [t for t in _ws_timestamps[user_id] if t > window]
    if len(_ws_timestamps[user_id]) >= _WS_MAX:
        return False
    _ws_timestamps[user_id].append(now)
    return True


def _channel_for(locador_id: str) -> str:
    return f"chat:{locador_id}"


@router.get("/conversations")
async def list_conversations(current: AuthUser = Depends(get_current_user)):
    """Admin sees all locador conversations; locador sees only their own."""
    flt = await get_tenant_filter(current)
    if current.role == "locador":
        return [{"locador_id": current.id}]
    if current.role not in ("admin", "superadmin"):
        raise HTTPException(403, "Acesso negado.")
    locadores = await db.users.find({**flt, "role": "locador"}, {"_id": 0, "id": 1, "nome": 1, "avatar_url": 1}).to_list(2000)
    # attach last message + unread for admin
    out = []
    for loc in locadores:
        last = await db.chat_messages.find_one({"locador_id": loc["id"]}, sort=[("created_at", -1)], projection={"_id": 0})
        unread = await db.chat_messages.count_documents({"locador_id": loc["id"], "lida": False, "remetente_role": "locador"})
        out.append({**loc, "last_message": last, "unread": unread})
    return serialize(out)


@router.get("/messages/{locador_id}")
async def list_messages(
    locador_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    current: AuthUser = Depends(get_current_user),
):
    if current.role == "locador" and current.id != locador_id:
        raise HTTPException(403, "Acesso negado.")
    skip = (page - 1) * limit
    rows = await db.chat_messages.find({"locador_id": locador_id}, {"_id": 0}) \
        .sort("created_at", 1).skip(skip).to_list(limit)
    total = await db.chat_messages.count_documents({"locador_id": locador_id})
    await db.chat_messages.update_many(
        {"locador_id": locador_id, "remetente_id": {"$ne": current.id}, "lida": False},
        {"$set": {"lida": True}},
    )
    return {"items": serialize(rows), "total": total, "page": page, "limit": limit}


@router.post("/messages")
async def post_message(payload: ChatMessageCreate, current: AuthUser = Depends(get_current_user)):
    if current.role == "locador" and current.id != payload.locador_id:
        raise HTTPException(403, "Acesso negado.")
    if not current.tenant_id and current.role != "superadmin":
        raise HTTPException(400, "Imobiliaria nao definida.")
    msg = ChatMessage(
        tenant_id=current.tenant_id or "",
        locador_id=payload.locador_id,
        remetente_id=current.id,
        remetente_nome=current.get("nome"),
        remetente_role=current.role,
        mensagem=payload.mensagem,
    ).model_dump()
    msg["created_at"] = now_utc().isoformat()
    await db.chat_messages.insert_one(msg)
    payload_out = serialize(msg)
    await chat_manager.broadcast(_channel_for(payload.locador_id), {"type": "message", "data": payload_out})
    return payload_out


@router.websocket("/ws/{locador_id}")
async def chat_ws(websocket: WebSocket, locador_id: str, token: str = Query(default="")):
    """WebSocket for realtime chat. Pass JWT in query (?token=...)."""
    try:
        if not token:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        try:
            payload = decode_token(token)
        except JWTError:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        user = await db.users.find_one({"id": payload.get("sub"), "active": True}, {"_id": 0, "password_hash": 0})
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        # access rules
        if user["role"] == "locador" and user["id"] != locador_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        if user["role"] not in ("admin", "superadmin", "locador"):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        channel = _channel_for(locador_id)
        await chat_manager.connect(channel, websocket)
        try:
            while True:
                raw = await websocket.receive_text()
                try:
                    data = json.loads(raw)
                except json.JSONDecodeError:
                    data = {"mensagem": raw}
                mensagem = (data.get("mensagem") or "").strip()
                if not mensagem:
                    continue
                if not _check_ws_rate(user["id"]):
                    await websocket.send_text(json.dumps({"type": "error", "detail": "Rate limit: aguarde alguns segundos."}))
                    continue
                msg = ChatMessage(
                    tenant_id=user.get("tenant_id") or "",
                    locador_id=locador_id,
                    remetente_id=user["id"],
                    remetente_nome=user.get("nome"),
                    remetente_role=user["role"],
                    mensagem=mensagem,
                ).model_dump()
                msg["created_at"] = datetime.now(timezone.utc).isoformat()
                await db.chat_messages.insert_one(msg)
                await chat_manager.broadcast(channel, {"type": "message", "data": serialize(msg)})
        except WebSocketDisconnect:
            await chat_manager.disconnect(channel, websocket)
    except Exception as exc:
        logger.exception("WebSocket error: %s", exc)
        try:
            await websocket.close()
        except Exception:
            pass
