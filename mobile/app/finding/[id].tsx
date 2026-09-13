import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '../../src/components/Screen';
import { PrimaryButton } from '../../src/components/PrimaryButton';
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

  if (!data) return <Screen><Text>Cargando…</Text></Screen>;
  const finding = data.finding;
  const overdue = !['closed', 'cancelled'].includes(finding.status) && Boolean(finding.due_at && new Date(finding.due_at).getTime() < Date.now());

  return <Screen>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Volver</Text></Pressable>
    <View style={styles.identityRow}><Text style={styles.code}>{finding.code}</Text><Text style={[styles.state, overdue && styles.stateDanger]}>{overdue ? 'VENCIDO' : finding.status === 'closed' ? 'CERRADO' : finding.status === 'in_progress' ? 'EN CURSO' : 'ABIERTO'}</Text></View>
    <Text style={styles.kicker}>{finding.priority.toUpperCase()} · {finding.severity.toUpperCase()}</Text>
    <Text style={styles.title}>{finding.title}</Text>
    {finding.description ? <Text style={styles.description}>{finding.description}</Text> : null}

    <View style={styles.info}>
      <Info label="Ubicación" value={finding.location_text}/><Info label="Elemento" value={finding.element_text}/><Info label="Responsable" value={finding.responsible_text}/><Info label="Vencimiento" value={finding.due_at ? new Date(finding.due_at).toLocaleString('es-AR') : null}/><Info label="Detectado" value={new Date(finding.created_at).toLocaleString('es-AR')}/>
    </View>

    <Text style={styles.section}>Acciones</Text>
    {data.actions.map(action => <View key={action.id} style={styles.card}><View style={styles.cardTop}><Text style={styles.cardTitle}>{action.action}</Text><Text style={styles.actionState}>{action.status.toUpperCase()}</Text></View><Text style={styles.meta}>{action.responsible_text || 'Sin responsable'}{action.due_at ? ` · ${new Date(action.due_at).toLocaleDateString('es-AR')}` : ''}</Text></View>)}
    {!data.actions.length ? <Text style={styles.empty}>Sin acciones asociadas.</Text> : null}

    <EvidenceSection title="Antes / detección" description="Conserva el estado observado originalmente." items={grouped.initial} previews={previews}/>
    {finding.status !== 'closed' ? <PrimaryButton title="📷 Agregar evidencia inicial" tone="neutral" busy={busy} onPress={() => void photo('initial')}/> : null}

    <EvidenceSection title="Seguimiento" description="Evidencias intermedias sin alterar la captura original." items={grouped.supporting} previews={previews}/>
    {finding.status !== 'closed' ? <PrimaryButton title="📷 Agregar seguimiento" tone="neutral" busy={busy} onPress={() => void photo('supporting')}/> : null}

    <EvidenceSection title="Después / cierre" description="Muestra la condición corregida y deja trazabilidad visual." items={grouped.closure} previews={previews}/>
    {finding.status !== 'closed' ? <PrimaryButton title="📷 Agregar evidencia de cierre" tone="neutral" busy={busy} onPress={() => void photo('closure')}/> : null}

    {finding.status !== 'closed' ? <View style={styles.closeBox}>
      <Text style={styles.section}>Cerrar hallazgo</Text>
      <Text style={styles.helper}>El cierre completa acciones pendientes y cancela alertas futuras. La evidencia fotográfica es recomendable cuando aplica.</Text>
      <TextInput placeholder="Qué se corrigió y cómo quedó" multiline value={comment} onChangeText={setComment} style={styles.input}/>
      <PrimaryButton title="Cerrar hallazgo" tone="danger" busy={busy} onPress={() => void close()}/>
    </View> : <View style={styles.closedBox}><Text style={styles.closedTitle}>✓ Hallazgo cerrado</Text><Text style={styles.closedText}>{finding.closure_comment || 'Sin comentario de cierre.'}</Text><Text style={styles.closedMeta}>{finding.closed_at ? new Date(finding.closed_at).toLocaleString('es-AR') : ''}</Text><PrimaryButton title="Reabrir hallazgo" tone="neutral" busy={busy} onPress={() => void reopen()}/></View>}

    <Text style={styles.section}>Trazabilidad</Text>
    {data.events.map(event => <View key={event.id} style={styles.event}><View style={styles.eventDot}/><View style={styles.eventBody}><Text style={styles.eventType}>{event.event_type === 'created' ? 'Creado' : event.event_type === 'status_changed' ? 'Cambio de estado' : 'Actualizado'}</Text><Text style={styles.meta}>{new Date(event.created_at).toLocaleString('es-AR')}{event.from_status ? ` · ${event.from_status} → ${event.to_status}` : ''}</Text>{event.note ? <Text style={styles.eventNote}>{event.note}</Text> : null}</View></View>)}
  </Screen>;
}

