# Romeo & Juliet — Private Introduction Service

A beautifully crafted mobile app (Expo SDK 53, expo-router v5, TypeScript, Supabase, ElevenLabs voice) for a private, curated romantic introduction service. Letters. Archetypes. Referral-only.

## Architecture

- **Stack**: Expo ~53, expo-router ~5, Supabase, ElevenLabs RN SDK v1.2.3, react-native-reanimated, react-native-svg, expo-image
- **Theme**: `useRJTheme()` → `{ c, f, d }`. Fonts: `f.serif/serifI` = CormorantGaramond, `f.body/bodyI` = EBGaramond, `f.mono` = JetBrainsMono, `f.script` = Caveat
- **Phase flow**: REFERRAL → PROFILE → PENDING_APPROVAL → APPROVED/CHATTING → QUESTIONNAIRE_DONE/WAITING → LETTER_READY → COMPLETE/REJECTED
- **npm install** requires `--legacy-peer-deps` due to @livekit/react-native peer conflict with @livekit/react-native-webrtc versions

## Key Files

- `lib/hooks.ts` — `useStatus` (Realtime + polling fallback), `useMatches`, `otherUserName`, `MatchRow`, `Phase`, `Profile`
- `lib/api.ts` — `redeemReferral`, `saveProfile`, `respondToMatch` (falls back to direct Supabase if web backend unreachable)
- `lib/push.ts` / `lib/push.web.ts` — push notification registration (platform-specific; web is a stub)
- `lib/biometric.ts` / `lib/biometric.web.ts` — biometric auth (platform-specific; web is a stub)
- `theme/preferences.ts` — `usePreferences()` → `{ prefs, loaded, update }` with `dark`, `density`, `biometric` fields
- `app/_layout.tsx` — ErrorBoundary + SplashScreen + OfflineBanner

## Running

The `Start application` workflow runs `expo start --web --port 5000`.

## User Preferences
