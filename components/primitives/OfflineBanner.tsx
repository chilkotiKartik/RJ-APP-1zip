// RJ-APP/components/primitives/OfflineBanner.tsx
// Slides down from top when device is offline.
import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useRJTheme } from '@/theme/useRJTheme';
import NetInfo from '@react-native-community/netinfo';
import { useState } from 'react';

const BANNER_H = 36;

export function OfflineBanner() {
  const { c, f } = useRJTheme();
  const [offline, setOffline] = useState(false);
  const translateY = useSharedValue(-BANNER_H);

  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      setOffline(state.isConnected === false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    translateY.value = withTiming(
      offline ? 0 : -BANNER_H,
      { duration: 280, easing: Easing.inOut(Easing.ease) },
    );
  }, [offline, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: BANNER_H,
        backgroundColor: c.bgSunken,
        zIndex: 999,
        alignItems: 'center',
        justifyContent: 'center',
      }, style]}
    >
      <Text style={{
        fontFamily: f.mono,
        fontSize: 9,
        letterSpacing: 9 * 0.22,
        color: c.inkMuted,
        textTransform: 'uppercase',
      }}>
        Postmaster unavailable — reconnecting
      </Text>
    </Animated.View>
  );
}
