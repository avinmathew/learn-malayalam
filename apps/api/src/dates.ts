export function toDateKey(date = new Date()): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

export function isDue(nextReviewDate: string, now = new Date()): boolean {
  return new Date(nextReviewDate).getTime() <= now.getTime()
}

export function normalizeTimestamp(timestamp: string | undefined, fallback = new Date()): string {
  if (!timestamp) {
    return fallback.toISOString()
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(timestamp)) {
    return new Date(`${timestamp}T00:00:00`).toISOString()
  }

  const parsed = new Date(timestamp)

  if (Number.isNaN(parsed.getTime())) {
    return fallback.toISOString()
  }

  return parsed.toISOString()
}
