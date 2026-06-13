import type { Card, CardState, CardStats, CardType, UserSettings } from '../types'

export type StudyBucket = 'new' | 'learn' | 'due' | 'hidden'
export interface StudyQueueOptions {
  includeFuture?: boolean
}

const ANKI_LEARNING_LOOKAHEAD_MINUTES = 20

const legacyLetterPrefix = 'character-'
const legacyLetterType = 'character'
const reverseCardIdSuffix = '__reverse'
const defaultMaxNewCardsPerDay = 5

const typeOrder: Record<CardType, number> = {
  letter: 0,
  vocab: 1,
  phrase: 2,
}

export const deckMeta: Record<
  CardType,
  {
    label: string
    shortLabel: string
    accentClass: string
    pillClass: string
    description: string
  }
> = {
  letter: {
    label: 'Letter deck',
    shortLabel: 'Letters',
    accentClass: 'from-emerald-300/70 via-emerald-100 to-white',
    pillClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    description: 'Build fast recognition for Malayalam letters and their sounds.',
  },
  vocab: {
    label: 'Vocabulary deck',
    shortLabel: 'Vocab',
    accentClass: 'from-amber-300/70 via-amber-100 to-white',
    pillClass: 'bg-amber-100 text-amber-900 border-amber-200',
    description: 'Add useful daily words with meaning and pronunciation cues.',
  },
  phrase: {
    label: 'Phrase deck',
    shortLabel: 'Phrases',
    accentClass: 'from-sky-300/70 via-sky-100 to-white',
    pillClass: 'bg-sky-100 text-sky-900 border-sky-200',
    description: 'Move from isolated words to full reading and speaking patterns.',
  },
}

export function createDefaultUserSettings(): UserSettings {
  return {
    maxNewCardsPerDay: {
      letter: defaultMaxNewCardsPerDay,
      vocab: defaultMaxNewCardsPerDay,
      phrase: defaultMaxNewCardsPerDay,
    },
    courseProgress: {
      completedLessonIds: [],
    },
  }
}

function normalizeMaxNewCardsPerDay(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return defaultMaxNewCardsPerDay
  }

  return Math.max(0, Math.trunc(value))
}

function normalizeCompletedLessonIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  const completedLessonIds = new Set<string>()

  for (const item of value) {
    if (typeof item !== 'string') {
      continue
    }

    const lessonId = item.trim()

    if (lessonId) {
      completedLessonIds.add(lessonId)
    }
  }

  return [...completedLessonIds]
}

export function normalizeUserSettings(settings?: Partial<UserSettings> | null): UserSettings {
  const defaults = createDefaultUserSettings()
  const maxNewCardsPerDay = settings?.maxNewCardsPerDay as Partial<Record<CardType | typeof legacyLetterType, number>> | undefined
  const courseProgress = settings?.courseProgress as Partial<UserSettings['courseProgress']> | undefined

  return {
    maxNewCardsPerDay: {
      letter: normalizeMaxNewCardsPerDay(maxNewCardsPerDay?.letter ?? maxNewCardsPerDay?.character ?? defaults.maxNewCardsPerDay.letter),
      vocab: normalizeMaxNewCardsPerDay(maxNewCardsPerDay?.vocab ?? defaults.maxNewCardsPerDay.vocab),
      phrase: normalizeMaxNewCardsPerDay(maxNewCardsPerDay?.phrase ?? defaults.maxNewCardsPerDay.phrase),
    },
    courseProgress: {
      completedLessonIds: normalizeCompletedLessonIds(courseProgress?.completedLessonIds),
    },
  }
}

function normalizeCardId(cardId: string): string {
  const { baseId, isReverse } = splitVariantCardId(cardId)
  const normalizedBaseId = baseId.startsWith(legacyLetterPrefix) ? `letter-${baseId.slice(legacyLetterPrefix.length)}` : baseId

  return isReverse ? `${normalizedBaseId}${reverseCardIdSuffix}` : normalizedBaseId
}

function normalizeCardType(type: CardType | typeof legacyLetterType): CardType {
  return type === legacyLetterType ? 'letter' : type
}

function splitVariantCardId(cardId: string): { baseId: string; isReverse: boolean } {
  return cardId.endsWith(reverseCardIdSuffix)
    ? { baseId: cardId.slice(0, -reverseCardIdSuffix.length), isReverse: true }
    : { baseId: cardId, isReverse: false }
}

function inferCardDirection(cardId: string, direction: Card['direction']): Card['direction'] {
  return direction === 'reverse' || splitVariantCardId(cardId).isReverse ? 'reverse' : undefined
}

function normalizeSourceCardId(cardId: string, direction: Card['direction'], sourceCardId: string | undefined): string | undefined {
  if (direction !== 'reverse') {
    return undefined
  }

  return normalizeCardId(sourceCardId ?? splitVariantCardId(cardId).baseId)
}

