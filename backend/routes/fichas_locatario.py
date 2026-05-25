"""Ficha Inquilino (Locatário) routes — cadastro completo com dados LGPD."""
from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

import re

from core import (
    AuthUser,
    db,
    get_current_user,
    get_tenant_filter,
    hash_password,
    now_utc,
    require_roles,
    serialize,
)
from models import FichaLocatario, FichaLocatarioCreate, FichaLocatarioUpdate, User as UserModel
from routes.notifications import create_notification

router = APIRouter(prefix="/fichas-locatario", tags=["fichas-locatario"])


async def _enrich(doc: dict) -> dict:
    """Attach corretor info and imovel info to a ficha document."""
    if doc.get("corretor_id"):
        c = await db.users.find_one({"id": doc["corretor_id"]}, {"_id": 0, "id": 1, "nome": 1, "email": 1})
        doc["corretor"] = c
    if doc.get("imovel_id"):
        p = await db.properties.find_one({"id": doc["imovel_id"]}, {"_id": 0, "id": 1, "titulo": 1, "endereco": 1})
        doc["imovel"] = p
    return doc


def _check_access(ficha: dict, current: AuthUser) -> None:
    if current.role in ("admin", "superadmin"):
        return
    if current.role == "corretor" and ficha.get("corretor_id") != current.id:
        raise HTTPException(403, "Acesso negado.")
    if current.role == "locatario":
        # locatário pode ver apenas a sua própria ficha via cliente1.email
        c1 = ficha.get("cliente1") or {}
        if c1.get("email") != current.get("email"):
            raise HTTPException(403, "Acesso negado.")


# ── CREATE ────────────────────────────────────────────────────────────────────

@router.post("")
async def create_ficha(
    payload: FichaLocatarioCreate,
    current: AuthUser = Depends(require_roles("corretor", "admin", "superadmin")),
):
    if not current.tenant_id:
        raise HTTPException(400, "Imobiliária não definida.")

    ficha = FichaLocatario(
        tenant_id=current.tenant_id,
        corretor_id=current.id,
        imovel_id=payload.imovel_id,
        condominio=payload.condominio,
        unidade=payload.unidade,
        data_cadastro=date.today().isoformat(),
        cliente1=payload.cliente1,
        cliente2=payload.cliente2,
        referencias=payload.referencias,
        empresa_trabalha=payload.empresa_trabalha,
        endereco_trabalho=payload.endereco_trabalho,
        tel_empresa_1=payload.tel_empresa_1,
        tel_empresa_2=payload.tel_empresa_2,
        endereco_correspondencia=payload.endereco_correspondencia,
        valor_caucao=payload.valor_caucao,
        valor_locacao=payload.valor_locacao,
        autoriza_analise_documental=payload.autoriza_analise_documental,
        autoriza_proposta_analise_inclusa=payload.autoriza_proposta_analise_inclusa,
        autoriza_correspondencias=payload.autoriza_correspondencias,
        data_prevista_entrega_chaves=payload.data_prevista_entrega_chaves,
        data_primeiro_aluguel_vencimento=payload.data_primeiro_aluguel_vencimento,
    ).model_dump()
    ficha["created_at"] = now_utc().isoformat()
    await db.fichas_locatario.insert_one(ficha)

    # Notify all admins of this tenant
    corretor_user = await db.users.find_one({"id": current.id}, {"_id": 0, "nome": 1})
    corretor_nome = (corretor_user or {}).get("nome", "Corretor")
    imovel_titulo = ""
    if payload.imovel_id:
        prop = await db.properties.find_one({"id": payload.imovel_id}, {"_id": 0, "titulo": 1})
        imovel_titulo = f" para {(prop or {}).get('titulo', '')}" if prop else ""
    cliente1_nome = (payload.cliente1 or {}).get("nome_completo", "Inquilino")
    admins = await db.users.find(
        {"tenant_id": current.tenant_id, "role": {"$in": ["admin", "superadmin"]}},
        {"_id": 0, "id": 1},
    ).to_list(50)
    for admin in admins:
        await create_notification(
            tenant_id=current.tenant_id,
            recipient_id=admin["id"],
            type="info",
            title="Novo inquilino cadastrado",
            body=f"{corretor_nome} cadastrou {cliente1_nome}{imovel_titulo}.",
            link="/admin/fichas-locatario",
        )

    # Auto-create locatário user accounts (login with email, temp password = CPF digits)
    async def _auto_create_locatario(email: str, nome: str, cpf: str) -> None:
        if not email:
            return
        existing = await db.users.find_one({"email": email}, {"_id": 0, "id": 1})
        if existing:
            return
        temp_pw = re.sub(r"\D", "", cpf) or "imobvip123"
        user_doc = UserModel(
            role="locatario",
            nome=nome,
            email=email,
            tenant_id=current.tenant_id,
            corretor_id=current.id,
        ).model_dump()
        user_doc["password_hash"] = hash_password(temp_pw)
        user_doc["created_at"] = now_utc().isoformat()
        await db.users.insert_one(user_doc)

    cliente1 = payload.cliente1 or {}
    await _auto_create_locatario(
        email=cliente1.get("email", "").strip(),
        nome=cliente1.get("nome_completo", "Locatário"),
        cpf=cliente1.get("cpf", ""),
    )

    if payload.cliente2:
        cliente2 = payload.cliente2 if isinstance(payload.cliente2, dict) else payload.cliente2
        await _auto_create_locatario(
            email=(cliente2.get("email", "") if isinstance(cliente2, dict) else "").strip(),
            nome=(cliente2.get("nome_completo", "Locatário 2") if isinstance(cliente2, dict) else "Locatário 2"),
            cpf=(cliente2.get("cpf", "") if isinstance(cliente2, dict) else ""),
        )

    return serialize(ficha)


