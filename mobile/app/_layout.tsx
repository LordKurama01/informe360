import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/providers/auth-provider';
import { WorkspaceProvider } from '../src/providers/workspace-provider';

export default function RootLayout() {
  return <SafeAreaProvider><AuthProvider><WorkspaceProvider><StatusBar style="dark"/><Stack screenOptions={{ headerShown: false }} /></WorkspaceProvider></AuthProvider></SafeAreaProvider>;
}
