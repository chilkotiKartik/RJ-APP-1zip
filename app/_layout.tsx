// RJ-APP/app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts as useCormorant,
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';
import {
  EBGaramond_400Regular,
  EBGaramond_400Regular_Italic,
  EBGaramond_500Medium,
} from '@expo-google-fonts/eb-garamond';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { Caveat_400Regular } from '@expo-google-fonts/caveat';
import { View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { RJ_LIGHT, RJ_DARK } from '@/theme/tokens';
import { usePreferences } from '@/theme/preferences';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/primitives/OfflineBanner';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { prefs, loaded: prefsLoaded } = usePreferences();
  const [loaded] = useCormorant({
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    EBGaramond_400Regular,
    EBGaramond_400Regular_Italic,
    EBGaramond_500Medium,
    JetBrainsMono_400Regular,
    Caveat_400Regular,
  });

  const ready = loaded && prefsLoaded;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: RJ_LIGHT.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={RJ_LIGHT.forest} />
      </View>
    );
  }

  const palette = prefs.dark ? RJ_DARK : RJ_LIGHT;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider dark={prefs.dark} density={prefs.density}>
          <StatusBar style={prefs.dark ? 'light' : 'dark'} />
          <OfflineBanner />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: palette.bg },
              animation: 'fade',
            }}
          />
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
