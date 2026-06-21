import { useEffect, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'

import { CourseLessonCard } from '../components/CourseLessonCard'
import { useFlashcards } from '../context/FlashcardsContext'
import { useUserSettings } from '../context/SettingsContext'
import { deckMeta, sortCardsByCurriculumOrder } from '../lib/cards'
import { getCourseLesson, getCourseLessons } from '../lib/courseRegistry'
import type { Card, CardType } from '../types'

function isCardType(value: string | null): value is CardType {
  return value === 'letter' || value === 'vocab' || value === 'phrase'
}

function containsMalayalamText(value: string): boolean {
  return /[\u0D00-\u0D7F]/.test(value)
}

function getCardSummary(card: Card): string {
  if (card.type === 'letter') {
    return card.transliteration || card.back
  }

  return card.meaning || card.back
}

interface OutlineSection {
  lessonId: string | null
  cards: Card[]
  title?: string
}

export function CourseOutlinePage() {
  const { cards } = useFlashcards()
  const { settings } = useUserSettings()
  const [searchParams] = useSearchParams()
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const deckParam = searchParams.get('deck')
  const selectedDeck = isCardType(deckParam) ? deckParam : null

  useEffect(() => {
    setSelectedLessonId(null)
  }, [selectedDeck])

  if (!selectedDeck) {
    return <Navigate to="/" replace />
  }

  const lessons = getCourseLessons(selectedDeck)
  const completedLessonIdSet = new Set(settings.courseProgress.completedLessonIds)
  const orderedCards = sortCardsByCurriculumOrder(cards.filter((card) => card.type === selectedDeck && card.direction !== 'reverse'))
  const selectedLesson = selectedLessonId ? getCourseLesson(selectedDeck, selectedLessonId) : null
  const outlineSections: OutlineSection[] = lessons.length === 0
    ? selectedDeck === 'vocab'
      ? Array.from(
          orderedCards.reduce<Map<string, Card[]>>((sections, card) => {
            const category = card.category?.trim() || 'Other'
            const cardsInCategory = sections.get(category)

            if (cardsInCategory) {
              cardsInCategory.push(card)
            } else {
              sections.set(category, [card])
            }

            return sections
          }, new Map()),
          ([title, cards]) => ({ lessonId: null, title, cards }),
        )
      : [{ lessonId: null, cards: orderedCards }]
    : lessons.map((lesson, index) => {
      const nextStartOrder = lessons[index + 1]?.startOrder ?? Number.POSITIVE_INFINITY

      return {
        lessonId: lesson.id,
        cards: orderedCards.filter((card) => {
          const cardOrder = card.order ?? Number.MAX_SAFE_INTEGER
          return cardOrder >= lesson.startOrder && cardOrder < nextStartOrder
        }),
      }
    })

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-[1.5rem] border border-white/75 bg-white/78 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:rounded-[1.75rem] sm:p-6">
        <div className="flex items-center justify-between gap-4">
          {selectedLesson ? (
            <Link
              to="/"
              onClick={(event: ReactMouseEvent<HTMLAnchorElement>) => {
                event.preventDefault()
                setSelectedLessonId(null)
              }}
              className="rounded-full bg-[rgba(118,118,128,0.12)] px-4 py-2 text-sm font-medium text-[rgb(0,122,255)] transition hover:bg-white"
            >
              Back
            </Link>
          ) : (
            <Link to="/" className="rounded-full bg-[rgba(118,118,128,0.12)] px-4 py-2 text-sm font-medium text-[rgb(0,122,255)] transition hover:bg-white">
              Back
            </Link>
          )}
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Course outline</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{deckMeta[selectedDeck].shortLabel}</h1>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/75 bg-white/78 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
        {selectedLesson ? (
          <CourseLessonCard lesson={selectedLesson} onContinue={() => setSelectedLessonId(null)} actionLabel="Back to outline" actionVariant="back" />
        ) : (
          <div className="space-y-6">
            {lessons.length === 0 ? (
              <section className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-5 text-sm leading-7 text-slate-700 shadow-sm">
                This deck does not have authored lessons yet. The cards below are still listed in curriculum order.
              </section>
            ) : null}

            {outlineSections.map((section, index) => {
              const lesson = section.lessonId ? getCourseLesson(selectedDeck, section.lessonId) : null

              return (
                <section key={lesson?.id ?? `cards-${index}`} className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-white/88 p-4 shadow-sm sm:p-5">
                  {lesson ? (
                    <button
                      type="button"
                      onClick={() => setSelectedLessonId(lesson.id)}
                      className="w-full cursor-pointer rounded-[1.3rem] border border-emerald-200 bg-emerald-50/75 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-900">{lesson.moduleLabel}</p>
                          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${completedLessonIdSet.has(lesson.id) ? 'bg-emerald-200 text-emerald-950' : 'bg-white text-slate-700'}`}>
                            {completedLessonIdSet.has(lesson.id) ? 'Completed' : 'See Lesson'}
                          </span>
                        </div>
                        <h2 className="text-lg font-semibold text-slate-950">{lesson.title}</h2>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{lesson.upNextLabel}</p>
                    </button>
                  ) : null}

                  {!lesson && section.title ? (
                    <div className="flex items-center justify-between gap-3 rounded-[1.3rem] border border-slate-200/90 bg-slate-50/80 px-4 py-3">
                      <h2 className="text-base font-semibold text-slate-950">{section.title}</h2>
                      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                        {section.cards.length} cards
                      </span>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    {section.cards.map((card) => (
                      <div key={card.id} className="grid grid-cols-[auto_minmax(0,1.3fr)_minmax(0,1fr)] items-center gap-3 rounded-[1.1rem] border border-slate-200/90 bg-slate-50/80 px-4 py-2.5 sm:gap-4">
                        <span className="min-w-11 rounded-full bg-white px-3 py-1 text-center text-xs font-semibold text-slate-500 shadow-sm">
                          {card.order ?? '-'}
                        </span>
                        <div className="min-w-0">
                          <p className={`${containsMalayalamText(card.front) ? 'malayalam-text text-lg text-slate-950 sm:text-xl' : 'text-base font-semibold text-slate-950'}`}>
                            {card.front}
                          </p>
                        </div>
                        <p className="min-w-0 text-right text-sm text-slate-600">{getCardSummary(card)}</p>
                      </div>
                    ))}

                    {section.cards.length === 0 ? (
                      <p className="rounded-[1.1rem] border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
                        No cards are authored in this section yet.
                      </p>
                    ) : null}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}