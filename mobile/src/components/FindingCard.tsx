import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import type { Finding, Priority } from '../types/hse';

const priorityLabel: Record<Priority, string> = { low: 'BAJA', medium: 'MEDIA', high: 'ALTA', urgent: 'URGENTE' };
const priorityTone: Record<Priority, string> = { low: theme.colors.muted, medium: theme.colors.info, high: theme.colors.warning, urgent: theme.colors.danger };

export function FindingCard({ finding, onPress }: { finding: Finding; onPress: () => void }) {
  const overdue = !['closed', 'cancelled'].includes(finding.status) && Boolean(finding.due_at && new Date(finding.due_at).getTime() < Date.now());
  const status = overdue ? 'VENCIDO' : finding.status === 'in_progress' ? 'EN CURSO' : finding.status === 'closed' ? 'CERRADO' : 'ABIERTO';
  const statusTone = overdue ? theme.colors.danger : finding.status === 'closed' ? theme.colors.success : theme.colors.primary;
  const statusBg = overdue ? theme.colors.dangerSoft : finding.status === 'closed' ? theme.colors.successSoft : theme.colors.primarySoft;
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
    <View style={[styles.riskBar, { backgroundColor: priorityTone[finding.priority] }]}/>
    <View style={styles.body}>
      <View style={styles.topRow}>
        <View style={styles.identity}><Text style={styles.code}>{finding.code}</Text><Text style={[styles.priority, { color: priorityTone[finding.priority] }]}>{priorityLabel[finding.priority]}</Text></View>
        <Text style={[styles.status, { color: statusTone, backgroundColor: statusBg }]}>{status}</Text>
      </View>
      <Text style={styles.title}>{finding.title}</Text>
      <Text numberOfLines={1} style={styles.meta}>{finding.location_text || finding.element_text || finding.category || 'Sin ubicación definida'}</Text>
      <View style={styles.footer}>
        <View style={styles.footerItem}><Text style={styles.footerKey}>RESP.</Text><Text numberOfLines={1} style={styles.footerText}>{finding.responsible_text || 'Sin asignar'}</Text></View>
        <View style={[styles.footerItem, styles.footerRight]}><Text style={styles.footerKey}>VENCE</Text><Text style={[styles.footerText, overdue && styles.footerDanger]}>{finding.due_at ? new Date(finding.due_at).toLocaleDateString('es-AR') : 'Sin fecha'}</Text></View>
      </View>
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', overflow: 'hidden', backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.line, ...theme.shadow.card },
  riskBar: { width: 5 },
  body: { flex: 1, padding: theme.spacing.lg, gap: 7 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.995 }] },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.sm },
  identity: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  code: { color: theme.colors.inkSoft, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  priority: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  status: { fontSize: 9, fontWeight: '900', paddingHorizontal: 9, paddingVertical: 5, borderRadius: theme.radius.pill },
  title: { color: theme.colors.ink, fontWeight: '900', fontSize: 16, lineHeight: 21 },
  meta: { color: theme.colors.muted, fontSize: 12, lineHeight: 17 },
  footer: { flexDirection: 'row', gap: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.line, paddingTop: theme.spacing.sm, marginTop: 2 },
  footerItem: { flex: 1, gap: 2 },
  footerRight: { alignItems: 'flex-end' },
  footerKey: { color: theme.colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  footerText: { color: theme.colors.inkSoft, fontSize: 11, fontWeight: '800' },
  footerDanger: { color: theme.colors.danger },
});
