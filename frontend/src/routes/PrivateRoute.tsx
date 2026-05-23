import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/stores/auth'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ReactNode } from 'react'
import type { Role } from '@/types'

interface Props {
  children: ReactNode
  allowedRoles?: Role[]
}

export function PrivateRoute({ children, allowedRoles }: Props) {
  const { user, token, hydrated } = useAuth()
  const location = useLocation()
  if (!hydrated) return <LoadingScreen fullscreen />
  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={defaultRouteFor(user.role)} replace />
  }
  return <>{children}</>
}

export function defaultRouteFor(role: Role): string {
  if (role === 'superadmin') return '/superadmin'
  if (role === 'admin') return '/admin'
  if (role === 'corretor') return '/corretor'
  if (role === 'locatario') return '/locatario'
  return '/locador'
}
