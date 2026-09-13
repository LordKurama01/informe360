import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import type { Finding, Priority } from '../types/hse';

const priorityLabel: Record<Priority, string> = { low: 'BAJA', medium: 'MEDIA', high: 'ALTA', urgent: 'URGENTE' };
const priorityTone: Record<Priority, string> = { low: '#64748B', medium: '#2563EB', high: '#D97706', urgent: '#DC2626' };

export function FindingCard({ finding, onPress }: { finding: Finding; onPress: () => void }) {
  const overdue = !['closed', 'cancelled'].includes(finding.status) && Boolean(finding.due_at && new Date(finding.due_at).getTime() < Date.now());
  return <Pressable onPress={onPress} style={styles.card}>
    <View style={styles.topRow}>
      <View style={styles.identity}><Text style={styles.code}>{finding.code}</Text><View style={[styles.priorityDot, { backgroundColor: priorityTone[finding.priority] }]}/><Text style={[styles.priority, { color: priorityTone[finding.priority] }]}>{priorityLabel[finding.priority]}</Text></View>
      <Text style={[styles.status, overdue && styles.overdue]}>{overdue ? 'VENCIDO' : finding.status === 'in_progress' ? 'EN CURSO' : finding.status === 'closed' ? 'CERRADO' : 'ABIERTO'}</Text>
    </View>
    <Text style={styles.title}>{finding.title}</Text>
    <Text style={styles.meta}>{finding.location_text || finding.element_text || finding.category || 'Sin ubicación definida'}</Text>
    <View style={styles.footer}>
      <Text style={styles.footerText}>{finding.responsible_text || 'Sin responsable'}</Text>
      <Text style={styles.footerText}>{finding.due_at ? new Date(finding.due_at).toLocaleDateString('es-AR') : 'Sin vencimiento'}</Text>
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.surface, padding: 16, borderRadius: 18, gap: 8, borderWidth: 1, borderColor: theme.colors.line, shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, identity: { flexDirection: 'row', alignItems: 'center', gap: 6 }, code: { color: theme.colors.ink, fontSize: 11, fontWeight: '900', letterSpacing: 0.4 }, priorityDot: { width: 7, height: 7, borderRadius: 4 }, priority: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  status: { fontSize: 9, fontWeight: '900', color: theme.colors.primary, backgroundColor: '#CCFBF1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }, overdue: { color: theme.colors.danger, backgroundColor: '#FEE2E2' },
  title: { color: theme.colors.ink, fontWeight: '900', fontSize: 16, lineHeight: 21 }, meta: { color: theme.colors.muted, fontSize: 13 }, footer: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, borderTopWidth: 1, borderTopColor: theme.colors.line, paddingTop: 9, marginTop: 2 }, footerText: { color: theme.colors.muted, fontSize: 11, fontWeight: '700' },
});
