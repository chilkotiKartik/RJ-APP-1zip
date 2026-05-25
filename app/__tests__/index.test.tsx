// Phase router behavior. Mocks useStatus and asserts that <Redirect>
// is rendered with the right href for each phase value.
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';

const mockUseStatus = jest.fn();
const mockRedirect = jest.fn(({ href }: { href: string }) => null);

jest.mock('@/lib/hooks', () => ({
  __esModule: true,
  useStatus: (...args: unknown[]) => (mockUseStatus as unknown as (...a: unknown[]) => unknown)(...args),
}));

jest.mock('expo-router', () => ({
  __esModule: true,
  Redirect: (props: { href: string }) => mockRedirect(props),
}));

jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'Svg',
  Svg: 'Svg', Defs: 'Defs', RadialGradient: 'RadialGradient',
  Stop: 'Stop', Path: 'Path', Circle: 'Circle',
}));

jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: (fn: () => unknown) => fn(),
    withRepeat: (v: unknown) => v,
    withTiming: (v: unknown) => v,
    Easing: { inOut: (x: unknown) => x, ease: 'ease' },
  };
});

// Import after mocks are wired
import Index from '../index';

function renderWithTheme() {
  return render(
    <ThemeProvider dark={false} density="comfortable">
      <Index />
    </ThemeProvider>
  );
}

describe('phase router', () => {
  beforeEach(() => {
    mockRedirect.mockClear();
    mockUseStatus.mockReset();
  });

  it('renders splash while loading', () => {
    mockUseStatus.mockReturnValue({ loading: true, phase: 'REFERRAL', profile: null, userId: null });
    renderWithTheme();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('redirects to welcome when no session', () => {
    mockUseStatus.mockReturnValue({ loading: false, phase: 'REFERRAL', profile: null, userId: null });
    renderWithTheme();
    expect(mockRedirect).toHaveBeenCalledWith({ href: '/(auth)/welcome' });
  });

  it('redirects to onboarding profile when session but no profile', () => {
    mockUseStatus.mockReturnValue({ loading: false, phase: 'REFERRAL', profile: null, userId: 'u1' });
    renderWithTheme();
    expect(mockRedirect).toHaveBeenCalledWith({ href: '/(onboarding)/profile' });
  });

  const cases: [string, string][] = [
    ['PENDING_APPROVAL', '/(onboarding)/pending'],
    ['APPROVED', '/(conversation)/voice'],
    ['CHATTING', '/(conversation)/voice'],
    ['QUESTIONNAIRE_DONE', '/(conversation)/waiting'],
    ['WAITING', '/(conversation)/waiting'],
    ['LETTER_READY', '/(letter)/envelope'],
    ['COMPLETE', '/(main)/home'],
    ['REJECTED', '/(auth)/rejected'],
    ['REFERRAL', '/(auth)/referral'],
  ];

  for (const [phase, expected] of cases) {
    it(`redirects ${phase} → ${expected}`, () => {
      mockUseStatus.mockReturnValue({
        loading: false,
        phase,
        profile: { user_id: 'u1', phase, first_name: null, social_handle: null, photo_urls: null, archetype: null, questionnaire_answers: null },
        userId: 'u1',
      });
      renderWithTheme();
      expect(mockRedirect).toHaveBeenCalledWith({ href: expected });
    });
  }

  it('falls through unknown phase to welcome', () => {
    mockUseStatus.mockReturnValue({
      loading: false,
      phase: 'NEW_FUTURE_PHASE',
      profile: { user_id: 'u1', phase: 'NEW_FUTURE_PHASE', first_name: null, social_handle: null, photo_urls: null, archetype: null, questionnaire_answers: null },
      userId: 'u1',
    });
    renderWithTheme();
    expect(mockRedirect).toHaveBeenCalledWith({ href: '/(auth)/welcome' });
  });
});
