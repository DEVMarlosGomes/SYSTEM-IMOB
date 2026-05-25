"""Idempotent seed for ImobSys demo data.

Creates:
- one tenant (Imobiliaria Premium)
- demo users for every role with password 'senha123'
- one corretor with cadastered property + owner profile
- one active contract between locatario and locador with monthly payments
- couple of upcoming appointments

The seed is safe to run on every startup: it checks for existing emails / IDs.
"""
from __future__ import annotations

import logging
from datetime import datetime, date, timedelta, timezone

from core import db, hash_password, next_business_day, now_utc

logger = logging.getLogger("imobsys.seed")

TENANT_ID = "00000000-0000-0000-0000-000000000001"
ADMIN_ID = "u-admin-0001"
CORRETOR_ID = "u-corretor-0001"
CORRETOR2_ID = "u-corretor-0002"
LOCATARIO_ID = "u-locatario-0001"
LOCADOR_ID = "u-locador-0001"
SUPERADMIN_ID = "u-superadmin-0001"
OWNER_PROFILE_ID = "op-0001"
PROPERTY_ID = "prop-0001"
PROPERTY2_ID = "prop-0002"
PROPERTY3_ID = "prop-0003"
CONTRACT_ID = "c-0001"

DEMO_PASSWORD_HASH: str | None = None


async def _upsert(collection: str, doc: dict, key: str = "id") -> None:
    await db[collection].update_one({key: doc[key]}, {"$setOnInsert": doc}, upsert=True)