function EvidenceSection({ title, description, items, previews }: { title: string; description: string; items: FindingBundle['evidence']; previews: PreviewMap }) {
  return <View style={styles.evidenceSection}><View><Text style={styles.section}>{title}</Text><Text style={styles.helper}>{description}</Text></View>{items.length ? <View style={styles.gallery}>{items.map(item => <View key={item.id} style={styles.evidenceCard}>{previews[item.id] ? <Image source={{ uri: previews[item.id] }} style={styles.image}/> : <View style={styles.fileFallback}><Text style={styles.fileIcon}>▣</Text></View>}<Text numberOfLines={1} style={styles.fileName}>{item.file_name}</Text><Text style={styles.meta}>{phaseLabel[item.phase]} · {new Date(item.created_at).toLocaleDateString('es-AR')}</Text></View>)}</View> : <Text style={styles.empty}>Sin evidencia en esta etapa.</Text>}</View>;
}
function Info({ label, value }: { label: string; value: string | null }) { return <View style={styles.infoRow}><Text style={styles.meta}>{label}</Text><Text style={styles.infoValue}>{value || '—'}</Text></View>; }

const styles = StyleSheet.create({
  back: { color: theme.colors.primary, fontWeight: '800' }, identityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, code: { color: theme.colors.ink, fontWeight: '900', fontSize: 12, letterSpacing: 0.7 }, state: { color: theme.colors.primary, backgroundColor: '#CCFBF1', fontWeight: '900', fontSize: 9, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 }, stateDanger: { color: theme.colors.danger, backgroundColor: '#FEE2E2' }, kicker: { color: theme.colors.primary, fontWeight: '900', letterSpacing: 1, fontSize: 10 }, title: { fontSize: 29, lineHeight: 34, fontWeight: '900', color: theme.colors.ink }, description: { fontSize: 15, lineHeight: 22, color: theme.colors.ink },
  info: { backgroundColor: '#fff', padding: 15, borderRadius: 17, borderWidth: 1, borderColor: theme.colors.line, gap: 10 }, infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 }, infoValue: { flex: 1, textAlign: 'right', fontWeight: '800', color: theme.colors.ink, fontSize: 12 }, section: { fontSize: 18, fontWeight: '900', color: theme.colors.ink, marginTop: 4 }, helper: { color: theme.colors.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.line }, cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, cardTitle: { flex: 1, fontWeight: '800', color: theme.colors.ink }, actionState: { color: theme.colors.primary, fontSize: 9, fontWeight: '900' }, meta: { color: theme.colors.muted, fontSize: 11 }, empty: { color: theme.colors.muted, fontSize: 12, paddingVertical: 3 },
  evidenceSection: { gap: 8 }, gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, evidenceCard: { width: '48.5%', backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.line, borderRadius: 14, overflow: 'hidden', paddingBottom: 9 }, image: { width: '100%', aspectRatio: 1.2, backgroundColor: '#E2E8F0' }, fileFallback: { width: '100%', aspectRatio: 1.2, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }, fileIcon: { fontSize: 30, color: theme.colors.muted }, fileName: { color: theme.colors.ink, fontWeight: '800', fontSize: 11, marginHorizontal: 9, marginTop: 8 }, evidenceCard: {},
  closeBox: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: theme.colors.line, padding: 14, gap: 9 }, input: { minHeight: 90, backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.line, borderRadius: 14, padding: 12, textAlignVertical: 'top' }, closedBox: { backgroundColor: '#ECFDF5', borderRadius: 18, borderWidth: 1, borderColor: '#BBF7D0', padding: 15, gap: 7 }, closedTitle: { color: '#166534', fontWeight: '900', fontSize: 17 }, closedText: { color: '#166534', lineHeight: 20 }, closedMeta: { color: '#15803D', fontSize: 11 },
  event: { flexDirection: 'row', gap: 10, paddingVertical: 5 }, eventDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: theme.colors.primary, marginTop: 4 }, eventBody: { flex: 1, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.line }, eventType: { fontWeight: '900', color: theme.colors.ink }, eventNote: { color: theme.colors.ink, marginTop: 4, fontSize: 12, lineHeight: 17 },
  fileName: {},
});
