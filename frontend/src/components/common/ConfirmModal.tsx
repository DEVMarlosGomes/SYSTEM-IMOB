import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  title?: string
  description?: string
  confirmLabel?: string
  variant?: 'danger' | 'primary'
}

export function ConfirmModal({ open, onClose, onConfirm, title = 'Confirmar acao', description = 'Tem certeza?', confirmLabel = 'Confirmar', variant = 'primary' }: Props) {
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (!open) setBusy(false) }, [open])
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={busy}>Cancelar</button>
          <button
            className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
            onClick={async () => { setBusy(true); try { await onConfirm() } finally { setBusy(false) } }}
            disabled={busy}
          >
            {busy ? 'Processando…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-warning-soft text-warning flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={20} />
        </div>
        <p className="text-sm text-ink-secondary">{description}</p>
      </div>
    </Modal>
  )
}
