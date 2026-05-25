import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { FichaLocatarioForm } from '@/components/locatarios/FichaLocatarioForm'
import { fichaLocatarioService } from '@/services'
import type { FichaLocatario } from '@/types/locatario.types'

export default function EditarLocatario() {
  const { id } = useParams<{ id: string }>()
  const [ficha, setFicha] = useState<FichaLocatario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fichaLocatarioService.get(id).then(setFicha).finally(() => setLoading(false))
  }, [id])

  if (loading) return <AppLayout><LoadingScreen /></AppLayout>
  if (!ficha) return <AppLayout><p className="p-8 text-ink-secondary">Ficha não encontrada.</p></AppLayout>

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Ficha Inquilino"
        title={`Editar — ${ficha.cliente1.nome_completo}`}
        description={`${ficha.condominio} · ${ficha.unidade}`}
      />
      <div className="max-w-3xl">
        <FichaLocatarioForm initial={ficha} />
      </div>
    </AppLayout>
  )
}
