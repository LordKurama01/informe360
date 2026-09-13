import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '../../src/components/Screen';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SectionHeader } from '../../src/components/SectionHeader';
import { useWorkspace } from '../../src/providers/workspace-provider';
import { addEvidence, closeFinding, getFindingBundle, reopenFinding, signedEvidenceUrl } from '../../src/services/findings';
import { compressEvidenceImage } from '../../src/services/media';
import { uploadLocalFile } from '../../src/services/upload';
import type { EvidencePhase, FindingBundle } from '../../src/types/hse';
import { theme } from '../../src/theme';

type PreviewMap = Record<string, string>;
const phaseLabel: Record<EvidencePhase, string> = { initial: 'Evidencia inicial', supporting: 'Seguimiento', closure: 'Evidencia de cierre' };

export default function FindingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { workspace } = useWorkspace();
  const [data, setData] = useState<FindingBundle | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [previews, setPreviews] = useState<PreviewMap>({});

  const load = useCallback(async () => { if (id) setData(await getFindingBundle(id)); }, [id]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!data?.evidence.length) { setPreviews({}); return; }
    let active = true;
    void Promise.all(data.evidence.map(async evidence => {
      if (!evidence.mime_type?.startsWith('image/')) return null;
      try { return [evidence.id, await signedEvidenceUrl(evidence.storage_path)] as const; } catch { return null; }
    })).then(entries => { if (active) setPreviews(Object.fromEntries(entries.filter(Boolean) as Array<readonly [string, string]>)); });
    return () => { active = false; };
  }, [data?.evidence]);

  const grouped = useMemo(() => ({
    initial: data?.evidence.filter(item => item.phase === 'initial') || [],
    supporting: data?.evidence.filter(item => item.phase === 'supporting') || [],
    closure: data?.evidence.filter(item => item.phase === 'closure') || [],
  }), [data?.evidence]);

  async function photo(phase: EvidencePhase) {
    if (!workspace || !data) return;
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return Alert.alert('Cámara', 'Necesitamos permiso para adjuntar evidencia.');
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (result.canceled) return;
    setBusy(true);
    try {
      const compressed = await compressEvidenceImage(result.assets[0].uri);
      const upload = await uploadLocalFile({ bucket: 'hse-evidence', organizationId: workspace.organizationId, entityId: `findings/${data.finding.id}`, uri: compressed.uri, mimeType: 'image/jpeg', prefix: phase });
      await addEvidence(workspace, data.finding.id, upload, 'image/jpeg', phase);
      await load();
    } catch (error) { Alert.alert('Evidencia', error instanceof Error ? error.message : 'No se pudo guardar'); }
    finally { setBusy(false); }
  }

  async function close() {
    if (!data) return;
    if (!comment.trim()) return Alert.alert('Comentario de cierre', 'Describí qué se hizo para resolver el hallazgo.');
    setBusy(true);
    try {
      await closeFinding(data.finding, comment);
      setComment('');
      await load();
    } catch (error) { Alert.alert('Cierre', error instanceof Error ? error.message : 'No se pudo cerrar'); }
    finally { setBusy(false); }
  }

  async function reopen() {
    if (!data) return;
    setBusy(true);
    try { await reopenFinding(data.finding); await load(); }
    catch (error) { Alert.alert('Reapertura', error instanceof Error ? error.message : 'No se pudo reabrir'); }
    finally { setBusy(false); }
  }

  if (!data) return <Screen style={styles.loading}><Text style={styles.loadingText}>Cargando hallazgo…</Text></Screen>;
  const finding = data.finding;
  const overdue = !['closed', 'cancelled'].includes(finding.status) && Boolean(finding.due_at && new Date(finding.due_at).getTime() < Date.now());
  const stateLabel = overdue ? 'VENCIDO' : finding.status === 'closed' ? 'CERRADO' : finding.status === 'in_progress' ? 'EN CURSO' : 'ABIERTO';
  const priorityTone = finding.priority === 'urgent' ? theme.colors.danger : finding.priority === 'high' ? theme.colors.warning : theme.colors.primary;

  return <Screen>
    <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>‹ Volver</Text></Pressable>

    <View style={styles.hero}>
      <View style={styles.identityRow}><Text style={styles.code}>{finding.code}</Text><Text style={[styles.state, overdue && styles.stateDanger, finding.status === 'closed' && styles.stateClosed]}>{stateLabel}</Text></View>
      <Text style={[styles.kicker, { color: priorityTone }]}>{finding.priority.toUpperCase()} · {finding.severity.toUpperCase()}</Text>
      <Text style={styles.title}>{finding.title}</Text>
      {finding.description ? <Text style={styles.description}>{finding.description}</Text> : null}
      <View style={styles.heroMeta}><InfoCompact label="Ubicación" value={finding.location_text}/><InfoCompact label="Responsable" value={finding.responsible_text}/></View>
    </View>

    <View style={styles.info}>
      <Info label="Elemento" value={finding.element_text}/>
      <Info label="Vencimiento" value={finding.due_at ? new Date(finding.due_at).toLocaleString('es-AR') : null} danger={overdue}/>
      <Info label="Detectado" value={new Date(finding.created_at).toLocaleString('es-AR')}/>
    </View>

    <SectionHeader title="Acciones" meta={`${data.actions.length} asociada${data.actions.length === 1 ? '' : 's'}`}/>
    <View style={styles.stack}>{data.actions.map(action => <View key={action.id} style={styles.actionCard}><View style={styles.actionTop}><Text style={styles.actionTitle}>{action.action}</Text><Text style={styles.actionState}>{action.status.toUpperCase()}</Text></View><Text style={styles.meta}>{action.responsible_text || 'Sin responsable'}{action.due_at ? ` · ${new Date(action.due_at).toLocaleDateString('es-AR')}` : ''}</Text></View>)}</View>
    {!data.actions.length ? <EmptyLine text="Sin acciones asociadas."/> : null}

    <EvidenceSection title="Antes / detección" description="Conserva el estado observado originalmente." items={grouped.initial} previews={previews}/>
    {finding.status !== 'closed' ? <PrimaryButton title="Agregar evidencia inicial" tone="neutral" busy={busy} onPress={() => void photo('initial')}/> : null}

    <EvidenceSection title="Seguimiento" description="Evidencias intermedias sin alterar la captura original." items={grouped.supporting} previews={previews}/>
    {finding.status !== 'closed' ? <PrimaryButton title="Agregar seguimiento" tone="neutral" busy={busy} onPress={() => void photo('supporting')}/> : null}

    <EvidenceSection title="Después / cierre" description="Muestra la condición corregida y deja trazabilidad visual." items={grouped.closure} previews={previews}/>
    {finding.status !== 'closed' ? <PrimaryButton title="Agregar evidencia de cierre" tone="neutral" busy={busy} onPress={() => void photo('closure')}/> : null}

    {finding.status !== 'closed' ? <View style={styles.closeBox}>
      <View style={styles.closeHead}><View style={styles.closeMark}><Text style={styles.closeMarkText}>✓</Text></View><View style={styles.closeHeadCopy}><Text style={styles.closeTitle}>Cerrar hallazgo</Text><Text style={styles.helper}>El cierre completa acciones pendientes y cancela alertas futuras.</Text></View></View>
      <TextInput placeholder="Qué se corrigió y cómo quedó" placeholderTextColor={theme.colors.muted} multiline value={comment} onChangeText={setComment} style={styles.input}/>
      <PrimaryButton title="Cerrar hallazgo" tone="danger" busy={busy} onPress={() => void close()}/>
    </View> : <View style={styles.closedBox}>
      <View style={styles.closedHead}><View style={styles.closedMark}><Text style={styles.closedMarkText}>✓</Text></View><Text style={styles.closedTitle}>Hallazgo cerrado</Text></View>
      <Text style={styles.closedText}>{finding.closure_comment || 'Sin comentario de cierre.'}</Text>
      <Text style={styles.closedMeta}>{finding.closed_at ? new Date(finding.closed_at).toLocaleString('es-AR') : ''}</Text>
      <PrimaryButton title="Reabrir hallazgo" tone="neutral" busy={busy} onPress={() => void reopen()}/>
    </View>}

    <SectionHeader title="Trazabilidad" meta="Historial auditable del registro"/>
    <View style={styles.timeline}>{data.events.map((event, index) => <View key={event.id} style={styles.event}>
      <View style={styles.eventRail}><View style={styles.eventDot}/>{index < data.events.length - 1 ? <View style={styles.eventLine}/> : null}</View>
      <View style={styles.eventBody}><Text style={styles.eventType}>{event.event_type === 'created' ? 'Creado' : event.event_type === 'status_changed' ? 'Cambio de estado' : 'Actualizado'}</Text><Text style={styles.meta}>{new Date(event.created_at).toLocaleString('es-AR')}{event.from_status ? ` · ${event.from_status} → ${event.to_status}` : ''}</Text>{event.note ? <Text style={styles.eventNote}>{event.note}</Text> : null}</View>
    </View>)}</View>
  </Screen>;
}

