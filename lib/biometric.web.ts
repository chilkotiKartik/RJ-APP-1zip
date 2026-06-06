// RJ-APP/lib/biometric.web.ts — web stub (expo-local-authentication not supported on web)
export async function isBiometricAvailable(): Promise<boolean> {
  return false;
}

export async function authenticateWithBiometric(): Promise<boolean> {
  return true;
}
