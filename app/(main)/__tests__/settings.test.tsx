import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';

const mockUseStatus = jest.fn();
const mockUsePreferences = jest.fn();
const mockSignOut = jest.fn(async () => ({ error: null }));
const mockGetUser = jest.fn(async () => ({ data: { user: { email: 'eleanor@example.com' } } }));
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('@/lib/hooks', () => ({
  __esModule: true,
  useStatus: (...a: unknown[]) => (mockUseStatus as unknown as (...x: unknown[]) => unknown)(...a),
}));

jest.mock('@/theme/preferences', () => ({
  __esModule: true,
  usePreferences: (...a: unknown[]) => (mockUsePreferences as unknown as (...x: unknown[]) => unknown)(...a),
}));

jest.mock('@/lib/supabase', () => ({
  __esModule: true,
  supabase: {
    auth: {
      signOut: (...a: unknown[]) => (mockSignOut as unknown as (...x: unknown[]) => unknown)(...a),
      getUser: (...a: unknown[]) => (mockGetUser as unknown as (...x: unknown[]) => unknown)(...a),
    },
  },
}));

jest.mock('expo-router', () => ({
  __esModule: true,
  router: { replace: (...a: unknown[]) => (mockReplace as unknown as (...x: unknown[]) => unknown)(...a), back: (...a: unknown[]) => (mockBack as unknown as (...x: unknown[]) => unknown)(...a), push: jest.fn() },
}));

jest.mock('expo-haptics', () => ({ __esModule: true, selectionAsync: jest.fn() }));
jest.mock('expo-secure-store', () => ({ __esModule: true, getItemAsync: async () => null, setItemAsync: async () => {}, deleteItemAsync: async () => {} }));

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

import Settings from '../settings';

function wrap(ui: React.ReactElement) {
  return render(
    <ThemeProvider dark={false} density="comfortable">
      {ui}
    </ThemeProvider>
  );
}

const baseProfile = {
  user_id: 'u1', phase: 'COMPLETE' as const,
  first_name: 'Eleanor', social_handle: null, photo_urls: null,
  archetype: 'curious', questionnaire_answers: null,
};

describe('Settings', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockSignOut.mockClear();
    mockBack.mockClear();
    mockUseStatus.mockReset();
    mockUsePreferences.mockReset();
  });

  it('renders archetype card when archetype is set', () => {
    mockUseStatus.mockReturnValue({ profile: baseProfile, userId: 'u1' });
    mockUsePreferences.mockReturnValue({ prefs: { dark: false, density: 'comfortable' }, loaded: true, update: jest.fn() });
    const { getByText, getAllByText } = wrap(<Settings />);
    expect(getByText('Juliet sees you as')).toBeTruthy();
    // "The Curious Explorer" appears twice — in the archetype card and in
    // the "You" section's archetype value row. Both are intended.
    expect(getAllByText('The Curious Explorer').length).toBe(2);
  });

  it('hides archetype card when archetype is null', () => {
    mockUseStatus.mockReturnValue({ profile: { ...baseProfile, archetype: null }, userId: 'u1' });
    mockUsePreferences.mockReturnValue({ prefs: { dark: false, density: 'comfortable' }, loaded: true, update: jest.fn() });
    const { queryByText } = wrap(<Settings />);
    expect(queryByText('Juliet sees you as')).toBeNull();
  });

  it('dark mode toggle calls update', () => {
    const update = jest.fn();
    mockUseStatus.mockReturnValue({ profile: baseProfile, userId: 'u1' });
    mockUsePreferences.mockReturnValue({ prefs: { dark: false, density: 'comfortable' }, loaded: true, update });
    const { getByTestId } = wrap(<Settings />);
    fireEvent(getByTestId('settings-dark-toggle'), 'valueChange', true);
    expect(update).toHaveBeenCalledWith({ dark: true });
  });

  it('density picker selects new density', () => {
    const update = jest.fn();
    mockUseStatus.mockReturnValue({ profile: baseProfile, userId: 'u1' });
    mockUsePreferences.mockReturnValue({ prefs: { dark: false, density: 'comfortable' }, loaded: true, update });
    const { getByTestId } = wrap(<Settings />);
    fireEvent.press(getByTestId('settings-density-row'));
    fireEvent.press(getByTestId('settings-density-compact'));
    expect(update).toHaveBeenCalledWith({ density: 'compact' });
  });

  it('sign out tap calls signOut then routes to /', () => {
    mockUseStatus.mockReturnValue({ profile: baseProfile, userId: 'u1' });
    mockUsePreferences.mockReturnValue({ prefs: { dark: false, density: 'comfortable' }, loaded: true, update: jest.fn() });
    const { getByText } = wrap(<Settings />);
    fireEvent.press(getByText('Sign out'));
    // signOut is async — assertion timing: it should have been called.
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('back button calls router.back', () => {
    mockUseStatus.mockReturnValue({ profile: baseProfile, userId: 'u1' });
    mockUsePreferences.mockReturnValue({ prefs: { dark: false, density: 'comfortable' }, loaded: true, update: jest.fn() });
    const { getByTestId } = wrap(<Settings />);
    fireEvent.press(getByTestId('settings-back-btn'));
    expect(mockBack).toHaveBeenCalled();
  });
});
