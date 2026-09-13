import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export function FieldHeader({ kicker, title, subtitle, action }: { kicker?: string; title: string; subtitle?: string; action?: ReactNode }) {
  return <View style={styles.root}>
    <View style={styles.copy}>
      {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    {action ? <View style={styles.action}>{action}</View> : null}
  </View>;
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.spacing.md },
  copy: { flex: 1, gap: theme.spacing.xs },
  kicker: { color: theme.colors.primary, fontSize: theme.type.micro, fontWeight: '900', letterSpacing: 1.45 },
  title: { color: theme.colors.ink, fontSize: theme.type.title, lineHeight: 32, fontWeight: '900', letterSpacing: -0.4 },
  subtitle: { color: theme.colors.muted, fontSize: 13, lineHeight: 19 },
  action: { paddingTop: 2, alignItems: 'flex-end' },
});
