import { useEffect } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/providers/auth-provider';
import { WorkspaceProvider } from '../src/providers/workspace-provider';
import { SyncProvider } from '../src/providers/sync-provider';

const WEB_HSE_URL = process.env.EXPO_PUBLIC_WEB_APP_URL || 'https://informe360-hse.onrender.com/app/hse';

/** The Expo web export is a mobile QA preview, never the desktop web product. */
function DesktopWebPortal() {
  useEffect(() => {
    if (typeof window !== 'undefined') window.location.replace(WEB_HSE_URL);
  }, []);

  return <View style={styles.portal}>
    <Text style={styles.eyebrow}>INFORME360  /  PLATAFORMAS</Text>
    <Text style={styles.title}>Abriendo el panel web HSE…</Text>
    <Text style={styles.description}>La web de escritorio es independiente de la aplicación móvil nativa.</Text>
    <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(WEB_HSE_URL)} style={styles.button}>
      <Text style={styles.buttonText}>Abrir panel web ›</Text>
    </Pressable>
  </View>;
}

export default function RootLayout() {
  const { width } = useWindowDimensions();

  if (Platform.OS === 'web' && width >= 760) {
    return <DesktopWebPortal />;
  }

  return <SafeAreaProvider><AuthProvider><WorkspaceProvider><SyncProvider><StatusBar style="dark"/><Stack screenOptions={{ headerShown: false }} /></SyncProvider></WorkspaceProvider></AuthProvider></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  portal: { flex: 1, minHeight: 420, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 18, backgroundColor: '#102320' },
  eyebrow: { fontSize: 11, color: '#82DCC4', letterSpacing: 1.4, fontWeight: '900' },
  title: { fontSize: 28, lineHeight: 35, fontWeight: '900', textAlign: 'center', color: '#FFFFFF' },
  description: { fontSize: 15, lineHeight: 23, color: '#B1C8C0', textAlign: 'center', maxWidth: 420 },
  button: { minHeight: 52, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: '#0B806B' },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