async def run_seed() -> None:
    global DEMO_PASSWORD_HASH
    DEMO_PASSWORD_HASH = hash_password("senha123")

    # ---- tenant ----
    tenant_doc = {
        "id": TENANT_ID,
        "nome": "Imobiliaria Premium",
        "slug": "premium",
        "cnpj": "12.345.678/0001-90",
        "chave_pix": "contato@imobiliariapremium.com.br",
        "telefone": "(11) 4000-0000",
        "endereco": "Av. Paulista, 1000 - Sao Paulo/SP",
        "logo_url": None,
        "created_at": now_utc().isoformat(),
    }
    await _upsert("tenants", tenant_doc)

    # ---- users ----
    users = [
        {"id": SUPERADMIN_ID, "role": "superadmin", "nome": "Super Admin", "email": "super@teste.com",
         "telefone": "(11) 90000-0000", "tenant_id": None},
        {"id": ADMIN_ID, "role": "admin", "nome": "Marina Albuquerque", "email": "admin@teste.com",
         "telefone": "(11) 90000-1111", "tenant_id": TENANT_ID},
        {"id": CORRETOR_ID, "role": "corretor", "nome": "Rafael Andrade", "email": "corretor@teste.com",
         "telefone": "(11) 90000-2222", "tenant_id": TENANT_ID},
        {"id": CORRETOR2_ID, "role": "corretor", "nome": "Camila Souza", "email": "corretor2@teste.com",
         "telefone": "(11) 90000-3333", "tenant_id": TENANT_ID},
        {"id": LOCATARIO_ID, "role": "locatario", "nome": "Joana Pereira", "email": "locatario@teste.com",
         "telefone": "(11) 90000-4444", "tenant_id": TENANT_ID, "corretor_id": CORRETOR_ID},
        {"id": LOCADOR_ID, "role": "locador", "nome": "Carlos Fernandes", "email": "locador@teste.com",
         "telefone": "(11) 90000-5555", "tenant_id": TENANT_ID, "corretor_id": CORRETOR_ID},
    ]
    for u in users:
        await db.users.update_one(
            {"email": u["email"]},
            {
                "$setOnInsert": {
                    **u,
                    "password_hash": DEMO_PASSWORD_HASH,
                    "active": True,
                    "avatar_url": None,
                    "created_at": now_utc().isoformat(),
                }
            },
            upsert=True,
        )

    # ---- owner profile ----
    owner_profile = {
        "id": OWNER_PROFILE_ID,
        "tenant_id": TENANT_ID,
        "corretor_id": CORRETOR_ID,
        "nome": "Carlos Fernandes",
        "cpf": "123.456.789-00",
        "rg": "12.345.678-9",
        "telefone": "(11) 90000-5555",
        "email": "locador@teste.com",
        "endereco": "Rua das Flores, 200 - Sao Paulo/SP",
        "banco": "Banco Premium",
        "agencia": "0001",
        "conta": "12345-6",
        "tipo_conta": "corrente",
        "pix": "locador@teste.com",
        "locador_user_id": LOCADOR_ID,
        "created_at": now_utc().isoformat(),
    }
    await _upsert("owner_profiles", owner_profile)

    # ---- properties ----
    base_props = [
        {
            "id": PROPERTY_ID,
            "tenant_id": TENANT_ID,
            "corretor_id": CORRETOR_ID,
            "owner_profile_id": OWNER_PROFILE_ID,
            "titulo": "Apartamento Premium Vila Madalena",
            "descricao": "Apartamento de alto padrao, recem reformado, com vista panoramica e luz natural o dia todo.",
            "tipo": "apartamento",
            "status": "alugado",
            "endereco": "Rua Aspicuelta, 500",
            "bairro": "Vila Madalena",
            "cidade": "Sao Paulo",
            "cep": "05433-010",
            "area_m2": 95.0,
            "quartos": 2,
            "banheiros": 2,
            "vagas": 1,
            "valor_aluguel": 4800.0,
            "valor_condominio": 850.0,
            "valor_iptu": 180.0,
            "aceita_pet": True,
            "mobiliado": False,
            "fotos": [
                "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
            ],
        },
        {
            "id": PROPERTY2_ID,
            "tenant_id": TENANT_ID,
            "corretor_id": CORRETOR_ID,
            "owner_profile_id": None,
            "titulo": "Casa com piscina em Alphaville",
            "descricao": "Casa em condominio fechado, 4 suites, area de lazer completa, piscina aquecida e churrasqueira.",
            "tipo": "casa",
            "status": "disponivel",
            "endereco": "Alameda dos Anapurus, 70",
            "bairro": "Alphaville",
            "cidade": "Barueri",
            "cep": "06474-000",
            "area_m2": 320.0,
            "quartos": 4,
            "banheiros": 5,
            "vagas": 4,
            "valor_aluguel": 12500.0,
            "valor_condominio": 1850.0,
            "valor_iptu": 540.0,
            "aceita_pet": True,
            "mobiliado": True,
            "fotos": [
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
            ],
        },
        {
            "id": PROPERTY3_ID,
            "tenant_id": TENANT_ID,
            "corretor_id": CORRETOR2_ID,
            "owner_profile_id": None,
            "titulo": "Sala comercial Faria Lima",
            "descricao": "Sala comercial em torre AAA, com infraestrutura completa, lobby imponente e estacionamento.",
            "tipo": "sala",
            "status": "disponivel",
            "endereco": "Av. Brigadeiro Faria Lima, 3477",
            "bairro": "Itaim Bibi",
            "cidade": "Sao Paulo",
            "cep": "04538-133",
            "area_m2": 85.0,
            "quartos": 0,
            "banheiros": 2,
            "vagas": 2,
            "valor_aluguel": 7800.0,
            "valor_condominio": 1200.0,
            "valor_iptu": 240.0,
            "aceita_pet": False,
            "mobiliado": False,
            "fotos": [
                "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
            ],
        },
    ]
    for p in base_props:
        await _upsert("properties", {**p, "created_at": now_utc().isoformat()})

    # ---- contract + payments ----
    today = date.today()
    start = today.replace(day=1) - timedelta(days=60)
    start = start.replace(day=1)
    end = (start.replace(year=start.year + 1))
    contract = {
        "id": CONTRACT_ID,
        "tenant_id": TENANT_ID,
        "property_id": PROPERTY_ID,
        "locatario_id": LOCATARIO_ID,
        "locador_id": LOCADOR_ID,
        "corretor_id": CORRETOR_ID,
        "owner_profile_id": OWNER_PROFILE_ID,
        "data_inicio": start.isoformat(),
        "data_fim": end.isoformat(),
        "valor_aluguel": 4800.0,
        "dia_vencimento": 10,
        "indice_reajuste": "IGPM",
        "status": "ativo",
        "pdf_url": None,
        "clausulas": "Reajuste anual conforme IGPM. Caucao de 1 aluguel.",
        "created_at": now_utc().isoformat(),
    }
    await _upsert("contracts", contract)

    # generate payments month by month
    cur = start.replace(day=1)
    while cur <= end:
        due_day = 10
        try:
            due_date = cur.replace(day=due_day)
        except ValueError:
            due_date = cur.replace(day=28)
        due_date = next_business_day(due_date)
        mes_ref = cur.strftime("%Y-%m")

        # decide status based on whether month is in the past
        if cur < today.replace(day=1):
            status_loc = "pago"
            status_lor = "pago"
            data_pagamento = due_date.isoformat()
        elif cur.month == today.month and cur.year == today.year:
            # current month - simulate already paid by tenant, in tax phase for landlord
            if today.day > due_day:
                status_loc = "pago"
                status_lor = "gerando_impostos"
                data_pagamento = due_date.isoformat()
            else:
                status_loc = "pendente"
                status_lor = "em_esteira"
                data_pagamento = None
        else:
            status_loc = "pendente"
            status_lor = "em_esteira"
            data_pagamento = None

        pid = f"pay-{mes_ref}"
        await _upsert("payments", {
            "id": pid,
            "tenant_id": TENANT_ID,
            "contract_id": CONTRACT_ID,
            "locatario_id": LOCATARIO_ID,
            "locador_id": LOCADOR_ID,
            "mes_referencia": mes_ref,
            "valor": 4800.0,
            "data_vencimento": due_date.isoformat(),
            "data_pagamento": data_pagamento,
            "status_locatario": status_loc,
            "status_locador": status_lor,
            "comprovante_locatario_url": None,
            "comprovante_locador_url": None,
            "data_repasse_prevista": None,
            "observacoes": None,
            "created_at": now_utc().isoformat(),
        })

        # advance month
        if cur.month == 12:
            cur = cur.replace(year=cur.year + 1, month=1, day=1)
        else:
            cur = cur.replace(month=cur.month + 1, day=1)

    # ---- a couple of appointments ----
    appts = [
        {
            "id": "app-0001",
            "tenant_id": TENANT_ID,
            "corretor_id": CORRETOR_ID,
            "property_id": PROPERTY2_ID,
            "nome_cliente": "Lucas e Beatriz",
            "data": (today + timedelta(days=1)).isoformat(),
            "hora_inicio": "10:00",
            "hora_fim": "11:00",
            "observacoes": "Visita com possibilidade de fechamento.",
            "status": "agendado",
            "created_at": now_utc().isoformat(),
        },
        {
            "id": "app-0002",
            "tenant_id": TENANT_ID,
            "corretor_id": CORRETOR2_ID,
            "property_id": PROPERTY3_ID,
            "nome_cliente": "Startup Aurora",
            "data": (today + timedelta(days=2)).isoformat(),
            "hora_inicio": "14:00",
            "hora_fim": "15:00",
            "observacoes": "Visita corporativa.",
            "status": "agendado",
            "created_at": now_utc().isoformat(),
        },
    ]
    for a in appts:
        await _upsert("appointments", a)

    # ---- a couple of chat messages between locador <-> imobiliaria ----
    msg1 = {
        "id": "msg-0001",
        "tenant_id": TENANT_ID,
        "locador_id": LOCADOR_ID,
        "remetente_id": ADMIN_ID,
        "remetente_nome": "Marina (Imobiliaria)",
        "remetente_role": "admin",
        "mensagem": "Ola Carlos! Tudo certo com o repasse deste mes, ja em processamento.",
        "lida": True,
        "created_at": (now_utc() - timedelta(hours=2)).isoformat(),
    }
    msg2 = {
        "id": "msg-0002",
        "tenant_id": TENANT_ID,
        "locador_id": LOCADOR_ID,
        "remetente_id": LOCADOR_ID,
        "remetente_nome": "Carlos Fernandes",
        "remetente_role": "locador",
        "mensagem": "Otimo, obrigado pelo retorno!",
        "lida": False,
        "created_at": (now_utc() - timedelta(hours=1)).isoformat(),
    }
    for m in (msg1, msg2):
        await _upsert("chat_messages", m)

    # ---- extra demo clients (locadores, locatários, imóveis) ----
    extra_locadores = [
        {"id": "u-locador-0002", "nome": "Patricia Moreira",     "email": "patricia.locador@teste.com",  "telefone": "(11) 91111-2001"},
        {"id": "u-locador-0003", "nome": "Roberto Assis",        "email": "roberto.locador@teste.com",   "telefone": "(11) 91111-2002"},
        {"id": "u-locador-0004", "nome": "Isabela Carvalho",     "email": "isabela.locador@teste.com",   "telefone": "(11) 91111-2003"},
        {"id": "u-locador-0005", "nome": "Eduardo Mendes",       "email": "eduardo.locador@teste.com",   "telefone": "(11) 91111-2004"},
        {"id": "u-locador-0006", "nome": "Fatima Nascimento",    "email": "fatima.locador@teste.com",    "telefone": "(11) 91111-2005"},
        {"id": "u-locador-0007", "nome": "Marcelo Teixeira",     "email": "marcelo.locador@teste.com",   "telefone": "(11) 91111-2006"},
    ]
    for u in extra_locadores:
        await db.users.update_one(
            {"email": u["email"]},
            {"$setOnInsert": {**u, "role": "locador", "tenant_id": TENANT_ID, "corretor_id": CORRETOR_ID,
                              "password_hash": DEMO_PASSWORD_HASH, "active": True, "avatar_url": None,
                              "created_at": now_utc().isoformat()}},
            upsert=True,
        )

    extra_locatarios = [
        {"id": "u-locatario-0002", "nome": "Fernanda Lima",        "email": "fernanda.loc@teste.com",   "telefone": "(11) 92222-3001"},
        {"id": "u-locatario-0003", "nome": "Thiago Rodrigues",     "email": "thiago.loc@teste.com",     "telefone": "(11) 92222-3002"},
        {"id": "u-locatario-0004", "nome": "Aline Barbosa",        "email": "aline.loc@teste.com",      "telefone": "(11) 92222-3003"},
        {"id": "u-locatario-0005", "nome": "Gustavo Almeida",      "email": "gustavo.loc@teste.com",    "telefone": "(11) 92222-3004"},
        {"id": "u-locatario-0006", "nome": "Leticia Santos",       "email": "leticia.loc@teste.com",    "telefone": "(11) 92222-3005"},
        {"id": "u-locatario-0007", "nome": "Diego Ferreira",       "email": "diego.loc@teste.com",      "telefone": "(11) 92222-3006"},
        {"id": "u-locatario-0008", "nome": "Bruna Martins",        "email": "bruna.loc@teste.com",      "telefone": "(11) 92222-3007"},
    ]
    for u in extra_locatarios:
        await db.users.update_one(
            {"email": u["email"]},
            {"$setOnInsert": {**u, "role": "locatario", "tenant_id": TENANT_ID, "corretor_id": CORRETOR2_ID,
                              "password_hash": DEMO_PASSWORD_HASH, "active": True, "avatar_url": None,
                              "created_at": now_utc().isoformat()}},
            upsert=True,
        )

    extra_owner_profiles = [
        {"id": "op-0002", "locador_user_id": "u-locador-0002", "nome": "Patricia Moreira",  "cpf": "234.567.890-01",
         "rg": "23.456.789-0", "telefone": "(11) 91111-2001", "email": "patricia.locador@teste.com",
         "endereco": "Rua Boa Vista, 110 - Suzano/SP",
         "banco": "Itau", "agencia": "1234", "conta": "56789-0", "tipo_conta": "corrente", "pix": "patricia.locador@teste.com"},
        {"id": "op-0003", "locador_user_id": "u-locador-0003", "nome": "Roberto Assis",     "cpf": "345.678.901-12",
         "rg": "34.567.890-1", "telefone": "(11) 91111-2002", "email": "roberto.locador@teste.com",
         "endereco": "Av. Paulo Portela, 350 - Suzano/SP",
         "banco": "Bradesco", "agencia": "2345", "conta": "67890-1", "tipo_conta": "poupanca", "pix": "roberto.locador@teste.com"},
        {"id": "op-0004", "locador_user_id": "u-locador-0004", "nome": "Isabela Carvalho",  "cpf": "456.789.012-23",
         "rg": "45.678.901-2", "telefone": "(11) 91111-2003", "email": "isabela.locador@teste.com",
         "endereco": "Rua Sao Bento, 78 - Mogi das Cruzes/SP",
         "banco": "Caixa", "agencia": "3456", "conta": "78901-2", "tipo_conta": "corrente", "pix": "456.789.012-23"},
        {"id": "op-0005", "locador_user_id": "u-locador-0005", "nome": "Eduardo Mendes",    "cpf": "567.890.123-34",
         "rg": "56.789.012-3", "telefone": "(11) 91111-2004", "email": "eduardo.locador@teste.com",
         "endereco": "Estrada Mogi-Suzano, 900 - Poá/SP",
         "banco": "Santander", "agencia": "4567", "conta": "89012-3", "tipo_conta": "corrente", "pix": "567.890.123-34"},
        {"id": "op-0006", "locador_user_id": "u-locador-0006", "nome": "Fatima Nascimento", "cpf": "678.901.234-45",
         "rg": "67.890.123-4", "telefone": "(11) 91111-2005", "email": "fatima.locador@teste.com",
         "endereco": "Rua Guarani, 22 - Suzano/SP",
         "banco": "Nubank", "agencia": "0001", "conta": "90123-4", "tipo_conta": "corrente", "pix": "fatima.locador@teste.com"},
        {"id": "op-0007", "locador_user_id": "u-locador-0007", "nome": "Marcelo Teixeira",  "cpf": "789.012.345-56",
         "rg": "78.901.234-5", "telefone": "(11) 91111-2006", "email": "marcelo.locador@teste.com",
         "endereco": "Av. Independencia, 500 - Suzano/SP",
         "banco": "Banco do Brasil", "agencia": "5678", "conta": "01234-5", "tipo_conta": "corrente", "pix": "789.012.345-56"},
    ]
    for op in extra_owner_profiles:
        await _upsert("owner_profiles", {**op, "tenant_id": TENANT_ID, "corretor_id": CORRETOR_ID, "created_at": now_utc().isoformat()})

    extra_properties = [
        {
            "id": "prop-0004", "tenant_id": TENANT_ID, "corretor_id": CORRETOR_ID, "owner_profile_id": "op-0002",
            "titulo": "Apartamento 2 quartos Centro Suzano",
            "descricao": "Apto reformado no centro de Suzano, próximo ao metrô, sacada com churrasqueira.",
            "tipo": "apartamento", "status": "disponivel",
            "endereco": "Rua General Francisco Glicério, 150", "bairro": "Centro", "cidade": "Suzano", "cep": "08673-000",
            "area_m2": 68.0, "quartos": 2, "banheiros": 1, "vagas": 1,
            "valor_aluguel": 1800.0, "valor_condominio": 320.0, "valor_iptu": 65.0,
            "aceita_pet": False, "mobiliado": False,
            "fotos": ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80"],
        },
        {
            "id": "prop-0005", "tenant_id": TENANT_ID, "corretor_id": CORRETOR_ID, "owner_profile_id": "op-0003",
            "titulo": "Casa 3 quartos Jardim Imperador",
            "descricao": "Casa espaçosa com quintal amplo, churrasqueira coberta e 2 vagas. Ótima localização.",
            "tipo": "casa", "status": "disponivel",
            "endereco": "Rua das Azaleias, 340", "bairro": "Jardim Imperador", "cidade": "Suzano", "cep": "08674-000",
            "area_m2": 130.0, "quartos": 3, "banheiros": 2, "vagas": 2,
            "valor_aluguel": 2800.0, "valor_condominio": 0.0, "valor_iptu": 95.0,
            "aceita_pet": True, "mobiliado": False,
            "fotos": ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80"],
        },
        {
            "id": "prop-0006", "tenant_id": TENANT_ID, "corretor_id": CORRETOR2_ID, "owner_profile_id": "op-0004",
            "titulo": "Studio mobiliado Mogi das Cruzes",
            "descricao": "Studio compacto e funcional, totalmente mobiliado, ideal para solteiros ou casais.",
            "tipo": "studio", "status": "disponivel",
            "endereco": "Av. Voluntário Fernando Pinheiro Franco, 880", "bairro": "Vila Industrial", "cidade": "Mogi das Cruzes", "cep": "08750-000",
            "area_m2": 38.0, "quartos": 1, "banheiros": 1, "vagas": 0,
            "valor_aluguel": 1200.0, "valor_condominio": 280.0, "valor_iptu": 40.0,
            "aceita_pet": False, "mobiliado": True,
            "fotos": ["https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1200&q=80"],
        },
        {
            "id": "prop-0007", "tenant_id": TENANT_ID, "corretor_id": CORRETOR_ID, "owner_profile_id": "op-0005",
            "titulo": "Sobrado 4 quartos Poá",
            "descricao": "Sobrado moderno em condomínio fechado, 4 quartos sendo 1 suíte, área gourmet.",
            "tipo": "sobrado", "status": "alugado",
            "endereco": "Rua Marechal Deodoro, 210", "bairro": "Centro", "cidade": "Poá", "cep": "08550-000",
            "area_m2": 180.0, "quartos": 4, "banheiros": 3, "vagas": 2,
            "valor_aluguel": 3500.0, "valor_condominio": 480.0, "valor_iptu": 130.0,
            "aceita_pet": True, "mobiliado": False,
            "fotos": ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"],
        },
        {
            "id": "prop-0008", "tenant_id": TENANT_ID, "corretor_id": CORRETOR2_ID, "owner_profile_id": "op-0006",
            "titulo": "Ponto comercial Avenida Principal Suzano",
            "descricao": "Loja de esquina com grande vitrine, 80m², no trecho mais movimentado do comércio local.",
            "tipo": "loja", "status": "disponivel",
            "endereco": "Av. Paulo Portela, 1200", "bairro": "Centro", "cidade": "Suzano", "cep": "08673-100",
            "area_m2": 80.0, "quartos": 0, "banheiros": 1, "vagas": 0,
            "valor_aluguel": 4200.0, "valor_condominio": 0.0, "valor_iptu": 180.0,
            "aceita_pet": False, "mobiliado": False,
            "fotos": ["https://images.unsplash.com/photo-1601546544593-afe8d2e17be3?auto=format&fit=crop&w=1200&q=80"],
        },
        {
            "id": "prop-0009", "tenant_id": TENANT_ID, "corretor_id": CORRETOR_ID, "owner_profile_id": "op-0007",
            "titulo": "Apartamento garden Jardim Trabalho",
            "descricao": "Garden com jardim privativo, 2 quartos, varanda, 1 vaga coberta. Condomínio tranquilo.",
            "tipo": "apartamento", "status": "disponivel",
            "endereco": "Rua Felício Imigrante, 55", "bairro": "Jardim Trabalho", "cidade": "Suzano", "cep": "08675-000",
            "area_m2": 75.0, "quartos": 2, "banheiros": 1, "vagas": 1,
            "valor_aluguel": 2100.0, "valor_condominio": 350.0, "valor_iptu": 72.0,
            "aceita_pet": True, "mobiliado": False,
            "fotos": ["https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80"],
        },
        {
            "id": "prop-0010", "tenant_id": TENANT_ID, "corretor_id": CORRETOR2_ID, "owner_profile_id": "op-0003",
            "titulo": "Galpão logístico Estrada do Pinheirinho",
            "descricao": "Galpão 400m², pé-direito 7m, portão largo, excelente acesso para caminhões. Área de escritório inclusa.",
            "tipo": "galpao", "status": "disponivel",
            "endereco": "Estrada do Pinheirinho, 2800", "bairro": "Distrito Industrial", "cidade": "Suzano", "cep": "08681-000",
            "area_m2": 400.0, "quartos": 0, "banheiros": 2, "vagas": 8,
            "valor_aluguel": 9800.0, "valor_condominio": 0.0, "valor_iptu": 390.0,
            "aceita_pet": False, "mobiliado": False,
            "fotos": ["https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80"],
        },
    ]
    for p in extra_properties:
        await _upsert("properties", {**p, "created_at": now_utc().isoformat()})

    logger.info("Seed completed (idempotent).")
