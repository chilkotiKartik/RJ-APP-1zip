// RJ-APP/components/WebViewScreen.tsx
// Loads a path on the web app with the mobile user's session attached as
// URL params. The web's AuthGuard reads those params, calls
// supabase.auth.setSession(), and strips them from the URL before any
// cookie-dependent fetch runs.
//
// We detect "user is done with this flow" by watching URL navigation —
// when the WebView lands on a path in `exitPaths`, we close it and bounce
// the mobile root router so the user lands on the right native screen for
// their new phase.
import { useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
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
        // No session — bounce out, root router will send to welcome.
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

  const handleNavChange = (nav: WebViewNavigation) => {
    try {
      const u = new URL(nav.url);
      if (exitPaths.some(p => u.pathname === p || u.pathname.startsWith(`${p}/`))) {
        router.replace('/');
      }
    } catch {
      // ignore parse errors
    }
  };

  const splash = useMemo(() => (
    <View style={[styles.splash, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <ActivityIndicator color={c.forest} />
    </View>
  ), [c.bg, c.forest, insets.top]);

  if (!url) return splash;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <WebView
        source={{ uri: url }}
        style={{ flex: 1, backgroundColor: c.bg }}
        // Voice features (mic, autoplay audio) need these
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        // iOS: don't block mic permission silently
        allowsBackForwardNavigationGestures
        // Persist cookies / localStorage across launches
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
        // Use a desktop-ish UA so the web's mobile-detection still works
        // naturally (it checks viewport, not UA — viewport is correct here).
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
