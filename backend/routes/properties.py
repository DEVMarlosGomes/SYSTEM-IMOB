"""Property CRUD with privacy rules around owner_profile."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from core import (
    AuthUser,
    db,
    get_current_user,
    get_tenant_filter,
    now_utc,
    require_roles,
    serialize,
)
from models import Property, PropertyUpsert

router = APIRouter(prefix="/properties", tags=["properties"])

PRIVATE_OWNER_KEY = "owner_profile_id"


async def _attach_corretor(rows: list[dict]) -> list[dict]:
    """Embed minimal corretor info (nome/telefone/avatar) for the UI."""
    ids = list({r["corretor_id"] for r in rows if r.get("corretor_id")})
    if not ids:
        return rows
    corretores = await db.users.find({"id": {"$in": ids}}, {"_id": 0, "id": 1, "nome": 1, "telefone": 1, "avatar_url": 1, "email": 1}).to_list(100)
    by_id = {c["id"]: c for c in corretores}
    for r in rows:
        c = by_id.get(r.get("corretor_id"))
        r["corretor"] = c
    return rows


def _apply_privacy(rows: list[dict], current: AuthUser) -> list[dict]:
    """Mask owner_profile_id for users who shouldn't see it."""
    if current.role in ("admin", "superadmin"):
        return rows
    for r in rows:
        if r.get("corretor_id") != current.id:
            r[PRIVATE_OWNER_KEY] = None
    return rows


@router.get("")
async def list_properties(
    status: Optional[str] = None,
    tipo: Optional[str] = None,
    corretor_id: Optional[str] = None,
    search: Optional[str] = None,
    current: AuthUser = Depends(get_current_user),
):
    flt = await get_tenant_filter(current)
    if status:
        flt["status"] = status
    if tipo:
        flt["tipo"] = tipo
    if corretor_id:
        flt["corretor_id"] = corretor_id
    if current.role == "locatario":
        # locatario only sees property linked to him via active contract
        contracts = await db.contracts.find({"locatario_id": current.id, "status": "ativo"}, {"_id": 0, "property_id": 1}).to_list(10)
        ids = [c["property_id"] for c in contracts]
        flt["id"] = {"$in": ids}
    if current.role == "locador":
        contracts = await db.contracts.find({"locador_id": current.id, "status": "ativo"}, {"_id": 0, "property_id": 1}).to_list(10)
        ids = [c["property_id"] for c in contracts]
        flt["id"] = {"$in": ids}
    if search:
        flt["$or"] = [
            {"titulo": {"$regex": search, "$options": "i"}},
            {"endereco": {"$regex": search, "$options": "i"}},
            {"bairro": {"$regex": search, "$options": "i"}},
            {"cidade": {"$regex": search, "$options": "i"}},
        ]
    rows = await db.properties.find(flt, {"_id": 0}).sort("created_at", -1).to_list(1000)
    rows = _apply_privacy(rows, current)
    rows = await _attach_corretor(rows)
    return serialize(rows)


@router.get("/{property_id}")
async def get_property(property_id: str, current: AuthUser = Depends(get_current_user)):
    p = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Imovel nao encontrado.")
    if current.role != "superadmin" and p.get("tenant_id") != current.tenant_id:
        raise HTTPException(403, "Acesso negado.")
    p = _apply_privacy([p], current)[0]
    p_list = await _attach_corretor([p])
    p = p_list[0]
    # attach owner profile if visible
    if p.get(PRIVATE_OWNER_KEY):
        owner = await db.owner_profiles.find_one({"id": p[PRIVATE_OWNER_KEY]}, {"_id": 0})
        p["owner_profile"] = owner
    return serialize(p)


@router.post("")
async def create_property(payload: PropertyUpsert, current: AuthUser = Depends(require_roles("corretor", "admin", "superadmin"))):
    if not current.tenant_id:
        raise HTTPException(400, "Imobiliaria nao definida para o usuario.")
    payload_dict = payload.model_dump(exclude_none=True)
    doc = Property(
        tenant_id=current.tenant_id,
        corretor_id=current.id,
        **payload_dict,
    ).model_dump()
    doc["created_at"] = now_utc().isoformat()
    await db.properties.insert_one(doc)
    return serialize(doc)


@router.put("/{property_id}")
async def update_property(property_id: str, payload: PropertyUpsert, current: AuthUser = Depends(get_current_user)):
    p = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Imovel nao encontrado.")
    if current.role == "corretor" and p["corretor_id"] != current.id:
        raise HTTPException(403, "Voce so pode editar imoveis que voce cadastrou.")
    if current.role not in ("corretor", "admin", "superadmin"):
        raise HTTPException(403, "Acesso negado.")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    await db.properties.update_one({"id": property_id}, {"$set": updates})
    updated = await db.properties.find_one({"id": property_id}, {"_id": 0})
    return serialize(updated)


@router.delete("/{property_id}")
async def delete_property(property_id: str, current: AuthUser = Depends(get_current_user)):
    p = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Imovel nao encontrado.")
    if current.role == "corretor" and p["corretor_id"] != current.id:
        raise HTTPException(403, "Voce so pode remover seus imoveis.")
    if current.role not in ("corretor", "admin", "superadmin"):
        raise HTTPException(403, "Acesso negado.")
    await db.properties.delete_one({"id": property_id})
    return {"ok": True}
