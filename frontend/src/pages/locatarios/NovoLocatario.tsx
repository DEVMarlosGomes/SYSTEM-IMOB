import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { FichaLocatarioForm } from '@/components/locatarios/FichaLocatarioForm'

export default function NovoLocatario() {
  return (
    <AppLayout>
      <PageHeader
        eyebrow="Ficha Inquilino"
        title="Nova Ficha Inquilino"
        description="Cadastro completo do inquilino — dados pessoais, referências, valores e autorizações LGPD."
      />
      <div className="max-w-3xl">
        <FichaLocatarioForm />
      </div>
    </AppLayout>
  )
}
