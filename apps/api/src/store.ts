import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { isDue, normalizeTimestamp, toDateKey } from './dates.js'
import { createInitialSchedule, scheduleReview } from './srs.js'
import type {
  Card,
  CardContent,
  CardDirection,
  CardProgress,
  CardStats,
  CardType,
  NewCardInput,
  PersistedCardProgress,
  ReviewRating,
  UserSettings,
} from './types.js'

const legacyLetterPrefix = 'character-'
const legacyLetterType = 'character'
const reverseCardIdSuffix = '__reverse'
const deckDirectoryPath = fileURLToPath(new URL('../../../data/decks/', import.meta.url))
const progressFilePath = fileURLToPath(new URL('../../../data/progress.json', import.meta.url))
const usersDirectoryPath = fileURLToPath(new URL('../../../data/users/', import.meta.url))
const legacyCardsFilePath = fileURLToPath(new URL('../../../data/cards.json', import.meta.url))
const deckTypes: CardType[] = ['letter', 'vocab', 'phrase']
const defaultMaxNewCardsPerDay = 5
const typeOrder: Record<CardType, number> = {
  letter: 0,
  vocab: 1,
  phrase: 2,
}
const splitVocabDeckPattern = /^vocab(?:-.+)?\.json$/i
const splitPhraseDeckPattern = /^phrase(?:-.+)?\.json$/i
const deckFilePaths = {
  letter: fileURLToPath(new URL('../../../data/decks/letter.json', import.meta.url)),
  vocab: fileURLToPath(new URL('../../../data/decks/vocab.json', import.meta.url)),
}

