---
name: ReactNativeApplicationEntryPoint fix
description: EAS build fails because prebuild generates MainApplication.kt using a class that doesn't exist in react-native 0.79.7
---

## The Problem
EAS Android build fails at `:app:compileReleaseKotlin` with:
- `Unresolved reference 'ReactNativeApplicationEntryPoint'`
- `Unresolved reference 'loadReactNative'`

`ReactNativeApplicationEntryPoint` does NOT exist anywhere in `react-native 0.79.7` — confirmed by grep returning 0 results across the entire npm package. It was introduced in a later RN version (0.80+). The EAS build server's prebuild templates use a newer template that references this class, causing a classpath mismatch.

**Why:** The EAS `"latest"` build image uses a version of expo-cli whose `MainApplication.kt` template was updated for a future react-native release, but the project pins `react-native: 0.79.7` which doesn't have the class in its Maven AAR.

## The Fix
Config plugin `plugins/withMainApplication.js` that runs during prebuild (`withDangerousMod` on android platform) and overwrites the generated `MainApplication.kt` with the traditional `DefaultReactNativeHost` pattern:

- Uses `com.facebook.react.defaults.DefaultReactNativeHost` (confirmed present in RN 0.79.7)
- Uses `com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost`
- Uses `com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load`
- These are all in the `defaults` package, stable since RN 0.71

Add to `app.json` plugins array: `"./plugins/withMainApplication"`

**How to apply:** Any time react-native version is upgraded, verify the plugin's imports still match what's available. When RN ships `ReactNativeApplicationEntryPoint` (in its Maven AAR), the plugin can be removed and the EAS template will work natively.

## Also set
- `newArchEnabled: false` in app.json (belt-and-suspenders: keeps `BuildConfig.IS_NEW_ARCHITECTURE_ENABLED` = false)
- `resolutions` in package.json alongside `overrides` (fixes yarn on EAS ignoring npm overrides for livekit version pinning)
