// RJ-APP/app/_layout.tsx
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
import { ThemeProvider } from '@/theme/ThemeProvider';
import { RJ_LIGHT } from '@/theme/tokens';

export default function RootLayout() {
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

  if (!loaded) {
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

  return (
    <SafeAreaProvider>
      <ThemeProvider dark={false} density="comfortable">
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: RJ_LIGHT.bg },
            animation: 'fade',
          }}
        />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
