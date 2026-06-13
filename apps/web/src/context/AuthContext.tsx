import { GoogleOAuthProvider } from '@react-oauth/google'
import { createContext, useContext, useEffect, useState } from 'react'

import { fetchAuthSessionRequest, logoutRequest, signInWithGoogleRequest } from '../lib/api'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  googleClientConfigured: boolean
  signInWithGoogle: (credential: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || ''

function AuthProviderContent({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [googleClientConfigured, setGoogleClientConfigured] = useState(false)

  useEffect(() => {
    let isMounted = true

    void (async () => {
      try {
        const payload = await fetchAuthSessionRequest()

        if (!isMounted) {
          return
        }

        setUser(payload.user)
        setGoogleClientConfigured(payload.googleClientConfigured)
      } catch {
        if (!isMounted) {
          return
        }

        setUser(null)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [])

  async function signInWithGoogle(credential: string) {
    const payload = await signInWithGoogleRequest(credential)
    setUser(payload.user)
    setGoogleClientConfigured(payload.googleClientConfigured)
  }

  async function signOut() {
    await logoutRequest()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        googleClientConfigured,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const content = <AuthProviderContent>{children}</AuthProviderContent>

  if (!googleClientId) {
    return content
  }

  return <GoogleOAuthProvider clientId={googleClientId}>{content}</GoogleOAuthProvider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }

  return context
}