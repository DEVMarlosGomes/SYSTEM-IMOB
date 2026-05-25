"""Admin report data endpoints."""
from __future__ import annotations

from datetime import date
from collections import defaultdict

from fastapi import APIRouter, Depends

from core import AuthUser, db, get_tenant_filter, require_roles, serialize

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/admin")
async def admin_reports(current: AuthUser = Depends(require_roles("admin", "superadmin"))):
    flt = await get_tenant_filter(current)
    today = date.today().isoformat()
    ym_now = today[:7]  # YYYY-MM

    # ── Inadimplência ─────────────────────────────────────────────────────────
    overdue_payments = await db.payments.find(
        {**flt, "status_locatario": {"$in": ["pendente", "atrasado"]}, "data_vencimento": {"$lt": today}},
        {"_id": 0},
    ).sort("data_vencimento", 1).to_list(2000)

    # Enrich with locatário name and property
    locat_ids = list({p["locatario_id"] for p in overdue_payments})
    users = await db.users.find({"id": {"$in": locat_ids}}, {"_id": 0, "id": 1, "nome": 1, "email": 1, "telefone": 1}).to_list(500) if locat_ids else []
    by_user = {u["id"]: u for u in users}
    contract_ids = list({p["contract_id"] for p in overdue_payments})
    contracts = await db.contracts.find({"id": {"$in": contract_ids}}, {"_id": 0, "id": 1, "property_id": 1}).to_list(500) if contract_ids else []
    by_contract = {c["id"]: c for c in contracts}
    prop_ids = list({c["property_id"] for c in contracts})
    props = await db.properties.find({"id": {"$in": prop_ids}}, {"_id": 0, "id": 1, "titulo": 1, "endereco": 1}).to_list(500) if prop_ids else []
    by_prop = {p["id"]: p for p in props}

    inadimplencia = []
    for p in overdue_payments:
        days_overdue = (date.today() - date.fromisoformat(p["data_vencimento"])).days
        c = by_contract.get(p["contract_id"], {})
        prop = by_prop.get(c.get("property_id", ""), {})
        inadimplencia.append({
            "locatario": by_user.get(p["locatario_id"], {}).get("nome", "—"),
            "email": by_user.get(p["locatario_id"], {}).get("email", ""),
            "telefone": by_user.get(p["locatario_id"], {}).get("telefone", ""),
            "imovel": prop.get("titulo", "—"),
            "mes_referencia": p["mes_referencia"],
            "data_vencimento": p["data_vencimento"],
            "dias_atraso": days_overdue,
            "valor": p["valor"],
        })

    total_inadimplencia = sum(x["valor"] for x in inadimplencia)

    # ── Imóveis vagos ─────────────────────────────────────────────────────────
    all_props = await db.properties.find(flt, {"_id": 0}).to_list(5000)
    vagos = []
    for prop in all_props:
        if prop.get("status") != "alugado":
            # Find last contract for this property
            last_contract = await db.contracts.find_one(
                {"property_id": prop["id"]},
                sort=[("created_at", -1)],
                projection={"_id": 0, "data_fim": 1},
            )
            last_date = (last_contract or {}).get("data_fim")
            if last_date:
                try:
                    dias_vago = (date.today() - date.fromisoformat(last_date)).days
                except Exception:
                    dias_vago = None
            else:
                dias_vago = None  # never rented
            vagos.append({
                "titulo": prop.get("titulo", "—"),
                "endereco": prop.get("endereco", ""),
                "bairro": prop.get("bairro", ""),
                "tipo": prop.get("tipo", ""),
                "valor_aluguel": prop.get("valor_aluguel", 0),
                "status": prop.get("status", "disponivel"),
                "dias_vago": dias_vago,
                "ultimo_contrato_fim": last_date,
            })
    vagos.sort(key=lambda x: (x["dias_vago"] or -1), reverse=True)

    # ── Receita por corretor ──────────────────────────────────────────────────
    corretores = await db.users.find({**flt, "role": "corretor"}, {"_id": 0, "id": 1, "nome": 1, "email": 1}).to_list(500)
    receita_corretores = []
    for corretor in corretores:
        # Contracts managed by this corretor
        cor_contracts = await db.contracts.find(
            {**flt, "corretor_id": corretor["id"]},
            {"_id": 0, "id": 1, "valor_aluguel": 1},
        ).to_list(1000)
        contract_ids_cor = [c["id"] for c in cor_contracts]
        # Paid payments this month
        paid_mes = await db.payments.count_documents({
            "contract_id": {"$in": contract_ids_cor},
            "status_locatario": "pago",
            "mes_referencia": ym_now,
        })
        total_pago_mes = sum(
            p["valor"] for p in (await db.payments.find({
                "contract_id": {"$in": contract_ids_cor},
                "status_locatario": "pago",
                "mes_referencia": ym_now,
            }, {"_id": 0, "valor": 1}).to_list(1000))
        ) if contract_ids_cor else 0
        # Total all time
        total_historico = sum(
            p["valor"] for p in (await db.payments.find({
                "contract_id": {"$in": contract_ids_cor},
                "status_locatario": "pago",
            }, {"_id": 0, "valor": 1}).to_list(5000))
        ) if contract_ids_cor else 0
        receita_corretores.append({
            "corretor": corretor["nome"],
            "email": corretor["email"],
            "contratos_ativos": len(cor_contracts),
            "recebido_mes": total_pago_mes,
            "taxa_mes": round(total_pago_mes * 0.10, 2),
            "historico_total": total_historico,
        })
    receita_corretores.sort(key=lambda x: x["recebido_mes"], reverse=True)

    # ── KPIs do mês ──────────────────────────────────────────────────────────
    all_payments = await db.payments.find(flt, {"_id": 0, "valor": 1, "status_locatario": 1, "mes_referencia": 1}).to_list(10000)
    receita_mes = sum(p["valor"] for p in all_payments if p["status_locatario"] == "pago" and p["mes_referencia"] == ym_now)
    total_atrasado = sum(p["valor"] for p in overdue_payments)

    return serialize({
        "gerado_em": today,
        "mes_referencia": ym_now,
        "kpis": {
            "receita_mes": receita_mes,
            "total_inadimplencia": total_inadimplencia,
            "imoveis_vagos": len(vagos),
            "locatarios_inadimplentes": len(inadimplencia),
        },
        "inadimplencia": inadimplencia,
        "imoveis_vagos": vagos,
        "receita_corretores": receita_corretores,
    })
