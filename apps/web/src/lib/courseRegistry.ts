import type { Card, CardType } from '../types'

import type { CourseLesson } from './courseTypes'
import { letterCourseLessons } from './letterCourse'
import { phraseCourseLessons } from './phraseCourse'

const courseLessonsByDeck: Record<CardType, CourseLesson[]> = {
  letter: letterCourseLessons,
  vocab: [],
  phrase: phraseCourseLessons,
}

function isNewCard(card: Card): boolean {
  return card.state === 'new' || card.repetitions === 0
}

export function getCourseLessons(deckType: CardType): CourseLesson[] {
  return courseLessonsByDeck[deckType]
}

export function getCourseLesson(deckType: CardType, lessonId: string): CourseLesson | null {
  return getCourseLessons(deckType).find((lesson) => lesson.id === lessonId) ?? null
}

export function getCurrentCourseLesson(deckType: CardType, queue: Card[], completedLessonIds: Iterable<string> = []): CourseLesson | null {
  if (queue.length === 0) {
    return null
  }

  const firstNewCard = queue.find(isNewCard)

  if (!firstNewCard || queue[0]?.id !== firstNewCard.id || typeof firstNewCard.order !== 'number') {
    return null
  }

  const completedLessonIdSet = new Set(completedLessonIds)

  return getCourseLessons(deckType).find((lesson) => lesson.startOrder === firstNewCard.order && !completedLessonIdSet.has(lesson.id)) ?? null
}