import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../theme';

export function PrimaryButton({ title, onPress, busy = false, disabled = false, tone = 'primary' }: { title: string; onPress: () => void; busy?: boolean; disabled?: boolean; tone?: 'primary' | 'danger' | 'neutral' }) {
  const backgroundColor = tone === 'danger' ? theme.colors.danger : tone === 'neutral' ? '#334155' : theme.colors.primary;
  return <Pressable accessibilityRole="button" disabled={busy || disabled} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor }, (pressed || disabled) && styles.dim]}>
    {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>{title}</Text>}
  </Pressable>;
}

const styles = StyleSheet.create({ button: { minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 }, text: { color: '#fff', fontSize: 16, fontWeight: '800' }, dim: { opacity: 0.6 } });
