---
name: expo-notifications web stub
description: expo-notifications v0.31.x has no web implementation for several modules; creating a .web.ts stub is the fix.
---

# expo-notifications web stub

**Rule:** When importing `expo-notifications` (or any native-only package) in a file used on web, create a platform-specific `.web.ts` sibling file that exports the same API as no-ops.

**Why:** expo-notifications 0.31.x exports modules like `cancelAllScheduledNotificationsAsync` that have no `.web.js` file. Metro bundler on web cannot resolve them, causing a hard bundler crash.

**How to apply:** Create `lib/push.web.ts` alongside `lib/push.ts`. Metro's platform-specific resolution automatically picks `.web.ts` when bundling for web, and `.ts` for native. No metro.config changes needed.
