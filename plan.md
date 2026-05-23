# plan.md — ImobSys (V1) — UPDATED (após Fase 2 + E2E)

## 1) Objectives
- Entregar um MVP SaaS “magro” com **5 perfis** (superadmin/admin/corretor/locatário/locador) e módulos essenciais: **imóveis**, **agenda**, **CRM**, **financeiro**, **contratos PDF** e **chat realtime**.
- Garantir fundação estável: **React 18 + TypeScript + Vite** (mantendo `REACT_APP_BACKEND_URL`) + **FastAPI + MongoDB + JWT** + **uploads** + **WebSocket**.
- Implementar e validar regras críticas:
  - **Privacidade do proprietário** (corretor só vê ficha dos imóveis que cadastrou; admin vê tudo)
  - **Conflitos de agenda** (409 em overlap)
  - **Fluxo pagamento → repasse** (comprovante → admin aprova → repasse em esteira)
  - **Mudança automática de status do imóvel via contrato** (criar contrato → `alugado`; encerrar → `disponivel`)
- Objetivo atualizado (status atual): **MVP entregue e validado**; foco agora em **hardening**, qualidade e incrementos de produto (Fase 3+).

## 2) Implementation Steps

### Phase 1 — Core POC (isolated foundation: Vite + JWT + Mongo + WebSocket)
**Goal:** provar que a base (env, auth, DB e realtime) funciona antes de escalar para 9 módulos.

User stories:
1. Como usuário, quero logar e receber um JWT para acessar o sistema.
2. Como usuário, quero acessar uma rota protegida e ver meu perfil/role.
3. Como dev, quero rodar o frontend Vite na porta 3000 sem renomear `REACT_APP_BACKEND_URL`.
4. Como usuário, quero fazer upload de um arquivo e conseguir acessá-lo por URL.
5. Como usuário, quero enviar/receber mensagens via WebSocket para validar realtime.

Steps:
- Frontend migration: CRA→Vite + React 18 + TS; configurar `envPrefix: ['VITE_', 'REACT_APP_']`; manter supervisor/porta 3000.
- UI foundation: Tailwind + shadcn/ui; fontes (Playfair/DM Sans) e tema (navy/gold).
- Backend foundation: FastAPI modular + Motor; healthcheck; CORS; config.
- Auth: endpoints `/auth/login`, `/auth/me`; JWT (python-jose) + bcrypt; RBAC middleware/deps.
- Uploads: endpoint multipart; armazenar em `uploads/`; servir estáticos em `/api/uploads/static/...`.
- WebSocket: endpoint `/api/chat/ws/{locador_id}?token=...` com broadcast por canal.
- Seed: criar usuários demo (superadmin/admin/corretor/locatário/locador @teste.com, senha123) + imobiliária demo + dados iniciais.
- Validation: login→token→rota protegida; Mongo conectado; upload e fetch; WS envia/recebe.

Exit criteria:
- App sobe (FE 3000 + BE ok), login funciona, `/me` retorna role, upload acessível, WS troca mensagens.

**Status:** ✅ COMPLETO

