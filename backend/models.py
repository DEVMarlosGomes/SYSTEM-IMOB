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
PaymentStatusLocatario = Literal["pendente", "comprovante_enviado", "pago", "atrasado"]
PaymentStatusLocador = Literal["em_esteira", "gerando_impostos", "pago"]
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
    # For locatario / locador we keep a soft link to their broker for contact info
    corretor_id: Optional[str] = None


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
    endereco: str
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    cep: Optional[str] = None
    area_m2: Optional[float] = None
    quartos: Optional[int] = 0
    banheiros: Optional[int] = 0
    vagas: Optional[int] = 0
    valor_aluguel: float
    valor_condominio: Optional[float] = 0
    valor_iptu: Optional[float] = 0
    aceita_pet: bool = False
    mobiliado: bool = False
    fotos: list[str] = Field(default_factory=list)


class PropertyUpsert(BaseModel):
    titulo: str
    descricao: Optional[str] = None
    tipo: PropertyType
    status: Optional[PropertyStatus] = "disponivel"
    endereco: str
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    cep: Optional[str] = None
    area_m2: Optional[float] = None
    quartos: Optional[int] = 0
    banheiros: Optional[int] = 0
    vagas: Optional[int] = 0
    valor_aluguel: float
    valor_condominio: Optional[float] = 0
    valor_iptu: Optional[float] = 0
    aceita_pet: bool = False
    mobiliado: bool = False
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


class PaymentUpdate(BaseModel):
    status_locatario: Optional[PaymentStatusLocatario] = None
    status_locador: Optional[PaymentStatusLocador] = None
    data_pagamento: Optional[str] = None
    comprovante_locador_url: Optional[str] = None
    observacoes: Optional[str] = None


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
