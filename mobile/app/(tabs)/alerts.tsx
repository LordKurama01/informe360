import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FieldHeader } from '../../src/components/FieldHeader';
import { useWorkspace } from '../../src/providers/workspace-provider';
import { listPendingReminders } from '../../src/services/findings';
import { theme } from '../../src/theme';

type ReminderFinding = { title: string; code: string };
type ReminderRow = { id: string; scheduled_for: string; status: string; finding_id: string | null; findings: ReminderFinding | null };
type RawReminderRow = Omit<ReminderRow, 'findings'> & { findings: ReminderFinding | ReminderFinding[] | null };

export default function Alerts() {
  const { workspace } = useWorkspace();
  const [items, setItems] = useState<ReminderRow[]>([]);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (!workspace) return;
    setBusy(true);
    try {
      const raw = await listPendingReminders(workspace) as unknown as RawReminderRow[];
      setItems(raw.map(item => ({ ...item, findings: Array.isArray(item.findings) ? item.findings[0] || null : item.findings })));
    } finally {
      setBusy(false);
    }
  }, [workspace]);
  useEffect(() => { void load(); }, [load]);

  const grouped = useMemo(() => {
    const now = Date.now();
    const day = 86400000;
    return {
      overdue: items.filter(item => new Date(item.scheduled_for).getTime() < now),
      today: items.filter(item => { const time = new Date(item.scheduled_for).getTime(); return time >= now && time < now + day; }),
      later: items.filter(item => new Date(item.scheduled_for).getTime() >= now + day),
    };
  }, [items]);

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
    <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={busy} onRefresh={load}/>} contentContainerStyle={styles.content}>
      <FieldHeader kicker="SEGUIMIENTO" title="Alertas" subtitle="Qué necesita atención ahora y qué se acerca."/>

      {items.length ? <View style={styles.summary}>
        <Summary value={grouped.overdue.length} label="Vencidas" tone="danger"/>
        <Summary value={grouped.today.length} label="Hoy" tone="warning"/>
        <Summary value={grouped.later.length} label="Próximas" tone="primary"/>
      </View> : null}

      <AlertGroup title="Vencidas" description="Atención prioritaria" items={grouped.overdue} danger/>
      <AlertGroup title="Hoy" description="Seguimientos programados para hoy" items={grouped.today}/>
      <AlertGroup title="Próximas" description="Lo que viene después" items={grouped.later}/>

      {!items.length && !busy ? <View style={styles.empty}>
        <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>✓</Text></View>
        <Text style={styles.emptyTitle}>Todo al día</Text>
        <Text style={styles.emptyCopy}>No hay vencimientos operativos esperando atención.</Text>
      </View> : null}

      <Text style={styles.sourceNote}>La fecha guardada en Informe360 es la fuente de verdad. La notificación es sólo el canal de aviso.</Text>
    </ScrollView>
  </SafeAreaView>;
}

function Summary({ value, label, tone }: { value: number; label: string; tone: 'danger' | 'warning' | 'primary' }) {
  const palette = tone === 'danger' ? { ink: theme.colors.danger, bg: theme.colors.dangerSoft } : tone === 'warning' ? { ink: theme.colors.warning, bg: theme.colors.warningSoft } : { ink: theme.colors.primary, bg: theme.colors.primarySoft };
  return <View style={[styles.summaryItem, { backgroundColor: palette.bg }]}><Text style={[styles.summaryValue, { color: palette.ink }]}>{value}</Text><Text style={styles.summaryLabel}>{label}</Text></View>;
}

function AlertGroup({ title, description, items, danger = false }: { title: string; description: string; items: ReminderRow[]; danger?: boolean }) {
  if (!items.length) return null;
  return <View style={styles.group}>
    <View><Text style={[styles.section, danger && styles.sectionDanger]}>{title} · {items.length}</Text><Text style={styles.sectionMeta}>{description}</Text></View>
    {items.map(item => <Pressable accessibilityRole="button" key={item.id} disabled={!item.finding_id} onPress={() => item.finding_id && router.push(`/finding/${item.finding_id}`)} style={({ pressed }) => [styles.card, danger && styles.cardDanger, pressed && styles.pressed]}>
      <View style={[styles.cardMark, danger ? styles.cardMarkDanger : styles.cardMarkNormal]}><Text style={[styles.cardMarkText, danger && styles.cardMarkTextDanger]}>{danger ? '!' : '•'}</Text></View>
      <View style={styles.cardBody}>
        <View style={styles.row}><Text style={styles.code}>{item.findings?.code || 'HSE'}</Text><Text style={[styles.date, danger && styles.dateDanger]}>{new Date(item.scheduled_for).toLocaleString('es-AR')}</Text></View>
        <Text style={styles.cardTitle}>{item.findings?.title || 'Hallazgo'}</Text>
        <Text style={styles.open}>Abrir seguimiento →</Text>
      </View>
    </Pressable>)}
  </View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: 112, gap: theme.spacing.lg },
  summary: { flexDirection: 'row', gap: theme.spacing.sm },
  summaryItem: { flex: 1, minHeight: 78, borderRadius: theme.radius.md, padding: theme.spacing.md, justifyContent: 'flex-end' },
  summaryValue: { fontSize: 24, fontWeight: '900', lineHeight: 26 },
  summaryLabel: { color: theme.colors.inkSoft, fontSize: 10, fontWeight: '800', marginTop: 2 },
  group: { gap: theme.spacing.sm },
  section: { fontWeight: '900', color: theme.colors.ink, fontSize: 17 },
  sectionDanger: { color: theme.colors.danger },
  sectionMeta: { color: theme.colors.muted, fontSize: 10, marginTop: 2 },
  card: { minHeight: 92, backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.line, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, ...theme.shadow.card },
  cardDanger: { borderColor: '#F3C5C1', backgroundColor: '#FFFDFC' },
  cardMark: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardMarkNormal: { backgroundColor: theme.colors.primarySoft },
  cardMarkDanger: { backgroundColor: theme.colors.dangerSoft },
  cardMarkText: { color: theme.colors.primary, fontSize: 20, fontWeight: '900' },
  cardMarkTextDanger: { color: theme.colors.danger },
  cardBody: { flex: 1, gap: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  code: { fontWeight: '900', fontSize: 9, color: theme.colors.primary, letterSpacing: 0.5 },
  cardTitle: { fontWeight: '900', color: theme.colors.ink, fontSize: 14, lineHeight: 19 },
  date: { color: theme.colors.warning, fontSize: 9, fontWeight: '800' },
  dateDanger: { color: theme.colors.danger },
  open: { color: theme.colors.primary, fontWeight: '900', fontSize: 10, marginTop: 2 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.995 }] },
  empty: { minHeight: 250, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.lg, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xxl },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: theme.colors.successSoft, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.sm },
  emptyIconText: { color: theme.colors.success, fontSize: 26, fontWeight: '900' },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: theme.colors.ink },
  emptyCopy: { color: theme.colors.muted, lineHeight: 18, textAlign: 'center', fontSize: 12, marginTop: 4 },
  sourceNote: { color: theme.colors.muted, fontSize: 9, lineHeight: 14, textAlign: 'center', paddingHorizontal: theme.spacing.lg },
});
