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
    <div className="min-h-screen bg-surface">
      <div className={cn('hidden md:block')}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      </div>
      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <button className="absolute inset-0 bg-navy-800/50" onClick={() => setMobileOpen(false)} aria-label="fechar" />
          <div className="relative"><Sidebar /></div>
        </div>
      )}
      <div className={cn('transition-all', collapsed ? 'md:pl-[76px]' : 'md:pl-[260px]')}>
        <Header onMenu={() => setMobileOpen(true)} search={search} onSearch={onSearch} searchPlaceholder={searchPlaceholder} />
        <main className="px-4 md:px-8 py-6 md:py-8 max-w-[1600px] mx-auto animate-fade-in">{children}</main>
      </div>
    </div>
  )
}
