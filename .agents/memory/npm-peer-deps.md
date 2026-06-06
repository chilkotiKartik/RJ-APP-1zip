---
name: npm legacy peer deps
description: All npm installs in this project require --legacy-peer-deps due to @livekit peer conflict.
---

# npm --legacy-peer-deps required

**Rule:** Always use `npm install --legacy-peer-deps` in this project. Never use `npx expo install` without the `-- --legacy-peer-deps` suffix (though that syntax doesn't work; use npm directly).

**Why:** @elevenlabs/react-native@1.2.3 depends on @livekit/react-native-webrtc@^137.0.2, but @livekit/react-native@2.11.0 requires @livekit/react-native-webrtc@^144.1.0. npm cannot resolve these simultaneously without legacy mode.

**How to apply:** `npm install <package> --legacy-peer-deps`
