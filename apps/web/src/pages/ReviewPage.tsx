import { useEffect, useEffectEvent, useMemo, useState, useTransition } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { CourseLessonCard } from '../components/CourseLessonCard'
import { ReviewCard } from '../components/ReviewCard'
import { useFlashcards } from '../context/FlashcardsContext'
import { useUserSettings } from '../context/SettingsContext'
import { getCurrentCourseLesson } from '../lib/courseRegistry'
import { deckMeta, formatIntervalFromReviewDate, getQueueStats, getStudyQueue, sortCards } from '../lib/cards'
import { scheduleReview } from '../lib/srs'
import type { CardType } from '../types'
import type { ReviewRating } from '../types'

const ratingButtons: Array<{
  label: string
  rating: ReviewRating
  shortcut: string
  className: string
}> = [
  {
    label: 'Again',
    rating: 0,
    shortcut: '1',
    className: 'bg-[rgb(255,59,48)] text-white hover:bg-[rgb(230,46,36)]',
  },
  {
    label: 'Hard',
    rating: 1,
    shortcut: '2',
    className: 'bg-[rgb(255,149,0)] text-white hover:bg-[rgb(230,134,0)]',
  },
  {
    label: 'Good',
    rating: 2,
    shortcut: '3',
    className: 'bg-[rgb(52,199,89)] text-white hover:bg-[rgb(40,181,75)]',
  },
  {
    label: 'Easy',
    rating: 3,
    shortcut: '4',
    className: 'bg-[rgb(10,132,255)] text-white hover:bg-[rgb(0,112,235)]',
  },
]

const deckOrder: CardType[] = ['letter', 'vocab', 'phrase']

const stateBadgeClassNames = {
  new: 'bg-[rgba(10,132,255,0.12)] text-[rgb(0,64,221)]',
  learn: 'bg-[rgba(255,59,48,0.12)] text-[rgb(196,43,28)]',
  review: 'bg-[rgba(52,199,89,0.16)] text-[rgb(36,138,61)]',
} as const

function isCardType(value: string | null): value is CardType {
  return value === 'letter' || value === 'vocab' || value === 'phrase'
}

