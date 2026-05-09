# Praxis Console — Mobile

> The iOS companion to the Praxis Console at [conduitai.io/app](https://conduitai.io/app).

**Platform:** iOS (Android secondary) · **TestFlight:** build 12+

## What this is

`~/conduit-mobile` was originally a CallFlow AI dialer. As of build 12 it is the
**Praxis Console mobile app** — your nine-employee AI workforce on the phone.

## Tech stack

- **Framework:** Expo SDK 55 / React Native 0.83 / React 19.2
- **Routing:** expo-router (file-based)
- **State:** Zustand (`store/authStore`, `store/themeStore`)
- **Auth & Data:** Supabase (RLS-secured direct reads + cookie-auth chat stream)
- **Streaming:** Server-Sent Events from `POST /api/conduit/chat`
- **Realtime:** Supabase channels for messages + build logs
- **Iconography:** phosphor-react-native (matches the web)
- **Typography:** Fraunces (display) + Inter (body) + JetBrains Mono
- **Animation:** react-native-reanimated 4

## Architecture

```
Mobile (Expo) → Supabase (auth + RLS reads + realtime)
              → conduitai.io /api/conduit/chat (cookie-auth SSE)
              → wss://conduit-voice-worker.up.railway.app (v2 voice)
```

## Surfaces

1. **Home** — workspace dashboard with usage, quick start, recent activity, memory
2. **Chat** — conversations list + streaming detail with employee-aware bubbles
3. **Voice** — fullscreen voice mode (v1 type-to-Atlas; PTT + TTS land in v2)
4. **Builds** — engineering sessions with live realtime logs and deploy links
5. **Team** — nine-employee grid with per-employee profile and dedicated thread

Settings (account, voice prefs, memory, appearance) is reachable from Home.

## Running locally

```bash
npm install
npx expo start
```

Press `i` for iOS Simulator. The app authenticates against the production
Supabase project (`mvuslmfjkkuizixjpkgl`).

## Shipping a build

```bash
eas build --profile production --platform ios
eas submit --profile production --platform ios
```

Bundle id `io.conduitai.app` is preserved from the CallFlow era so the existing
TestFlight thread continues uninterrupted.

## Open work (v2)

- Voice input transcription (PTT → STT) and `tts_chunk` audio playback
- Push notifications wired into `conduit_messages` realtime
- iPad layout (currently `supportsTablet: false`)
- Indigo Praxis app icon + splash artwork (current art is pre-rebrand)

## Author

Luis Garcia · [conduitai.io](https://conduitai.io)
