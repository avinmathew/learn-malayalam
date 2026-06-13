export type CardType = 'letter' | 'vocab' | 'phrase'
export type CardState = 'new' | 'learning' | 'review' | 'relearning'
export type CardDirection = 'forward' | 'reverse'

export type ReviewRating = 0 | 1 | 2 | 3

export interface AppUser {
  id: string
  email: string
  name: string
  picture?: string
}

export interface CardContent {
  id: string
  type: CardType
  order?: number
  category?: string
  front: string
  back: string
  transliteration?: string
  meaning?: string
  example?: string
  imagePath?: string
  audioText: string
  direction?: CardDirection
  sourceCardId?: string
}

export interface CardProgress {
  easeFactor: number
  interval: number
  repetitions: number
  lapses?: number
  learningSteps?: number
  difficulty?: number
  stability?: number
  state?: CardState
  introducedAt?: string
  nextReviewDate: string
  createdAt: string
  updatedAt: string
  lastReviewedAt?: string
}

export interface PersistedCardProgress extends CardProgress {
  cardId: string
}

export type Card = CardContent & CardProgress

export interface NewCardInput {
  type: CardType
  front: string
  back?: string
  transliteration?: string
  meaning?: string
  order?: number
  category?: string
  example?: string
  imagePath?: string
  audioText?: string
}

export interface CardStats {
  totalCards: number
  dueToday: number
  newCards: number
  learnCards: number
  reviewCards: number
  masteredCards: number
  studiedToday: number
  byType: Record<CardType, { total: number; new: number; learn: number; due: number; available: number }>
}

export interface CourseProgressSettings {
  completedLessonIds: string[]
}

export interface UserSettings {
  maxNewCardsPerDay: Record<CardType, number>
  courseProgress: CourseProgressSettings
}