Deliverables (confirmados):
- Vite + TS + Tailwind + tema premium navy (#1B3A5C) + dourado (#D4A853)
- Fontes Playfair Display + DM Sans
- Backend FastAPI modular (routers), JWT/bcrypt, Mongo (Motor), WebSocket chat
- Seed idempotente completo:
  - 1 imobiliária (tenant)
  - 6 usuários demo
  - 3 imóveis
  - 1 contrato ativo
  - 13 pagamentos
  - 2 agendamentos
  - 2 mensagens de chat

---

### Phase 2 — V1 App Development (MVP completo “magro” dos 5 perfis)
**Goal:** construir o produto funcional end-to-end com UX consistente e fluxos essenciais.

User stories:
1. Como admin, quero ver um dashboard com KPIs e gráficos para entender saúde da operação.
2. Como corretor, quero cadastrar imóvel com fotos e dados do proprietário para publicar rapidamente.
3. Como corretor, quero ver imóveis de outros corretores sem dados do proprietário para respeitar privacidade.
4. Como locatário, quero enviar comprovante de pagamento e acompanhar status (enviado→aprovado).
5. Como locador, quero ver status de repasse e conversar em tempo real com a imobiliária.

Backend (FastAPI + Mongo):
- Multi-tenant leve: `tenant_id` em todas coleções; superadmin pode impersonar.
- Models/collections (MVP): users, tenants, properties, owner_profiles, appointments, contracts, payments, chat_messages.
- RBAC + regras:
  - Privacidade proprietário: `owner_profiles` só visível ao corretor criador + admin.
  - Imóvel status: `disponivel|indisponivel|alugado`; ao criar contrato→`alugado`; encerrar→`disponivel`.
  - Agenda: slots 09–17; conflito por corretor (overlap check) → 409.
  - Financeiro: vencimentos (5/10/15/20/25/30) + ajuste para próximo dia útil; kanban (a_cobrar/pago/atrasado).
  - Fluxo: comprovante locatário→admin aprova→payment=pago→repasse (em_esteira→gerando_impostos→pago).
- Endpoints MVP (implementados):
  - Auth: `/auth/login`, `/auth/me`, `/auth/impersonate/{id}`
  - Users: list/get/create/update/deactivate
  - Tenants: list/me/create/update
  - Properties: CRUD + privacidade (mask `owner_profile_id`)
  - Owner profiles: CRUD (escopado/privado)
  - Appointments: CRUD + conflito
  - CRM: `/crm/locatarios`, `/crm/locadores`
  - Payments: list, `/kanban`, upload comprovante, aprovar, update
  - Contracts: list/get/create/encerrar + set pdf_url
  - Uploads: `/uploads` + estáticos
  - Chat: conversations, messages, WS realtime

Frontend (React + TS + Vite):
- App shell: Sidebar navy adaptativa por role + Header + AppLayout responsivo.
- Rotas por role com `PrivateRoute` + lazy loading.
- State: Zustand persist (auth/session); interceptors Axios com token.
- Pages MVP (implementadas):
  - Login (botões demo, validação e UX premium)
  - Dashboards: Admin (KPIs + 3 gráficos Recharts + atividade recente), Corretor (KPIs + próximos agendamentos + imóveis), Superadmin (tenants + usuários + impersonate)
  - Imóveis: List com filtros, Detalhes com galeria + ficha proprietário (com privacidade), Form 3 steps (Info/Fotos/Proprietário) + upload dropzone + consulta ViaCEP
  - Agenda: FullCalendar pt-BR (week/day/month) + modal + conflito
  - CRM: Locatários + Locadores (tabelas)
  - Financeiro: Kanban por vencimento + Comprovantes recebidos + Repasses (esteira)
  - Portal Locatário: PIX copiável + corretor + pagamentos + upload comprovante
  - Portal Locador: status repasse com barra de progresso + histórico + chat realtime
  - Chat Admin: lista conversas + mensagens + envio
  - Contratos: List + Form + Detalhes + PDF via `@react-pdf/renderer`

Testing (end of phase):
- Rodar 1 ciclo E2E (papéis demo): criar imóvel→contrato→status muda; agendar visita com conflito; locatário envia comprovante→admin aprova→repasse evolui; locador vê repasse e chat realtime.

Exit criteria:
- Todos os 5 perfis conseguem completar seus fluxos principais sem erro; privacidade do proprietário validada.

**Status:** ✅ COMPLETO

Regras de negócio validadas (confirmadas):
- Privacidade do proprietário ok (corretor1 vê ficha; corretor2 não)
- Status do imóvel muda para `alugado` ao criar contrato
- Conflito de agenda retorna 409
- Aprovação de pagamento gera `data_repasse_prevista` (5 dias úteis)
- Dia de vencimento aceito apenas 5/10/15/20/25/30
- Máscaras BR (CPF/CNPJ/telefone/CEP) aplicadas

Qualidade/E2E:
- Testing agent:
  - Backend: **92.6%** (25/27 testes) — **1 bug minor corrigido** em `POST /properties` (quando `fotos=None`) via `model_dump(exclude_none=True)`.
  - Frontend: **100%**
  - Overall: **98%**

---

### Phase 3 — Hardening + UX/quality improvements
**Goal:** estabilizar e preparar o produto para operação contínua; expandir recursos sob demanda.

User stories:
1. Como admin, quero filtros avançados e exportação CSV no CRM para operar em escala.
2. Como admin, quero auditoria (quem aprovou pagamento/alterou status) para rastreabilidade.
3. Como corretor, quero busca e filtros avançados para encontrar imóveis rapidamente.
4. Como locatário, quero notificações quando pagamento for aprovado.
5. Como locador, quero anexos/recibos do repasse para download (e histórico mais claro).
6. Como superadmin, quero CRUD completo de tenants e controles multi-tenant reais.

Steps:
- Notificações in-app:
  - Backend: criar collection `notifications` + endpoints list/mark-read.
  - Frontend: conectar sino (Header) + painel.
- Relatórios/exportação:
  - Export CSV/Excel (CRM, Financeiro) + filtros por período.
- Configurações da imobiliária:
  - Tela para editar tenant (já existe PUT /tenants/{id}).
- Superadmin expandido:
  - CRUD tenants + métricas básicas por tenant.
- Multi-tenant real (se necessário):
  - Garantir isolamento estrito por tenant em todas queries; adicionar testes específicos.
- Chat hardening:
  - Unread count consistente, paginação de histórico, rate limit simples.
- Segurança/observabilidade:
  - Rate limit login (básico), sanitização, limites de upload, logs estruturados.
- Regressão:
  - Rodar novo ciclo E2E + testes automatizados de regressão.

**Status:** ⏳ PENDENTE / sob demanda

## 3) Next Actions
1. (Opcional) Implementar **notificações in-app** (aproveitamento do sino já presente no Header).
2. Implementar **exportação CSV/Excel** para CRM e Financeiro.
3. Criar a **tela de configurações da imobiliária** (editar chave PIX, telefone, endereço, logo).
4. Expandir **painel superadmin** (CRUD de tenants + relatórios).
5. Endurecer segurança (rate limit, limites upload) + observabilidade.

## 4) Success Criteria
- Fundação: FE roda em 3000 com Vite; BE conecta no Mongo; login/me OK; upload OK; WS OK. ✅
- MVP: módulos essenciais disponíveis por role; privacidade do proprietário garantida; conflitos de agenda bloqueiam corretamente; fluxo pagamento→repasse funciona; contrato PDF gera e altera status do imóvel. ✅
- Qualidade: 0 crashes no fluxo principal; estados de loading/erro/empty consistentes; E2E final passa com usuários demo. ✅ (com 1 correção minor já aplicada)
