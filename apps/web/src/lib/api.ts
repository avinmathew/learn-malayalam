import type { AuthSessionPayload, Card, CardsPayload, ReviewRating, UserSettings } from '../types'

import { buildAppPath } from './base'

const JSON_HEADERS = {
  'Content-Type': 'application/json',
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildAppPath(`/api${path}`), {
    ...init,
    credentials: 'include',
    headers: {
      ...JSON_HEADERS,
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}

export function fetchCardsRequest(): Promise<CardsPayload> {
  return requestJson<CardsPayload>('/cards')
}

export function buildCardAudioRequestPath(cardId: string): string {
  return buildAppPath(`/api/cards/${encodeURIComponent(cardId)}/audio`)
}

export function fetchAuthSessionRequest(): Promise<AuthSessionPayload> {
  return requestJson<AuthSessionPayload>('/auth/me')
}

export function signInWithGoogleRequest(credential: string): Promise<AuthSessionPayload> {
  return requestJson<AuthSessionPayload>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  })
}

export async function logoutRequest(): Promise<void> {
  await requestJson('/auth/logout', {
    method: 'POST',
  })
}

export function fetchUserSettingsRequest(): Promise<UserSettings> {
  return requestJson<UserSettings>('/users/settings')
}

export function updateUserSettingsRequest(settings: UserSettings): Promise<UserSettings> {
  return requestJson<UserSettings>('/users/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}

export function reviewCardRequest(cardId: string, rating: ReviewRating): Promise<Card> {
  return requestJson<Card>('/reviews', {
    method: 'POST',
    body: JSON.stringify({ cardId, rating }),
  })
}

export function syncCardRequest(card: Card): Promise<Card> {
  return requestJson<Card>('/cards/sync', {
    method: 'POST',
    body: JSON.stringify(card),
  })
}
