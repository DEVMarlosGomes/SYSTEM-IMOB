"""Pydantic models used across routes. Kept in one module for compactness."""
from __future__ import annotations

import uuid
from datetime import date, datetime, time, timezone
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Role = Literal["superadmin", "admin", "corretor", "locatario", "locador"]
PropertyStatus = Literal["disponivel", "indisponivel", "alugado"]
PropertyType = Literal["apartamento", "casa", "comercial", "terreno", "sala", "galpao"]
ContractStatus = Literal["ativo", "encerrado", "rescindido"]
PaymentStatusLocatario = Literal["pendente", "comprovante_enviado", "pago", "atrasado", "rejeitado"]
PaymentStatusLocador = Literal["em_esteira", "gerando_impostos", "enviado", "pago"]
AppointmentStatus = Literal["agendado", "realizado", "cancelado"]


def gen_id() -> str:
    return str(uuid.uuid4())


class BaseDoc(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ----------------------------- Tenants -----------------------------------
class Tenant(BaseDoc):
    nome: str
    slug: Optional[str] = None
    cnpj: Optional[str] = None
    logo_url: Optional[str] = None
    chave_pix: Optional[str] = None
    telefone: Optional[str] = None
    endereco: Optional[str] = None


class TenantUpsert(BaseModel):
    nome: str
    cnpj: Optional[str] = None
    chave_pix: Optional[str] = None
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    logo_url: Optional[str] = None


# ----------------------------- Auth / Users ------------------------------
class LoginInput(BaseModel):
    email: EmailStr
    password: str


class User(BaseDoc):
    role: Role
    nome: str
    email: EmailStr
    telefone: Optional[str] = None
    avatar_url: Optional[str] = None
    tenant_id: Optional[str] = None
    active: bool = True
    corretor_id: Optional[str] = None
    creci_sp: Optional[str] = None
    instagram: Optional[str] = None


class UserPublic(BaseModel):
    id: str
    role: Role
    nome: str
    email: EmailStr
    telefone: Optional[str] = None
    avatar_url: Optional[str] = None
    tenant_id: Optional[str] = None
    active: bool = True
    corretor_id: Optional[str] = None
    creci_sp: Optional[str] = None
    instagram: Optional[str] = None


class UserCreate(BaseModel):
    role: Role
    nome: str
    email: EmailStr
    password: str
    telefone: Optional[str] = None
    tenant_id: Optional[str] = None  # admin/superadmin can pass
    corretor_id: Optional[str] = None


class UserUpdate(BaseModel):
    nome: Optional[str] = None
    telefone: Optional[str] = None
    avatar_url: Optional[str] = None
    active: Optional[bool] = None
    corretor_id: Optional[str] = None
    password: Optional[str] = None
    creci_sp: Optional[str] = None
    instagram: Optional[str] = None


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


# ----------------------------- Owner profile ----------------------------
class OwnerProfile(BaseDoc):
    tenant_id: str
    corretor_id: str
    nome: str
    cpf: Optional[str] = None
    rg: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    profissao: Optional[str] = None
    endereco: Optional[str] = None
    banco: Optional[str] = None
    agencia: Optional[str] = None
    conta: Optional[str] = None
    tipo_conta: Optional[Literal["corrente", "poupanca"]] = None
    pix: Optional[str] = None
    # Optional link to a locador user (so they can login and see their portal)
    locador_user_id: Optional[str] = None


class OwnerProfileUpsert(BaseModel):
    nome: str
    cpf: Optional[str] = None
    rg: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    profissao: Optional[str] = None
    endereco: Optional[str] = None
    banco: Optional[str] = None
    agencia: Optional[str] = None
    conta: Optional[str] = None
    tipo_conta: Optional[Literal["corrente", "poupanca"]] = None
    pix: Optional[str] = None
    locador_user_id: Optional[str] = None


# ----------------------------- Properties --------------------------------
class Property(BaseDoc):
    tenant_id: str
    corretor_id: str
    owner_profile_id: Optional[str] = None
    titulo: str
    descricao: Optional[str] = None
    tipo: PropertyType
    status: PropertyStatus = "disponivel"
    # Ficha Captação — Identificação
    finalidade: Optional[str] = None          # locacao | venda | permuta | temporada
    categoria: Optional[str] = None           # residencial | comercial | rural | lancamento
    situacao_imovel: Optional[str] = None     # pronto | na_planta | em_construcao
    # Endereço
    endereco: str
    numero: Optional[str] = None
    complemento: Optional[str] = None
    lote: Optional[str] = None
    quadra: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    cep: Optional[str] = None
    # Construção
    ano_construcao: Optional[int] = None
    construtora: Optional[str] = None
    tipo_construcao: Optional[str] = None
    pavimentos: Optional[int] = None
    face: Optional[str] = None
    posicao: Optional[str] = None
    # Medidas
    medidas_x: Optional[float] = None
    medidas_y: Optional[float] = None
    area_m2: Optional[float] = None           # area total
    area_construida: Optional[float] = None
    area_terreno: Optional[float] = None
    area_total: Optional[float] = None
    # Cômodos base (mantidos para compatibilidade)
    quartos: Optional[int] = 0
    banheiros: Optional[int] = 0
    vagas: Optional[int] = 0
    garagem_tipo: Optional[str] = None        # coberta | descoberta | mista
    # Valores
    valor_aluguel: float = 0
    valor_venda: Optional[float] = None
    valor_condominio: Optional[float] = 0
    valor_iptu: Optional[float] = 0
    exclusividade: bool = False
    exclusividade_data: Optional[str] = None
    financia: bool = False
    # Flags
    aceita_pet: bool = False
    mobiliado: bool = False
    placa: bool = False
    placa_padrao: Optional[str] = None
    placa_localizacao: Optional[str] = None
    # Infraestrutura
    energia_empresa: Optional[str] = None
    energia_instalacao: Optional[str] = None
    gas_empresa: Optional[str] = None
    gas_instalacao: Optional[str] = None
    agua_empresa: Optional[str] = None
    agua_rgi: Optional[str] = None
    agua_fornecimento: Optional[str] = None
    # Documentação
    cadastro_prefeitura: Optional[str] = None
    cartorio_imoveis: Optional[str] = None
    documentacao: Optional[str] = None
    local_chaves: Optional[str] = None
    # Dependências (checklist)
    dep_dormitorios: int = 0
    dep_suites: int = 0
    dep_armarios_planejados: bool = False
    dep_closet: bool = False
    dep_suite_master: bool = False
    dep_sala: bool = False
    dep_sala_2_ambientes: bool = False
    dep_sala_jantar: bool = False
    dep_sala_estar: bool = False
    dep_sala_tv: bool = False
    dep_varanda: bool = False
    dep_banheiros: int = 0
    dep_arm_banheiros: bool = False
    dep_box_banheiros: bool = False
    dep_lavabos: int = 0
    dep_banheiro_empregada: bool = False
    dep_cozinha: bool = False
    dep_cozinha_planejada: bool = False
    dep_despensa: bool = False
    dep_area_servico: bool = False
    dep_empregada: bool = False
    dep_quintal_privativo: bool = False
    dep_varanda_gourmet: bool = False
    # Pisos por cômodo
    piso_dormitorios: Optional[str] = None
    piso_sala: Optional[str] = None
    piso_banheiros: Optional[str] = None
    piso_cozinha: Optional[str] = None
    piso_quintal: Optional[str] = None
    # Listas
    perto_de: list[str] = Field(default_factory=list)
    amenidades: list[str] = Field(default_factory=list)
    # Observações e fotos
    observacoes: Optional[str] = None
    fotos: list[str] = Field(default_factory=list)


class PropertyUpsert(BaseModel):
    titulo: str
    descricao: Optional[str] = None
    tipo: PropertyType
    status: Optional[PropertyStatus] = "disponivel"
    finalidade: Optional[str] = None
    categoria: Optional[str] = None
    situacao_imovel: Optional[str] = None
    endereco: str
    numero: Optional[str] = None
    complemento: Optional[str] = None
    lote: Optional[str] = None
    quadra: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    cep: Optional[str] = None
    ano_construcao: Optional[int] = None
    construtora: Optional[str] = None
    tipo_construcao: Optional[str] = None
    pavimentos: Optional[int] = None
    face: Optional[str] = None
    posicao: Optional[str] = None
    medidas_x: Optional[float] = None
    medidas_y: Optional[float] = None
    area_m2: Optional[float] = None
    area_construida: Optional[float] = None
    area_terreno: Optional[float] = None
    area_total: Optional[float] = None
    quartos: Optional[int] = 0
    banheiros: Optional[int] = 0
    vagas: Optional[int] = 0
    garagem_tipo: Optional[str] = None
    valor_aluguel: float = 0
    valor_venda: Optional[float] = None
    valor_condominio: Optional[float] = 0
    valor_iptu: Optional[float] = 0
    exclusividade: bool = False
    exclusividade_data: Optional[str] = None
    financia: bool = False
    aceita_pet: bool = False
    mobiliado: bool = False
    placa: bool = False
    placa_padrao: Optional[str] = None
    placa_localizacao: Optional[str] = None
    energia_empresa: Optional[str] = None
    energia_instalacao: Optional[str] = None
    gas_empresa: Optional[str] = None
    gas_instalacao: Optional[str] = None
    agua_empresa: Optional[str] = None
    agua_rgi: Optional[str] = None
    agua_fornecimento: Optional[str] = None
    cadastro_prefeitura: Optional[str] = None
    cartorio_imoveis: Optional[str] = None
    documentacao: Optional[str] = None
    local_chaves: Optional[str] = None
    dep_dormitorios: int = 0
    dep_suites: int = 0
    dep_armarios_planejados: bool = False
    dep_closet: bool = False
    dep_suite_master: bool = False
    dep_sala: bool = False
    dep_sala_2_ambientes: bool = False
    dep_sala_jantar: bool = False
    dep_sala_estar: bool = False
    dep_sala_tv: bool = False
    dep_varanda: bool = False
    dep_banheiros: int = 0
    dep_arm_banheiros: bool = False
    dep_box_banheiros: bool = False
    dep_lavabos: int = 0
    dep_banheiro_empregada: bool = False
    dep_cozinha: bool = False
    dep_cozinha_planejada: bool = False
    dep_despensa: bool = False
    dep_area_servico: bool = False
    dep_empregada: bool = False
    dep_quintal_privativo: bool = False
    dep_varanda_gourmet: bool = False
    piso_dormitorios: Optional[str] = None
    piso_sala: Optional[str] = None
    piso_banheiros: Optional[str] = None
    piso_cozinha: Optional[str] = None
    piso_quintal: Optional[str] = None
    perto_de: Optional[list[str]] = None
    amenidades: Optional[list[str]] = None
    observacoes: Optional[str] = None
    fotos: Optional[list[str]] = None
    owner_profile_id: Optional[str] = None


# ----------------------------- Appointments ------------------------------
class Appointment(BaseDoc):
    tenant_id: str
    corretor_id: str
    property_id: Optional[str] = None
    nome_cliente: str
    data: str  # YYYY-MM-DD
    hora_inicio: str  # HH:MM
    hora_fim: str
    observacoes: Optional[str] = None
    status: AppointmentStatus = "agendado"


class AppointmentUpsert(BaseModel):
    nome_cliente: str
    property_id: Optional[str] = None
    data: str
    hora_inicio: str
    hora_fim: Optional[str] = None  # if not provided -> +1h
    observacoes: Optional[str] = None
    status: Optional[AppointmentStatus] = "agendado"
    corretor_id: Optional[str] = None  # admin can specify


# ----------------------------- Contracts ---------------------------------
class Contract(BaseDoc):
    tenant_id: str
    property_id: str
    locatario_id: str
    locador_id: str
    corretor_id: str
    owner_profile_id: Optional[str] = None
    data_inicio: str  # YYYY-MM-DD
    data_fim: str
    valor_aluguel: float
    dia_vencimento: int  # 5,10,15,20,25,30
    indice_reajuste: Optional[str] = "IGPM"
    clausulas: Optional[str] = None
    status: ContractStatus = "ativo"
    pdf_url: Optional[str] = None


class ContractCreate(BaseModel):
    property_id: str
    locatario_id: str
    locador_id: str
    data_inicio: str
    data_fim: str
    valor_aluguel: float
    dia_vencimento: int
    indice_reajuste: Optional[str] = "IGPM"
    clausulas: Optional[str] = None


# ----------------------------- Payments ----------------------------------
class Payment(BaseDoc):
    tenant_id: str
    contract_id: str
    locatario_id: str
    locador_id: str
    mes_referencia: str  # YYYY-MM
    valor: float
    data_vencimento: str  # YYYY-MM-DD
    data_pagamento: Optional[str] = None
    status_locatario: PaymentStatusLocatario = "pendente"
    status_locador: PaymentStatusLocador = "em_esteira"
    comprovante_locatario_url: Optional[str] = None
    comprovante_locador_url: Optional[str] = None
    data_repasse_prevista: Optional[str] = None
    observacoes: Optional[str] = None
    motivo_rejeicao: Optional[str] = None


class PaymentUpdate(BaseModel):
    status_locatario: Optional[PaymentStatusLocatario] = None
    status_locador: Optional[PaymentStatusLocador] = None
    data_pagamento: Optional[str] = None
    comprovante_locador_url: Optional[str] = None
    observacoes: Optional[str] = None
    motivo_rejeicao: Optional[str] = None


# ----------------------------- Ficha Locatário ---------------------------

class ClienteFicha(BaseModel):
    cpf: str
    nome_completo: str
    estado_civil: str
    rg: str
    email: EmailStr
    profissao: str
    endereco: Optional[str] = None  # exclusivo do Cliente 2


class ReferenciaFicha(BaseModel):
    label: str  # contato_1 | contato_2 | referencia_1 | referencia_2
    nome: str
    telefone: str


class FichaLocatario(BaseDoc):
    tenant_id: str
    corretor_id: str
    imovel_id: Optional[str] = None
    contrato_id: Optional[str] = None
    # Cabeçalho
    condominio: str
    unidade: str
    data_cadastro: str  # YYYY-MM-DD
    # Clientes
    cliente1: dict  # ClienteFicha
    cliente2: Optional[dict] = None
    # Referências
    referencias: list[dict] = Field(default_factory=list)
    # Dados profissionais
    empresa_trabalha: str = ""
    endereco_trabalho: str = ""
    tel_empresa_1: str = ""
    tel_empresa_2: Optional[str] = None
    # Correspondência
    endereco_correspondencia: str = ""
    # Valores
    valor_caucao: float = 0
    valor_locacao: float = 0
    # Autorizações LGPD
    autoriza_analise_documental: bool = False
    autoriza_proposta_analise_inclusa: bool = False
    autoriza_correspondencias: bool = False
    # Datas
    data_prevista_entrega_chaves: str = ""
    data_primeiro_aluguel_vencimento: str = ""
    # Assinaturas
    assinatura_cliente1_url: Optional[str] = None
    assinatura_cliente2_url: Optional[str] = None
    # PDF gerado
    ficha_pdf_url: Optional[str] = None
    # Status
    status: str = "analise"  # analise | ativo | inativo
    updated_at: Optional[str] = None


class FichaLocatarioCreate(BaseModel):
    imovel_id: Optional[str] = None
    condominio: str
    unidade: str
    cliente1: dict
    cliente2: Optional[dict] = None
    referencias: list[dict] = Field(default_factory=list)
    empresa_trabalha: str = ""
    endereco_trabalho: str = ""
    tel_empresa_1: str = ""
    tel_empresa_2: Optional[str] = None
    endereco_correspondencia: str = ""
    valor_caucao: float = 0
    valor_locacao: float = 0
    autoriza_analise_documental: bool = False
    autoriza_proposta_analise_inclusa: bool = False
    autoriza_correspondencias: bool = False
    data_prevista_entrega_chaves: str = ""
    data_primeiro_aluguel_vencimento: str = ""


class FichaLocatarioUpdate(BaseModel):
    condominio: Optional[str] = None
    unidade: Optional[str] = None
    imovel_id: Optional[str] = None
    cliente1: Optional[dict] = None
    cliente2: Optional[dict] = None
    referencias: Optional[list[dict]] = None
    empresa_trabalha: Optional[str] = None
    endereco_trabalho: Optional[str] = None
    tel_empresa_1: Optional[str] = None
    tel_empresa_2: Optional[str] = None
    endereco_correspondencia: Optional[str] = None
    valor_caucao: Optional[float] = None
    valor_locacao: Optional[float] = None
    autoriza_analise_documental: Optional[bool] = None
    autoriza_proposta_analise_inclusa: Optional[bool] = None
    autoriza_correspondencias: Optional[bool] = None
    data_prevista_entrega_chaves: Optional[str] = None
    data_primeiro_aluguel_vencimento: Optional[str] = None
    status: Optional[str] = None
    ficha_pdf_url: Optional[str] = None
    assinatura_cliente1_url: Optional[str] = None
    assinatura_cliente2_url: Optional[str] = None
    contrato_id: Optional[str] = None


# ----------------------------- Notifications -----------------------------
NotificationType = Literal[
    "comprovante_enviado",
    "pagamento_aprovado",
    "contrato_criado",
    "info",
]


class Notification(BaseDoc):
    tenant_id: str
    recipient_id: str  # user.id that should see this notification
    type: NotificationType
    title: str
    body: str
    lida: bool = False
    link: Optional[str] = None  # frontend route, e.g. /admin/pagamentos


# ----------------------------- Chat --------------------------------------
class ChatMessage(BaseDoc):
    tenant_id: str
    locador_id: str
    remetente_id: str
    remetente_nome: Optional[str] = None
    remetente_role: Optional[Role] = None
    mensagem: str
    lida: bool = False


class ChatMessageCreate(BaseModel):
    locador_id: str  # which conversation
    mensagem: str


# ----------------------------- Comissões ---------------------------------
ComissaoStatus = Literal["pendente", "pago"]


TipoComissao = Literal["locacao", "captacao", "gerencia", "premiacao"]


class Comissao(BaseDoc):
    tenant_id: str
    corretor_id: str
    contrato_id: Optional[str] = None
    imovel_id: Optional[str] = None
    tipo: TipoComissao = "locacao"
    descricao: str
    percentual: Optional[float] = None   # % aplicada
    valor_base: Optional[float] = None   # base de cálculo
    valor: float                         # valor final a pagar
    mes_referencia: str
    data_prevista: str
    data_pagamento: Optional[str] = None
    status: ComissaoStatus = "pendente"
    observacoes: Optional[str] = None


class ComissaoCreate(BaseModel):
    corretor_id: str
    contrato_id: Optional[str] = None
    imovel_id: Optional[str] = None
    tipo: TipoComissao = "locacao"
    descricao: str
    percentual: Optional[float] = None
    valor_base: Optional[float] = None
    valor: float
    mes_referencia: str
    data_prevista: str
    observacoes: Optional[str] = None


class ComissaoUpdate(BaseModel):
    tipo: Optional[TipoComissao] = None
    descricao: Optional[str] = None
    percentual: Optional[float] = None
    valor_base: Optional[float] = None
    valor: Optional[float] = None
    mes_referencia: Optional[str] = None
    data_prevista: Optional[str] = None
    data_pagamento: Optional[str] = None
    status: Optional[ComissaoStatus] = None
    observacoes: Optional[str] = None
