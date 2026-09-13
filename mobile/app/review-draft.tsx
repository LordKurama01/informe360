import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { clearPendingDraft, loadPendingDraft, type PendingDraft } from '../src/services/drafts';
import { createFindingBundle } from '../src/services/findings';
import { scheduleFindingReminder } from '../src/services/notifications';
import type { Severity } from '../src/types/hse';
import { theme } from '../src/theme';

export default function ReviewDraft() {
  const [pending, setPending] = useState<PendingDraft | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { void loadPendingDraft().then(setPending); }, []);

  if (!pending) return <Screen><Text style={styles.title}>No hay borrador</Text><PrimaryButton title="Volver" onPress={() => router.replace('/(tabs)')} /></Screen>;
  const d = pending.draft;
  const update = (key: keyof typeof d, value: unknown) => setPending((previous) => previous ? { ...previous, draft: { ...previous.draft, [key]: value } } : previous);

  async function save() {
    const snapshot = pending;
    if (!snapshot) return;
    setBusy(true);
    try {
      const id = await createFindingBundle(snapshot.fieldEntryId, snapshot.draft, snapshot.dueAt);
      await scheduleFindingReminder(id, snapshot.draft.title, snapshot.dueAt);
      await clearPendingDraft();
      router.replace(`/finding/${id}`);
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return <Screen>
    <Text style={styles.kicker}>REVISIÓN · {pending.provider}</Text>
    <Text style={styles.title}>Confirmá antes de guardar</Text>
    <Field label="Título" value={d.title} onChange={(v) => update('title', v)} />
    <Field label="Descripción" value={d.description || ''} onChange={(v) => update('description', v)} />
    <View><Text style={styles.label}>Severidad</Text><View style={styles.severities}>{(['low', 'medium', 'high', 'critical'] as Severity[]).map((severity) => <Pressable key={severity} onPress={() => update('severity', severity)} style={[styles.severity, d.severity === severity && styles.active]}><Text style={[styles.severityText, d.severity === severity && styles.activeText]}>{({ low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' } as const)[severity]}</Text></Pressable>)}</View></View>
    <Field label="Ubicación" value={d.location_text || ''} onChange={(v) => update('location_text', v)} />
    <Field label="Elemento" value={d.element_text || ''} onChange={(v) => update('element_text', v)} />
    <Field label="Acción" value={d.action || ''} onChange={(v) => update('action', v)} />
    <Field label="Responsable" value={d.responsible_text || ''} onChange={(v) => update('responsible_text', v)} />
    {pending.dueAt ? <View style={styles.due}><Text style={styles.label}>Vencimiento expresado por vos</Text><Text style={styles.dueText}>{new Date(pending.dueAt).toLocaleString('es-AR')}</Text></View> : <Text style={styles.warning}>Sin vencimiento. La IA no inventa periodicidades ni fechas legales.</Text>}
    <PrimaryButton title="Guardar hallazgo" busy={busy} onPress={() => void save()} />
    <Text style={styles.confidence}>Confianza IA: {Math.round(d.confidence * 100)}%. Siempre podés corregir antes de guardar.</Text>
  </Screen>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChange} multiline style={styles.input} /></View>;
}

const styles = StyleSheet.create({ kicker: { color: theme.colors.primary, fontWeight: '900', letterSpacing: 1.5, fontSize: 11 }, title: { fontSize: 28, fontWeight: '900', color: theme.colors.ink }, field: { gap: 6 }, label: { color: theme.colors.muted, fontWeight: '700', fontSize: 12 }, input: { backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.line, borderRadius: 13, minHeight: 46, padding: 12, textAlignVertical: 'top' }, severities: { flexDirection: 'row', gap: 6, marginTop: 6 }, severity: { flex: 1, paddingVertical: 10, borderRadius: 11, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.line }, active: { backgroundColor: theme.colors.primary }, severityText: { fontSize: 11, fontWeight: '800', color: theme.colors.muted }, activeText: { color: '#fff' }, due: { backgroundColor: '#ECFDF5', padding: 14, borderRadius: 14 }, dueText: { fontWeight: '900', color: theme.colors.success, marginTop: 4 }, warning: { backgroundColor: '#FFF7ED', color: theme.colors.warning, padding: 14, borderRadius: 14, lineHeight: 20 }, confidence: { color: theme.colors.muted, fontSize: 12, textAlign: 'center' } });
