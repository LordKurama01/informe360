import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export function SectionHeader({ title, meta, action }: { title: string; meta?: string; action?: ReactNode }) {
  return <View style={styles.root}>
    <View style={styles.copy}>
      <Text style={styles.title}>{title}</Text>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </View>
    {action}
  </View>;
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md },
  copy: { flex: 1 },
  title: { color: theme.colors.ink, fontSize: theme.type.section, lineHeight: 23, fontWeight: '900', letterSpacing: -0.2 },
  meta: { color: theme.colors.muted, fontSize: theme.type.small, marginTop: 2 },
});
