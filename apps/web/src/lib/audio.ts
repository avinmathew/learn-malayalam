function getSpeechSynthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null
  }

  return window.speechSynthesis
}

async function getVoices(speech: SpeechSynthesis): Promise<SpeechSynthesisVoice[]> {
  const existingVoices = speech.getVoices()

  if (existingVoices.length > 0) {
    return existingVoices
  }

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      resolve(speech.getVoices())
    }, 250)

    speech.addEventListener(
      'voiceschanged',
      () => {
        window.clearTimeout(timeout)
        resolve(speech.getVoices())
      },
      { once: true },
    )
  })
}

let activeAudio: HTMLAudioElement | null = null

function stopActiveAudio() {
  if (!activeAudio) {
    return
  }

  activeAudio.pause()
  activeAudio.currentTime = 0
  activeAudio = null
}

export async function playRemoteAudio(src: string): Promise<boolean> {
  if (typeof Audio === 'undefined') {
    return false
  }

  getSpeechSynthesis()?.cancel()
  stopActiveAudio()

  const audio = new Audio(src)
  activeAudio = audio

  return new Promise((resolve) => {
    const finish = (result: boolean) => {
      if (activeAudio === audio) {
        activeAudio = null
      }

      audio.onended = null
      audio.onerror = null
      resolve(result)
    }

    audio.onended = () => finish(true)
    audio.onerror = () => finish(false)
    void audio.play().catch(() => finish(false))
  })
}

export async function speakText(text: string, fallbackText?: string): Promise<boolean> {
  const speech = getSpeechSynthesis()

  if (!speech) {
    return false
  }

  const voices = await getVoices(speech)
  const malayalamVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith('ml'))
  const fallbackVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith('en'))

  const utterance = new SpeechSynthesisUtterance(malayalamVoice ? text : fallbackText || text)
  utterance.lang = malayalamVoice?.lang ?? fallbackVoice?.lang ?? 'en-US'
  utterance.voice = malayalamVoice ?? fallbackVoice ?? null
  utterance.rate = malayalamVoice ? 0.88 : 0.95
  utterance.pitch = 1

  speech.cancel()

  return new Promise((resolve) => {
    utterance.onend = () => resolve(true)
    utterance.onerror = () => resolve(false)
    speech.speak(utterance)
  })
}
