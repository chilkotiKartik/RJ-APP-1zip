---
name: EAS build livekit peer dep fix
description: How to permanently fix the @livekit peer dep conflict that breaks npm ci on EAS build servers
---

## The Problem
EAS build servers run `npm ci` (strict mode). The project has `@elevenlabs/react-native@1.2.3` which peer-requires `@livekit/react-native@^2.9.2` AND `@livekit/react-native-webrtc@^137.0.2`. npm resolves `@livekit/react-native` to the latest `2.11.0`, which peer-requires `@livekit/react-native-webrtc@^144.x` — conflicting with the `^137.x` already in the tree.

**Why:** `npm ci` enforces peer deps strictly. The conflict makes npm ci exit non-zero → node_modules incomplete → `expo config` fails to resolve plugins → "Failed to resolve plugin for module expo-notifications" error, even if expo-notifications is not in the plugins array.

**Symptom chain:**
1. `npm ci` fails (peer dep conflict)
2. node_modules empty/incomplete
3. `expo config --json --full --type public` exits 1
4. EAS reports: "Failed to resolve plugin for module expo-notifications. Do you have node modules installed?"

## The Fix
Add both packages as **explicit direct dependencies** at the exact versions that don't conflict, AND add `overrides` to pin them throughout the transitive tree:

```json
"dependencies": {
  "@livekit/react-native": "2.9.8",
  "@livekit/react-native-webrtc": "137.0.3",
  ...
},
"overrides": {
  "@livekit/react-native": "2.9.8",
  "@livekit/react-native-webrtc": "137.0.3"
}
```

**Why:** `@livekit/react-native@2.9.8` peer-requires `@livekit/react-native-webrtc@^137.0.1`, which is satisfied by `137.0.3`. Both elevenlabs peer deps are satisfied. No conflict → `npm ci` succeeds without any flags.

**How to apply:** After changing package.json, run `npm install --legacy-peer-deps` to regenerate package-lock.json. Verify with `npm ci --dry-run` — must exit 0 with zero ERESOLVE errors. Also keep `.npmrc` with `legacy-peer-deps=true` and `eas.json` env `NPM_CONFIG_LEGACY_PEER_DEPS=true` as belt-and-suspenders.

## Other learnings
- EAS "Rebuild" button reuses the same old git snapshot — always trigger a fresh `eas build` from the terminal.
- `expo-updates` config plugin can crash `expo config` on EAS; remove it until OTA updates are explicitly needed.
- Removing a plugin from `app.json` plugins array is not enough if npm ci fails — expo can't find ANY plugins without node_modules.
