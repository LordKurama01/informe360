import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/providers/auth-provider';
import { useWorkspace } from '../src/providers/workspace-provider';

export default function Index() {
  const auth = useAuth();
  const work = useWorkspace();
  if (auth.loading || work.loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>;
  if (!auth.session) return <Redirect href="/login" />;
  if (!work.workspace) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
