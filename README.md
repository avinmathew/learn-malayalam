# Aksharam Malayalam SRS

Mobile-friendly Malayalam script practice app with spaced repetition, seeded decks, audio playback, and offline-friendly local caching.

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Persistence: per-deck JSON content files (`data/decks/*.json`), user progress in `data/progress.json`, plus browser localStorage cache
- Audio: Google Cloud Text-to-Speech with on-disk caching in `data/tts-cache`

## Project Structure

```text
learn-malayalam/
├─ apps/
│  ├─ api/
│  │  ├─ src/
│  │  │  ├─ dates.ts
│  │  │  ├─ index.ts
│  │  │  ├─ srs.ts
│  │  │  ├─ store.ts
│  │  │  └─ types.ts
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  └─ web/
│     ├─ public/
│     │  └─ sw.js
│     ├─ src/
│     │  ├─ components/
│     │  ├─ context/
│     │  ├─ lib/
│     │  ├─ pages/
│     │  ├─ App.tsx
│     │  ├─ index.css
│     │  ├─ main.tsx
│     │  └─ types.ts
│     ├─ index.html
│     ├─ package.json
│     └─ vite.config.ts
├─ data/
│  ├─ decks/
│  │  ├─ letter.json
│  │  ├─ phrase-personal-pronouns.json
│  │  ├─ phrase-getting-around.json
│  │  ├─ vocab-greetings.json
│  │  ├─ vocab-colours.json
│  │  ├─ ...
│  │  └─ ...
│  └─ progress.json (generated locally for user scheduling state)
├─ package.json
└─ README.md
```

## Features

- Three deck types: letters, vocabulary, and phrase practice
- Review-first landing screen with deck-level `New`, `Learn`, and `Due` badges
- FSRS-style scheduling with `Again`, `Hard`, `Good`, and `Easy`
- Seed data for Malayalam letters, basic words, and beginner phrases
- Review screen with flip animation, projected next intervals, and keyboard shortcuts (`1-4`, `Space`, `Enter`)
- Google Cloud Malayalam audio playback cached locally after the first synthesis
- Offline-friendly behavior through service worker caching and local state snapshots
- Offline card persistence that can be edited outside the app through the generated data store

## Scheduling Rules

The scheduler lives in both the API and the client fallback implementation.

- The scheduler keeps FSRS-style `difficulty` and `stability` memory state for each card
- `Again` moves the card back into learning with a short reappearance window
- `Hard`, `Good`, and `Easy` increase stability by different amounts based on current difficulty
- Review buttons preview the projected next interval, including short learning delays like `<10m`

## Running Locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start both the API and the Vite app:

   ```bash
   npm run dev
   ```

3. Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Google TTS Setup

The API synthesizes Malayalam audio on demand, stores generated MP3 files under `data/tts-cache`, and reuses the cached file for later requests.

Set one of these credential options in `.env` before starting the API:

```bash
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
```

or:

```bash
GOOGLE_TTS_CREDENTIALS_JSON={"type":"service_account",...}
```

Optional tuning:

```bash
GOOGLE_TTS_LANGUAGE_CODE=ml-IN
GOOGLE_TTS_VOICE_NAME=
GOOGLE_TTS_SPEAKING_RATE=0.9
```

If Google TTS is unavailable or misconfigured, audio playback is unavailable until valid credentials are configured.

## Production Build

Build both apps:

```bash
npm run build
```

After building, start the Express server. It serves the compiled frontend from `apps/web/dist` when present.

```bash
npm run start
```
