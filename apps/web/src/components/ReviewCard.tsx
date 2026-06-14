import { useRef } from 'react'

import { resolveAppAssetPath } from '../lib/base'
import type { Card } from '../types'

import { AudioButton } from './AudioButton'

const MAX_TAP_DISTANCE_PX = 8
const MAX_TAP_DURATION_MS = 250

interface ReviewCardProps {
  card: Card
  flipped: boolean
  onFlip: () => void
  onPlayAudio: () => void | Promise<unknown>
}

export function ReviewCard({ card, flipped, onFlip, onPlayAudio }: ReviewCardProps) {
  const isReverseCard = card.direction === 'reverse'
  const promptText = isReverseCard ? card.meaning || card.back : card.front
  const promptUsesMalayalamText = !isReverseCard
  const answerText = card.front
  const meaningText = card.meaning || card.back
  const meaningLabel = isReverseCard ? 'English prompt' : card.type === 'phrase' ? 'English translation' : card.type === 'letter' ? 'Sound' : 'Meaning'
  const transliterationLabel = card.type === 'phrase' ? 'Manglish' : 'Transliteration'
  const pointerStartRef = useRef<{ pointerId: number; x: number; y: number; time: number } | null>(null)
  const showImage = card.type === 'vocab' && Boolean(card.imagePath)
  const imagePath = resolveAppAssetPath(card.imagePath)
  const imageAlt = promptText
  const promptTextSizeClass =
    card.type === 'phrase' ? 'text-[clamp(1.9rem,7vw,3.4rem)]' : 'text-[clamp(3rem,10vw,5.8rem)]'
  const promptTextClassName = promptUsesMalayalamText
    ? `malayalam-text ${promptTextSizeClass} font-medium leading-tight text-balance text-slate-950`
    : `${promptTextSizeClass} max-w-full font-semibold leading-tight text-balance text-slate-950`

  function isInteractiveTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && Boolean(target.closest('button, a, input, textarea, select, label'))
  }

  function hasActiveSelection(): boolean {
    const selection = window.getSelection()
    return Boolean(selection && selection.type === 'Range' && selection.toString().trim())
  }

  return (
    <section className="space-y-4">


      <div className="flashcard-stage">
        <div
          role="button"
          tabIndex={0}
          aria-label="Flip the current flashcard"
          data-flipped={flipped}
          className="flashcard h-[29rem] cursor-pointer rounded-[2rem]"
          onPointerDown={(event) => {
            if (isInteractiveTarget(event.target)) {
              pointerStartRef.current = null
              return
            }

            pointerStartRef.current = {
              pointerId: event.pointerId,
              x: event.clientX,
              y: event.clientY,
              time: event.timeStamp,
            }
          }}
          onPointerUp={(event) => {
            const pointerStart = pointerStartRef.current
            pointerStartRef.current = null

            if (!pointerStart || pointerStart.pointerId !== event.pointerId || isInteractiveTarget(event.target) || hasActiveSelection()) {
              return
            }

            const distanceX = event.clientX - pointerStart.x
            const distanceY = event.clientY - pointerStart.y
            const distance = Math.hypot(distanceX, distanceY)
            const duration = event.timeStamp - pointerStart.time

            if (distance <= MAX_TAP_DISTANCE_PX && duration <= MAX_TAP_DURATION_MS) {
              onFlip()
            }
          }}
          onPointerCancel={() => {
            pointerStartRef.current = null
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onFlip()
            }
          }}
        >
          <article className="flashcard-face overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(160deg,_rgba(255,255,255,0.95),_rgba(236,248,244,0.96))] p-5 shadow-[0_26px_60px_rgba(21,41,38,0.14)] sm:p-8">
            <div className="flex h-full flex-col justify-between gap-5 sm:gap-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-800">Prompt</p>
                </div>
              </div>

              <div className="flex flex-1 items-center justify-center rounded-[1.6rem] border border-emerald-100 bg-white/80 px-4 py-8 text-center shadow-inner shadow-emerald-100/60">
                <div className="flex w-full max-w-full flex-col items-center justify-center gap-4">
                  {showImage ? (
                    <img
                      src={imagePath}
                      alt={imageAlt}
                      className="max-h-32 w-full max-w-[11rem] rounded-[1.4rem] object-contain shadow-[0_14px_30px_rgba(21,41,38,0.12)]"
                    />
                  ) : null}

                  <p className={promptTextClassName}>
                    {promptText}
                  </p>
                </div>
              </div>
            </div>
          </article>

          <article className="flashcard-face flashcard-face--back overflow-y-auto overflow-x-hidden rounded-[2rem] border border-slate-900/10 bg-[linear-gradient(180deg,_rgba(23,50,47,0.96),_rgba(16,37,35,0.98))] p-5 text-white shadow-[0_26px_60px_rgba(21,41,38,0.24)] sm:overflow-hidden sm:p-8">
            <div className="flex min-h-full flex-col gap-4 sm:gap-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200">Answer</p>
                </div>
                <div
                  className="flex items-center justify-between gap-3"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                  onPointerUp={(event) => event.stopPropagation()}
                >
                  <AudioButton compact onClick={onPlayAudio} />
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-4 sm:p-5">
                <div className={`flex items-center gap-4 ${showImage ? 'sm:flex-row' : ''}`}>
                  {showImage ? (
                    <img
                      src={imagePath}
                      alt={imageAlt}
                      className="mx-auto max-h-20 w-full max-w-[7rem] shrink-0 rounded-[1.2rem] object-contain sm:mx-0"
                    />
                  ) : null}

                  <p className="malayalam-text flex-1 text-[clamp(1.9rem,7vw,3.4rem)] font-medium leading-tight text-balance">
                    {answerText}
                  </p>
                </div>
              </div>



              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                {card.transliteration ? (
                  <div className="rounded-[1.3rem] border border-white/10 bg-white/6 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">{transliterationLabel}</p>
                    <p className="mt-2 text-lg font-medium text-white/95">{card.transliteration}</p>
                  </div>
                ) : null}

                <div className="rounded-[1.3rem] border border-white/10 bg-white/6 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">{meaningLabel}</p>
                  <p className="mt-2 text-lg font-medium text-white/95">{meaningText}</p>
                </div>
              </div>

              {card.type === 'vocab' && card.category ? (
                <div className="rounded-[1.3rem] border border-emerald-200/20 bg-emerald-300/10 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100/75">Category</p>
                  <p className="mt-2 text-sm font-medium text-emerald-50">{card.category}</p>
                </div>
              ) : null}

              {card.example ? (
                <div className="rounded-[1.3rem] border border-white/10 bg-white/6 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">Example word</p>
                  <p className="malayalam-text mt-2 text-xl font-medium text-white sm:text-2xl">{card.example}</p>
                </div>
              ) : null}

            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
