// RJ-APP/app/(conversation)/voice.tsx
// Voice/chat with Juliet — delegates to the web's /chat page inside a
// WebView so we get real ElevenLabs voice + the same UX as web. When the
// user finishes and the web routes to /waiting or /pending, we exit back
// to the mobile phase router.
import { WebViewScreen } from '@/components/WebViewScreen';

export default function Voice() {
  return (
    <WebViewScreen
      path="/chat"
      exitPaths={['/waiting', '/pending', '/']}
    />
  );
}
