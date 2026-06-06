// Web stub for biometric auth — expo-local-authentication native modules
// are not available on web. Metro picks this file automatically on web platform.
export async function isBiometricAvailable(): Promise<boolean> {
  return false;
}

export async function authenticateWithBiometric(): Promise<boolean> {
  return false;
}
