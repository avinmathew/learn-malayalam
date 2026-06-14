const rawBaseUrl = import.meta.env.BASE_URL || '/'

function normalizeBasePath(baseUrl: string): string {
  const trimmed = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl

  if (!trimmed || trimmed === '/') {
    return ''
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

export const APP_BASE_PATH = normalizeBasePath(rawBaseUrl)

export function buildAppPath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return APP_BASE_PATH ? `${APP_BASE_PATH}${normalizedPath}` : normalizedPath
}

export function resolveAppAssetPath(path?: string): string | undefined {
  if (!path) {
    return undefined
  }

  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith('data:')) {
    return path
  }

  return path.startsWith('/') ? buildAppPath(path) : path
}