import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { clearPendingDraft, loadPendingDraft, type PendingDraft } from '../src/services/drafts';
import { createFindingBundle } from '../src/services/findings';
import { scheduleFindingReminder } from '../src/services/notifications';
import type { Priority, Severity } from '../src/types/hse';
import { theme } from '../src/theme';

const priorityBySeverity: Record<Severity, Priority> = { low: 'low', medium: 'medium', high: 'high', critical: 'urgent' };

function dateAtNoon(daysFromNow: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
}

function parseDate(value: string) {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export default function ReviewDraft() {
  const [pending, setPending] = useState<PendingDraft | null>(null);
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueAt, setDueAt] = useState<string | null>(null);
  const [manualDate, setManualDate] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadPendingDraft().then(value => {
      setPending(value);
      if (value) {
        setPriority(priorityBySeverity[value.draft.severity]);
        setDueAt(value.dueAt);
      }
    });
  }, []);

  const dueLabel = useMemo(() => dueAt ? new Date(dueAt).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' }) : 'Sin vencimiento', [dueAt]);

  if (!pending) return <Screen><Text style={styles.title}>No hay borrador</Text><PrimaryButton title="Volver" onPress={() => router.replace('/(tabs)')}/></Screen>;

  const current = pending;
  const draft = current.draft;
  const update = (key: keyof typeof draft, value: unknown) => setPending(valueCurrent => valueCurrent ? { ...valueCurrent, draft: { ...valueCurrent.draft, [key]: value } } : valueCurrent);

  async function save() {
    if (!current.draft.title.trim()) return Alert.alert('Falta el título', 'Describí brevemente el hallazgo.');
    setBusy(true);
    try {
      const id = await createFindingBundle(current.fieldEntryId, current.draft, dueAt, priority);
      await scheduleFindingReminder(id, current.draft.title, dueAt);
      await clearPendingDraft();
      router.replace(`/finding/${id}`);
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  function applyManualDate() {
    const parsed = parseDate(manualDate);
    if (!parsed) return Alert.alert('Fecha inválida', 'Usá el formato DD/MM/AAAA.');
    setDueAt(parsed);
  }

  return <Screen>
    <Text style={styles.kicker}>REVISIÓN HUMANA · {current.provider.toUpperCase()}</Text>
    <Text style={styles.title}>Confirmá antes de guardar</Text>
    <Text style={styles.intro}>La captura original no se modifica. Corregí cualquier interpretación de la IA antes de convertirla en un hallazgo oficial.</Text>

    <Field label="Título" value={draft.title} onChange={value => update('title', value)}/>
    <Field label="Descripción" value={draft.description || ''} onChange={value => update('description', value)}/>

    <Text style={styles.label}>Severidad</Text>
    <View style={styles.options}>{(['low', 'medium', 'high', 'critical'] as Severity[]).map(value => <Pressable key={value} onPress={() => { update('severity', value); setPriority(priorityBySeverity[value]); }} style={[styles.option, draft.severity === value && styles.optionActive]}><Text style={[styles.optionText, draft.severity === value && styles.optionTextActive]}>{({ low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' } as const)[value]}</Text></Pressable>)}</View>

    <Text style={styles.label}>Prioridad operativa</Text>
    <View style={styles.options}>{(['low', 'medium', 'high', 'urgent'] as Priority[]).map(value => <Pressable key={value} onPress={() => setPriority(value)} style={[styles.option, priority === value && styles.optionActive]}><Text style={[styles.optionText, priority === value && styles.optionTextActive]}>{({ low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente' } as const)[value]}</Text></Pressable>)}</View>

    <Field label="Ubicación" value={draft.location_text || ''} onChange={value => update('location_text', value)}/>
    <Field label="Elemento / equipo" value={draft.element_text || ''} onChange={value => update('element_text', value)}/>
    <Field label="Acción sugerida" value={draft.action || ''} onChange={value => update('action', value)}/>
    <Field label="Responsable" value={draft.responsible_text || ''} onChange={value => update('responsible_text', value)}/>

    <View style={styles.dueBox}>
      <Text style={styles.label}>Vencimiento</Text>
      <Text style={styles.dueText}>{dueLabel}</Text>
      <View style={styles.quickDates}>
        <DateChip label="Hoy" onPress={() => setDueAt(dateAtNoon(0))}/>
        <DateChip label="Mañana" onPress={() => setDueAt(dateAtNoon(1))}/>
        <DateChip label="+7 días" onPress={() => setDueAt(dateAtNoon(7))}/>
        <DateChip label="Sin fecha" onPress={() => setDueAt(null)}/>
      </View>
      <View style={styles.manualDateRow}>
        <TextInput value={manualDate} onChangeText={setManualDate} placeholder="DD/MM/AAAA" keyboardType="numbers-and-punctuation" style={styles.dateInput}/>
        <Pressable onPress={applyManualDate} style={styles.applyDate}><Text style={styles.applyDateText}>Aplicar</Text></Pressable>
      </View>
      <Text style={styles.safety}>Las fechas operativas expresadas por el usuario pueden cargarse acá. Los vencimientos legales/normativos no los decide la IA.</Text>
    </View>

    <PrimaryButton title="Guardar hallazgo" busy={busy} onPress={() => void save()}/>
    <Text style={styles.confidence}>Confianza de interpretación: {Math.round(draft.confidence * 100)}%. La confirmación humana es la fuente final del registro.</Text>
  </Screen>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChange} multiline style={styles.input}/></View>;
}

function DateChip({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.dateChip}><Text style={styles.dateChipText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  kicker: { color: theme.colors.primary, fontWeight: '900', letterSpacing: 1.5, fontSize: 10 }, title: { fontSize: 28, fontWeight: '900', color: theme.colors.ink }, intro: { color: theme.colors.muted, lineHeight: 20 },
  field: { gap: 6 }, label: { color: theme.colors.muted, fontWeight: '800', fontSize: 12 }, input: { backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.line, borderRadius: 13, minHeight: 48, padding: 12, textAlignVertical: 'top', color: theme.colors.ink },
  options: { flexDirection: 'row', gap: 6 }, option: { flex: 1, minHeight: 42, paddingHorizontal: 5, borderRadius: 11, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.line }, optionActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }, optionText: { fontSize: 10, fontWeight: '800', color: theme.colors.muted }, optionTextActive: { color: '#fff' },
  dueBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.line, borderRadius: 16, padding: 14, gap: 10 }, dueText: { fontSize: 17, fontWeight: '900', color: theme.colors.ink }, quickDates: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, dateChip: { backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.line, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999 }, dateChipText: { color: theme.colors.ink, fontWeight: '800', fontSize: 11 }, manualDateRow: { flexDirection: 'row', gap: 8 }, dateInput: { flex: 1, backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.line, borderRadius: 11, paddingHorizontal: 12, minHeight: 44 }, applyDate: { backgroundColor: theme.colors.ink, justifyContent: 'center', paddingHorizontal: 15, borderRadius: 11 }, applyDateText: { color: '#fff', fontWeight: '900' }, safety: { backgroundColor: '#FFF7ED', color: theme.colors.warning, borderRadius: 10, padding: 10, fontSize: 11, lineHeight: 16 },
  confidence: { color: theme.colors.muted, fontSize: 11, textAlign: 'center', lineHeight: 16 },
});
