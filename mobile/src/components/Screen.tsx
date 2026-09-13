import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';

export function Screen({ children, scroll = true, style }: PropsWithChildren<{ scroll?: boolean; style?: ViewStyle }>) {
  const content = <View style={[styles.content, style]}>{children}</View>;
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>{scroll ? <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>{content}</ScrollView> : content}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  scroll: { flexGrow: 1 },
  content: { flex: 1, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: 104, gap: theme.spacing.md },
});
