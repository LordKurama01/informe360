import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/providers/auth-provider';
import { WorkspaceProvider } from '../src/providers/workspace-provider';
import { SyncProvider } from '../src/providers/sync-provider';

export default function RootLayout() {
  return <SafeAreaProvider><AuthProvider><WorkspaceProvider><SyncProvider><StatusBar style="dark"/><Stack screenOptions={{ headerShown: false }} /></SyncProvider></WorkspaceProvider></AuthProvider></SafeAreaProvider>;
}
