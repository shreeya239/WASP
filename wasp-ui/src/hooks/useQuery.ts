import { useState, useEffect, useCallback, useRef } from 'react'

interface QueryState<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

interface QueryOptions {
  refetchInterval?: number
  enabled?: boolean
}

// Very simple in-memory cache
const cache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 5000

export function useQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: QueryOptions = {}
): QueryState<T> {
  const { refetchInterval, enabled = true } = options

  const [data, setData] = useState<T | null>(() => {
    const cached = cache.get(key)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return cached.data as T
    }
    return null
  })
  const [isLoading, setIsLoading] = useState(data === null && enabled)
  const [error, setError] = useState<Error | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetch = useCallback(async () => {
    if (!enabled) return
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setIsLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      cache.set(key, { data: result, ts: Date.now() })
      setData(result)
    } catch (e: unknown) {
      if ((e as Error).name !== 'AbortError') {
        setError(e as Error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [key, enabled])

  useEffect(() => {
    fetch()
  }, [fetch])

  useEffect(() => {
    if (!refetchInterval || !enabled) return
    const interval = setInterval(fetch, refetchInterval)
    return () => clearInterval(interval)
  }, [fetch, refetchInterval, enabled])

  return { data, isLoading, error, refetch: fetch }
}

export function invalidateCache(key: string) {
  cache.delete(key)
}

export function invalidateCachePrefix(prefix: string) {
  for (const k of cache.keys()) {
    if (k.startsWith(prefix)) cache.delete(k)
  }
}
