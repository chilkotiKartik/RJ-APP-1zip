// RJ-APP/components/WebViewScreen.tsx
// Loads a path on the web app with the mobile user's session attached as
// URL params. The web's AuthGuard reads those params, calls
// supabase.auth.setSession(), and strips them from the URL before any
// cookie-dependent fetch runs.
//
// Platform split:
//   native (iOS/Android) → react-native-webview
//   web (Expo Web)       → plain HTML iframe (RN WebView throws on web)
//
// We detect "user is done with this flow" by watching URL navigation —
// when the WebView lands on a path in `exitPaths`, we close it and bounce
// the mobile root router so the user lands on the right native screen for
// their new phase.
import { useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useRJTheme } from '@/theme/useRJTheme';

const WEB_BASE = process.env.EXPO_PUBLIC_WEB_BASE ?? 'http://localhost:3000';

type Props = {
  path: string;
  // When the embedded web navigates to any of these paths, treat the flow
  // as complete and route the mobile user via the phase router.
  exitPaths: string[];
};

export function WebViewScreen({ path, exitPaths }: Props) {
  const { c } = useRJTheme();
  const insets = useSafeAreaInsets();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session) {
        router.replace('/');
        return;
      }
      const qs = new URLSearchParams({
        mobile_session: session.access_token,
        refresh: session.refresh_token,
      }).toString();
      setUrl(`${WEB_BASE}${path}?${qs}`);
    })();
    return () => { cancelled = true; };
  }, [path]);

  const splash = useMemo(() => (
    <View style={[styles.splash, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <ActivityIndicator color={c.forest} />
    </View>
  ), [c.bg, c.forest, insets.top]);

  if (!url) return splash;

  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
        <iframe
          src={url}
          allow="microphone; autoplay; clipboard-read; clipboard-write"
          onLoad={(e: { currentTarget: HTMLIFrameElement }) => {
            // Detect navigation to exit paths. Cross-origin iframes block
            // direct location reads, but here we share an origin (the web
            // dev server), so contentWindow.location.pathname is readable.
            try {
              const iframeUrl = e.currentTarget.contentWindow?.location.pathname;
              if (iframeUrl && exitPaths.some(p => iframeUrl === p || iframeUrl.startsWith(`${p}/`))) {
                router.replace('/');
              }
            } catch {
              // ignore cross-origin read failures
            }
          }}
          style={{
            flex: 1, width: '100%', height: '100%', border: 'none',
            background: c.bg,
          } as React.CSSProperties}
        />
      </View>
    );
  }

  // Native: load react-native-webview lazily so the web bundle doesn't
  // try to resolve it.
  const { WebView } = require('react-native-webview');
  type WebViewNavEvent = { url: string };
  const handleNavChange = (nav: WebViewNavEvent) => {
    try {
      const u = new URL(nav.url);
      if (exitPaths.some(p => u.pathname === p || u.pathname.startsWith(`${p}/`))) {
        router.replace('/');
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <WebView
        source={{ uri: url }}
        style={{ flex: 1, backgroundColor: c.bg }}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsBackForwardNavigationGestures
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
        onNavigationStateChange={handleNavChange}
        renderLoading={() => splash}
        startInLoadingState
      />
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
});
