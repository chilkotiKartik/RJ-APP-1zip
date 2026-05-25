import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';

const mockSignOut = jest.fn(async () => ({ error: null }));
const mockReplace = jest.fn();

jest.mock('@/lib/supabase', () => ({
  __esModule: true,
  supabase: { auth: { signOut: (...a: unknown[]) => (mockSignOut as unknown as (...x: unknown[]) => unknown)(...a) } },
}));

jest.mock('expo-router', () => ({
  __esModule: true,
  router: { replace: (...a: unknown[]) => (mockReplace as unknown as (...x: unknown[]) => unknown)(...a), back: jest.fn(), push: jest.fn() },
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

import Rejected from '../rejected';

describe('Rejected screen', () => {
  beforeEach(() => {
    mockSignOut.mockClear();
    mockReplace.mockClear();
  });

  it('renders the regret copy', () => {
    const { getByText } = render(
      <ThemeProvider dark={false} density="comfortable">
        <Rejected />
      </ThemeProvider>
    );
    expect(getByText(/The room isn['’]t open to you/)).toBeTruthy();
  });

  it('Sign out button calls supabase.auth.signOut', () => {
    const { getByText } = render(
      <ThemeProvider dark={false} density="comfortable">
        <Rejected />
      </ThemeProvider>
    );
    fireEvent.press(getByText('Sign out'));
    expect(mockSignOut).toHaveBeenCalled();
  });
});
