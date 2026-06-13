import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { TextToSpeechClient } from '@google-cloud/text-to-speech'

import './env.js'

const cacheDir = fileURLToPath(new URL('../../../data/tts-cache', import.meta.url))
const defaultLanguageCode = process.env.GOOGLE_TTS_LANGUAGE_CODE?.trim() || 'ml-IN'
const defaultVoiceName = process.env.GOOGLE_TTS_VOICE_NAME?.trim() || undefined
const defaultSpeakingRate = Number(process.env.GOOGLE_TTS_SPEAKING_RATE ?? '0.9')
const generationVersion = 'v1'
const pendingSyntheses = new Map<string, Promise<string>>()

let client: TextToSpeechClient | null = null

function getCredentialsFromEnv() {
  const credentialsJson = process.env.GOOGLE_TTS_CREDENTIALS_JSON?.trim()

  if (!credentialsJson) {
    return undefined
  }

  try {
    return JSON.parse(credentialsJson) as { client_email?: string; private_key?: string }
  } catch {
    throw new Error('GOOGLE_TTS_CREDENTIALS_JSON is not valid JSON.')
  }
}

function getClient() {
  if (client) {
    return client
  }

  client = new TextToSpeechClient({
    credentials: getCredentialsFromEnv(),
  })

  return client
}

function buildCacheKey(text: string) {
  const hash = createHash('sha256')
  hash.update(JSON.stringify({
    version: generationVersion,
    text,
    languageCode: defaultLanguageCode,
    voiceName: defaultVoiceName,
    speakingRate: defaultSpeakingRate,
    audioEncoding: 'MP3',
  }))
  return hash.digest('hex')
}

function normalizeAudioContent(audioContent: Uint8Array | string | null | undefined) {
  if (!audioContent) {
    throw new Error('Google TTS returned an empty audio payload.')
  }

  if (typeof audioContent === 'string') {
    return Buffer.from(audioContent, 'base64')
  }

  return Buffer.from(audioContent)
}

async function synthesizeToCache(filePath: string, text: string) {
  await mkdir(cacheDir, { recursive: true })

  const ttsClient = getClient()
  const [response] = await ttsClient.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode: defaultLanguageCode,
      name: defaultVoiceName,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: Number.isFinite(defaultSpeakingRate) ? defaultSpeakingRate : 0.9,
    },
  })

  const buffer = normalizeAudioContent(response.audioContent)
  await writeFile(filePath, buffer)
  return filePath
}

export async function getCachedSpeechFile(text: string) {
  const normalizedText = text.trim()

  if (!normalizedText) {
    throw new Error('Audio text cannot be empty.')
  }

  const cacheKey = buildCacheKey(normalizedText)
  const filePath = path.join(cacheDir, `${cacheKey}.mp3`)

  try {
    await readFile(filePath)
    return { filePath, cacheKey, fromCache: true }
  } catch {
    const pending = pendingSyntheses.get(cacheKey)

    if (pending) {
      return {
        filePath: await pending,
        cacheKey,
        fromCache: true,
      }
    }

    const synthesis = synthesizeToCache(filePath, normalizedText)
    pendingSyntheses.set(cacheKey, synthesis)

    try {
      return {
        filePath: await synthesis,
        cacheKey,
        fromCache: false,
      }
    } finally {
      pendingSyntheses.delete(cacheKey)
    }
  }
}