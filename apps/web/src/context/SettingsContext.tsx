import { createContext, useContext, useEffect, useState } from 'react'

import { useAuth } from './AuthContext'
import { fetchUserSettingsRequest, updateUserSettingsRequest } from '../lib/api'
import { createDefaultUserSettings, normalizeUserSettings } from '../lib/cards'
import type { UserSettings } from '../types'

const GUEST_SETTINGS_STORAGE_KEY = 'learn-malayalam:guest-settings'

interface SettingsContextValue {
  settings: UserSettings
  isLoading: boolean
  updateSettings: (settings: UserSettings) => Promise<UserSettings>
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

function readGuestSettings(): UserSettings {
  try {
    const rawSettings = window.localStorage.getItem(GUEST_SETTINGS_STORAGE_KEY)

    if (!rawSettings) {
      return createDefaultUserSettings()
    }

    return normalizeUserSettings(JSON.parse(rawSettings) as Partial<UserSettings>)
  } catch {
    return createDefaultUserSettings()
  }
}

function writeGuestSettings(settings: UserSettings) {
  try {
    window.localStorage.setItem(GUEST_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Best-effort only.
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [settings, setSettings] = useState<UserSettings>(createDefaultUserSettings())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    let isMounted = true

    if (!user) {
      setSettings(readGuestSettings())
      setIsLoading(false)
      return () => {
        isMounted = false
      }
    }

    setIsLoading(true)

    void (async () => {
      try {
        const payload = await fetchUserSettingsRequest()

        if (!isMounted) {
          return
        }

        setSettings(normalizeUserSettings(payload))
      } catch {
        if (!isMounted) {
          return
        }

        setSettings(createDefaultUserSettings())
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [isAuthLoading, user])

  async function updateSettings(settingsInput: UserSettings): Promise<UserSettings> {
    const normalizedSettings = normalizeUserSettings(settingsInput)

    if (!user) {
      setSettings(normalizedSettings)
      writeGuestSettings(normalizedSettings)
      return normalizedSettings
    }

    const savedSettings = normalizeUserSettings(await updateUserSettingsRequest(normalizedSettings))
    setSettings(savedSettings)
    return savedSettings
  }

  return <SettingsContext.Provider value={{ settings, isLoading, updateSettings }}>{children}</SettingsContext.Provider>
}

export function useUserSettings() {
  const context = useContext(SettingsContext)

  if (!context) {
    throw new Error('useUserSettings must be used inside SettingsProvider.')
  }

  return context
}