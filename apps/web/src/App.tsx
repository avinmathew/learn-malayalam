import { GoogleLogin } from '@react-oauth/google'
import type { CredentialResponse } from '@react-oauth/google'
import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { AuthProvider, useAuth } from './context/AuthContext'
import { FlashcardsProvider } from './context/FlashcardsContext'
import { SettingsProvider } from './context/SettingsContext'
import { APP_BASE_PATH } from './lib/base'
import { CourseOutlinePage } from './pages/CourseOutlinePage'
import { ReviewPage } from './pages/ReviewPage'
import { SettingsPage } from './pages/SettingsPage'

function Shell() {
  const { user, isLoading: isAuthLoading, googleClientConfigured, signInWithGoogle, signOut } = useAuth()
  const location = useLocation()
  const showHeader = location.pathname === '/' && !new URLSearchParams(location.search).get('deck')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setIsUserMenuOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!isUserMenuOpen) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isUserMenuOpen])

  async function handleGoogleSuccess(response: CredentialResponse) {
    if (!response.credential) {
      return
    }

    await signInWithGoogle(response.credential)
  }

  async function handleSignOut() {
    setIsUserMenuOpen(false)
    await signOut()
  }

  const userInitial = user?.name?.trim().charAt(0).toUpperCase() || user?.email?.trim().charAt(0).toUpperCase() || 'U'
  const deckParam = new URLSearchParams(location.search).get('deck')
  const selectedDeckLabel = deckParam === 'letter' ? 'Letters' : deckParam === 'vocab' ? 'Vocab' : deckParam === 'phrase' ? 'Phrases' : null

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(10,132,255,0.18),_transparent_50%),radial-gradient(circle_at_top_right,_rgba(90,200,250,0.16),_transparent_40%)]" />
      <div className="app-shell mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pt-4 sm:px-6 lg:px-8">
        {showHeader ? (
          <header className="relative z-30 rounded-[1.35rem] border border-white/75 bg-white/72 px-5 py-3 shadow-[0_20px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3 sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Link to="/" className="text-[clamp(1.6rem,4vw,2.1rem)] font-semibold tracking-tight text-[rgb(28,28,30)] transition hover:text-[rgb(0,122,255)]">
                  Learn Malayalam
                </Link>
                {selectedDeckLabel ? <span className="rounded-full bg-[rgba(10,132,255,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(0,64,221)]">{selectedDeckLabel}</span> : null}
              </div>

              <div className="flex shrink-0 items-center justify-end gap-2 self-start text-sm">
                {isAuthLoading ? (
                  <div className="rounded-full border border-[rgba(60,60,67,0.12)] bg-white/85 px-3 py-2 text-slate-600">
                    Checking session
                  </div>
                ) : user ? (
                  <div ref={userMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen((open) => !open)}
                      className="cursor-pointer rounded-full border border-[rgba(60,60,67,0.12)] bg-white/90 p-1 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(10,132,255,0.35)]"
                      aria-haspopup="menu"
                      aria-expanded={isUserMenuOpen}
                      aria-label="Open account menu"
                    >
                      {user.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name}
                          className="h-9 w-9 rounded-full object-cover sm:h-10 sm:w-10"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgb(28,28,30)] text-sm font-semibold text-white sm:h-10 sm:w-10">
                          {userInitial}
                        </span>
                      )}
                    </button>

                    {isUserMenuOpen ? (
                      <div
                        className="absolute right-0 top-[calc(100%+0.75rem)] z-20 w-[min(16rem,calc(100vw-2.5rem))] rounded-[1.25rem] border border-[rgba(60,60,67,0.12)] bg-white/96 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-xl"
                        role="menu"
                        aria-label="Account menu"
                      >
                        <div className="rounded-[1rem] bg-[rgba(118,118,128,0.08)] px-3 py-3">
                          <p className="truncate text-sm font-semibold text-[rgb(28,28,30)]">{user.name}</p>
                          <p className="truncate text-xs text-[rgb(99,99,102)]">{user.email}</p>
                        </div>

                        <div className="mt-2 grid gap-1">
                          <Link
                            to="/settings"
                            className="rounded-[0.95rem] px-3 py-2.5 text-sm font-medium text-[rgb(28,28,30)] transition hover:bg-[rgba(118,118,128,0.12)]"
                            role="menuitem"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            Settings
                          </Link>
                          <button
                            type="button"
                            onClick={() => void handleSignOut()}
                            className="cursor-pointer rounded-[0.95rem] px-3 py-2.5 text-left text-sm font-medium text-[rgb(196,43,28)] transition hover:bg-[rgba(255,59,48,0.08)]"
                            role="menuitem"
                          >
                            Sign out
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : googleClientConfigured ? (
                  <GoogleLogin
                    onSuccess={(response) => {
                      void handleGoogleSuccess(response)
                    }}
                    onError={() => undefined}
                    text="signin_with"
                    size="medium"
                    shape="pill"
                  />
                ) : (
                  <div className="rounded-full border border-[rgba(60,60,67,0.12)] bg-white/85 px-3 py-2 text-slate-600">
                    Guest mode only. Set `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID` to enable sign-in.
                  </div>
                )}
              </div>
            </div>
          </header>
        ) : null}

        <main className="relative z-10 flex-1">
          <Routes>
            <Route path="/" element={<ReviewPage />} />
            <Route path="/course" element={<CourseOutlinePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/review" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter basename={APP_BASE_PATH || undefined}>
      <AuthProvider>
        <SettingsProvider>
          <FlashcardsProvider>
            <Shell />
          </FlashcardsProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
