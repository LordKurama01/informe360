import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../theme';

export function PrimaryButton({ title, onPress, busy = false, disabled = false, tone = 'primary' }: { title: string; onPress: () => void; busy?: boolean; disabled?: boolean; tone?: 'primary' | 'danger' | 'neutral' }) {
  const backgroundColor = tone === 'danger' ? theme.colors.danger : tone === 'neutral' ? theme.colors.dark : theme.colors.primary;
  return <Pressable accessibilityRole="button" disabled={busy || disabled} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor }, pressed && styles.pressed, disabled && styles.disabled]}>
    {busy ? <ActivityIndicator color={theme.colors.white}/> : <Text style={styles.text}>{title}</Text>}
  </Pressable>;
}

const styles = StyleSheet.create({
  button: { minHeight: 54, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.xl, ...theme.shadow.card },
  text: { color: theme.colors.white, fontSize: 15, lineHeight: 20, fontWeight: '900', letterSpacing: 0.1 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.48 },
});
