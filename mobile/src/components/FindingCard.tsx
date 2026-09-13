import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import type { Finding } from '../types/hse';

export function FindingCard({ finding, onPress }: { finding: Finding; onPress: () => void }) {
  const overdue = finding.status !== 'closed' && finding.status !== 'cancelled' && Boolean(finding.due_at && new Date(finding.due_at).getTime() < Date.now());
  return <Pressable onPress={onPress} style={styles.card}>
    <View style={styles.row}><Text style={styles.title}>{finding.title}</Text><Text style={[styles.pill, overdue && styles.overdue]}>{overdue ? 'VENCIDO' : finding.status.toUpperCase()}</Text></View>
    <Text style={styles.meta}>{finding.location_text || finding.element_text || finding.category || 'Sin categoría'}</Text>
    <Text style={styles.meta}>{finding.responsible_text ? `Responsable: ${finding.responsible_text}` : 'Sin responsable'}{finding.due_at ? ` · ${new Date(finding.due_at).toLocaleDateString('es-AR')}` : ''}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({ card: { backgroundColor: theme.colors.surface, padding: 16, borderRadius: 16, gap: 8, borderWidth: 1, borderColor: theme.colors.line }, row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' }, title: { flex: 1, color: theme.colors.ink, fontWeight: '800', fontSize: 16 }, pill: { fontSize: 10, fontWeight: '900', color: theme.colors.primary, backgroundColor: '#CCFBF1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }, overdue: { color: theme.colors.danger, backgroundColor: '#FEE2E2' }, meta: { color: theme.colors.muted, fontSize: 13 } });
