"""WebSocket manager for realtime chat (Locador <-> Imobiliaria).

Keyed by conversation (locador_id). When the admin connects to a conversation
they identify themselves with admin user_id, and when locador connects we route
messages between both ends of the same locador_id channel.
"""
from __future__ import annotations

import asyncio
import json
import logging
from collections import defaultdict
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger("imobsys.ws")


class ChatManager:
    def __init__(self) -> None:
        # channel -> set of connected sockets
        self._channels: dict[str, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, channel: str, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._channels[channel].add(ws)
        logger.info("WS connect channel=%s total=%d", channel, len(self._channels[channel]))

    async def disconnect(self, channel: str, ws: WebSocket) -> None:
        async with self._lock:
            self._channels[channel].discard(ws)
            if not self._channels[channel]:
                self._channels.pop(channel, None)
        logger.info("WS disconnect channel=%s", channel)

    async def broadcast(self, channel: str, payload: dict[str, Any]) -> None:
        data = json.dumps(payload, default=str)
        dead: list[WebSocket] = []
        sockets = list(self._channels.get(channel, []))
        for ws in sockets:
            try:
                await ws.send_text(data)
            except Exception as exc:
                logger.warning("WS send failed: %s", exc)
                dead.append(ws)
        for ws in dead:
            await self.disconnect(channel, ws)


chat_manager = ChatManager()
