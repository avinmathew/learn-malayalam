import { createHmac, timingSafeEqual } from 'node:crypto'

import { OAuth2Client } from 'google-auth-library'
import { parse as parseCookieHeader, serialize as serializeCookie } from 'cookie'

import './env.js'

import type { AppUser } from './types.js'

const AUTH_COOKIE_NAME = 'aksharam_session'
const DEFAULT_SESSION_SECRET = 'aksharam-dev-session-secret'
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

const googleClient = new OAuth2Client()

interface SessionPayload {
  exp: number
  user: AppUser
}

function getGoogleClientId(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim()

  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured.')
  }

  return clientId
}

function getSessionSecret(): string {
  return process.env.AUTH_COOKIE_SECRET?.trim() || DEFAULT_SESSION_SECRET
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function signPayload(payload: string): string {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('base64url')
}

function buildSessionToken(user: AppUser, now = Date.now()): string {
  const payload = encodeBase64Url(JSON.stringify({
    exp: now + SESSION_TTL_MS,
    user,
  } satisfies SessionPayload))
  const signature = signPayload(payload)

  return `${payload}.${signature}`
}

function verifySessionToken(token: string): AppUser | null {
  const [payload, signature] = token.split('.')

  if (!payload || !signature) {
    return null
  }

  const expectedSignature = signPayload(payload)

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as SessionPayload

    if (parsed.exp <= Date.now()) {
      return null
    }

    return parsed.user
  } catch {
    return null
  }
}

export function readSessionUser(cookieHeader: string | undefined): AppUser | null {
  if (!cookieHeader) {
    return null
  }

  const cookies = parseCookieHeader(cookieHeader)
  const sessionToken = cookies[AUTH_COOKIE_NAME]

  if (!sessionToken) {
    return null
  }

  return verifySessionToken(sessionToken)
}

export function createSessionCookie(user: AppUser): string {
  return serializeCookie(AUTH_COOKIE_NAME, buildSessionToken(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1_000),
  })
}

export function clearSessionCookie(): string {
  return serializeCookie(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}

export async function verifyGoogleCredential(credential: string): Promise<AppUser> {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: getGoogleClientId(),
  })
  const payload = ticket.getPayload()

  if (!payload?.sub || !payload.email) {
    throw new Error('Google credential did not include a usable user profile.')
  }

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
    picture: payload.picture,
  }
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim())
}