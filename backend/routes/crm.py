"""CRM endpoints for locatarios and locadores (joined views)."""
from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends

from core import AuthUser, db, get_current_user, get_tenant_filter, require_roles, serialize

router = APIRouter(prefix="/crm", tags=["crm"])


@router.get("/locatarios")
async def crm_locatarios(
    search: Optional[str] = None,
    current: AuthUser = Depends(require_roles("admin", "superadmin", "corretor")),
):
    flt = await get_tenant_filter(current)
    flt["role"] = "locatario"
    if search:
        flt["$or"] = [
            {"nome": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"telefone": {"$regex": search, "$options": "i"}},
        ]
    users = await db.users.find(flt, {"_id": 0, "password_hash": 0}).sort("nome", 1).to_list(2000)
    if current.role == "corretor":
        contracts = await db.contracts.find({"corretor_id": current.id}, {"_id": 0, "locatario_id": 1}).to_list(2000)
        linked = {c["locatario_id"] for c in contracts}
        users = [u for u in users if u["id"] in linked]

    # Bulk load fichas to get CPF
    emails = [u["email"] for u in users if u.get("email")]
    fichas_list = await db.fichas_locatario.find(
        {"cliente1.email": {"$in": emails}},
        {"_id": 0, "cliente1.email": 1, "cliente1.cpf": 1},
    ).to_list(2000)
    cpf_by_email = {f["cliente1"]["email"]: f["cliente1"].get("cpf", "") for f in fichas_list if f.get("cliente1")}

    contracts = await db.contracts.find(
        {"locatario_id": {"$in": [u["id"] for u in users]}, "status": "ativo"},
        {"_id": 0},
    ).to_list(2000)
    by_locat = {c["locatario_id"]: c for c in contracts}
    props = await db.properties.find({"id": {"$in": [c["property_id"] for c in contracts]}}, {"_id": 0}).to_list(2000)
    by_prop = {p["id"]: p for p in props}
    today = date.today().isoformat()

    for u in users:
        u["cpf"] = cpf_by_email.get(u.get("email", ""), None)
        c = by_locat.get(u["id"])
        u["contract"] = c
        u["property"] = by_prop.get(c["property_id"]) if c else None
        if c:
            payments = await db.payments.find(
                {"contract_id": c["id"]},
                {"_id": 0},
                sort=[("data_vencimento", -1)],
            ).to_list(200)
            # flag overdue in-memory
            for p in payments:
                if p["status_locatario"] == "pendente" and p["data_vencimento"] < today:
                    p["status_locatario"] = "atrasado"
            u["last_payment"] = payments[0] if payments else None
            # meses em atraso
            u["meses_atraso"] = sum(1 for p in payments if p["status_locatario"] == "atrasado")
            # next pending payment
            pending = [p for p in reversed(payments) if p["status_locatario"] in ("pendente",)]
            if pending:
                nxt = pending[0]
                d_due = date.fromisoformat(nxt["data_vencimento"])
                d_today = date.today()
                u["dias_para_vencer"] = (d_due - d_today).days
            else:
                u["dias_para_vencer"] = None
        else:
            u["meses_atraso"] = 0
            u["dias_para_vencer"] = None

    return serialize(users)


@router.get("/locadores")
async def crm_locadores(
    search: Optional[str] = None,
    current: AuthUser = Depends(require_roles("admin", "superadmin", "corretor")),
):
    flt = await get_tenant_filter(current)
    flt["role"] = "locador"
    if search:
        flt["$or"] = [
            {"nome": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"telefone": {"$regex": search, "$options": "i"}},
        ]
    users = await db.users.find(flt, {"_id": 0, "password_hash": 0}).sort("nome", 1).to_list(2000)
    if current.role == "corretor":
        contracts = await db.contracts.find({"corretor_id": current.id}, {"_id": 0, "locador_id": 1}).to_list(2000)
        linked = {c["locador_id"] for c in contracts}
        users = [u for u in users if u["id"] in linked]

    # Bulk load owner_profiles for banco/pix
    user_ids = [u["id"] for u in users]
    profiles = await db.owner_profiles.find(
        {"locador_user_id": {"$in": user_ids}},
        {"_id": 0, "locador_user_id": 1, "banco": 1, "agencia": 1, "conta": 1, "pix": 1},
    ).to_list(2000)
    profile_by_user = {p["locador_user_id"]: p for p in profiles if p.get("locador_user_id")}

    contracts = await db.contracts.find(
        {"locador_id": {"$in": user_ids}, "status": "ativo"},
        {"_id": 0},
    ).to_list(2000)
    by_locador = {c["locador_id"]: c for c in contracts}
    props = await db.properties.find({"id": {"$in": [c["property_id"] for c in contracts]}}, {"_id": 0}).to_list(2000)
    by_prop = {p["id"]: p for p in props}

    TAXA = 0.10
    for u in users:
        prof = profile_by_user.get(u["id"], {})
        u["banco"] = prof.get("banco")
        u["pix"] = prof.get("pix")
        c = by_locador.get(u["id"])
        u["contract"] = c
        u["property"] = by_prop.get(c["property_id"]) if c else None
        valor = c["valor_aluguel"] if c else 0
        u["taxa_adm"] = round(valor * TAXA, 2)
        u["valor_liquido"] = round(valor * (1 - TAXA), 2)
        if c:
            last_payment = await db.payments.find_one(
                {"contract_id": c["id"]},
                sort=[("data_vencimento", -1)],
                projection={"_id": 0},
            )
            u["last_payout"] = last_payment
        else:
            u["last_payout"] = None

    return serialize(users)
