/**
 * Module-level TTL cache for Supabase query results.
 * Lives at the JS module scope — survives SPA route navigations.
 * Dramatically reduces latency since most dashboard data changes slowly.
 */

interface CacheEntry<T> {
  data: T
  ts: number
}

const store = new Map<string, CacheEntry<unknown>>()

const DEFAULT_TTL_MS = 30_000 // 30 seconds

export function cacheGet<T>(key: string, ttl = DEFAULT_TTL_MS): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() - entry.ts > ttl) {
    store.delete(key)
    return null
  }
  return entry.data
}

export function cacheSet<T>(key: string, data: T): void {
  store.set(key, { data, ts: Date.now() })
}

export function cacheInvalidate(...keys: string[]): void {
  keys.forEach(k => store.delete(k))
}

export function cacheInvalidatePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}

/**
 * Stale-while-revalidate: returns cached data immediately,
 * then fetches fresh data in background and calls onFresh when done.
 */
export async function swr<T>(
  key: string,
  fetcher: () => Promise<T>,
  onFresh: (data: T) => void,
  ttl = DEFAULT_TTL_MS
): Promise<T> {
  const cached = cacheGet<T>(key, ttl)

  if (cached !== null) {
    // Return stale data immediately, revalidate in background
    fetcher().then(fresh => {
      cacheSet(key, fresh)
      onFresh(fresh)
    }).catch(() => {/* network error — keep using stale */})
    return cached
  }

  // No cache — fetch and wait
  const fresh = await fetcher()
  cacheSet(key, fresh)
  return fresh
}