function EvidenceSection({ title, description, items, previews }: { title: string; description: string; items: FindingBundle['evidence']; previews: PreviewMap }) {
  return <View style={styles.evidenceSection}><SectionHeader title={title} meta={description}/>{items.length ? <View style={styles.gallery}>{items.map(item => <View key={item.id} style={styles.evidenceCard}>{previews[item.id] ? <Image source={{ uri: previews[item.id] }} style={styles.image}/> : <View style={styles.fileFallback}><Text style={styles.fileIcon}>▣</Text></View>}<View style={styles.fileCopy}><Text numberOfLines={1} style={styles.fileName}>{item.file_name}</Text><Text style={styles.meta}>{phaseLabel[item.phase]} · {new Date(item.created_at).toLocaleDateString('es-AR')}</Text></View></View>)}</View> : <EmptyLine text="Sin evidencia en esta etapa."/>}</View>;
}

function Info({ label, value, danger = false }: { label: string; value: string | null; danger?: boolean }) { return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={[styles.infoValue, danger && styles.infoDanger]}>{value || '—'}</Text></View>; }
function InfoCompact({ label, value }: { label: string; value: string | null }) { return <View style={styles.infoCompact}><Text style={styles.infoCompactLabel}>{label}</Text><Text numberOfLines={1} style={styles.infoCompactValue}>{value || '—'}</Text></View>; }
function EmptyLine({ text }: { text: string }) { return <View style={styles.emptyLine}><Text style={styles.emptyLineText}>{text}</Text></View>; }

