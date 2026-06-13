import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { useUserSettings } from '../context/SettingsContext'
import { deckMeta, normalizeUserSettings } from '../lib/cards'
import type { CardType, UserSettings } from '../types'

const deckOrder: CardType[] = ['letter', 'vocab', 'phrase']

export function SettingsPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const { settings, isLoading: isSettingsLoading, updateSettings } = useUserSettings()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<UserSettings>(settings)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [savedMessage, setSavedMessage] = useState<string>()

  useEffect(() => {
    setDraft(settings)
  }, [settings])

  if (!isAuthLoading && !user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setErrorMessage(undefined)
    setSavedMessage(undefined)

    try {
      const nextSettings = normalizeUserSettings(draft)
      const savedSettings = await updateSettings(nextSettings)
      setDraft(savedSettings)
      setSavedMessage('Saved')
      navigate('/')
    } catch {
      setErrorMessage('Could not save settings right now.')
    } finally {
      setIsSaving(false)
    }
  }

  function updateDeckLimit(type: CardType, rawValue: string) {
    const nextValue = rawValue === '' ? 0 : Number(rawValue)

    setDraft((currentSettings) => ({
      ...currentSettings,
      maxNewCardsPerDay: {
        ...currentSettings.maxNewCardsPerDay,
        [type]: Number.isFinite(nextValue) ? Math.max(0, Math.trunc(nextValue)) : 0,
      },
    }))
    setSavedMessage(undefined)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-[1.5rem] border border-white/75 bg-white/78 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:rounded-[1.75rem] sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex w-fit rounded-full bg-[rgba(118,118,128,0.12)] px-4 py-2 text-sm font-medium text-[rgb(0,122,255)] transition hover:bg-white">
            Back
          </Link>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Settings</p>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/75 bg-white/78 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
        <h1 className="text-xl font-semibold tracking-tight text-slate-950">Daily new card limits</h1>
        <p className="text-sm leading-6 text-[rgb(99,99,102)]">
          Set how many new cards each deck can introduce per day. This affects only new cards; learning and <span className="whitespace-nowrap">due reviews</span> stay uncapped.
        </p>

        {isAuthLoading || isSettingsLoading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {deckOrder.map((type) => (
              <div key={type} className="h-40 animate-pulse rounded-[1.5rem] bg-white/70" />
            ))}
          </div>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {deckOrder.map((type) => {
                const metadata = deckMeta[type]

                return (
                  <label
                    key={type}
                    className="rounded-[1.5rem] border border-[rgba(60,60,67,0.1)] bg-white/82 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-base font-semibold text-[rgb(28,28,30)]">{metadata.shortLabel}</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={draft.maxNewCardsPerDay[type]}
                      onChange={(event) => updateDeckLimit(type, event.target.value)}
                      className="mt-4 w-full rounded-[1rem] border border-[rgba(60,60,67,0.12)] bg-[rgba(118,118,128,0.06)] px-4 py-3 text-lg font-semibold text-[rgb(28,28,30)] outline-none transition focus:border-[rgba(10,132,255,0.45)] focus:bg-white"
                    />
                  </label>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(60,60,67,0.12)] pt-5">
              <div className="min-h-6 text-sm text-[rgb(99,99,102)]">
                {errorMessage ? <span className="text-[rgb(196,43,28)]">{errorMessage}</span> : savedMessage ? <span className="text-[rgb(36,138,61)]">{savedMessage}</span> : null}
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="cursor-pointer rounded-full bg-[rgb(28,28,30)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-default disabled:opacity-60"
              >
                {isSaving ? 'Saving' : 'Save settings'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}