export function toDateKey(date = new Date()): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
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

function inferState(card: Card): CardState {
  if (card.state) {
    return card.state
  }

  if (card.repetitions === 0) {
    return 'new'
  }

  return card.interval < 1 ? 'learning' : 'review'
}

export function normalizeCard(card: Card): Card {
  const createdAt = normalizeTimestamp(card.createdAt)
  const id = normalizeCardId(card.id)
  const direction = inferCardDirection(id, card.direction)

  return {
    ...card,
    id,
    type: normalizeCardType(card.type as CardType | typeof legacyLetterType),
    direction,
    sourceCardId: normalizeSourceCardId(id, direction, card.sourceCardId),
    state: inferState(card),
    lapses: typeof card.lapses === 'number' ? Math.max(0, Math.trunc(card.lapses)) : undefined,
    learningSteps: typeof card.learningSteps === 'number' ? Math.max(0, Math.trunc(card.learningSteps)) : undefined,
    difficulty: typeof card.difficulty === 'number' ? Number(card.difficulty.toFixed(2)) : undefined,
    stability: typeof card.stability === 'number' ? Number(card.stability.toFixed(4)) : undefined,
    introducedAt: card.introducedAt ? normalizeTimestamp(card.introducedAt, new Date(createdAt)) : undefined,
    nextReviewDate: normalizeTimestamp(card.nextReviewDate, new Date(createdAt)),
    createdAt,
    updatedAt: normalizeTimestamp(card.updatedAt, new Date(createdAt)),
    lastReviewedAt: card.lastReviewedAt ? normalizeTimestamp(card.lastReviewedAt, new Date(createdAt)) : undefined,
  }
}

export function normalizeCards(cards: Card[]): Card[] {
  return cards.map(normalizeCard)
}

export function isDue(nextReviewDate: string, now = new Date()): boolean {
  return new Date(nextReviewDate).getTime() <= now.getTime()
}

export function getStudyBucket(card: Card, now = new Date()): StudyBucket {
  if (!isDue(card.nextReviewDate, now)) {
    return 'hidden'
  }

  const state = inferState(card)

  if (state === 'new') {
    return 'new'
  }

  if (state === 'learning' || state === 'relearning') {
    return 'learn'
  }

  return 'due'
}

export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort(
    (left, right) =>
      left.nextReviewDate.localeCompare(right.nextReviewDate) ||
      typeOrder[left.type] - typeOrder[right.type] ||
      (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER) ||
      left.front.localeCompare(right.front, 'ml'),
  )
}

export function sortCardsByCurriculumOrder(cards: Card[]): Card[] {
  return [...cards].sort(
    (left, right) =>
      typeOrder[left.type] - typeOrder[right.type] ||
      (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER) ||
      left.front.localeCompare(right.front, 'ml'),
  )
}

function getVisibleDueCardIds(cards: Card[], settings: UserSettings, now = new Date()): Set<string> {
  const today = toDateKey(now)
  const normalizedSettings = normalizeUserSettings(settings)
  const introducedTodayByType: Record<CardType, number> = {
    letter: 0,
    vocab: 0,
    phrase: 0,
  }
  const visibleDueIds = new Set<string>()
  const queuedNewByType: Record<CardType, Card[]> = {
    letter: [],
    vocab: [],
    phrase: [],
  }

  for (const card of cards) {
    if (card.introducedAt && toDateKey(new Date(card.introducedAt)) === today) {
      introducedTodayByType[card.type] += 1
    }
  }

  for (const card of sortCards(cards)) {
    const bucket = getStudyBucket(card, now)

    if (bucket === 'hidden') {
      continue
    }

    if (bucket === 'new') {
      queuedNewByType[card.type].push(card)
      continue
    }

    visibleDueIds.add(card.id)
  }

  for (const deckType of (Object.keys(queuedNewByType) as CardType[])) {
    const remainingSlots = Math.max(0, normalizedSettings.maxNewCardsPerDay[deckType] - introducedTodayByType[deckType])

    for (const card of queuedNewByType[deckType].slice(0, remainingSlots)) {
      visibleDueIds.add(card.id)
    }
  }

  return visibleDueIds
}

export function getDueCards(cards: Card[], settings: UserSettings = createDefaultUserSettings()): Card[] {
  const now = new Date()
  const visibleDueCardIds = getVisibleDueCardIds(cards, settings, now)

  return sortCards(cards.filter((card) => visibleDueCardIds.has(card.id)))
}

