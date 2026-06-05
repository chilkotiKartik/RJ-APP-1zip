---
name: Expo web Animated sequence stall
description: Animated.sequence stalls on web when useNativeDriver falls back to JS. Use parallel with delays instead.
---

## Rule
Never use `Animated.sequence` for entrance animations — it can stall on web preview because the JS fallback doesn't always chain correctly. Use `Animated.parallel` with `delay` on each timing instead.

## Pattern
```tsx
// BAD — sequence stalls on web
Animated.sequence([
  Animated.timing(a, { toValue: 1, duration: 600, useNativeDriver: true }),
  Animated.timing(b, { toValue: 1, duration: 500, useNativeDriver: true }),
]).start();

// GOOD — parallel with delays, always runs
Animated.parallel([
  Animated.timing(a, { toValue: 1, duration: 600, useNativeDriver: true }),
  Animated.timing(b, { toValue: 1, duration: 500, delay: 300, useNativeDriver: true }),
]).start();
```

**Why:** On web, `useNativeDriver: true` falls back to JS-based animation (the native animated module is missing). The sequence handoff between stages can fail silently, leaving later stages stuck at their initial value (opacity 0).

**How to apply:** Any multi-stage entrance animation should use `Animated.parallel` with staggered `delay` values.