export function ReviewPage() {
  const { cards, reviewCard, stats, isLoading, playAudio } = useFlashcards()
  const { settings, updateSettings } = useUserSettings()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [flipped, setFlipped] = useState(false)
  const [studyAheadCardIds, setStudyAheadCardIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const deckParam = searchParams.get('deck')
  const selectedDeck: CardType | null = isCardType(deckParam) ? deckParam : null
  const normalDeckQueue = useMemo(
    () => (selectedDeck ? getStudyQueue(cards, selectedDeck, settings) : []),
    [cards, selectedDeck, settings],
  )
  const studyAheadCandidates = useMemo(
    () => (selectedDeck ? getStudyQueue(cards, selectedDeck, settings, { includeFuture: true }) : []),
    [cards, selectedDeck, settings],
  )
  const studyAheadCards = useMemo(() => {
    if (studyAheadCardIds.length === 0) {
      return []
    }

    const selectedIds = new Set(studyAheadCardIds)
    return cards.filter((card) => selectedIds.has(card.id))
  }, [cards, studyAheadCardIds])
  const studyAheadQueue = useMemo(
    () => (selectedDeck && studyAheadCardIds.length > 0 ? sortCards(studyAheadCards.filter((card) => card.type === selectedDeck)) : []),
    [selectedDeck, studyAheadCardIds.length, studyAheadCards],
  )
  const isStudyingAhead = studyAheadCardIds.length > 0
  const deckQueue = isStudyingAhead ? studyAheadQueue : normalDeckQueue
  const currentCard = deckQueue[0]
  const currentLesson = useMemo(
    () => (selectedDeck ? getCurrentCourseLesson(selectedDeck, deckQueue, settings.courseProgress.completedLessonIds) : null),
    [deckQueue, selectedDeck, settings.courseProgress.completedLessonIds],
  )
  const selectedDeckStats = useMemo(() => {
    if (!selectedDeck) {
      return null
    }

    return isStudyingAhead ? getQueueStats(deckQueue) : stats.byType[selectedDeck]
  }, [deckQueue, isStudyingAhead, selectedDeck, stats])
  const canStudyAhead = selectedDeck !== null && !isStudyingAhead && normalDeckQueue.length === 0 && studyAheadCandidates.length > 0

  function getOutlinePath(deckType: CardType): string {
    return `/course?deck=${deckType}`
  }

  useEffect(() => {
    setFlipped(false)
  }, [currentCard?.id, currentLesson?.id])

  useEffect(() => {
    setStudyAheadCardIds([])
  }, [selectedDeck])

  useEffect(() => {
    if (studyAheadCardIds.length > 0 && studyAheadQueue.length === 0) {
      setStudyAheadCardIds([])
    }
  }, [studyAheadCardIds.length, studyAheadQueue.length])

  function submitRating(rating: ReviewRating) {
    if (!currentCard || currentLesson) {
      return
    }

    startTransition(() => {
      setFlipped(false)
      if (isStudyingAhead) {
        setStudyAheadCardIds((currentIds) => currentIds.filter((cardId) => cardId !== currentCard.id))
      }
      void reviewCard(currentCard.id, rating)
    })
  }

  const handleKeyboardShortcuts = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null

    if (target?.closest('input, textarea, select, button')) {
      return
    }

    if (!currentCard) {
      return
    }

    if (currentLesson) {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        void completeLesson(currentLesson.id)
      }
      return
    }

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      if (!flipped) {
        setFlipped(true)
      } else {
        submitRating(2)
      }
      return
    }

    if (!flipped) {
      return
    }

    const shortcutMap: Record<string, ReviewRating> = {
      '1': 0,
      '2': 1,
      '3': 2,
      '4': 3,
    }

    const rating = shortcutMap[event.key]

    if (rating !== undefined) {
      event.preventDefault()
      submitRating(rating)
    }
  })

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboardShortcuts)

    return () => {
      window.removeEventListener('keydown', handleKeyboardShortcuts)
    }
  }, [])

  async function completeLesson(lessonId: string) {
    if (settings.courseProgress.completedLessonIds.includes(lessonId)) {
      return
    }

    await updateSettings({
      ...settings,
      courseProgress: {
        completedLessonIds: [...settings.courseProgress.completedLessonIds, lessonId],
      },
    })
  }

  if (isLoading && selectedDeck && !currentCard) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="h-[32rem] animate-pulse rounded-[2rem] bg-white/70 shadow-[0_20px_50px_rgba(21,41,38,0.1)]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="h-36 animate-pulse rounded-[1.8rem] bg-white/70" />
          <div className="h-36 animate-pulse rounded-[1.8rem] bg-white/70" />
        </div>
      </div>
    )
  }

  if (!selectedDeck) {
    return (
      <>
        <section className="rounded-[1.75rem] border border-white/75 bg-white/78 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
          <div className="mt-6 grid gap-3">
            {deckOrder.map((type) => {
              const metadata = deckMeta[type]
              const summary = stats.byType[type]

              return (
                <div
                  key={type}
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/?deck=${type}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      navigate(`/?deck=${type}`)
                    }
                  }}
                  className="cursor-pointer rounded-[1.25rem] bg-[rgba(118,118,128,0.08)] px-4 py-4 transition hover:bg-[rgba(118,118,128,0.14)] focus:outline-none focus:ring-2 focus:ring-[rgba(10,132,255,0.35)]"
                >
                  <div className="space-y-3 sm:space-y-0 sm:flex sm:min-w-0 sm:flex-1 sm:items-center sm:justify-between sm:gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-semibold text-[rgb(28,28,30)]">{metadata.shortLabel}</p>
                      </div>
                      <Link
                        to={getOutlinePath(type)}
                        className="flex shrink-0 items-center justify-center p-1 text-slate-500 transition hover:text-slate-900 sm:hidden"
                        aria-label={`Open ${metadata.shortLabel} outline`}
                        title={`Open ${metadata.shortLabel} outline`}
                        onClick={(event: ReactMouseEvent<HTMLAnchorElement>) => event.stopPropagation()}
                        onKeyDown={(event: ReactKeyboardEvent<HTMLAnchorElement>) => event.stopPropagation()}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 10v6" />
                          <path d="M12 7.5h.01" />
                        </svg>
                      </Link>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stateBadgeClassNames.new}`}>New {summary.new}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stateBadgeClassNames.learn}`}>Learn {summary.learn}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stateBadgeClassNames.review}`}>Due {summary.due}</span>
                      <Link
                        to={getOutlinePath(type)}
                        className="hidden shrink-0 items-center justify-center p-1 text-slate-500 transition hover:text-slate-900 sm:flex"
                        aria-label={`Open ${metadata.shortLabel} outline`}
                        title={`Open ${metadata.shortLabel} outline`}
                        onClick={(event: ReactMouseEvent<HTMLAnchorElement>) => event.stopPropagation()}
                        onKeyDown={(event: ReactKeyboardEvent<HTMLAnchorElement>) => event.stopPropagation()}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 10v6" />
                          <path d="M12 7.5h.01" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </>
    )
  }

  if (!currentCard) {
    return (
      <section className="rounded-[1.75rem] border border-white/75 bg-white/78 p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="mx-auto max-w-2xl space-y-5">
          <h2 className="text-4xl font-semibold tracking-tight text-[rgb(28,28,30)]">Congratulations! You have finished your cards in the {deckMeta[selectedDeck].shortLabel} deck.</h2>
          <p className="text-base leading-7 text-[rgb(99,99,102)]">
            {canStudyAhead
              ? 'This deck has no New, Learn, or Due cards at the moment. You can study ahead and keep practicing with future cards.'
              : 'This deck has no New, Learn, or Due cards at the moment.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {canStudyAhead ? (
              <button
                type="button"
                onClick={() => setStudyAheadCardIds(studyAheadCandidates.map((card) => card.id))}
                className="rounded-full bg-[rgb(0,122,255)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[rgb(0,112,235)]"
              >
                Study ahead
              </button>
            ) : null}
            <Link to="/" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
              Back to decks
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-[1.5rem] border border-white/75 bg-white/78 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:rounded-[1.75rem] sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="rounded-full bg-[rgba(118,118,128,0.12)] px-4 py-2 text-sm font-medium text-[rgb(0,122,255)] transition hover:bg-white">
            Back
          </Link>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            {isStudyingAhead ? (
              <span className="rounded-full bg-[rgba(0,122,255,0.12)] px-2.5 py-1 text-xs font-semibold text-[rgb(0,64,221)]">
                Studying ahead
              </span>
            ) : null}
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stateBadgeClassNames.new}`}>New {selectedDeckStats?.new ?? 0}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stateBadgeClassNames.learn}`}>Learn {selectedDeckStats?.learn ?? 0}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stateBadgeClassNames.review}`}>Due {selectedDeckStats?.due ?? 0}</span>
            <Link
              to={getOutlinePath(selectedDeck)}
              className="flex shrink-0 items-center justify-center p-1 text-slate-500 transition hover:text-slate-900"
              aria-label="Open deck outline"
              title="Open deck outline"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 10v6" />
                <path d="M12 7.5h.01" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/75 bg-white/78 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
        {currentLesson ? (
          <CourseLessonCard
            lesson={currentLesson}
            onContinue={() => {
              void completeLesson(currentLesson.id)
            }}
          />
        ) : (
          <>
            <ReviewCard
              card={currentCard}
              flipped={flipped}
              onFlip={() => setFlipped((value) => !value)}
              onPlayAudio={() => playAudio(currentCard)}
            />

            <div className="mt-6 border-t border-[rgba(60,60,67,0.12)] pt-6">
              {!flipped ? (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setFlipped(true)}
                    className="min-w-56 rounded-[1rem] bg-[rgb(0,122,255)] px-5 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[rgb(0,112,235)]"
                  >
                    Show Answer
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                    </div>
                    {isPending ? (
                      <span className="rounded-full bg-[rgba(52,199,89,0.16)] px-3 py-2 text-sm font-medium text-[rgb(36,138,61)]">
                        Updating
                      </span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {ratingButtons.map((button) => {
                      const previewNow = new Date()
                      const projectedCard = scheduleReview(currentCard, button.rating, previewNow)
                      const projectedLabel = formatIntervalFromReviewDate(projectedCard.nextReviewDate, previewNow)

                      return (
                        <button
                          key={button.label}
                          type="button"
                          onClick={() => submitRating(button.rating)}
                          className={`cursor-pointer rounded-[1.35rem] p-4 text-center transition shadow-sm hover:-translate-y-0.5 hover:shadow-md ${button.className}`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-base font-semibold">{button.label}</span>
                          </div>
                          <p className="mt-1 text-base font-semibold">{projectedLabel}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </section>

    </div>
  )
}
