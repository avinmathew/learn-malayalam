import './env.js'

import cors from 'cors'
import express from 'express'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { clearSessionCookie, createSessionCookie, isGoogleAuthConfigured, readSessionUser, verifyGoogleCredential } from './auth.js'
import { addCard, getCardsPayload, getCardStats, getCards, getUserSettings, reviewCard, syncCard, updateUserSettings } from './store.js'
import { getCachedSpeechFile } from './tts.js'
import type { Card, NewCardInput, ReviewRating, UserSettings } from './types.js'

const app = express()
const api = express.Router()
const port = Number(process.env.PORT ?? 3001)
const currentDir = path.dirname(fileURLToPath(import.meta.url))
const webDistDir = path.resolve(currentDir, '../../web/dist')
const appBasePath = '/learn-malayalam'

app.use(cors())
app.use(express.json())
app.use((req, res, next) => {
  res.locals.user = readSessionUser(req.headers.cookie)
  next()
})

api.get('/health', (_req, res) => {
  res.json({ ok: true })
})

api.get('/auth/me', (_req, res) => {
  res.json({
    user: res.locals.user ?? null,
    googleClientConfigured: isGoogleAuthConfigured(),
  })
})

api.post('/auth/google', async (req, res) => {
  const { credential } = req.body as { credential?: string }

  if (!credential) {
    res.status(400).json({ message: 'Google credential is required.' })
    return
  }

  const user = await verifyGoogleCredential(credential)
  res.setHeader('Set-Cookie', createSessionCookie(user))
  res.json({
    user,
    googleClientConfigured: isGoogleAuthConfigured(),
  })
})

api.post('/auth/logout', (_req, res) => {
  res.setHeader('Set-Cookie', clearSessionCookie())
  res.status(204).end()
})

api.get('/users/settings', async (_req, res) => {
  const userId = res.locals.user?.id

  if (!userId) {
    res.status(401).json({ message: 'Sign-in is required.' })
    return
  }

  res.json(await getUserSettings(userId))
})

api.put('/users/settings', async (req, res) => {
  const userId = res.locals.user?.id

  if (!userId) {
    res.status(401).json({ message: 'Sign-in is required.' })
    return
  }

  const payload = req.body as Partial<UserSettings>
  res.json(await updateUserSettings(userId, payload as UserSettings))
})

api.get('/cards', async (_req, res) => {
  const payload = await getCardsPayload(res.locals.user?.id)
  res.json(payload)
})

api.get('/stats', async (_req, res) => {
  const cards = await getCards(res.locals.user?.id)
  const settings = await getUserSettings(res.locals.user?.id)
  res.json(getCardStats(cards, settings))
})

api.get('/cards/:cardId/audio', async (req, res) => {
  const cards = await getCards(res.locals.user?.id)
  const card = cards.find((candidate) => candidate.id === req.params.cardId)

  if (!card) {
    res.status(404).json({ message: 'Card not found.' })
    return
  }

  const { filePath, fromCache } = await getCachedSpeechFile(card.audioText || card.front)

  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-TTS-Cache', fromCache ? 'HIT' : 'MISS')
  res.sendFile(filePath)
})

api.post('/cards', async (req, res) => {
  const payload = req.body as NewCardInput

  if (!payload?.type || !payload?.front) {
    res.status(400).json({ message: 'type and front are required.' })
    return
  }

  const card = await addCard(payload, res.locals.user?.id)
  res.status(201).json(card)
})

api.post('/cards/sync', async (req, res) => {
  const payload = req.body as Card

  if (!payload?.id || !payload?.type || !payload?.front || !payload?.audioText) {
    res.status(400).json({ message: 'A complete card payload is required.' })
    return
  }

  const card = await syncCard(payload, res.locals.user?.id)
  res.status(201).json(card)
})

api.post('/reviews', async (req, res) => {
  const { cardId, rating } = req.body as { cardId?: string; rating?: number }

  if (!cardId || rating === undefined || ![0, 1, 2, 3].includes(rating)) {
    res.status(400).json({ message: 'cardId and a valid rating are required.' })
    return
  }

  const card = await reviewCard(cardId, rating as ReviewRating, res.locals.user?.id)
  res.json(card)
})

app.use('/api', api)
app.use(`${appBasePath}/api`, api)

if (existsSync(webDistDir)) {
  app.get('/', (_req, res) => {
    res.redirect(302, `${appBasePath}/`)
  })

  app.use(appBasePath, express.static(webDistDir))

  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith(`${appBasePath}/api`)) {
      next()
      return
    }

    if (!req.path.startsWith(appBasePath)) {
      next()
      return
    }

    res.sendFile(path.join(webDistDir, 'index.html'))
  })
}

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ message: error.message || 'Unexpected server error.' })
})

app.listen(port)
