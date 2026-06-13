import type { CourseLesson } from '../lib/courseTypes'

interface CourseLessonCardProps {
  lesson: CourseLesson
  onContinue: () => void
  actionLabel?: string
  actionVariant?: 'primary' | 'back'
}

function containsMalayalamText(value: string): boolean {
  return /[\u0D00-\u0D7F]/.test(value)
}

export function CourseLessonCard({ lesson, onContinue, actionLabel = 'Continue', actionVariant = 'primary' }: CourseLessonCardProps) {
  const actionClassName = actionVariant === 'back'
    ? 'rounded-full bg-[rgba(118,118,128,0.12)] px-4 py-2 text-sm font-medium text-[rgb(0,122,255)] transition hover:bg-white'
    : 'rounded-full bg-[rgb(0,122,255)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[rgb(0,112,235)]'

  return (
    <article className="space-y-6 rounded-[2rem] border border-white/75 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(237,248,244,0.98))] p-6 shadow-[0_26px_60px_rgba(21,41,38,0.14)] sm:p-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-900">
            {lesson.moduleLabel}
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
            {lesson.upNextLabel}
          </span>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{lesson.title}</h2>
          <p className="max-w-3xl text-base leading-7 text-slate-700 sm:text-lg">{lesson.summary}</p>
        </div>
      </header>

      <div className="space-y-5">
        {lesson.sections.map((section, index) => (
          <section key={`${lesson.id}-${index}`} className="space-y-3 rounded-[1.5rem] border border-slate-200/80 bg-white/70 p-4 shadow-sm sm:p-5">
            {section.heading ? <h3 className="text-lg font-semibold text-slate-900">{section.heading}</h3> : null}

            {section.rows ? (
              <div className="overflow-hidden rounded-[1.2rem] border border-slate-200">
                {section.columns ? (
                  <div className="grid grid-cols-2 bg-slate-100/90 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    <span>{section.columns[0]}</span>
                    <span>{section.columns[1]}</span>
                  </div>
                ) : null}

                <div className="divide-y divide-slate-200 bg-white">
                  {section.rows.map((row) => (
                    <div key={`${row.left}-${row.right}`} className="grid grid-cols-2 gap-4 px-4 py-3 text-sm text-slate-700 sm:text-base">
                      <span className={`${containsMalayalamText(row.left) ? 'malayalam-text text-lg font-medium text-slate-950 sm:text-xl' : 'font-medium text-slate-950'}`}>
                        {row.left}
                      </span>
                      <span className={`${containsMalayalamText(row.right) ? 'malayalam-text text-lg text-slate-950 sm:text-xl' : ''}`}>
                        {row.right}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="text-base leading-7 text-slate-700">
                {paragraph}
              </p>
            ))}

            {section.bullets ? (
              <ul className="space-y-2 text-base leading-7 text-slate-700">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <footer className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/90 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-900">Goal</p>
        <p className="mt-2 text-base leading-7 text-emerald-950">{lesson.goal}</p>
      </footer>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onContinue}
          className={actionClassName}
        >
          {actionLabel}
        </button>
      </div>
    </article>
  )
}