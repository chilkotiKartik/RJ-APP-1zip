// RJ-APP/components/primitives/ArchetypeStamp.tsx
import { ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { Archetype } from '@/lib/archetypes';
import { useRJTheme } from '@/theme/useRJTheme';

const ASPECT = 431 / 579;

export function ArchetypeStamp({
  archetype, height = 110, color, style,
}: { archetype: Archetype; height?: number; color?: string; style?: ImageStyle }) {
  const { c } = useRJTheme();
  const tintColor = color ?? c.forest;
  return (
    <Image
      source={archetype.image}
      accessibilityLabel={archetype.name}
      tintColor={tintColor}
      style={[{ width: height * ASPECT, height }, style]}
      contentFit="contain"
    />
  );
}