const styles = StyleSheet.create({
  loading: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: theme.colors.muted, fontWeight: '800' },
  backButton: { alignSelf: 'flex-start', minHeight: 42, justifyContent: 'center' },
  back: { color: theme.colors.primary, fontWeight: '900' },
  hero: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.xl, borderWidth: 1, borderColor: theme.colors.line, padding: theme.spacing.xl, gap: 7, ...theme.shadow.card },
  identityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { color: theme.colors.inkSoft, fontWeight: '900', fontSize: 10, letterSpacing: 0.7 },
  state: { color: theme.colors.primary, backgroundColor: theme.colors.primarySoft, fontWeight: '900', fontSize: 9, paddingHorizontal: 9, paddingVertical: 5, borderRadius: theme.radius.pill },
  stateDanger: { color: theme.colors.danger, backgroundColor: theme.colors.dangerSoft },
  stateClosed: { color: theme.colors.success, backgroundColor: theme.colors.successSoft },
  kicker: { fontWeight: '900', letterSpacing: 1.1, fontSize: 9 },
  title: { fontSize: 28, lineHeight: 33, fontWeight: '900', color: theme.colors.ink, letterSpacing: -0.5 },
  description: { fontSize: 13, lineHeight: 19, color: theme.colors.inkSoft },
  heroMeta: { flexDirection: 'row', gap: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.line, paddingTop: theme.spacing.md, marginTop: 3 },
  infoCompact: { flex: 1, minWidth: 0 },
  infoCompactLabel: { color: theme.colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  infoCompactValue: { color: theme.colors.ink, fontSize: 11, fontWeight: '800', marginTop: 2 },
  info: { backgroundColor: theme.colors.surfaceMuted, padding: theme.spacing.md, borderRadius: theme.radius.lg, gap: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 },
  infoLabel: { color: theme.colors.muted, fontSize: 10, fontWeight: '800' },
  infoValue: { flex: 1, textAlign: 'right', fontWeight: '800', color: theme.colors.ink, fontSize: 11 },
  infoDanger: { color: theme.colors.danger },
  stack: { gap: theme.spacing.sm },
  actionCard: { backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.line },
  actionTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  actionTitle: { flex: 1, fontWeight: '900', color: theme.colors.ink, fontSize: 13, lineHeight: 18 },
  actionState: { color: theme.colors.primary, fontSize: 8, fontWeight: '900' },
  meta: { color: theme.colors.muted, fontSize: 9, lineHeight: 14 },
  emptyLine: { minHeight: 52, borderRadius: theme.radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.line, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.md },
  emptyLineText: { color: theme.colors.muted, fontSize: 10 },
  evidenceSection: { gap: theme.spacing.sm },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  evidenceCard: { width: '48.5%', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.md, overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 1.25, backgroundColor: theme.colors.surfaceStrong },
  fileFallback: { width: '100%', aspectRatio: 1.25, backgroundColor: theme.colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  fileIcon: { fontSize: 27, color: theme.colors.muted },
  fileCopy: { padding: 9, gap: 2 },
  fileName: { color: theme.colors.ink, fontWeight: '800', fontSize: 10 },
  closeBox: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: '#F0CBC8', padding: theme.spacing.lg, gap: theme.spacing.md },
  closeHead: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'flex-start' },
  closeMark: { width: 38, height: 38, borderRadius: 13, backgroundColor: theme.colors.dangerSoft, alignItems: 'center', justifyContent: 'center' },
  closeMarkText: { color: theme.colors.danger, fontWeight: '900' },
  closeHeadCopy: { flex: 1 },
  closeTitle: { color: theme.colors.ink, fontSize: 17, fontWeight: '900' },
  helper: { color: theme.colors.muted, fontSize: 10, lineHeight: 15, marginTop: 2 },
  input: { minHeight: 100, backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.md, padding: theme.spacing.md, textAlignVertical: 'top', color: theme.colors.ink },
  closedBox: { backgroundColor: theme.colors.successSoft, borderRadius: theme.radius.lg, padding: theme.spacing.lg, gap: theme.spacing.sm },
  closedHead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  closedMark: { width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(21,115,71,0.1)', alignItems: 'center', justifyContent: 'center' },
  closedMarkText: { color: theme.colors.success, fontWeight: '900' },
  closedTitle: { color: theme.colors.success, fontWeight: '900', fontSize: 16 },
  closedText: { color: '#285B43', lineHeight: 18, fontSize: 11 },
  closedMeta: { color: theme.colors.success, fontSize: 9 },
  timeline: { gap: 0 },
  event: { flexDirection: 'row', gap: theme.spacing.md, minHeight: 58 },
  eventRail: { width: 12, alignItems: 'center' },
  eventDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: theme.colors.primary, marginTop: 5 },
  eventLine: { flex: 1, width: 1.5, backgroundColor: theme.colors.line, marginTop: 3 },
  eventBody: { flex: 1, paddingBottom: theme.spacing.md },
  eventType: { fontWeight: '900', color: theme.colors.ink, fontSize: 12 },
  eventNote: { color: theme.colors.inkSoft, marginTop: 4, fontSize: 10, lineHeight: 15 },
});
