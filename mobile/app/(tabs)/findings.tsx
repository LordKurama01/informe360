import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FindingCard } from '../../src/components/FindingCard';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useWorkspace } from '../../src/providers/workspace-provider';
import { createReportFromFindings, listFindings, searchFindings } from '../../src/services/findings';
import type { Finding } from '../../src/types/hse';
import { theme } from '../../src/theme';

type Filter = 'open' | 'overdue' | 'upcoming' | 'critical' | 'closed' | 'all';
const filters: Array<{ key: Filter; label: string }> = [
  { key: 'open', label: 'Abiertos' }, { key: 'overdue', label: 'Vencidos' }, { key: 'upcoming', label: 'Próx. 7 días' }, { key: 'critical', label: 'Críticos' }, { key: 'closed', label: 'Cerrados' }, { key: 'all', label: 'Todos' },
];

function normalizeFilter(value?: string): Filter { return filters.some(item => item.key === value) ? value as Filter : 'open'; }

export default function Findings() {
  const params = useLocalSearchParams<{ filter?: string }>();
  const { workspace } = useWorkspace();
  const [items, setItems] = useState<Finding[]>([]);
  const [filter, setFilter] = useState<Filter>(() => normalizeFilter(params.filter));
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reportBusy, setReportBusy] = useState(false);

  useEffect(() => setFilter(normalizeFilter(params.filter)), [params.filter]);

  const load = useCallback(async () => {
    if (!workspace) return;
    setBusy(true);
    try { setItems(query.trim().length >= 2 ? await searchFindings(workspace, query, true) : await listFindings(workspace)); }
    catch (error) { Alert.alert('Hallazgos', error instanceof Error ? error.message : 'No se pudieron cargar'); }
    finally { setBusy(false); }
  }, [workspace, query]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), query.trim().length ? 280 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  const visible = useMemo(() => {
    const now = Date.now();
    const next7 = now + 7 * 24 * 60 * 60 * 1000;
    if (filter === 'closed') return items.filter(item => item.status === 'closed');
    if (filter === 'overdue') return items.filter(item => !['closed', 'cancelled'].includes(item.status) && Boolean(item.due_at && new Date(item.due_at).getTime() < now));
    if (filter === 'upcoming') return items.filter(item => !['closed', 'cancelled'].includes(item.status) && Boolean(item.due_at && new Date(item.due_at).getTime() >= now && new Date(item.due_at).getTime() <= next7));
    if (filter === 'critical') return items.filter(item => !['closed', 'cancelled'].includes(item.status) && item.severity === 'critical');
    if (filter === 'open') return items.filter(item => !['closed', 'cancelled'].includes(item.status));
    return items;
  }, [items, filter]);

  function toggle(id: string) {
    if (!selecting) return router.push(`/finding/${id}`);
    setSelected(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  function toggleSelectionMode() {
    setSelecting(value => !value);
    setSelected(new Set());
  }

  async function createReport() {
    if (!workspace || !selected.size) return;
    setReportBusy(true);
    try {
      const result = await createReportFromFindings(workspace, [...selected]);
      Alert.alert('Informe creado', `Se vinculó el informe a ${selected.size} hallazgo${selected.size === 1 ? '' : 's'} reales. ID: ${result.reportId.slice(0, 8)}…`);
      setSelecting(false); setSelected(new Set());
    } catch (error) { Alert.alert('Informe', error instanceof Error ? error.message : 'No se pudo crear'); }
    finally { setReportBusy(false); }
  }

  return <View style={styles.safe}><ScrollView refreshControl={<RefreshControl refreshing={busy} onRefresh={load}/>} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><View><Text style={styles.kicker}>MEMORIA OPERATIVA</Text><Text style={styles.title}>Hallazgos</Text></View><Pressable onPress={toggleSelectionMode} style={[styles.reportMode, selecting && styles.reportModeActive]}><Text style={[styles.reportModeText, selecting && styles.reportModeTextActive]}>{selecting ? 'Cancelar' : 'Armar informe'}</Text></Pressable></View>
    <View style={styles.searchWrap}><Text style={styles.searchIcon}>⌕</Text><TextInput value={query} onChangeText={setQuery} placeholder="Código, hallazgo, sector, equipo, responsable…" style={styles.search}/>{query ? <Pressable onPress={() => setQuery('')}><Text style={styles.clear}>×</Text></Pressable> : null}</View>
    <View style={styles.filters}>{filters.map(item => <Pressable key={item.key} onPress={() => setFilter(item.key)} style={[styles.filter, filter === item.key && styles.active]}><Text style={[styles.filterText, filter === item.key && styles.activeText]}>{item.label}</Text></Pressable>)}</View>
    {selecting ? <Text style={styles.selectionHint}>Seleccioná los hallazgos que querés incluir. El informe guarda vínculos; no copia ni altera el registro original.</Text> : null}
    {visible.map(finding => <View key={finding.id} style={selected.has(finding.id) ? styles.selectedWrap : undefined}>{selecting ? <Pressable onPress={() => toggle(finding.id)} style={styles.selectRow}><View style={[styles.checkbox, selected.has(finding.id) && styles.checkboxOn]}><Text style={styles.check}>{selected.has(finding.id) ? '✓' : ''}</Text></View><Text style={styles.selectLabel}>{selected.has(finding.id) ? 'Incluido' : 'Incluir'}</Text></Pressable> : null}<FindingCard finding={finding} onPress={() => toggle(finding.id)}/></View>)}
    {!visible.length && !busy ? <Text style={styles.empty}>{query ? 'No encontramos coincidencias en esta vista.' : 'No hay registros en esta vista.'}</Text> : null}
    {selecting ? <View style={styles.reportFooter}><Text style={styles.selectedCount}>{selected.size} seleccionado{selected.size === 1 ? '' : 's'}</Text><PrimaryButton title={`Crear informe${selected.size ? ` (${selected.size})` : ''}`} busy={reportBusy} onPress={() => void createReport()}/></View> : null}
  </ScrollView></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg }, content: { paddingTop: 58, paddingHorizontal: 18, paddingBottom: 38, gap: 12 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, kicker: { color: theme.colors.primary, fontWeight: '900', letterSpacing: 1.4, fontSize: 10 }, title: { fontSize: 30, fontWeight: '900', color: theme.colors.ink }, reportMode: { backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.line, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12 }, reportModeActive: { backgroundColor: theme.colors.ink, borderColor: theme.colors.ink }, reportModeText: { color: theme.colors.ink, fontSize: 11, fontWeight: '900' }, reportModeTextActive: { color: '#fff' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.line, borderRadius: 15, paddingHorizontal: 12 }, searchIcon: { fontSize: 20, color: theme.colors.muted }, search: { flex: 1, minHeight: 50, paddingHorizontal: 9, color: theme.colors.ink }, clear: { fontSize: 24, color: theme.colors.muted, paddingHorizontal: 4 },
  filters: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' }, filter: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.line }, active: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }, filterText: { fontSize: 11, fontWeight: '800', color: theme.colors.muted }, activeText: { color: '#fff' },
  selectionHint: { backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: 12, borderRadius: 13, lineHeight: 18, fontSize: 11 }, selectedWrap: { borderRadius: 20, padding: 3, backgroundColor: '#DBEAFE' }, selectRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 5 }, checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: '#93C5FD', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }, checkboxOn: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }, check: { color: '#fff', fontSize: 12, fontWeight: '900' }, selectLabel: { color: '#1D4ED8', fontSize: 10, fontWeight: '900' },
  empty: { textAlign: 'center', color: theme.colors.muted, padding: 30 }, reportFooter: { backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.line, borderRadius: 18, padding: 14, gap: 9, marginTop: 4 }, selectedCount: { color: theme.colors.ink, textAlign: 'center', fontWeight: '900' },
});
