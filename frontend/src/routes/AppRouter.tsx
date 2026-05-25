import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { PrivateRoute, defaultRouteFor } from '@/routes/PrivateRoute'
import { useAuth } from '@/stores/auth'
import { LoadingScreen } from '@/components/common/LoadingScreen'

const Login = lazy(() => import('@/pages/auth/Login'))
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'))
const CorretorDashboard = lazy(() => import('@/pages/corretor/Dashboard'))
const SuperadminPanel = lazy(() => import('@/pages/superadmin/Panel'))
const ImoveisList = lazy(() => import('@/pages/imoveis/ImoveisList'))
const ImovelForm = lazy(() => import('@/pages/imoveis/ImovelForm'))
const ImovelDetalhes = lazy(() => import('@/pages/imoveis/ImovelDetalhes'))
const AgendaPage = lazy(() => import('@/pages/agenda/Agenda'))
const CRMLocatarios = lazy(() => import('@/pages/admin/CRMLocatarios'))
const CRMLocadores = lazy(() => import('@/pages/admin/CRMLocadores'))
const Corretores = lazy(() => import('@/pages/admin/Corretores'))
const CorretorDetalhes = lazy(() => import('@/pages/admin/CorretorDetalhes'))
const Financeiro = lazy(() => import('@/pages/admin/Financeiro'))
const Contratos = lazy(() => import('@/pages/contratos/Contratos'))
const ContratoForm = lazy(() => import('@/pages/contratos/ContratoForm'))
const ContratoDetalhes = lazy(() => import('@/pages/contratos/ContratoDetalhes'))
const LocatarioPortal = lazy(() => import('@/pages/locatario/Portal'))
const LocatarioPagamentos = lazy(() => import('@/pages/locatario/Pagamentos'))
const LocadorPortal = lazy(() => import('@/pages/locador/Portal'))
const LocadorFinanceiro = lazy(() => import('@/pages/locador/Financeiro'))
const LocadorChat = lazy(() => import('@/pages/locador/Chat'))
const AdminChat = lazy(() => import('@/pages/admin/AdminChat'))
const FichasLocatarios = lazy(() => import('@/pages/locatarios/FichasLocatarios'))
const Relatorios = lazy(() => import('@/pages/admin/Relatorios'))
const NovoLocatario = lazy(() => import('@/pages/locatarios/NovoLocatario'))
const DetalhesLocatario = lazy(() => import('@/pages/locatarios/DetalhesLocatario'))
const EditarLocatario = lazy(() => import('@/pages/locatarios/EditarLocatario'))