# ── LIST ──────────────────────────────────────────────────────────────────────

@router.get("")
async def list_fichas(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current: AuthUser = Depends(get_current_user),
):
    flt = await get_tenant_filter(current)
    if current.role == "corretor":
        flt["corretor_id"] = current.id
    elif current.role == "locatario":
        # Locatário só vê a própria ficha via e-mail
        flt["cliente1.email"] = current.get("email", "")
    if status:
        flt["status"] = status
    if search:
        flt["$or"] = [
            {"cliente1.nome_completo": {"$regex": search, "$options": "i"}},
            {"cliente1.cpf": {"$regex": search, "$options": "i"}},
            {"condominio": {"$regex": search, "$options": "i"}},
            {"unidade": {"$regex": search, "$options": "i"}},
        ]
    skip = (page - 1) * limit
    rows = await db.fichas_locatario.find(flt, {"_id": 0}) \
        .sort("created_at", -1).skip(skip).to_list(limit)
    total = await db.fichas_locatario.count_documents(flt)
    # Enrich with corretor name only (not full details) for list view
    corretor_ids = list({r["corretor_id"] for r in rows if r.get("corretor_id")})
    corretores = await db.users.find(
        {"id": {"$in": corretor_ids}}, {"_id": 0, "id": 1, "nome": 1}
    ).to_list(200) if corretor_ids else []
    by_c = {c["id"]: c for c in corretores}
    for r in rows:
        r["corretor"] = by_c.get(r.get("corretor_id"))
    return {"items": serialize(rows), "total": total, "page": page, "limit": limit}


# ── GET ONE ───────────────────────────────────────────────────────────────────

@router.get("/{ficha_id}")
async def get_ficha(ficha_id: str, current: AuthUser = Depends(get_current_user)):
    doc = await db.fichas_locatario.find_one({"id": ficha_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Ficha não encontrada.")
    _check_access(doc, current)
    doc = await _enrich(doc)
    return serialize(doc)


# ── UPDATE ────────────────────────────────────────────────────────────────────

@router.put("/{ficha_id}")
async def update_ficha(
    ficha_id: str,
    payload: FichaLocatarioUpdate,
    current: AuthUser = Depends(require_roles("corretor", "admin", "superadmin")),
):
    doc = await db.fichas_locatario.find_one({"id": ficha_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Ficha não encontrada.")
    _check_access(doc, current)
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, "Nada a atualizar.")
    updates["updated_at"] = now_utc().isoformat()
    await db.fichas_locatario.update_one({"id": ficha_id}, {"$set": updates})
    updated = await db.fichas_locatario.find_one({"id": ficha_id}, {"_id": 0})
    return serialize(updated)


# ── UPLOAD ASSINATURA ─────────────────────────────────────────────────────────

@router.post("/{ficha_id}/assinatura-cliente1")
async def upload_assinatura1(
    ficha_id: str,
    body: dict,
    current: AuthUser = Depends(require_roles("corretor", "admin", "superadmin")),
):
    url = body.get("url")
    if not url:
        raise HTTPException(400, "url obrigatório.")
    doc = await db.fichas_locatario.find_one({"id": ficha_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Ficha não encontrada.")
    _check_access(doc, current)
    await db.fichas_locatario.update_one({"id": ficha_id}, {"$set": {"assinatura_cliente1_url": url}})
    return {"ok": True}


@router.post("/{ficha_id}/assinatura-cliente2")
async def upload_assinatura2(
    ficha_id: str,
    body: dict,
    current: AuthUser = Depends(require_roles("corretor", "admin", "superadmin")),
):
    url = body.get("url")
    if not url:
        raise HTTPException(400, "url obrigatório.")
    doc = await db.fichas_locatario.find_one({"id": ficha_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Ficha não encontrada.")
    _check_access(doc, current)
    await db.fichas_locatario.update_one({"id": ficha_id}, {"$set": {"assinatura_cliente2_url": url}})
    return {"ok": True}


# ── SAVE PDF URL ──────────────────────────────────────────────────────────────

@router.post("/{ficha_id}/ficha-pdf-url")
async def save_pdf_url(
    ficha_id: str,
    body: dict,
    current: AuthUser = Depends(require_roles("corretor", "admin", "superadmin")),
):
    url = body.get("url")
    if not url:
        raise HTTPException(400, "url obrigatório.")
    await db.fichas_locatario.update_one({"id": ficha_id}, {"$set": {"ficha_pdf_url": url}})
    return {"ok": True}


# ── VINCULAR CONTRATO ─────────────────────────────────────────────────────────

@router.patch("/{ficha_id}/vincular-contrato")
async def vincular_contrato(
    ficha_id: str,
    body: dict,
    current: AuthUser = Depends(require_roles("corretor", "admin", "superadmin")),
):
    contrato_id = body.get("contrato_id")
    if not contrato_id:
        raise HTTPException(400, "contrato_id obrigatório.")
    doc = await db.fichas_locatario.find_one({"id": ficha_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Ficha não encontrada.")
    _check_access(doc, current)
    await db.fichas_locatario.update_one(
        {"id": ficha_id},
        {"$set": {"contrato_id": contrato_id, "status": "ativo"}},
    )
    return {"ok": True}
