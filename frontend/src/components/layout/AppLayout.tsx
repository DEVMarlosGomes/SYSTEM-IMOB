import { ReactNode, useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  search?: string
  onSearch?: (s: string) => void
  searchPlaceholder?: string
}

export function AppLayout({ children, search, onSearch, searchPlaceholder }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background decorativo sutil */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 h-[700px] w-[700px] rounded-full opacity-[0.055] animate-float"
          style={{ background: 'radial-gradient(circle, #2E5F8A 0%, transparent 65%)', animationDuration: '10s' }}
        />
        <div
          className="absolute top-1/2 -right-48 h-[550px] w-[550px] rounded-full opacity-[0.040] animate-float"
          style={{ background: 'radial-gradient(circle, #D4A853 0%, transparent 65%)', animationDelay: '3s', animationDuration: '13s' }}
        />
      </div>

      <div className={cn('hidden md:block')}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <button
            className="absolute inset-0"
            style={{ background: 'rgba(9,22,40,0.60)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            onClick={() => setMobileOpen(false)}
            aria-label="fechar"
          />
          <div className="relative"><Sidebar /></div>
        </div>
      )}

      <div className={cn('transition-all duration-300', collapsed ? 'md:pl-[76px]' : 'md:pl-[260px]')}>
        <Header onMenu={() => setMobileOpen(true)} search={search} onSearch={onSearch} searchPlaceholder={searchPlaceholder} />
        <main className="px-4 md:px-8 py-6 md:py-8 max-w-[1600px] mx-auto animate-fade-in">
          {children}
        </main>
        <footer className="px-4 md:px-8 py-4 text-center text-[11px] text-ink-muted border-t"
          style={{ borderColor: 'rgba(226,221,214,0.50)' }}
        >
          ImobVip Consultoria Imobiliária &nbsp;|&nbsp; CRECI SP 41.440-J &nbsp;|&nbsp; CNPJ 47.142.042/0001-20
        </footer>
      </div>
    </div>
  )
}
