import type { CacheSnapshot } from '../types'

const CACHE_KEY_PREFIX = 'learn-malayalam-cache-v1'

function getCacheKey(scope = 'guest'): string {
  return `${CACHE_KEY_PREFIX}:${scope}`
}

export function readCacheSnapshot(scope?: string): CacheSnapshot | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawSnapshot = window.localStorage.getItem(getCacheKey(scope))

  if (!rawSnapshot) {
    return null
  }

  try {
    return JSON.parse(rawSnapshot) as CacheSnapshot
  } catch {
    return null
  }
}

export function writeCacheSnapshot(snapshot: CacheSnapshot, scope?: string): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(getCacheKey(scope), JSON.stringify(snapshot))
}
