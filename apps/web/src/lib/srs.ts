import { createEmptyCard, fsrs, Rating, State, type Card as FsrsCard, type CardInput as FsrsCardInput, type Grade } from 'ts-fsrs'

import type { Card, CardState, NewCardInput, ReviewRating } from '../types'

const ankiScheduler = fsrs({
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzz: true,
  enable_short_term: true,
  learning_steps: ['1m', '10m'],
  relearning_steps: ['10m'],
})

const MIN_DIFFICULTY = 1
const MAX_DIFFICULTY = 10
const DEFAULT_EASE_FACTOR = 2.5
const MIN_STABILITY = 1 / 1_440

function clampDifficulty(value: number): number {
  return Number(Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, value)).toFixed(2))
}

function toEaseFactor(difficulty: number): number {
  return Number((3.7 - (difficulty - 1) * 0.2).toFixed(2))
}

function toCardState(state: State): CardState {
  switch (state) {
    case State.New:
      return 'new'
    case State.Learning:
      return 'learning'
    case State.Relearning:
      return 'relearning'
    case State.Review:
    default:
      return 'review'
  }
}

function toFsrsState(state: CardState | undefined): State {
  switch (state) {
    case 'learning':
      return State.Learning
    case 'relearning':
      return State.Relearning
    case 'review':
      return State.Review
    case 'new':
    default:
      return State.New
  }
}

function toFsrsRating(rating: ReviewRating): Grade {
  switch (rating) {
    case 0:
      return Rating.Again as Grade
    case 1:
      return Rating.Hard as Grade
    case 2:
      return Rating.Good as Grade
    case 3:
    default:
      return Rating.Easy as Grade
  }
}

function getDifficulty(card: Card): number {
  if (typeof card.difficulty === 'number') {
    return clampDifficulty(card.difficulty)
  }

  return clampDifficulty(6 - (card.easeFactor - 2.5) * 3)
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

function getStability(card: Card, state: CardState): number {
  if (state === 'new') {
    return 0
  }

  if (typeof card.stability === 'number' && Number.isFinite(card.stability) && card.stability > 0) {
    return Number(card.stability.toFixed(4))
  }

  if (Number.isFinite(card.interval) && card.interval > 0) {
    return Number(card.interval.toFixed(4))
  }

  return MIN_STABILITY
}

function getScheduledDays(card: Card): number {
  if (card.interval >= 1) {
    return Math.max(1, Math.round(card.interval))
  }

  return 0
}

function getLapses(card: Card): number {
  return typeof card.lapses === 'number' && Number.isFinite(card.lapses) ? Math.max(0, Math.trunc(card.lapses)) : 0
}

function getLearningSteps(card: Card): number {
  return typeof card.learningSteps === 'number' && Number.isFinite(card.learningSteps) ? Math.max(0, Math.trunc(card.learningSteps)) : 0
}

function toFsrsCard(card: Card): FsrsCardInput {
  const state = inferState(card)

  if (state === 'new') {
    const baseCard = createEmptyCard(card.nextReviewDate)

    return {
      ...baseCard,
      due: card.nextReviewDate,
      reps: 0,
      lapses: getLapses(card),
      learning_steps: getLearningSteps(card),
      state: State.New,
      last_review: null,
    }
  }

  return {
    due: card.nextReviewDate,
    stability: getStability(card, state),
    difficulty: getDifficulty(card),
    elapsed_days: 0,
    scheduled_days: getScheduledDays(card),
    learning_steps: getLearningSteps(card),
    reps: Math.max(0, Math.trunc(card.repetitions)),
    lapses: getLapses(card),
    state: toFsrsState(state),
    last_review: card.lastReviewedAt ?? null,
  }
}

function fromFsrsCard(source: Card, nextCard: FsrsCard, now: Date): Card {
  const interval = Number(((nextCard.due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)).toFixed(4))
  const difficulty = clampDifficulty(nextCard.difficulty)
  const createdAt = source.createdAt || now.toISOString()
  const currentState = inferState(source)

  return {
    ...source,
    easeFactor: toEaseFactor(difficulty),
    interval: Math.max(0, interval),
    repetitions: nextCard.reps,
    lapses: nextCard.lapses,
    learningSteps: nextCard.learning_steps,
    difficulty,
    stability: Number(nextCard.stability.toFixed(4)),
    state: toCardState(nextCard.state),
    introducedAt: source.introducedAt ?? (currentState === 'new' ? now.toISOString() : undefined),
    nextReviewDate: nextCard.due.toISOString(),
    createdAt,
    updatedAt: now.toISOString(),
    lastReviewedAt: nextCard.last_review?.toISOString() ?? now.toISOString(),
  }
}

export function createLocalCard(input: NewCardInput, now = new Date()): Card {
  const front = input.front.trim()
  const baseCard = createEmptyCard(now)
  const timestamp = now.toISOString()

  return {
    id: crypto.randomUUID(),
    type: input.type,
    front,
    back: input.back?.trim() || input.meaning?.trim() || input.transliteration?.trim() || front,
    transliteration: input.transliteration?.trim() || undefined,
    meaning: input.meaning?.trim() || undefined,
    example: input.example?.trim() || undefined,
    audioText: input.audioText?.trim() || front,
    easeFactor: DEFAULT_EASE_FACTOR,
    interval: 0,
    repetitions: baseCard.reps,
    lapses: baseCard.lapses,
    learningSteps: baseCard.learning_steps,
    difficulty: baseCard.difficulty,
    stability: Number(baseCard.stability.toFixed(4)),
    state: 'new',
    nextReviewDate: baseCard.due.toISOString(),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function scheduleReview(card: Card, rating: ReviewRating, now = new Date()): Card {
  const nextCard = ankiScheduler.next(toFsrsCard(card), now, toFsrsRating(rating)).card
  return fromFsrsCard(card, nextCard, now)
}
