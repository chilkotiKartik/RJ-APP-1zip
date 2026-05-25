import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';

const mockUseStatus = jest.fn();
const mockUseMatches = jest.fn();
const mockPush = jest.fn();

jest.mock('@/lib/hooks', () => ({
  __esModule: true,
  useStatus: (...a: unknown[]) => (mockUseStatus as unknown as (...x: unknown[]) => unknown)(...a),
  useMatches: (...a: unknown[]) => (mockUseMatches as unknown as (...x: unknown[]) => unknown)(...a),
  otherUserName: (m: { user_a: string; profile_a: { first_name: string } | null; profile_b: { first_name: string } | null }, uid: string) => {
    const other = m.user_a === uid ? m.profile_b : m.profile_a;
    return other?.first_name ?? 'Someone';
  },
}));

jest.mock('expo-router', () => ({
  __esModule: true,
  router: { push: (...a: unknown[]) => (mockPush as unknown as (...x: unknown[]) => unknown)(...a), replace: jest.fn(), back: jest.fn() },
}));

jest.mock('expo-haptics', () => ({ __esModule: true, selectionAsync: jest.fn() }));

jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'Svg',
  Svg: 'Svg', Defs: 'Defs', RadialGradient: 'RadialGradient',
  Stop: 'Stop', Path: 'Path', Circle: 'Circle',
}));

jest.mock('react-native-safe-area-context', () => ({
  __esModule: true,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import Home from '../home';

function wrap(ui: React.ReactElement) {
  return render(
    <ThemeProvider dark={false} density="comfortable">
      {ui}
    </ThemeProvider>
  );
}

const profile = {
  user_id: 'u1', phase: 'COMPLETE' as const, first_name: 'Eleanor',
  social_handle: null, photo_urls: null, archetype: 'curious',
  questionnaire_answers: null,
};

describe('Home', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseStatus.mockReset();
    mockUseMatches.mockReset();
  });

  it('renders empty state when no matches', () => {
    mockUseStatus.mockReturnValue({ phase: 'COMPLETE', profile, userId: 'u1' });
    mockUseMatches.mockReturnValue({ matches: [], loading: false, error: null });
    const { getByText } = wrap(<Home />);
    expect(getByText('Your first letter will arrive soon.')).toBeTruthy();
  });

  it('renders most recent letter when match exists', () => {
    mockUseStatus.mockReturnValue({ phase: 'COMPLETE', profile, userId: 'u1' });
    mockUseMatches.mockReturnValue({
      matches: [{
        id: 'match-abc-1234',
        user_a: 'u1', user_b: 'u2', status: 'ACTIVE',
        a_response: null, b_response: null,
        created_at: new Date().toISOString(),
        profile_a: null, profile_b: { first_name: 'James', archetype: 'slow' },
      }],
      loading: false,
      error: null,
    });
    const { getByTestId, getByText } = wrap(<Home />);
    expect(getByTestId('home-most-recent-card')).toBeTruthy();
    expect(getByText('Dear Eleanor,')).toBeTruthy();
  });

  it('falls back to "Someone" when matched profile is null', () => {
    mockUseStatus.mockReturnValue({ phase: 'COMPLETE', profile, userId: 'u1' });
    mockUseMatches.mockReturnValue({
      matches: [
        { id: 'm1', user_a: 'u1', user_b: 'u2', status: 'ACTIVE', a_response: null, b_response: null, created_at: new Date().toISOString(), profile_a: null, profile_b: null },
        { id: 'm2', user_a: 'u1', user_b: 'u3', status: 'ACTIVE', a_response: null, b_response: null, created_at: new Date(Date.now() - 7 * 86400_000).toISOString(), profile_a: null, profile_b: null },
      ],
      loading: false,
      error: null,
    });
    const { getByTestId } = wrap(<Home />);
    expect(getByTestId('home-earlier-0')).toBeTruthy();
  });

  it('cog button navigates to settings', () => {
    mockUseStatus.mockReturnValue({ phase: 'COMPLETE', profile, userId: 'u1' });
    mockUseMatches.mockReturnValue({ matches: [], loading: false, error: null });
    const { getByTestId } = wrap(<Home />);
    fireEvent.press(getByTestId('home-settings-btn'));
    expect(mockPush).toHaveBeenCalledWith('/(main)/settings');
  });

  it('shows Speak to Juliet only when phase is COMPLETE', () => {
    mockUseStatus.mockReturnValue({ phase: 'LETTER_READY', profile, userId: 'u1' });
    mockUseMatches.mockReturnValue({ matches: [], loading: false, error: null });
    const { queryByTestId } = wrap(<Home />);
    expect(queryByTestId('home-speak-juliet')).toBeNull();
  });
});
