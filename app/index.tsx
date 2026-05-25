// RJ-APP/app/index.tsx
// Phase-aware root router. Reads useStatus once and redirects to the right
// screen based on session + profile.phase. The default branch sends users
// to welcome so a missing phase value never lands them on a blank screen.
//
// TODO: verify Phase union in lib/hooks.ts matches the real
// profiles_phase_check constraint once dev server runs against real DB.
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useRJTheme } from '@/theme/useRJTheme';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { WaxSeal } from '@/components/primitives/WaxSeal';
import { useStatus } from '@/lib/hooks';

export default function Index() {
  const { c } = useRJTheme();
  const { loading, phase, profile, userId } = useStatus(0);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
        <PaperNoise />
        <WaxSeal size={96} pulse />
      </View>
    );
  }

  if (!userId) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!profile) {
    return <Redirect href="/(onboarding)/profile" />;
  }

  switch (phase) {
    case 'PROFILE':
      return <Redirect href="/(onboarding)/profile" />;
    case 'PENDING_APPROVAL':
      return <Redirect href="/(onboarding)/pending" />;
    case 'APPROVED':
    case 'CHATTING':
      return <Redirect href="/(conversation)/voice" />;
    case 'QUESTIONNAIRE_DONE':
    case 'WAITING':
      return <Redirect href="/(conversation)/waiting" />;
    case 'LETTER_READY':
      return <Redirect href="/(letter)/envelope" />;
    case 'COMPLETE':
      return <Redirect href="/(main)/home" />;
    case 'REJECTED':
      return <Redirect href="/(auth)/rejected" />;
    case 'REFERRAL':
      return <Redirect href="/(auth)/referral" />;
    default:
      return <Redirect href="/(auth)/welcome" />;
  }
}
