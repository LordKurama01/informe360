import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { DynamicForm } from '../../src/components/forms/DynamicForm';
import { getFormRunBundle, submitFormRun } from '../../src/services/forms';
import { removeOfflineFormDraft, saveOfflineFormDraft } from '../../src/services/form-offline';
import { createFindingFromNonCompliance, linkedFindingsForRun } from '../../src/services/inspections';
import type { FormRunBundle, HseFormAnswers } from '../../src/types/forms';
import { theme } from '../../src/theme';

export default function FormRunPage() {
  const { runId } = useLocalSearchParams<{ runId: string }>();
  const [bundle, setBundle] = useState<FormRunBundle | null>(null);
  const [answers, setAnswers] = useState<HseFormAnswers>({});
  const [linked, setLinked] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!runId) return;
    try {
      const [next, links] = await Promise.all([getFormRunBundle(runId), linkedFindingsForRun(runId)]);
      setBundle(next);
      setAnswers(next.answers);
      setLinked(Object.fromEntries(links.map(item => [item.field_id, item.finding_id])));
    } catch (error) {
      Alert.alert('Formulario', error instanceof Error ? error.message : 'No se pudo cargar');
    }
  }, [runId]);

  useEffect(() => { void load(); }, [load]);

  const failures = useMemo(() => {
    if (!bundle) return [];
    return bundle.version.schema_json.sections
      .flatMap(section => section.fields)
      .filter(field => field.type === 'compliance' && field.createFindingOnFail === true && answers[field.id] === 'non_compliant')
      .map(field => ({ id: field.id, label: field.label }));
  }, [bundle, answers]);

  async function persistLocal(next: HseFormAnswers) {
    if (!bundle || !runId) return;
    setAnswers(next);
    await saveOfflineFormDraft({ clientRunId: runId, serverRunId: runId, templateVersionId: bundle.version.id, templateId: bundle.template.id, siteId: bundle.run.site_id, answers: next });
  }

  async function submit(next: HseFormAnswers) {
    if (!bundle || !runId) return;
    setBusy(true);
    try {
      await submitFormRun(runId, next);
      await removeOfflineFormDraft(runId);
      await load();
      Alert.alert('Formulario enviado', bundle.template.category === 'inspection' ? 'La inspección quedó registrada. Revisá abajo los ítems No cumple y decidí cuáles deben convertirse en hallazgo.' : 'Las respuestas quedaron registradas y versionadas.');
    } catch (error) {
      await persistLocal(next);
      Alert.alert('Guardado en el teléfono', 'No pudimos enviar ahora. El formulario quedó guardado localmente y no se enviará sin tu confirmación.', [{ text: 'Entendido' }]);
    } finally {
      setBusy(false);
    }
  }

  async function makeFinding(fieldId: string, label: string) {
    if (!runId) return;
    setBusy(true);
    try {
      const findingId = await createFindingFromNonCompliance(runId, fieldId, label);
      setLinked(current => ({ ...current, [fieldId]: findingId }));
      Alert.alert('Hallazgo creado', 'La no conformidad quedó vinculada al sistema de hallazgos.', [{ text: 'Abrir', onPress: () => router.push(`/finding/${findingId}`) }, { text: 'Seguir' }]);
    } catch (error) {
      Alert.alert('Hallazgo', error instanceof Error ? error.message : 'No se pudo crear');
    } finally {
      setBusy(false);
    }
  }

  if (!bundle) return <View style={styles.loading}><Text style={styles.loadingText}>Cargando ejecución…</Text></View>;
  const readOnly = ['submitted', 'reviewed', 'cancelled'].includes(bundle.run.status);
  const statusLabel = bundle.run.status === 'submitted' ? 'ENVIADA' : bundle.run.status === 'reviewed' ? 'REVISADA' : bundle.run.status === 'cancelled' ? 'CANCELADA' : 'EN CURSO';

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.top}><Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>‹ Volver</Text></Pressable><Text style={[styles.status, readOnly && styles.statusLocked]}>{statusLabel}</Text></View>

      <View style={styles.heading}>
        <Text style={styles.kicker}>{bundle.template.category.toUpperCase()} · v{bundle.version.version}</Text>
        <Text style={styles.title}>{bundle.template.name}</Text>
        <Text style={styles.copy}>Iniciado {new Date(bundle.run.started_at).toLocaleString('es-AR')}</Text>
      </View>

      {!readOnly ? <View style={styles.localNote}><View style={styles.localDot}/><Text style={styles.localText}>Tus respuestas se conservan localmente mientras completás el formulario.</Text></View> : null}

      <DynamicForm schema={bundle.version.schema_json} initialAnswers={answers} readOnly={readOnly} submitLabel={busy ? 'Guardando…' : 'Enviar formulario'} onChange={next => { if (!readOnly) void persistLocal(next); }} onSubmit={submit}/>

      {readOnly && bundle.template.category === 'inspection' ? <View style={styles.failures}>
        <View style={styles.failuresHead}><View style={styles.failureIcon}><Text style={styles.failureIconText}>!</Text></View><View style={styles.failureHeadCopy}><Text style={styles.failuresTitle}>No conformidades</Text><Text style={styles.failuresCopy}>Nada se transforma automáticamente en hallazgo. Elegí qué requiere seguimiento formal.</Text></View></View>
        {failures.map(item => <View key={item.id} style={styles.failureRow}>
          <View style={styles.failureCopy}><Text style={styles.failureLabel}>{item.label}</Text><Text style={styles.failureState}>{linked[item.id] ? 'Hallazgo vinculado' : 'Marcado como No cumple'}</Text></View>
          {linked[item.id] ? <Pressable accessibilityRole="button" onPress={() => router.push(`/finding/${linked[item.id]}`)} style={styles.openFinding}><Text style={styles.openFindingText}>Abrir</Text></Pressable> : <Pressable accessibilityRole="button" disabled={busy} onPress={() => void makeFinding(item.id, item.label)} style={styles.makeFinding}><Text style={styles.makeFindingText}>Crear hallazgo</Text></Pressable>}
        </View>)}
        {!failures.length ? <View style={styles.noFailures}><Text style={styles.noFailuresText}>No se registraron ítems “No cumple” configurados para generar hallazgos.</Text></View> : null}
      </View> : null}

      {readOnly ? <View style={styles.locked}><View style={styles.lockedMark}><Text style={styles.lockedMarkText}>✓</Text></View><View style={styles.lockedCopyWrap}><Text style={styles.lockedTitle}>Ejecución cerrada para edición</Text><Text style={styles.lockedCopy}>Las respuestas corresponden a una versión histórica de la plantilla y permanecen auditables.</Text></View></View> : null}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg },
  loadingText: { color: theme.colors.muted, fontWeight: '800' },
  content: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: 88, gap: theme.spacing.lg },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { minHeight: 42, justifyContent: 'center' },
  back: { color: theme.colors.primary, fontWeight: '900' },
  status: { color: theme.colors.primary, backgroundColor: theme.colors.primarySoft, fontSize: 9, fontWeight: '900', letterSpacing: 0.7, paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.radius.pill },
  statusLocked: { color: theme.colors.inkSoft, backgroundColor: theme.colors.surfaceStrong },
  heading: { gap: 3 },
  kicker: { fontSize: 9, fontWeight: '900', color: theme.colors.primary, letterSpacing: 1.2 },
  title: { fontSize: 27, lineHeight: 32, fontWeight: '900', color: theme.colors.ink, letterSpacing: -0.45 },
  copy: { fontSize: 10, color: theme.colors.muted, marginTop: 2 },
  localNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: theme.colors.infoSoft, borderRadius: theme.radius.md, padding: theme.spacing.md },
  localDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.colors.info, marginTop: 5 },
  localText: { flex: 1, color: theme.colors.info, fontSize: 10, lineHeight: 15 },
  failures: { backgroundColor: theme.colors.warningSoft, borderRadius: theme.radius.lg, padding: theme.spacing.lg, gap: theme.spacing.md },
  failuresHead: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'flex-start' },
  failureIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(179,90,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  failureIconText: { color: theme.colors.warning, fontSize: 20, fontWeight: '900' },
  failureHeadCopy: { flex: 1 },
  failuresTitle: { fontSize: 17, fontWeight: '900', color: '#8C4700' },
  failuresCopy: { fontSize: 10, color: theme.colors.warning, marginTop: 2, lineHeight: 15 },
  failureRow: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.md, flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' },
  failureCopy: { flex: 1 },
  failureLabel: { fontSize: 12, lineHeight: 17, fontWeight: '900', color: theme.colors.ink },
  failureState: { fontSize: 9, color: theme.colors.muted, marginTop: 2 },
  makeFinding: { minHeight: 44, backgroundColor: theme.colors.warning, paddingHorizontal: 12, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center' },
  makeFindingText: { color: theme.colors.white, fontSize: 10, fontWeight: '900' },
  openFinding: { minHeight: 44, borderWidth: 1, borderColor: theme.colors.primary, paddingHorizontal: 14, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center' },
  openFindingText: { color: theme.colors.primary, fontSize: 10, fontWeight: '900' },
  noFailures: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#E7BD8F', borderRadius: theme.radius.md, padding: theme.spacing.md },
  noFailuresText: { fontSize: 10, color: '#8C4700', textAlign: 'center', lineHeight: 15 },
  locked: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md, backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radius.lg, padding: theme.spacing.lg },
  lockedMark: { width: 34, height: 34, borderRadius: 11, backgroundColor: theme.colors.successSoft, alignItems: 'center', justifyContent: 'center' },
  lockedMarkText: { color: theme.colors.success, fontWeight: '900' },
  lockedCopyWrap: { flex: 1 },
  lockedTitle: { fontWeight: '900', color: theme.colors.ink, fontSize: 13 },
  lockedCopy: { fontSize: 10, color: theme.colors.muted, marginTop: 3, lineHeight: 15 },
});