function RootRedirect() {
  const { user, hydrated } = useAuth()
  if (!hydrated) return <LoadingScreen fullscreen />
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={defaultRouteFor(user.role)} replace />
}

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingScreen fullscreen />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RootRedirect />} />

        {/* Superadmin */}
        <Route path="/superadmin" element={<PrivateRoute allowedRoles={["superadmin"]}><SuperadminPanel /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<PrivateRoute allowedRoles={["admin"]}><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/imoveis" element={<PrivateRoute allowedRoles={["admin"]}><ImoveisList /></PrivateRoute>} />
        <Route path="/admin/imoveis/novo" element={<PrivateRoute allowedRoles={["admin"]}><ImovelForm /></PrivateRoute>} />
        <Route path="/admin/imoveis/:id" element={<PrivateRoute allowedRoles={["admin","corretor"]}><ImovelDetalhes /></PrivateRoute>} />
        <Route path="/admin/imoveis/:id/editar" element={<PrivateRoute allowedRoles={["admin","corretor"]}><ImovelForm /></PrivateRoute>} />
        <Route path="/admin/corretores" element={<PrivateRoute allowedRoles={["admin"]}><Corretores /></PrivateRoute>} />
        <Route path="/admin/corretores/:id" element={<PrivateRoute allowedRoles={["admin"]}><CorretorDetalhes /></PrivateRoute>} />
        <Route path="/admin/crm/locatarios" element={<PrivateRoute allowedRoles={["admin"]}><CRMLocatarios /></PrivateRoute>} />
        <Route path="/admin/crm/locadores" element={<PrivateRoute allowedRoles={["admin"]}><CRMLocadores /></PrivateRoute>} />
        <Route path="/admin/agenda" element={<PrivateRoute allowedRoles={["admin"]}><AgendaPage /></PrivateRoute>} />
        <Route path="/admin/financeiro" element={<PrivateRoute allowedRoles={["admin"]}><Financeiro /></PrivateRoute>} />
        <Route path="/admin/contratos" element={<PrivateRoute allowedRoles={["admin","corretor"]}><Contratos /></PrivateRoute>} />
        <Route path="/admin/contratos/novo" element={<PrivateRoute allowedRoles={["admin","corretor"]}><ContratoForm /></PrivateRoute>} />
        <Route path="/admin/contratos/:id" element={<PrivateRoute allowedRoles={["admin","corretor","locatario","locador"]}><ContratoDetalhes /></PrivateRoute>} />
        <Route path="/admin/chat" element={<PrivateRoute allowedRoles={["admin"]}><AdminChat /></PrivateRoute>} />
        <Route path="/admin/relatorios" element={<PrivateRoute allowedRoles={["admin"]}><Relatorios /></PrivateRoute>} />
        <Route path="/admin/fichas-locatario" element={<PrivateRoute allowedRoles={["admin"]}><FichasLocatarios /></PrivateRoute>} />
        <Route path="/admin/fichas-locatario/novo" element={<PrivateRoute allowedRoles={["admin"]}><NovoLocatario /></PrivateRoute>} />
        <Route path="/admin/fichas-locatario/:id" element={<PrivateRoute allowedRoles={["admin"]}><DetalhesLocatario /></PrivateRoute>} />
        <Route path="/admin/fichas-locatario/:id/editar" element={<PrivateRoute allowedRoles={["admin"]}><EditarLocatario /></PrivateRoute>} />

        {/* Corretor */}
        <Route path="/corretor" element={<PrivateRoute allowedRoles={["corretor"]}><CorretorDashboard /></PrivateRoute>} />
        <Route path="/corretor/imoveis" element={<PrivateRoute allowedRoles={["corretor"]}><ImoveisList /></PrivateRoute>} />
        <Route path="/corretor/imoveis/novo" element={<PrivateRoute allowedRoles={["corretor"]}><ImovelForm /></PrivateRoute>} />
        <Route path="/corretor/imoveis/:id" element={<PrivateRoute allowedRoles={["corretor"]}><ImovelDetalhes /></PrivateRoute>} />
        <Route path="/corretor/imoveis/:id/editar" element={<PrivateRoute allowedRoles={["corretor"]}><ImovelForm /></PrivateRoute>} />
        <Route path="/corretor/agenda" element={<PrivateRoute allowedRoles={["corretor"]}><AgendaPage /></PrivateRoute>} />
        <Route path="/corretor/contratos" element={<PrivateRoute allowedRoles={["corretor"]}><Contratos /></PrivateRoute>} />
        <Route path="/corretor/contratos/novo" element={<PrivateRoute allowedRoles={["corretor"]}><ContratoForm /></PrivateRoute>} />
        <Route path="/corretor/contratos/:id" element={<PrivateRoute allowedRoles={["corretor"]}><ContratoDetalhes /></PrivateRoute>} />
        <Route path="/corretor/fichas-locatario" element={<PrivateRoute allowedRoles={["corretor"]}><FichasLocatarios /></PrivateRoute>} />
        <Route path="/corretor/fichas-locatario/novo" element={<PrivateRoute allowedRoles={["corretor"]}><NovoLocatario /></PrivateRoute>} />
        <Route path="/corretor/fichas-locatario/:id" element={<PrivateRoute allowedRoles={["corretor"]}><DetalhesLocatario /></PrivateRoute>} />
        <Route path="/corretor/fichas-locatario/:id/editar" element={<PrivateRoute allowedRoles={["corretor"]}><EditarLocatario /></PrivateRoute>} />

        {/* Locatario */}
        <Route path="/locatario" element={<PrivateRoute allowedRoles={["locatario"]}><LocatarioPortal /></PrivateRoute>} />
        <Route path="/locatario/pagamentos" element={<PrivateRoute allowedRoles={["locatario"]}><LocatarioPagamentos /></PrivateRoute>} />

        {/* Locador */}
        <Route path="/locador" element={<PrivateRoute allowedRoles={["locador"]}><LocadorPortal /></PrivateRoute>} />
        <Route path="/locador/financeiro" element={<PrivateRoute allowedRoles={["locador"]}><LocadorFinanceiro /></PrivateRoute>} />
        <Route path="/locador/chat" element={<PrivateRoute allowedRoles={["locador"]}><LocadorChat /></PrivateRoute>} />

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Suspense>
  )
}
