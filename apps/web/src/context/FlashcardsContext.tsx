import { createContext, useContext, useEffect, useRef, useState } from 'react'

import { useAuth } from './AuthContext'
import { useUserSettings } from './SettingsContext'
import { buildCardAudioRequestPath, fetchCardsRequest, reviewCardRequest, syncCardRequest } from '../lib/api'
import { playRemoteAudio } from '../lib/audio'
import { calculateStats, getDueCards, normalizeCards } from '../lib/cards'
import { createLocalCard, scheduleReview } from '../lib/srs'
import { readCacheSnapshot, writeCacheSnapshot } from '../lib/storage'
import type { Card, CardStats, NewCardInput, ReviewRating } from '../types'

interface AddCardResult {
  card: Card
  queued: boolean
}

interface FlashcardsContextValue {
  cards: Card[]
  dueCards: Card[]
  stats: CardStats
  isLoading: boolean
  isOnline: boolean
  pendingCount: number
  lastSyncedAt?: string
  refresh: () => Promise<void>
  reviewCard: (cardId: string, rating: ReviewRating) => Promise<void>
  addCard: (input: NewCardInput) => Promise<AddCardResult | undefined>
  playAudio: (card: Card) => Promise<boolean>
}

const FlashcardsContext = createContext<FlashcardsContextValue | null>(null)

function upsertPendingCard(pendingCards: Card[], updatedCard: Card): Card[] {
  return [updatedCard, ...pendingCards.filter((card) => card.id !== updatedCard.id)]
}

function removePendingCard(pendingCards: Card[], cardId: string): Card[] {
  return pendingCards.filter((card) => card.id !== cardId)
}

export function FlashcardsProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const { settings } = useUserSettings()
  const [cards, setCards] = useState<Card[]>([])
  const [pendingCards, setPendingCards] = useState<Card[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [lastSyncedAt, setLastSyncedAt] = useState<string>()
  const cardsRef = useRef<Card[]>([])
  const pendingCardsRef = useRef<Card[]>([])
  const cacheScope = user ? `user:${user.id}` : 'guest'

  function persistSnapshot(nextCards: Card[], nextPendingCards: Card[]) {
    const normalizedCards = normalizeCards(nextCards)
    const normalizedPendingCards = normalizeCards(nextPendingCards)

    cardsRef.current = normalizedCards
    pendingCardsRef.current = normalizedPendingCards
    setCards(normalizedCards)
    setPendingCards(normalizedPendingCards)
    writeCacheSnapshot({
      cards: normalizedCards,
      pendingCards: normalizedPendingCards,
      cachedAt: new Date().toISOString(),
    }, cacheScope)
  }

  async function flushPendingCards() {
    for (const pendingCard of pendingCardsRef.current) {
      await syncCardRequest(pendingCard)
    }
  }

  async function refresh() {
    try {
      if (pendingCardsRef.current.length > 0) {
        await flushPendingCards()
      }

      const payload = await fetchCardsRequest()
      persistSnapshot(payload.cards, [])
      setIsOnline(true)
      setLastSyncedAt(new Date().toISOString())
    } catch {
      setIsOnline(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    setIsLoading(true)

    const snapshot = readCacheSnapshot(cacheScope)

    if (snapshot) {
      const normalizedCards = normalizeCards(snapshot.cards)
      const normalizedPendingCards = normalizeCards(snapshot.pendingCards)
      cardsRef.current = normalizedCards
      pendingCardsRef.current = normalizedPendingCards
      setCards(normalizedCards)
      setPendingCards(normalizedPendingCards)
      setLastSyncedAt(snapshot.cachedAt)
      setIsLoading(false)
    } else {
      cardsRef.current = []
      pendingCardsRef.current = []
      setCards([])
      setPendingCards([])
      setLastSyncedAt(undefined)
    }

    void refresh()

    const handleOnline = () => {
      void refresh()
    }

    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [cacheScope, isAuthLoading])

  async function reviewCard(cardId: string, rating: ReviewRating) {
    const currentCard = cardsRef.current.find((card) => card.id === cardId)

    if (!currentCard) {
      return
    }

    const optimisticCard = scheduleReview(currentCard, rating)
    const optimisticCards = cardsRef.current.map((card) =>
      card.id === cardId ? optimisticCard : card,
    )

    persistSnapshot(optimisticCards, pendingCardsRef.current)

    try {
      const syncedCard = await reviewCardRequest(cardId, rating)
      const syncedCards = optimisticCards.map((card) =>
        card.id === cardId ? syncedCard : card,
      )
      persistSnapshot(syncedCards, removePendingCard(pendingCardsRef.current, cardId))
      setIsOnline(true)
      setLastSyncedAt(new Date().toISOString())
    } catch {
      persistSnapshot(optimisticCards, upsertPendingCard(pendingCardsRef.current, optimisticCard))
      setIsOnline(false)
    }
  }

  async function addCard(input: NewCardInput): Promise<AddCardResult | undefined> {
    if (!input.front.trim()) {
      return undefined
    }

    const localCard = createLocalCard(input)
    const nextCards = [localCard, ...cardsRef.current]

    persistSnapshot(nextCards, pendingCardsRef.current)

    try {
      await syncCardRequest(localCard)
      persistSnapshot(nextCards, removePendingCard(pendingCardsRef.current, localCard.id))
      setIsOnline(true)
      setLastSyncedAt(new Date().toISOString())
      return { card: localCard, queued: false }
    } catch {
      persistSnapshot(nextCards, upsertPendingCard(pendingCardsRef.current, localCard))
      setIsOnline(false)
      return { card: localCard, queued: true }
    }
  }

  async function playAudio(card: Card): Promise<boolean> {
    return playRemoteAudio(buildCardAudioRequestPath(card.id))
  }

  const stats = calculateStats(cards, settings)
  const dueCards = getDueCards(cards, settings)

  return (
    <FlashcardsContext.Provider
      value={{
        cards,
        dueCards,
        stats,
        isLoading,
        isOnline,
        pendingCount: pendingCards.length,
        lastSyncedAt,
        refresh,
        reviewCard,
        addCard,
        playAudio,
      }}
    >
      {children}
    </FlashcardsContext.Provider>
  )
}

export function useFlashcards() {
  const context = useContext(FlashcardsContext)

  if (!context) {
    throw new Error('useFlashcards must be used inside FlashcardsProvider.')
  }

  return context
}
