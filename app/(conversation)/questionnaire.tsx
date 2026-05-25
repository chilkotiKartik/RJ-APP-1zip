// RJ-APP/app/(conversation)/questionnaire.tsx
// 15-question questionnaire — delegates to the web's /waiting page in a
// WebView so question content + persistence stays in lockstep with web.
// When the user is done and the web routes to a post-questionnaire path,
// we exit back to mobile.
import { WebViewScreen } from '@/components/WebViewScreen';

export default function Questionnaire() {
  return (
    <WebViewScreen
      path="/waiting"
      exitPaths={['/pending', '/match', '/profile', '/']}
    />
  );
}
