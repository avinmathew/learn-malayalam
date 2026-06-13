import type { CardType } from '../types'

export interface CourseLessonRow {
  left: string
  right: string
}

export interface CourseLessonSection {
  heading?: string
  paragraphs?: string[]
  bullets?: string[]
  columns?: [string, string]
  rows?: CourseLessonRow[]
}

export interface CourseLesson {
  id: string
  deckType: CardType
  moduleLabel: string
  title: string
  startOrder: number
  upNextLabel: string
  summary: string
  sections: CourseLessonSection[]
  goal: string
}