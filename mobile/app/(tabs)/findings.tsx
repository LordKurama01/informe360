import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { FieldHeader } from '../../src/components/FieldHeader';
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

  const action = <Pressable accessibilityRole="button" onPress={toggleSelectionMode} style={[styles.reportMode, selecting && styles.reportModeActive]}><Text style={[styles.reportModeText, selecting && styles.reportModeTextActive]}>{selecting ? 'Cancelar' : 'Informe'}</Text></Pressable>;

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
    <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={busy} onRefresh={load}/>} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <FieldHeader kicker="MEMORIA OPERATIVA" title="Hallazgos" subtitle="Buscá, priorizá y seguí cada observación desde el campo." action={action}/>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput value={query} onChangeText={setQuery} placeholder="Código, sector, equipo, responsable…" placeholderTextColor={theme.colors.muted} style={styles.search}/>
        {query ? <Pressable accessibilityRole="button" onPress={() => setQuery('')} style={styles.clearButton}><Text style={styles.clear}>×</Text></Pressable> : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map(item => <Pressable accessibilityRole="button" key={item.key} onPress={() => setFilter(item.key)} style={[styles.filter, filter === item.key && styles.active]}><Text style={[styles.filterText, filter === item.key && styles.activeText]}>{item.label}</Text></Pressable>)}
      </ScrollView>

      <View style={styles.resultRow}><Text style={styles.resultCount}>{visible.length} resultado{visible.length === 1 ? '' : 's'}</Text>{query.trim().length >= 2 ? <Text style={styles.resultContext}>Búsqueda activa</Text> : null}</View>

      {selecting ? <View style={styles.selectionHint}><View style={styles.selectionMark}><Text style={styles.selectionMarkText}>✓</Text></View><Text style={styles.selectionHintText}>Seleccioná los hallazgos para vincularlos a un informe. El registro original no se modifica.</Text></View> : null}

      <View style={styles.list}>{visible.map(finding => <View key={finding.id} style={selected.has(finding.id) ? styles.selectedWrap : undefined}>
        {selecting ? <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected.has(finding.id) }} onPress={() => toggle(finding.id)} style={styles.selectRow}><View style={[styles.checkbox, selected.has(finding.id) && styles.checkboxOn]}><Text style={styles.check}>{selected.has(finding.id) ? '✓' : ''}</Text></View><Text style={styles.selectLabel}>{selected.has(finding.id) ? 'Incluido en el informe' : 'Incluir en el informe'}</Text></Pressable> : null}
        <FindingCard finding={finding} onPress={() => toggle(finding.id)}/>
      </View>)}</View>

      {!visible.length && !busy ? <View style={styles.empty}><View style={styles.emptyMark}><Text style={styles.emptyMarkText}>⌕</Text></View><Text style={styles.emptyTitle}>{query ? 'Sin coincidencias' : 'No hay hallazgos en esta vista'}</Text><Text style={styles.emptyText}>{query ? 'Probá con otro código, sector, equipo o responsable.' : 'Cambiá el filtro o registrá una nueva observación desde Capturar.'}</Text></View> : null}

      {selecting ? <View style={styles.reportFooter}><Text style={styles.selectedCount}>{selected.size} seleccionado{selected.size === 1 ? '' : 's'}</Text><PrimaryButton title={`Crear informe${selected.size ? ` (${selected.size})` : ''}`} busy={reportBusy} disabled={!selected.size} onPress={() => void createReport()}/></View> : null}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: 112, gap: theme.spacing.md },
  reportMode: { minHeight: 42, minWidth: 68, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, paddingHorizontal: 12, borderRadius: theme.radius.md },
  reportModeActive: { backgroundColor: theme.colors.dark, borderColor: theme.colors.dark },
  reportModeText: { color: theme.colors.ink, fontSize: 11, fontWeight: '900' },
  reportModeTextActive: { color: theme.colors.white },
  searchWrap: { minHeight: 52, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.md },
  searchIcon: { fontSize: 20, color: theme.colors.muted },
  search: { flex: 1, minHeight: 50, paddingHorizontal: 9, color: theme.colors.ink, fontSize: 14 },
  clearButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  clear: { fontSize: 23, color: theme.colors.muted },
  filters: { gap: 7, paddingRight: theme.spacing.lg },
  filter: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 13, borderRadius: theme.radius.pill, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line },
  active: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterText: { fontSize: 11, fontWeight: '800', color: theme.colors.muted },
  activeText: { color: theme.colors.white },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultCount: { color: theme.colors.inkSoft, fontSize: 11, fontWeight: '900' },
  resultContext: { color: theme.colors.primary, fontSize: 10, fontWeight: '800' },
  selectionHint: { flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-start', backgroundColor: theme.colors.infoSoft, padding: theme.spacing.md, borderRadius: theme.radius.md },
  selectionMark: { width: 28, height: 28, borderRadius: 10, backgroundColor: 'rgba(37,87,167,0.1)', alignItems: 'center', justifyContent: 'center' },
  selectionMarkText: { color: theme.colors.info, fontWeight: '900' },
  selectionHintText: { flex: 1, color: theme.colors.info, lineHeight: 17, fontSize: 11 },
  list: { gap: theme.spacing.sm },
  selectedWrap: { borderRadius: theme.radius.lg, padding: 3, backgroundColor: theme.colors.infoSoft },
  selectRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: '#8FA9D5', backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  check: { color: theme.colors.white, fontSize: 12, fontWeight: '900' },
  selectLabel: { color: theme.colors.info, fontSize: 10, fontWeight: '900' },
  empty: { minHeight: 220, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.lg, padding: theme.spacing.xxl },
  emptyMark: { width: 48, height: 48, borderRadius: 16, backgroundColor: theme.colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyMarkText: { color: theme.colors.primary, fontSize: 22 },
  emptyTitle: { color: theme.colors.ink, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: theme.colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 5 },
  reportFooter: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.lg, padding: theme.spacing.md, gap: theme.spacing.sm, marginTop: 4 },
  selectedCount: { color: theme.colors.ink, textAlign: 'center', fontWeight: '900', fontSize: 12 },
});