export function getStudyQueue(
  cards: Card[],
  deckType?: CardType,
  settings: UserSettings = createDefaultUserSettings(),
  options: StudyQueueOptions = {},
): Card[] {
  const now = new Date()
  const normalizedSettings = normalizeUserSettings(settings)
  const visibleDueCardIds = getVisibleDueCardIds(cards, settings, now)

  const dueQueue = sortCards(
    cards.filter((card) => {
      if (deckType && card.type !== deckType) {
        return false
      }

      return visibleDueCardIds.has(card.id)
    }),
  )

  if (dueQueue.length > 0 || !deckType) {
    return dueQueue
  }

  if (options.includeFuture) {
    return sortCards(cards.filter((card) => card.type === deckType)).slice(0, normalizedSettings.maxNewCardsPerDay[deckType])
  }

  const lookaheadLimit = now.getTime() + ANKI_LEARNING_LOOKAHEAD_MINUTES * 60 * 1000

  return sortCards(
    cards.filter((card) => {
      if (card.type !== deckType) {
        return false
      }

      const state = inferState(card)

      if (state !== 'learning' && state !== 'relearning') {
        return false
      }

      const reviewTime = new Date(card.nextReviewDate).getTime()
      return reviewTime > now.getTime() && reviewTime <= lookaheadLimit
    }),
  )
}

export function getDeckStats(cards: Card[], type: CardType, settings: UserSettings = createDefaultUserSettings()) {
  return calculateStats(cards, settings).byType[type]
}

export function getQueueStats(queue: Card[]): CardStats['byType'][CardType] {
  const summary: CardStats['byType'][CardType] = {
    total: queue.length,
    new: 0,
    learn: 0,
    due: 0,
    available: queue.length,
  }

  for (const card of queue) {
    const state = inferState(card)

    if (state === 'new') {
      summary.new += 1
    } else if (state === 'learning' || state === 'relearning') {
      summary.learn += 1
    } else {
      summary.due += 1
    }
  }

  return summary
}

export function getCardsByType(cards: Card[], type: CardType): Card[] {
  return sortCards(cards.filter((card) => card.type === type))
}

export function calculateStats(cards: Card[], settings: UserSettings = createDefaultUserSettings()): CardStats {
  const now = new Date()
  const today = toDateKey(now)
  const visibleDueCardIds = getVisibleDueCardIds(cards, settings, now)
  const byType: CardStats['byType'] = {
    letter: { total: 0, new: 0, learn: 0, due: 0, available: 0 },
    vocab: { total: 0, new: 0, learn: 0, due: 0, available: 0 },
    phrase: { total: 0, new: 0, learn: 0, due: 0, available: 0 },
  }

  let dueToday = 0
  let newCards = 0
  let learnCards = 0
  let reviewCards = 0
  let masteredCards = 0
  let studiedToday = 0

  for (const card of cards) {
    const typeStats = byType[card.type]
    typeStats.total += 1

    const bucket = getStudyBucket(card, now)

    if (visibleDueCardIds.has(card.id)) {
      dueToday += 1
      typeStats.available += 1

      if (bucket === 'new') {
        newCards += 1
        typeStats.new += 1
      } else if (bucket === 'learn') {
        learnCards += 1
        typeStats.learn += 1
      } else if (bucket === 'due') {
        reviewCards += 1
        typeStats.due += 1
      }
    }

    if (card.interval >= 21 || card.repetitions >= 5) {
      masteredCards += 1
    }

    if (card.lastReviewedAt && toDateKey(new Date(card.lastReviewedAt)) === today) {
      studiedToday += 1
    }
  }

  return {
    totalCards: cards.length,
    dueToday,
    newCards,
    learnCards,
    reviewCards,
    masteredCards,
    studiedToday,
    byType,
  }
}

export function formatIntervalFromDays(days: number): string {
  const minutes = days * 24 * 60

  if (minutes < 10) {
    return '<10m'
  }

  if (minutes < 60) {
    return `${Math.round(minutes)}m`
  }

  const hours = minutes / 60

  if (hours < 24) {
    return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`
  }

  if (days < 30) {
    return Number.isInteger(days) ? `${days}d` : `${days.toFixed(1)}d`
  }

  if (days < 365) {
    return `${(days / 30).toFixed(1)}mo`
  }

  return `${(days / 365).toFixed(1)}y`
}

export function formatIntervalFromReviewDate(nextReviewDate: string, now = new Date()): string {
  const minutes = Math.max(0, (new Date(nextReviewDate).getTime() - now.getTime()) / 60_000)

  if (minutes < 10) {
    return '<10m'
  }

  if (minutes < 60) {
    return `${Math.round(minutes)}m`
  }

  const hours = minutes / 60

  if (hours < 24) {
    return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`
  }

  const days = hours / 24

  if (days < 30) {
    return Number.isInteger(days) ? `${days}d` : `${days.toFixed(1)}d`
  }

  if (days < 365) {
    return `${(days / 30).toFixed(1)}mo`
  }

  return `${(days / 365).toFixed(1)}y`
}

export function formatReviewDate(nextReviewDate: string): string {
  const now = new Date()
  const reviewDate = new Date(nextReviewDate)

  if (reviewDate.getTime() <= now.getTime()) {
    return 'Ready now'
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(reviewDate)
}

export function formatTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp))
}
