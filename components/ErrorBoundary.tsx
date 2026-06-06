// RJ-APP/components/ErrorBoundary.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.warn('[ErrorBoundary]', error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    try { router.replace('/'); } catch { /* ignore */ }
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.root}>
        <View style={styles.divider} />
        <Text style={styles.heading}>Something went wrong.</Text>
        <Text style={styles.sub}>
          Our postmaster has been notified. The correspondence will resume shortly.
        </Text>
        <View style={styles.divider} />
        <Pressable style={styles.btn} onPress={this.reset}>
          <Text style={styles.btnText}>Return to start</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FBF2E3',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  divider: {
    width: 48,
    height: 1,
    backgroundColor: '#B89766',
    marginVertical: 24,
  },
  heading: {
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    fontSize: 26,
    color: '#2E2E2E',
    textAlign: 'center',
  },
  sub: {
    fontFamily: 'EBGaramond_400Regular_Italic',
    fontSize: 16,
    color: '#7A7A6E',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
    marginTop: 12,
  },
  btn: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#4E5B45',
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  btnText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 2,
    color: '#4E5B45',
    textTransform: 'uppercase',
  },
});
