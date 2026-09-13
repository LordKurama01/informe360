import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { FieldHeader } from '../src/components/FieldHeader';
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

  if (!pending) return <Screen style={styles.emptyRoot}><View style={styles.emptyMark}><Text style={styles.emptyMarkText}>✓</Text></View><Text style={styles.emptyTitle}>No hay borrador pendiente</Text><Text style={styles.emptyCopy}>Volvé al campo y registrá una nueva observación.</Text><PrimaryButton title="Volver al inicio" onPress={() => router.replace('/(tabs)')}/></Screen>;

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

  const confidencePct = Math.round(draft.confidence * 100);

  return <Screen>
    <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>‹ Volver</Text></Pressable>
    <FieldHeader kicker={`REVISIÓN HUMANA · ${current.provider.toUpperCase()}`} title="Confirmá antes de guardar" subtitle="La IA estructura la captura. Vos decidís qué queda en el registro oficial."/>

    <View style={styles.confidenceCard}>
      <View style={styles.confidenceMark}><Text style={styles.confidenceMarkText}>{confidencePct}</Text></View>
      <View style={styles.confidenceCopy}><Text style={styles.confidenceTitle}>Confianza de interpretación</Text><Text style={styles.confidenceText}>Revisá especialmente ubicación, responsable, criticidad y vencimiento.</Text></View>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Qué pasó</Text>
      <Field label="Título" value={draft.title} onChange={value => update('title', value)}/>
      <Field label="Descripción" value={draft.description || ''} onChange={value => update('description', value)} multiline/>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Riesgo y prioridad</Text>
      <ChoiceGroup label="Severidad" options={[['low','Baja'],['medium','Media'],['high','Alta'],['critical','Crítica']]} value={draft.severity} onChange={value => { update('severity', value as Severity); setPriority(priorityBySeverity[value as Severity]); }}/>
      <ChoiceGroup label="Prioridad operativa" options={[['low','Baja'],['medium','Media'],['high','Alta'],['urgent','Urgente']]} value={priority} onChange={value => setPriority(value as Priority)}/>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Contexto operativo</Text>
      <Field label="Ubicación" value={draft.location_text || ''} onChange={value => update('location_text', value)}/>
      <Field label="Elemento / equipo" value={draft.element_text || ''} onChange={value => update('element_text', value)}/>
      <Field label="Acción sugerida" value={draft.action || ''} onChange={value => update('action', value)} multiline/>
      <Field label="Responsable" value={draft.responsible_text || ''} onChange={value => update('responsible_text', value)}/>
    </View>

    <View style={styles.section}>
      <View style={styles.dueHeader}><View><Text style={styles.sectionTitle}>Vencimiento</Text><Text style={styles.dueText}>{dueLabel}</Text></View><View style={styles.calendarMark}><Text style={styles.calendarMarkText}>D</Text></View></View>
      <View style={styles.quickDates}>
        <DateChip label="Hoy" onPress={() => setDueAt(dateAtNoon(0))}/>
        <DateChip label="Mañana" onPress={() => setDueAt(dateAtNoon(1))}/>
        <DateChip label="+7 días" onPress={() => setDueAt(dateAtNoon(7))}/>
        <DateChip label="Sin fecha" onPress={() => setDueAt(null)}/>
      </View>
      <View style={styles.manualDateRow}>
        <TextInput value={manualDate} onChangeText={setManualDate} placeholder="DD/MM/AAAA" placeholderTextColor={theme.colors.muted} keyboardType="numbers-and-punctuation" style={styles.dateInput}/>
        <Pressable accessibilityRole="button" onPress={applyManualDate} style={styles.applyDate}><Text style={styles.applyDateText}>Aplicar</Text></Pressable>
      </View>
      <View style={styles.safety}><View style={styles.safetyMark}><Text style={styles.safetyMarkText}>!</Text></View><Text style={styles.safetyText}>Las fechas operativas expresadas por el usuario pueden cargarse acá. Los vencimientos legales/normativos no los decide la IA.</Text></View>
    </View>

    <PrimaryButton title="Guardar hallazgo" busy={busy} onPress={() => void save()}/>
    <Text style={styles.sourceNote}>La confirmación humana es la fuente final del registro.</Text>
  </Screen>;
}

function Field({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChange} multiline={multiline} placeholderTextColor={theme.colors.muted} style={[styles.input, multiline && styles.inputMultiline]}/></View>;
}