function slugifyDeckSegment(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getVocabDeckFileName(category: string | undefined): string {
  const categorySlug = slugifyDeckSegment(category?.trim() || '')
  return categorySlug ? `vocab-${categorySlug}.json` : 'vocab.json'
}

function getPhraseDeckFileName(category: string | undefined): string {
  const categorySlug = slugifyDeckSegment(category?.trim() || '')
  return categorySlug ? `phrase-${categorySlug}.json` : 'phrase-uncategorized.json'
}

async function listVocabDeckFilePaths(): Promise<string[]> {
  const fileNames = await readdir(deckDirectoryPath)
  const matchingFileNames = fileNames.filter((fileName) => splitVocabDeckPattern.test(fileName)).sort((left, right) => left.localeCompare(right))

  if (matchingFileNames.length > 0) {
    return matchingFileNames.map((fileName) => join(deckDirectoryPath, fileName))
  }

  return [deckFilePaths.vocab]
}

async function listPhraseDeckFilePaths(): Promise<string[]> {
  const fileNames = await readdir(deckDirectoryPath)
  const matchingFileNames = fileNames.filter((fileName) => splitPhraseDeckPattern.test(fileName)).sort((left, right) => left.localeCompare(right))

  if (matchingFileNames.length > 0) {
    return matchingFileNames.map((fileName) => join(deckDirectoryPath, fileName))
  }

  return []
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

function isReverseCardId(cardId: string): boolean {
  return splitVariantCardId(cardId).isReverse
}

function buildReverseCardId(cardId: string): string {
  const normalizedCardId = normalizeCardId(cardId)
  return isReverseCardId(normalizedCardId) ? normalizedCardId : `${normalizedCardId}${reverseCardIdSuffix}`
}

function normalizeCardDirection(cardId: string, direction: CardDirection | undefined): CardDirection | undefined {
  return direction === 'reverse' || isReverseCardId(cardId) ? 'reverse' : undefined
}

function normalizeSourceCardId(cardId: string, direction: CardDirection | undefined, sourceCardId: string | undefined): string | undefined {
  if (direction !== 'reverse') {
    return undefined
  }

  const inferredSourceCardId = sourceCardId ?? splitVariantCardId(cardId).baseId
  const normalizedSourceCardId = normalizeCardId(inferredSourceCardId)

  return isReverseCardId(normalizedSourceCardId) ? undefined : normalizedSourceCardId
}

function isRuntimeReverseCard(card: Pick<CardContent, 'id' | 'direction'>): boolean {
  return card.direction === 'reverse' || isReverseCardId(card.id)
}

let writeQueue = Promise.resolve()

function normalizeUserId(userId: string | undefined): string | undefined {
  return userId?.trim() || undefined
}

function getProgressFilePath(userId: string | undefined): string {
  const normalizedUserId = normalizeUserId(userId)

  if (!normalizedUserId) {
    return progressFilePath
  }

  return join(usersDirectoryPath, encodeURIComponent(normalizedUserId), 'progress.json')
}

function getSettingsFilePath(userId: string | undefined): string | undefined {
  const normalizedUserId = normalizeUserId(userId)

  if (!normalizedUserId) {
    return undefined
  }

  return join(usersDirectoryPath, encodeURIComponent(normalizedUserId), 'settings.json')
}

function createDefaultUserSettings(): UserSettings {
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

function normalizeUserSettings(settings?: Partial<UserSettings> | null): UserSettings {
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

function createEmptyDeckMap(): Record<CardType, CardContent[]> {
  return {
    letter: [],
    vocab: [],
    phrase: [],
  }
}

function deriveState(progress: Pick<CardProgress, 'state' | 'repetitions' | 'interval'>): CardProgress['state'] {
  return progress.state ?? (progress.repetitions === 0 ? 'new' : progress.interval < 1 ? 'learning' : 'review')
}

function normalizeContent(card: CardContent): CardContent {
  const id = normalizeCardId(card.id)
  const front = card.front.trim()
  const direction = normalizeCardDirection(id, card.direction)
  const sourceCardId = normalizeSourceCardId(id, direction, card.sourceCardId)
  const order = typeof card.order === 'number' && Number.isFinite(card.order) ? Number(card.order.toFixed(6)) : undefined

  return {
    ...card,
    id,
    type: normalizeCardType(card.type as CardType | typeof legacyLetterType),
    order,
    category: card.category?.trim() || undefined,
    front,
    back: card.back.trim(),
    transliteration: card.transliteration?.trim() || undefined,
    meaning: card.meaning?.trim() || undefined,
    example: card.example?.trim() || undefined,
    imagePath: card.imagePath?.trim() || undefined,
    audioText: card.audioText?.trim() || front,
    direction,
    sourceCardId,
  }
}

function normalizeProgress(progress: PersistedCardProgress): PersistedCardProgress {
  const normalized: PersistedCardProgress = {
    ...progress,
    lapses: typeof progress.lapses === 'number' ? Math.max(0, Math.trunc(progress.lapses)) : undefined,
    learningSteps: typeof progress.learningSteps === 'number' ? Math.max(0, Math.trunc(progress.learningSteps)) : undefined,
    difficulty: typeof progress.difficulty === 'number' ? progress.difficulty : undefined,
    stability: typeof progress.stability === 'number' ? progress.stability : undefined,
    introducedAt: progress.introducedAt ? normalizeTimestamp(progress.introducedAt) : undefined,
    nextReviewDate: normalizeTimestamp(progress.nextReviewDate),
    createdAt: normalizeTimestamp(progress.createdAt),
    updatedAt: normalizeTimestamp(progress.updatedAt),
    lastReviewedAt: progress.lastReviewedAt ? normalizeTimestamp(progress.lastReviewedAt) : undefined,
  }

  normalized.state = deriveState(normalized)
  return normalized
}

function mergeCard(content: CardContent, progress: PersistedCardProgress): Card {
  return {
    ...normalizeContent(content),
    ...normalizeProgress(progress),
  }
}

function splitCard(card: Card): { content: CardContent; progress: PersistedCardProgress } {
  const normalizedCard = normalizeCard(card)

  return {
    content: normalizeContent({
      id: normalizedCard.id,
      type: normalizedCard.type,
      order: normalizedCard.order,
      category: normalizedCard.category,
      front: normalizedCard.front,
      back: normalizedCard.back,
      transliteration: normalizedCard.transliteration,
      meaning: normalizedCard.meaning,
      example: normalizedCard.example,
      imagePath: normalizedCard.imagePath,
      audioText: normalizedCard.audioText,
      direction: normalizedCard.direction,
      sourceCardId: normalizedCard.sourceCardId,
    }),
    progress: normalizeProgress({
      cardId: normalizedCard.id,
      easeFactor: normalizedCard.easeFactor,
      interval: normalizedCard.interval,
      repetitions: normalizedCard.repetitions,
      lapses: normalizedCard.lapses,
      learningSteps: normalizedCard.learningSteps,
      difficulty: normalizedCard.difficulty,
      stability: normalizedCard.stability,
      state: normalizedCard.state,
      introducedAt: normalizedCard.introducedAt,
      nextReviewDate: normalizedCard.nextReviewDate,
      createdAt: normalizedCard.createdAt,
      updatedAt: normalizedCard.updatedAt,
      lastReviewedAt: normalizedCard.lastReviewedAt,
    }),
  }
}

function createInitialProgress(cardId: string, now = new Date()): PersistedCardProgress {
  return {
    cardId: normalizeCardId(cardId),
    ...createInitialSchedule(now),
  }
}

function mergeDeckContents(existingCards: CardContent[], importedCards: CardContent[]): CardContent[] {
  const normalizedExistingCards = toPersistableDeckCards(existingCards)
  const normalizedImportedCards = toPersistableDeckCards(importedCards)
  const importedById = new Map(normalizedImportedCards.map((card) => [card.id, card]))
  const merged = normalizedExistingCards.map((card) => importedById.get(card.id) ?? card)

  for (const importedCard of normalizedImportedCards) {
    if (!normalizedExistingCards.some((card) => card.id === importedCard.id)) {
      merged.push(importedCard)
    }
  }

  return merged
}

function sortDeckContentCards(cards: CardContent[]): CardContent[] {
  return cards
    .map((card, index) => ({ card: normalizeContent(card), index }))
    .sort(
      (left, right) =>
        (left.card.order ?? Number.MAX_SAFE_INTEGER) - (right.card.order ?? Number.MAX_SAFE_INTEGER) ||
        left.index - right.index ||
        left.card.front.localeCompare(right.card.front, 'ml'),
    )
    .map(({ card }) => card)
}

function toPersistableDeckCards(cards: CardContent[]): CardContent[] {
  return cards
    .map(normalizeContent)
    .filter((card) => !isRuntimeReverseCard(card))
    .map(({ direction: _direction, sourceCardId: _sourceCardId, ...card }) => card)
}

interface RuntimeDeckGroup {
  groupKey: string
  cards: CardContent[]
  startOrder: number
  endOrder: number
}

function createReverseCardContent(card: CardContent, order: number): CardContent {
  return normalizeContent({
    ...card,
    id: buildReverseCardId(card.id),
    order,
    direction: 'reverse',
    sourceCardId: card.id,
    audioText: card.audioText || card.front,
  })
}

function createReverseDeckCards(sourceGroup: RuntimeDeckGroup, insertAfterOrder: number, insertBeforeOrder?: number): CardContent[] {
  const reverseCards = sortDeckContentCards(sourceGroup.cards)

  if (reverseCards.length === 0) {
    return []
  }

  const upperBound =
    typeof insertBeforeOrder === 'number' && Number.isFinite(insertBeforeOrder) && insertBeforeOrder > insertAfterOrder
      ? insertBeforeOrder
      : insertAfterOrder + 1
  const gap = upperBound - insertAfterOrder

  return reverseCards.map((card, index) => {
    const offset = gap > 0 ? ((index + 1) / (reverseCards.length + 1)) * gap : (index + 1) * 0.000001
    return createReverseCardContent(card, insertAfterOrder + offset)
  })
}

function createRuntimeDeckContents(groups: RuntimeDeckGroup[]): CardContent[] {
  const runtimeCards: CardContent[] = []

  for (let index = 0; index < groups.length; index += 1) {
    const currentGroup = groups[index]
    runtimeCards.push(...currentGroup.cards)

    if (index === 0) {
      continue
    }

    const sourceGroup = groups[index - 1]
    const nextGroup = groups[index + 1]
    runtimeCards.push(...createReverseDeckCards(sourceGroup, currentGroup.endOrder, nextGroup?.startOrder))
  }

  const finalGroup = groups.at(-1)

  if (finalGroup) {
    runtimeCards.push(...createReverseDeckCards(finalGroup, finalGroup.endOrder))
  }

  return runtimeCards.map(normalizeContent)
}

async function readSplitDeckContents(filePaths: string[]): Promise<CardContent[]> {
  const groups = await Promise.all(
    filePaths.map(async (filePath, fileIndex) => {
      const fileContent = await readFile(filePath, 'utf8')
      const sortedCards = sortDeckContentCards(JSON.parse(fileContent) as CardContent[])
      const firstOrderedCard = sortedCards.find((card) => typeof card.order === 'number')
      const lastOrderedCard = [...sortedCards].reverse().find((card) => typeof card.order === 'number')
      const fallbackOrderBase = (fileIndex + 1) * 1_000_000

      return {
        groupKey: basename(filePath),
        cards: sortedCards,
        startOrder: firstOrderedCard?.order ?? fallbackOrderBase,
        endOrder: lastOrderedCard?.order ?? fallbackOrderBase + sortedCards.length,
      } satisfies RuntimeDeckGroup
    }),
  )

  return createRuntimeDeckContents(
    groups.sort((left, right) => left.startOrder - right.startOrder || left.groupKey.localeCompare(right.groupKey)),
  )
}

function queueWrite<T>(operation: () => Promise<T>): Promise<T> {
  const nextOperation = writeQueue.then(operation, operation)
  writeQueue = nextOperation.then(
    () => undefined,
    () => undefined,
  )

  return nextOperation
}

async function readDeckContents(type: CardType): Promise<CardContent[]> {
  if (type === 'letter') {
    const fileContent = await readFile(deckFilePaths[type], 'utf8')
    return (JSON.parse(fileContent) as CardContent[]).map(normalizeContent)
  }

  if (type === 'phrase') {
    const filePaths = await listPhraseDeckFilePaths()
    return readSplitDeckContents(filePaths)
  }

  const filePaths = await listVocabDeckFilePaths()
  return readSplitDeckContents(filePaths)
}

async function readAllDeckContents(): Promise<Record<CardType, CardContent[]>> {
  const deckEntries = await Promise.all(deckTypes.map(async (type) => [type, await readDeckContents(type)] as const))
  return Object.fromEntries(deckEntries) as Record<CardType, CardContent[]>
}

async function saveDeckContents(type: CardType, cards: CardContent[]): Promise<void> {
  if (type === 'letter') {
    await writeFile(deckFilePaths.letter, JSON.stringify(toPersistableDeckCards(cards), null, 2), 'utf8')
    return
  }

  if (type === 'phrase') {
    const existingFilePaths = await listPhraseDeckFilePaths().catch(() => [])
    await Promise.all(existingFilePaths.map(async (filePath) => {
      try {
        await rm(filePath, { force: true })
      } catch {
        // Ignore missing files while regenerating split phrase decks.
      }
    }))

    const groupedCards = new Map<string, CardContent[]>()

    for (const card of toPersistableDeckCards(cards)) {
      const fileName = getPhraseDeckFileName(card.category)
      const nextGroup = groupedCards.get(fileName) ?? []
      nextGroup.push(card)
      groupedCards.set(fileName, nextGroup)
    }

    const writeOperations = Array.from(groupedCards.entries())
      .sort(([leftFileName], [rightFileName]) => leftFileName.localeCompare(rightFileName))
      .map(async ([fileName, groupedDeckCards]) => {
        await writeFile(join(deckDirectoryPath, fileName), JSON.stringify(groupedDeckCards, null, 2), 'utf8')
      })

    await Promise.all(writeOperations)
    return
  }

  const existingFilePaths = await listVocabDeckFilePaths().catch(() => [deckFilePaths.vocab])
  await Promise.all(existingFilePaths.map(async (filePath) => {
    try {
      await rm(filePath, { force: true })
    } catch {
      // Ignore missing files while regenerating split vocab decks.
    }
  }))

  const groupedCards = new Map<string, CardContent[]>()

  for (const card of toPersistableDeckCards(cards)) {
    const fileName = getVocabDeckFileName(card.category)
    const nextGroup = groupedCards.get(fileName) ?? []
    nextGroup.push(card)
    groupedCards.set(fileName, nextGroup)
  }

  const writeOperations = Array.from(groupedCards.entries())
    .sort(([leftFileName], [rightFileName]) => leftFileName.localeCompare(rightFileName))
    .map(async ([fileName, groupedDeckCards]) => {
      await writeFile(join(deckDirectoryPath, fileName), JSON.stringify(groupedDeckCards, null, 2), 'utf8')
    })

  await Promise.all(writeOperations)
}

async function readProgressMap(userId?: string): Promise<Record<string, PersistedCardProgress>> {
  const fileContent = await readFile(getProgressFilePath(userId), 'utf8')
  const parsed = JSON.parse(fileContent) as Record<string, PersistedCardProgress>
  const normalizedEntries = Object.entries(parsed).map(([cardId, progress]) => {
    const normalizedCardId = normalizeCardId(progress.cardId ?? cardId)
    return [normalizedCardId, normalizeProgress({ ...progress, cardId: normalizedCardId })] as const
  })
  return Object.fromEntries(normalizedEntries)
}

async function saveProgressMap(progressMap: Record<string, PersistedCardProgress>, userId?: string): Promise<void> {
  const serializedEntries = Object.entries(progressMap)
    .sort(([leftId], [rightId]) => leftId.localeCompare(rightId))
    .map(([cardId, progress]) => [cardId, normalizeProgress({ ...progress, cardId })])

  await writeFile(getProgressFilePath(userId), JSON.stringify(Object.fromEntries(serializedEntries), null, 2), 'utf8')
}

async function readUserSettingsFile(userId: string): Promise<UserSettings> {
  const settingsFilePath = getSettingsFilePath(userId)

  if (!settingsFilePath) {
    return createDefaultUserSettings()
  }

  const fileContent = await readFile(settingsFilePath, 'utf8')
  return normalizeUserSettings(JSON.parse(fileContent) as Partial<UserSettings>)
}

async function saveUserSettingsFile(userId: string, settings: UserSettings): Promise<void> {
  const settingsFilePath = getSettingsFilePath(userId)

  if (!settingsFilePath) {
    return
  }

  await writeFile(settingsFilePath, JSON.stringify(normalizeUserSettings(settings), null, 2), 'utf8')
}

async function migrateLegacyCardsFile(progressExists: boolean): Promise<void> {
  const fileContent = await readFile(legacyCardsFilePath, 'utf8')
  const legacyCards = (JSON.parse(fileContent) as Card[]).map(normalizeCard)
  const existingDecks = await readAllDeckContents().catch(() => createEmptyDeckMap())
  const importedDecks = createEmptyDeckMap()

  for (const legacyCard of legacyCards) {
    const { content } = splitCard(legacyCard)
    importedDecks[legacyCard.type].push(content)
  }

  await queueWrite(async () => {
    for (const deckType of deckTypes) {
      const mergedDeck = mergeDeckContents(existingDecks[deckType], importedDecks[deckType])
      await saveDeckContents(deckType, mergedDeck)
    }

    if (!progressExists) {
      const progressEntries = legacyCards.map((card) => {
        const { progress } = splitCard(card)
        return [card.id, progress] as const
      })

      await saveProgressMap(Object.fromEntries(progressEntries))
    }
  })
}

async function ensureDataFiles(userId?: string): Promise<void> {
  const activeProgressFilePath = getProgressFilePath(userId)
  const activeSettingsFilePath = getSettingsFilePath(userId)

  await mkdir(dirname(progressFilePath), { recursive: true })
  await mkdir(deckDirectoryPath, { recursive: true })
  await mkdir(dirname(activeProgressFilePath), { recursive: true })

  if (activeSettingsFilePath) {
    await mkdir(dirname(activeSettingsFilePath), { recursive: true })
  }

  let progressExists = true

  try {
    await readFile(activeProgressFilePath, 'utf8')
  } catch {
    progressExists = false
  }

  if (!progressExists && !normalizeUserId(userId)) {
    try {
      await readFile(legacyCardsFilePath, 'utf8')
      await migrateLegacyCardsFile(progressExists)
      progressExists = true
    } catch {
      // No legacy file to import.
    }
  }

  const decks = await readAllDeckContents()
  const progressMap: Record<string, PersistedCardProgress> = progressExists
    ? await readProgressMap(userId).catch(() => ({} as Record<string, PersistedCardProgress>))
    : {}
  let changed = !progressExists

  for (const contentCard of deckTypes.flatMap((type) => decks[type])) {
    if (!progressMap[contentCard.id]) {
      progressMap[contentCard.id] = createInitialProgress(contentCard.id)
      changed = true
    }
  }

  if (changed) {
    await queueWrite(async () => {
      await saveProgressMap(progressMap, userId)
    })
  }

  if (activeSettingsFilePath) {
    try {
      await readFile(activeSettingsFilePath, 'utf8')
    } catch {
      await queueWrite(async () => {
        await saveUserSettingsFile(userId!, createDefaultUserSettings())
      })
    }
  }
}

export async function getCards(userId?: string): Promise<Card[]> {
  await ensureDataFiles(userId)
  const [decks, progressMap] = await Promise.all([readAllDeckContents(), readProgressMap(userId)])

  return deckTypes.flatMap((type) =>
    decks[type].map((contentCard) => mergeCard(contentCard, progressMap[contentCard.id] ?? createInitialProgress(contentCard.id))),
  )
}

function normalizeCard(card: Card): Card {
  const normalizedContent = normalizeContent(card)
  const createdAt = normalizeTimestamp(card.createdAt)

  return {
    ...normalizedContent,
    easeFactor: card.easeFactor,
    interval: card.interval,
    repetitions: Math.max(0, Math.trunc(card.repetitions)),
    lapses: typeof card.lapses === 'number' ? Math.max(0, Math.trunc(card.lapses)) : undefined,
    learningSteps: typeof card.learningSteps === 'number' ? Math.max(0, Math.trunc(card.learningSteps)) : undefined,
    difficulty: typeof card.difficulty === 'number' ? card.difficulty : undefined,
    stability: typeof card.stability === 'number' ? card.stability : undefined,
    state: deriveState(card),
    introducedAt: card.introducedAt ? normalizeTimestamp(card.introducedAt, new Date(createdAt)) : undefined,
    nextReviewDate: normalizeTimestamp(card.nextReviewDate, new Date(createdAt)),
    createdAt,
    updatedAt: normalizeTimestamp(card.updatedAt, new Date(createdAt)),
    lastReviewedAt: card.lastReviewedAt ? normalizeTimestamp(card.lastReviewedAt, new Date(createdAt)) : undefined,
  }
}

export async function getCardsPayload(userId?: string) {
  const cards = await getCards(userId)
  const settings = await getUserSettings(userId)

  return {
    cards,
    stats: getCardStats(cards, settings),
  }
}

export async function getUserSettings(userId?: string): Promise<UserSettings> {
  await ensureDataFiles(userId)

  if (!normalizeUserId(userId)) {
    return createDefaultUserSettings()
  }

  return readUserSettingsFile(userId!)
}

export async function updateUserSettings(userId: string, settings: UserSettings): Promise<UserSettings> {
  await ensureDataFiles(userId)
  const normalizedSettings = normalizeUserSettings(settings)

  await queueWrite(async () => {
    await saveUserSettingsFile(userId, normalizedSettings)
  })

  return normalizedSettings
}

export async function addCard(input: NewCardInput, userId?: string): Promise<Card> {
  await ensureDataFiles(userId)
  const [decks, progressMap] = await Promise.all([readAllDeckContents(), readProgressMap(userId)])
  const now = new Date()
  const trimmedFront = input.front.trim()
  const normalizedType = normalizeCardType(input.type as CardType | typeof legacyLetterType)

  if (!trimmedFront) {
    throw new Error('Front text is required.')
  }

  const newCard: Card = {
    id: crypto.randomUUID(),
    ...createInitialSchedule(now),
    type: normalizedType,
    front: trimmedFront,
    back: input.back?.trim() || input.meaning?.trim() || input.transliteration?.trim() || trimmedFront,
    transliteration: input.transliteration?.trim() || undefined,
    meaning: input.meaning?.trim() || undefined,
    example: input.example?.trim() || undefined,
    audioText: input.audioText?.trim() || trimmedFront,
  }

  const { content, progress } = splitCard(newCard)
  const nextDeckCards = [content, ...decks[normalizedType]]
  const nextProgressMap = {
    ...progressMap,
    [newCard.id]: progress,
  }

  await queueWrite(async () => {
    await saveDeckContents(normalizedType, nextDeckCards)
    await saveProgressMap(nextProgressMap, userId)
  })

  return newCard
}

export async function syncCard(card: Card, userId?: string): Promise<Card> {
  await ensureDataFiles(userId)
  const normalizedCard = normalizeCard(card)
  const [decks, progressMap] = await Promise.all([readAllDeckContents(), readProgressMap(userId)])

  if (normalizedCard.direction === 'reverse' || isReverseCardId(normalizedCard.id)) {
    const runtimeCard = deckTypes
      .flatMap((type) => decks[type])
      .find((candidate) => candidate.id === normalizedCard.id)

    if (!runtimeCard) {
      throw new Error('Card not found.')
    }

    const { progress } = splitCard({
      ...normalizedCard,
      updatedAt: new Date().toISOString(),
    })
    const nextProgressMap = {
      ...progressMap,
      [normalizedCard.id]: progress,
    }

    await queueWrite(async () => {
      await saveProgressMap(nextProgressMap, userId)
    })

    return mergeCard(runtimeCard, progress)
  }

  const { content, progress } = splitCard({
    ...normalizedCard,
    updatedAt: new Date().toISOString(),
  })
  const existingDeckCards = decks[content.type]
  const existingIndex = existingDeckCards.findIndex((currentCard) => currentCard.id === content.id)
  const nextDeckCards = [...existingDeckCards]

  if (existingIndex >= 0) {
    nextDeckCards[existingIndex] = content
  } else {
    nextDeckCards.unshift(content)
  }

  const nextProgressMap = {
    ...progressMap,
    [content.id]: progress,
  }

  await queueWrite(async () => {
    await saveDeckContents(content.type, nextDeckCards)
    await saveProgressMap(nextProgressMap, userId)
  })

  return mergeCard(content, progress)
}

export async function reviewCard(cardId: string, rating: ReviewRating, userId?: string): Promise<Card> {
  await ensureDataFiles(userId)
  const [decks, progressMap] = await Promise.all([readAllDeckContents(), readProgressMap(userId)])
  const normalizedCardId = normalizeCardId(cardId)
  const targetContent = deckTypes
    .flatMap((type) => decks[type])
    .find((card) => card.id === normalizedCardId)

  if (!targetContent) {
    throw new Error('Card not found.')
  }

  const currentProgress = progressMap[normalizedCardId] ?? createInitialProgress(normalizedCardId)
  const updatedCard = scheduleReview(mergeCard(targetContent, currentProgress), rating)
  const { progress } = splitCard(updatedCard)

  await queueWrite(async () => {
    await saveProgressMap({
      ...progressMap,
      [normalizedCardId]: progress,
    }, userId)
  })

  return updatedCard
}

function getStudyBucket(card: Card, now = new Date()): 'new' | 'learn' | 'due' | 'hidden' {
  if (!isDue(card.nextReviewDate, now)) {
    return 'hidden'
  }

  const state = card.state ?? (card.repetitions === 0 ? 'new' : card.interval < 1 ? 'learning' : 'review')

  if (state === 'new') {
    return 'new'
  }

  if (state === 'learning' || state === 'relearning') {
    return 'learn'
  }

  return 'due'
}

function sortCards(cards: Card[]): Card[] {
  return [...cards].sort(
    (left, right) =>
      left.nextReviewDate.localeCompare(right.nextReviewDate) ||
      typeOrder[left.type] - typeOrder[right.type] ||
      (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER) ||
      left.front.localeCompare(right.front, 'ml'),
  )
}

function getVisibleDueCardIds(cards: Card[], settings: UserSettings, now = new Date()): Set<string> {
  const today = toDateKey(now)
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

  for (const deckType of deckTypes) {
    const remainingSlots = Math.max(0, settings.maxNewCardsPerDay[deckType] - introducedTodayByType[deckType])

    for (const card of queuedNewByType[deckType].slice(0, remainingSlots)) {
      visibleDueIds.add(card.id)
    }
  }

  return visibleDueIds
}

export function getCardStats(cards: Card[], settings: UserSettings = createDefaultUserSettings()): CardStats {
  const now = new Date()
  const today = toDateKey(now)
  const visibleDueCardIds = getVisibleDueCardIds(cards, normalizeUserSettings(settings), now)
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
