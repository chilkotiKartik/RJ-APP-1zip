---
name: ElevenLabs React Native SDK v1.2.3
description: How to correctly use the ElevenLabs conversational AI hook in React Native — provider pattern, hook API, and callback signatures.
---

## Rule
`useConversation` **must** be inside a `<ConversationProvider>`. Split the screen into an inner component + outer export wrapper.

## API
```tsx
import { ConversationProvider, useConversation } from '@elevenlabs/react-native';

// Outer
export default function Voice() {
  return <ConversationProvider><VoiceInner /></ConversationProvider>;
}

// Inner
function VoiceInner() {
  const { startSession, endSession, status, isSpeaking } = useConversation({
    agentId: AGENT_ID,
    onConnect: () => { /* timer start */ },
    onDisconnect: () => { /* navigate away */ },
    onMessage: ({ message, role }) => { /* role === 'agent' for AI speech */ },
    onError: (errMessage: string) => { /* show alert */ },
  });
  // status: "disconnected" | "connecting" | "connected" | "error"
}
```

## Callback types
- `onConnect({ conversationId: string })`
- `onDisconnect(details: DisconnectionDetails)`
- `onMessage({ message: string, role: 'user'|'agent', source: 'user'|'ai' (deprecated), event_id?: number })`
- `onError(message: string, context?: any)`

**Why:** The SDK v1.2.3 switched from a standalone class pattern to a React Context Provider architecture. The old `conversation.startSession()` pattern doesn't work — `useConversation` returns `startSession()` and `endSession()` directly.

**How to apply:** Any screen using ElevenLabs voice must wrap the real screen in `ConversationProvider`. Pass `agentId` to either the hook options or `startSession()`.
