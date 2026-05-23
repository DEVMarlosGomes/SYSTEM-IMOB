"""Dashboard aggregations per role."""
from __future__ import annotations

from datetime import date, timedelta
from collections import defaultdict

from fastapi import APIRouter, Depends

from core import AuthUser, db, get_current_user, get_tenant_filter, serialize

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/admin")
async def admin_dashboard(current: AuthUser = Depends(get_current_user)):
    flt = await get_tenant_filter(current)
    today = date.today()

    properties = await db.properties.find(flt, {"_id": 0}).to_list(5000)
    payments = await db.payments.find(flt, {"_id": 0}).to_list(10000)
    appts = await db.appointments.find(flt, {"_id": 0}).to_list(2000)
    locatarios = await db.users.count_documents({**flt, "role": "locatario", "active": True})
    locadores = await db.users.count_documents({**flt, "role": "locador", "active": True})
    corretores = await db.users.count_documents({**flt, "role": "corretor", "active": True})

    by_status = defaultdict(int)
    by_tipo = defaultdict(int)
    for p in properties:
        by_status[p.get("status", "disponivel")] += 1
        by_tipo[p.get("tipo", "outro")] += 1

    # receita do mes (pagamentos com status=pago no mes corrente)
    ym = today.strftime("%Y-%m")
    receita_mes = sum(p["valor"] for p in payments if p["status_locatario"] == "pago" and p["mes_referencia"] == ym)
    atrasados = 0
    today_iso = today.isoformat()
    for p in payments:
        if p["status_locatario"] in ("pendente", "comprovante_enviado") and p["data_vencimento"] < today_iso:
            atrasados += 1

    # receita ultimos 6 meses
    months: list[tuple[str, float]] = []
    cur = today.replace(day=1)
    for _ in range(6):
        key = cur.strftime("%Y-%m")
        total = sum(p["valor"] for p in payments if p["status_locatario"] == "pago" and p["mes_referencia"] == key)
        months.append((key, total))
        # back one month
        if cur.month == 1:
            cur = cur.replace(year=cur.year - 1, month=12)
        else:
            cur = cur.replace(month=cur.month - 1)
    months.reverse()

    week_end = today + timedelta(days=7)
    agendamentos_semana = [a for a in appts if today.isoformat() <= a["data"] <= week_end.isoformat()]

    # recent activity
    recent_props = sorted(properties, key=lambda p: p.get("created_at", ""), reverse=True)[:5]
    recent_pays = sorted(
        [p for p in payments if p["status_locatario"] == "pago" and p.get("data_pagamento")],
        key=lambda p: p.get("data_pagamento", ""),
        reverse=True,
    )[:5]

    return serialize({
        "kpis": {
            "total_imoveis": len(properties),
            "imoveis_disponiveis": by_status["disponivel"],
            "imoveis_alugados": by_status["alugado"],
            "imoveis_indisponiveis": by_status["indisponivel"],
            "locatarios": locatarios,
            "locadores": locadores,
            "corretores": corretores,
            "receita_mes": receita_mes,
            "atrasados": atrasados,
            "agendamentos_semana": len(agendamentos_semana),
        },
        "distribuicao_status": [{"status": k, "total": v} for k, v in by_status.items()],
        "distribuicao_tipo": [{"tipo": k, "total": v} for k, v in by_tipo.items()],
        "receita_mensal": [{"mes": m, "valor": v} for m, v in months],
        "atividade_recente": {
            "imoveis": recent_props,
            "pagamentos": recent_pays,
        },
    })


@router.get("/corretor")
async def corretor_dashboard(current: AuthUser = Depends(get_current_user)):
    if current.role != "corretor":
        return await admin_dashboard(current)
    today = date.today()
    week_end = today + timedelta(days=7)
    properties = await db.properties.find({"corretor_id": current.id}, {"_id": 0}).to_list(2000)
    appts = await db.appointments.find({"corretor_id": current.id}, {"_id": 0}).to_list(2000)
    upcoming = [a for a in appts if today.isoformat() <= a["data"] <= week_end.isoformat()]
    by_status = defaultdict(int)
    for p in properties:
        by_status[p.get("status", "disponivel")] += 1
    return serialize({
        "kpis": {
            "meus_imoveis": len(properties),
            "disponiveis": by_status["disponivel"],
            "alugados": by_status["alugado"],
            "agendamentos_semana": len(upcoming),
        },
        "proximos_agendamentos": sorted(upcoming, key=lambda a: (a["data"], a["hora_inicio"]))[:6],
        "meus_imoveis": sorted(properties, key=lambda p: p.get("created_at", ""), reverse=True)[:6],
    })
