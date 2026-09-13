import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FieldHeader } from '../components/FieldHeader';
import { SectionHeader } from '../components/SectionHeader';
import { useWorkspace } from '../providers/workspace-provider';
import { listInspectionTemplates, listRecentInspectionRuns, seedInspectionTemplates, type InspectionRunSummary } from '../services/inspections';
import type { FormTemplateSummary } from '../types/forms';
import { theme } from '../theme';

export function InspectionsScreen({ showBack = false }: { showBack?: boolean }) {
  const { workspace } = useWorkspace();
  const [templates, setTemplates] = useState<FormTemplateSummary[]>([]);
  const [runs, setRuns] = useState<InspectionRunSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      const [templateRows, runRows] = await Promise.all([listInspectionTemplates(workspace), listRecentInspectionRuns(workspace)]);
      setTemplates(templateRows);
      setRuns(runRows);
    } catch (error) {
      Alert.alert('Inspecciones', error instanceof Error ? error.message : 'No se pudieron cargar');
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => { void load(); }, [load]);

  async function seed() {
    if (!workspace) return;
    setSeeding(true);
    try {
      const count = await seedInspectionTemplates(workspace);
      await load();
      Alert.alert('Biblioteca lista', count ? `Se agregaron ${count} checklists operativos.` : 'Los checklists estándar ya estaban disponibles.');
    } catch (error) {
      Alert.alert('Biblioteca', error instanceof Error ? error.message : 'No se pudo preparar');
    } finally {
      setSeeding(false);
    }
  }

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
    <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={load}/>} contentContainerStyle={styles.content}>
      {showBack ? <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>‹ Volver</Text></Pressable> : null}
      <FieldHeader kicker="CAMPO · CONTROL" title="Inspecciones" subtitle="Checklists versionados, evidencia y hallazgos dentro del mismo circuito."/>

      <View style={styles.hero}>
        <View style={styles.heroMark}><Text style={styles.heroMarkText}>✓</Text></View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Inspeccioná sin perder el contexto</Text>
          <Text style={styles.heroText}>Un “No cumple” no crea un hallazgo por su cuenta: vos revisás y decidís.</Text>
        </View>
      </View>

      <SectionHeader title="Biblioteca activa" meta={`${templates.length} checklist${templates.length === 1 ? '' : 's'} disponible${templates.length === 1 ? '' : 's'}`} action={<Pressable disabled={seeding} onPress={() => void seed()} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{seeding ? 'Preparando…' : 'Agregar estándares'}</Text></Pressable>}/>
      <View style={styles.grid}>
        {templates.map(item => <Pressable accessibilityRole="button" key={item.id} onPress={() => router.push(`/forms/${item.id}`)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
          <View style={styles.icon}><Text style={styles.iconText}>✓</Text></View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text numberOfLines={2} style={styles.cardCopy}>{item.description || item.schema.description || 'Checklist HSE'}</Text>
            <Text style={styles.cardMeta}>Versión {item.version} · publicada</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>)}
      </View>

      {!templates.length && !loading ? <View style={styles.empty}>
        <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>＋</Text></View>
        <Text style={styles.emptyTitle}>Prepará la biblioteca de campo</Text>
        <Text style={styles.emptyCopy}>Podés cargar los checklists estándar y empezar a inspeccionar desde este teléfono.</Text>
        <Pressable disabled={seeding} onPress={() => void seed()} style={styles.primary}><Text style={styles.primaryText}>{seeding ? 'Preparando…' : 'Preparar biblioteca inicial'}</Text></Pressable>
      </View> : null}

      <SectionHeader title="Actividad reciente" meta="Continuá una ejecución o revisá lo enviado"/>
      <View style={styles.history}>
        {runs.map(run => <Pressable accessibilityRole="button" key={run.id} onPress={() => router.push(`/form-run/${run.id}`)} style={({ pressed }) => [styles.run, pressed && styles.pressed]}>
          <View style={styles.runCopy}><Text style={styles.runTitle}>{run.templateName}</Text><Text style={styles.runDate}>{new Date(run.started_at).toLocaleString('es-AR')}</Text></View>
          <Text style={[styles.status, run.status === 'submitted' && styles.statusDone]}>{run.status === 'submitted' ? 'ENVIADA' : run.status.replace('_', ' ').toUpperCase()}</Text>
        </Pressable>)}
        {!runs.length ? <View style={styles.noRuns}><Text style={styles.noRunsText}>Todavía no hay inspecciones realizadas.</Text></View> : null}
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: 112, gap: theme.spacing.lg },
  backButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  back: { color: theme.colors.primary, fontWeight: '900' },
  hero: { backgroundColor: theme.colors.dark, borderRadius: theme.radius.xl, padding: theme.spacing.xl, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg },
  heroMark: { width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(94,234,212,0.12)', alignItems: 'center', justifyContent: 'center' },
  heroMarkText: { color: '#5EEAD4', fontSize: 25, fontWeight: '900' },
  heroCopy: { flex: 1, gap: 4 },
  heroTitle: { color: theme.colors.white, fontSize: 17, lineHeight: 22, fontWeight: '900' },
  heroText: { color: '#B8C7CE', fontSize: 12, lineHeight: 17 },
  secondaryAction: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 10 },
  secondaryActionText: { fontSize: 11, fontWeight: '900', color: theme.colors.primary },
  grid: { gap: theme.spacing.sm },
  card: { minHeight: 92, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.lg, padding: theme.spacing.md, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, ...theme.shadow.card },
  icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: theme.colors.successSoft, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 18, fontWeight: '900', color: theme.colors.success },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, lineHeight: 19, fontWeight: '900', color: theme.colors.ink },
  cardCopy: { fontSize: 11, color: theme.colors.muted, marginTop: 2, lineHeight: 16 },
  cardMeta: { fontSize: 10, color: theme.colors.primary, fontWeight: '800', marginTop: 5 },
  chevron: { fontSize: 28, color: '#94A3B8' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.995 }] },
  empty: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.lg, padding: theme.spacing.xxl, alignItems: 'center', gap: theme.spacing.sm },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  emptyIconText: { color: theme.colors.primary, fontSize: 24, fontWeight: '500' },
  emptyTitle: { fontSize: 17, fontWeight: '900', color: theme.colors.ink, textAlign: 'center' },
  emptyCopy: { color: theme.colors.muted, textAlign: 'center', lineHeight: 18 },
  primary: { minHeight: 48, backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.lg, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryText: { color: theme.colors.white, fontWeight: '900' },
  history: { gap: theme.spacing.sm },
  run: { minHeight: 68, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.md, padding: theme.spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.md },
  runCopy: { flex: 1 },
  runTitle: { fontWeight: '900', color: theme.colors.ink, fontSize: 14 },
  runDate: { fontSize: 10, color: theme.colors.muted, marginTop: 3 },
  status: { fontSize: 9, fontWeight: '900', color: theme.colors.warning, backgroundColor: theme.colors.warningSoft, paddingHorizontal: 8, paddingVertical: 5, borderRadius: theme.radius.pill },
  statusDone: { color: theme.colors.success, backgroundColor: theme.colors.successSoft },
  noRuns: { minHeight: 68, borderRadius: theme.radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.line, alignItems: 'center', justifyContent: 'center' },
  noRunsText: { color: theme.colors.muted, fontSize: 12 },
});
