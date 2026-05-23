import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseAsyncResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  setData: (next: T | null) => void
}

export function useAsync<T>(fn: () => Promise<T>, deps: any[] = []): UseAsyncResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)
  const fnRef = useRef(fn)
  fnRef.current = fn

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fnRef.current()
      if (mounted.current) setData(result)
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || 'Erro ao carregar dados.'
      if (mounted.current) setError(String(msg))
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    void refetch()
    return () => {
      mounted.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, refetch, setData }
}
