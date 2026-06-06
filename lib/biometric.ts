// RJ-APP/lib/biometric.ts
import * as LocalAuthentication from 'expo-local-authentication';

export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  } catch {
    return false;
  }
}

export async function authenticateWithBiometric(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Romeo & Juliet',
      fallbackLabel: 'Use Passcode',
    });
    return result.success;
  } catch {
    return false;
  }
}
