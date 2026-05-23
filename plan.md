# plan.md — ImobSys (V1)

## 1) Objectives
- Entregar um MVP SaaS “magro” com 5 perfis (superadmin/admin/corretor/locatário/locador) e módulos essenciais: imóveis, agenda, CRM, financeiro, contratos PDF e chat realtime.
- Garantir fundação estável: React 18 + TS + Vite (mantendo `REACT_APP_BACKEND_URL`) + FastAPI + MongoDB + JWT + uploads + WebSocket.
- Implementar regras críticas: privacidade do proprietário, conflitos de agenda, fluxo de pagamento→repasse, mudança automática de status do imóvel via contrato.

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
- Uploads: endpoint multipart; armazenar em `uploads/`; servir em `/api/uploads/{path}`.
- WebSocket: endpoint `/ws/chat/{tenant}/{user}` (MVP) com broadcast simples.
- Seed: criar usuários demo (superadmin/admin/corretor/locatário/locador @teste.com, senha123) + imobiliária demo.
- Validation: login→token→rota protegida; Mongo conectado; upload e fetch; WS echo/broadcast.

Exit criteria:
- App sobe (FE 3000 + BE ok), login funciona, `/me` retorna role, upload acessível, WS troca mensagens.

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
- Multi-tenant leve: `tenant_id` em todas coleções; superadmin pode trocar/impersonar.
- Models/collections (MVP): users, tenants(imobiliarias), properties, owner_profiles, appointments, contacts(tenants/landlords), leases/contracts, payments, payouts, messages.
- RBAC + regras:
  - Privacidade proprietário: `owner_profiles` só visível ao corretor criador + admin.
  - Imóvel status: `disponivel|reservado|alugado`; ao criar contrato→`alugado`; encerrar→`disponivel`.
  - Agenda: slots 09–17; conflito por corretor (start/end overlap check).
  - Financeiro: vencimentos apenas (5/10/15/20/25/30) e ajuste para próximo dia útil; status (cobrar/pago/atrasado).
  - Fluxo: comprovante locatário→admin aprova→payment=pago→payout inicia (em_esteira→gerando_impostos→pago).
- Endpoints MVP:
  - Auth/users: login/me, list users (admin), disable user.
  - Properties: CRUD + list (com projeção por role), upload photos.
  - Owner profile: CRUD (escopado a property + privacy).
  - Appointments: CRUD + list por corretor/admin; conflito.
  - CRM: list/search contacts (locatários/locadores).
  - Payments: criar pagamento, upload comprovante, aprovar (admin).
  - Payouts: avançar status e registrar data.
  - Contracts: criar contrato, gerar dados para PDF (frontend), encerrar.
  - Chat: WS + REST para histórico (MVP: últimos N por conversa).

Frontend (React + TS + Vite):
- App shell: sidebar + header; rotas por role (React Router v6) + guard.
- State: Zustand (auth/session + tenant/impersonation).
- Forms: React Hook Form + Zod; toasts; loading/empty/error states.
- Pages MVP:
  - Login
  - Dashboards: Superadmin (lista tenants + impersonar), Admin (KPIs + agenda consolidada), Corretor (tarefas + agenda), Locatário (pagamentos + upload), Locador (repasse + chat)
  - Imóveis: list + detalhes + create/edit; PropertyCard; StatusBadge; dropzone fotos.
  - Agenda: FullCalendar + modal agendamento + conflito.
  - CRM: Locatários/Locadores (TanStack Table filtros).
  - Financeiro: Kanban por vencimento (colunas 5/10/15/20/25/30).
  - Contratos: form + preview e gerar PDF via `@react-pdf/renderer`.
  - Chat: UI realtime (WS) + histórico.
- Design system: PageHeader, KPICard, EmptyState, ConfirmModal; tema navy/gold; tipografia.

Testing (end of phase):
- Rodar 1 ciclo E2E (papéis demo): criar imóvel→contrato→status muda; agendar visita com conflito; locatário envia comprovante→admin aprova→repasse evolui; locador vê repasse e chat realtime.

Exit criteria:
- Todos os 5 perfis conseguem completar seus fluxos principais sem erro; privacidade do proprietário validada.

---

### Phase 3 — Hardening + UX/quality improvements
User stories:
1. Como admin, quero filtros avançados e exportação CSV no CRM para operar em escala.
2. Como admin, quero auditoria (quem aprovou pagamento/alterou status) para rastreabilidade.
3. Como corretor, quero busca e filtros de imóveis para encontrar rapidamente.
4. Como locatário, quero ver notificações in-app quando pagamento for aprovado.
5. Como locador, quero anexos/recibos do repasse para download.

Steps:
- Refino multi-tenant/impersonation (trilhas seguras) + logs/audit.
- Melhorar validações de datas (feriados BR opcional) e regras de repasse (5 dias úteis).
- Persistência robusta do chat (conversas, unread count, paginação).
- Segurança: rate limit login (simples), harden CORS, sanitização, limites upload.
- Observabilidade: logs estruturados; erros padronizados.
- Rodar 1 ciclo E2E novamente + regressão nos fluxos críticos.

## 3) Next Actions
1. Implementar migração CRA→Vite+TS mantendo `REACT_APP_BACKEND_URL` via `envPrefix`.
2. Subir backend base (Motor, CORS, health) + JWT login/me.
3. Criar seed users/tenant e validar login end-to-end.
4. Implementar upload local + serve `/api/uploads` e validar no frontend.
5. Implementar WebSocket de chat (echo/broadcast) e validar com UI mínima.

## 4) Success Criteria
- Fundação: FE roda em 3000 com Vite; BE conecta no Mongo; login/me OK; upload OK; WS OK.
- MVP: módulos essenciais disponíveis por role; privacidade do proprietário garantida; conflitos de agenda bloqueiam corretamente; fluxo pagamento→repasse funciona; contrato PDF gera e altera status do imóvel.
- Qualidade: 0 crashes no fluxo principal; estados de loading/erro/empty consistentes; E2E final passa com usuários demo.