function ChoiceGroup({ label, options, value, onChange }: { label: string; options: Array<[string,string]>; value: string; onChange: (value: string) => void }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><View style={styles.options}>{options.map(([key, text]) => <Pressable accessibilityRole="button" key={key} onPress={() => onChange(key)} style={[styles.option, value === key && styles.optionActive]}><Text style={[styles.optionText, value === key && styles.optionTextActive]}>{text}</Text></Pressable>)}</View></View>;
}

function DateChip({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.dateChip}><Text style={styles.dateChipText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  backButton: { alignSelf: 'flex-start', minHeight: 42, justifyContent: 'center' },
  back: { color: theme.colors.primary, fontWeight: '900' },
  emptyRoot: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: theme.spacing.xl },
  emptyMark: { width: 56, height: 56, borderRadius: 18, backgroundColor: theme.colors.successSoft, alignItems: 'center', justifyContent: 'center' },
  emptyMarkText: { color: theme.colors.success, fontSize: 24, fontWeight: '900' },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: theme.colors.ink, textAlign: 'center' },
  emptyCopy: { color: theme.colors.muted, textAlign: 'center', lineHeight: 18 },
  confidenceCard: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center', backgroundColor: theme.colors.infoSoft, borderRadius: theme.radius.lg, padding: theme.spacing.md },
  confidenceMark: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(37,87,167,0.1)', alignItems: 'center', justifyContent: 'center' },
  confidenceMarkText: { color: theme.colors.info, fontWeight: '900', fontSize: 16 },
  confidenceCopy: { flex: 1 },
  confidenceTitle: { color: theme.colors.info, fontSize: 12, fontWeight: '900' },
  confidenceText: { color: '#4B6FAF', fontSize: 10, lineHeight: 15, marginTop: 2 },
  section: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.lg, padding: theme.spacing.lg, gap: theme.spacing.md, ...theme.shadow.card },
  sectionTitle: { color: theme.colors.ink, fontSize: 17, fontWeight: '900' },
  field: { gap: 6 },
  label: { color: theme.colors.inkSoft, fontWeight: '900', fontSize: 11 },
  input: { backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.md, minHeight: 50, paddingHorizontal: theme.spacing.md, paddingVertical: 12, color: theme.colors.ink, fontSize: 14 },
  inputMultiline: { minHeight: 92, textAlignVertical: 'top' },
  options: { flexDirection: 'row', gap: 6 },
  option: { flex: 1, minHeight: 48, paddingHorizontal: 4, borderRadius: theme.radius.md, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.line },
  optionActive: { backgroundColor: theme.colors.dark, borderColor: theme.colors.dark },
  optionText: { fontSize: 10, fontWeight: '800', color: theme.colors.muted },
  optionTextActive: { color: theme.colors.white },
  dueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dueText: { fontSize: 16, fontWeight: '900', color: theme.colors.primary, marginTop: 3 },
  calendarMark: { width: 38, height: 38, borderRadius: 13, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  calendarMarkText: { color: theme.colors.primary, fontWeight: '900' },
  quickDates: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  dateChip: { minHeight: 40, backgroundColor: theme.colors.surfaceMuted, borderWidth: 1, borderColor: theme.colors.line, paddingHorizontal: 12, borderRadius: theme.radius.pill, alignItems: 'center', justifyContent: 'center' },
  dateChipText: { color: theme.colors.ink, fontWeight: '800', fontSize: 10 },
  manualDateRow: { flexDirection: 'row', gap: 8 },
  dateInput: { flex: 1, backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.md, minHeight: 48, color: theme.colors.ink },
  applyDate: { backgroundColor: theme.colors.dark, justifyContent: 'center', paddingHorizontal: 16, borderRadius: theme.radius.md },
  applyDateText: { color: theme.colors.white, fontWeight: '900', fontSize: 11 },
  safety: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: theme.colors.warningSoft, borderRadius: theme.radius.md, padding: theme.spacing.md },
  safetyMark: { width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(179,90,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  safetyMarkText: { color: theme.colors.warning, fontWeight: '900' },
  safetyText: { flex: 1, color: theme.colors.warning, fontSize: 10, lineHeight: 15 },
  sourceNote: { color: theme.colors.muted, fontSize: 9, textAlign: 'center', lineHeight: 14 },
});
