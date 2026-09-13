import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

type Tone = 'primary' | 'danger' | 'warning' | 'success' | 'info';

const tones: Record<Tone, { ink: string; bg: string }> = {
  primary: { ink: theme.colors.primary, bg: theme.colors.primarySoft },
  danger: { ink: theme.colors.danger, bg: theme.colors.dangerSoft },
  warning: { ink: theme.colors.warning, bg: theme.colors.warningSoft },
  success: { ink: theme.colors.success, bg: theme.colors.successSoft },
  info: { ink: theme.colors.info, bg: theme.colors.infoSoft },
};

export function MetricTile({ label, value, tone = 'primary', onPress }: { label: string; value: number | string; tone?: Tone; onPress?: () => void }) {
  const palette = tones[tone];
  const content = <>
    <View style={[styles.dot, { backgroundColor: palette.ink }]}/>
    <Text style={[styles.value, { color: palette.ink }]}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </>;
  if (onPress) return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.root, { backgroundColor: palette.bg }, pressed && styles.pressed]}>{content}</Pressable>;
  return <View style={[styles.root, { backgroundColor: palette.bg }]}>{content}</View>;
}

const styles = StyleSheet.create({
  root: { minHeight: 98, flex: 1, minWidth: '46%', borderRadius: theme.radius.lg, padding: theme.spacing.lg, justifyContent: 'flex-end' },
  dot: { width: 7, height: 7, borderRadius: 4, marginBottom: theme.spacing.sm },
  value: { fontSize: 28, lineHeight: 30, fontWeight: '900', letterSpacing: -0.6 },
  label: { color: theme.colors.inkSoft, fontSize: 11, fontWeight: '800', marginTop: 2 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
});
