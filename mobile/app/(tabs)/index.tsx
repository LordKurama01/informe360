import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AiStatusPill } from '../../src/components/AiStatusPill';
import { FindingCard } from '../../src/components/FindingCard';
import { useAuth } from '../../src/providers/auth-provider';
import { useSync } from '../../src/providers/sync-provider';
import { useWorkspace } from '../../src/providers/workspace-provider';
import { getAiRuntimeStatus, type AiRuntimeStatus } from '../../src/services/ai-status';
import { seedDemoWorkspace } from '../../src/services/demo';
import { getDashboardSummary, listFindings } from '../../src/services/findings';
import { listPendingReviews } from '../../src/services/pending-reviews';
import type { DashboardSummary, Finding } from '../../src/types/hse';
import { theme } from '../../src/theme';

const emptySummary: DashboardSummary = { open: 0, overdue: 0, dueNext7Days: 0, closed: 0, closedOnTime: 0, closureCompliancePct: 0, criticalOpen: 0 };

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Buen día' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
}

export default function Home() {
  const { workspace, refresh: refreshWorkspace } = useWorkspace();
  const { signOut } = useAuth();
  const { pendingCount, syncing, syncNow, refreshPending } = useSync();
  const [items, setItems] = useState<Finding[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [reviewCount, setReviewCount] = useState(0);
  const [aiStatus, setAiStatus] = useState<AiRuntimeStatus>({ state: 'manual', label: 'Comprobando IA', detail: '' });
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);

  const load = useCallback(async () => {
    if (!workspace) return;
    setBusy(true);
    try {
      const [findings, dashboard, reviews, runtime] = await Promise.all([
        listFindings(workspace),
        getDashboardSummary(workspace),
        listPendingReviews(workspace),
        getAiRuntimeStatus(),
      ]);
      setItems(findings);
      setSummary(dashboard);
      setReviewCount(reviews.length);
      setAiStatus(runtime);
      await refreshPending();
    } catch (error) {
      Alert.alert('No se pudo actualizar', error instanceof Error ? error.message : 'Error');
    } finally {
      setBusy(false);
    }
  }, [workspace, refreshPending]);

  useEffect(() => { void load(); }, [load]);

  async function loadDemo() {
    setDemoBusy(true);
    try {
      await seedDemoWorkspace();
      await refreshWorkspace();
      Alert.alert('Demo lista', 'Cargamos una empresa, un sitio, ocho hallazgos y un informe coherente para recorrer el producto.');
    } catch (error) {
      Alert.alert('Demo', error instanceof Error ? error.message : 'No se pudo cargar');
    } finally {
      setDemoBusy(false);
    }
  }

  async function manualSync() {
    const result = await syncNow();
    if (result.synced) Alert.alert('Sincronización completa', `${result.synced} captura${result.synced === 1 ? '' : 's'} llegó${result.synced === 1 ? '' : 'ron'} al servidor y quedó pendiente de revisión.`);
    await load();
  }

  return <View style={styles.safe}><ScrollView refreshControl={<RefreshControl refreshing={busy} onRefresh={load}/>} contentContainerStyle={styles.content}>
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.kicker}>HSE COPILOT · CAMPO</Text>
        <Text style={styles.greeting}>{greeting()}</Text>
        <Text style={styles.site}>{workspace?.siteName || 'Sin sitio seleccionado'}</Text>
        <Text style={styles.organization}>{workspace?.organizationName}</Text>
      </View>
      <View style={styles.headerActions}><AiStatusPill status={aiStatus}/><Pressable onPress={() => void signOut()}><Text style={styles.exit}>Salir</Text></Pressable></View>
    </View>

    {pendingCount > 0 ? <Pressable onPress={() => void manualSync()} style={styles.syncBanner}>
      <View><Text style={styles.bannerTitle}>{syncing ? 'Sincronizando…' : `${pendingCount} captura${pendingCount === 1 ? '' : 's'} sin sincronizar`}</Text><Text style={styles.bannerCopy}>Guardadas de forma segura en este teléfono.</Text></View><Text style={styles.bannerAction}>{syncing ? '•••' : 'Sincronizar'}</Text>
    </Pressable> : null}

    {reviewCount > 0 ? <Pressable onPress={() => router.push('/pending-reviews')} style={styles.reviewBanner}>
      <View><Text style={styles.reviewTitle}>{reviewCount} captura{reviewCount === 1 ? '' : 's'} para confirmar</Text><Text style={styles.reviewCopy}>Ya están sincronizadas. Falta revisión humana.</Text></View><Text style={styles.chevron}>›</Text>
    </Pressable> : null}

    <Pressable onPress={() => router.push('/register?mode=audio')} style={styles.register}>
      <View style={styles.micCircle}><Text style={styles.mic}>🎙️</Text></View>
      <Text style={styles.registerTitle}>REGISTRAR</Text>
      <Text style={styles.registerCopy}>Tocá, hablá y seguí caminando</Text>
    </Pressable>

    <View style={styles.quickActions}>
      <QuickAction icon="📷" label="Foto" onPress={() => router.push('/register?mode=photo')}/>
      <QuickAction icon="✍️" label="Escribir" onPress={() => router.push('/register?mode=text')}/>
      <QuickAction icon="⌕" label="Buscar" onPress={() => router.push('/(tabs)/findings')}/>
    </View>

    <View style={styles.metricsHeader}><Text style={styles.section}>Situación operativa</Text><Text style={styles.compliance}>{summary.closureCompliancePct}% cierre en plazo</Text></View>
    <View style={styles.metricsGrid}>
      <Metric label="Abiertos" value={summary.open} tone={theme.colors.primary} onPress={() => router.push('/(tabs)/findings?filter=open')}/>
      <Metric label="Vencidos" value={summary.overdue} tone={theme.colors.danger} onPress={() => router.push('/(tabs)/findings?filter=overdue')}/>
      <Metric label="Próx. 7 días" value={summary.dueNext7Days} tone={theme.colors.warning} onPress={() => router.push('/(tabs)/findings?filter=upcoming')}/>
      <Metric label="Cerrados" value={summary.closed} tone={theme.colors.success} onPress={() => router.push('/(tabs)/findings?filter=closed')}/>
    </View>
    {summary.criticalOpen > 0 ? <Pressable onPress={() => router.push('/(tabs)/findings?filter=critical')} style={styles.critical}><Text style={styles.criticalText}>⚠ {summary.criticalOpen} crítico{summary.criticalOpen === 1 ? '' : 's'} abierto{summary.criticalOpen === 1 ? '' : 's'}</Text><Text style={styles.criticalAction}>Ver ahora →</Text></Pressable> : null}

    <View style={styles.sectionRow}><Text style={styles.section}>Actividad reciente</Text><Pressable onPress={() => router.push('/(tabs)/findings')}><Text style={styles.seeAll}>Ver todos</Text></Pressable></View>
    {items.slice(0, 4).map(finding => <FindingCard key={finding.id} finding={finding} onPress={() => router.push(`/finding/${finding.id}`)}/>)}

    {!items.length && !busy ? <View style={styles.emptyCard}>
      <Text style={styles.emptyIcon}>◎</Text><Text style={styles.emptyTitle}>Todavía no hay actividad</Text><Text style={styles.emptyCopy}>Registrá el primer hallazgo o cargá una empresa demo completa para recorrer el producto.</Text>
      <Pressable disabled={demoBusy} onPress={() => void loadDemo()} style={styles.demoButton}><Text style={styles.demoButtonText}>{demoBusy ? 'Preparando demo…' : 'Cargar demo comercial'}</Text></Pressable>
    </View> : null}

    <View style={styles.runtimeNote}><View style={[styles.runtimeDot, { backgroundColor: aiStatus.state === 'ready' ? theme.colors.success : aiStatus.state === 'offline' ? theme.colors.warning : theme.colors.primary }]}/><Text style={styles.runtimeText}>{aiStatus.detail}</Text></View>
  </ScrollView></View>;
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={styles.quick}><Text style={styles.quickIcon}>{icon}</Text><Text style={styles.quickLabel}>{label}</Text></Pressable>; }
function Metric({ label, value, tone, onPress }: { label: string; value: number; tone: string; onPress: () => void }) { return <Pressable onPress={onPress} style={styles.metric}><Text style={[styles.metricValue, { color: tone }]}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></Pressable>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg }, content: { paddingTop: 56, paddingHorizontal: 18, paddingBottom: 38, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }, headerText: { flex: 1 }, headerActions: { alignItems: 'flex-end', gap: 10 }, kicker: { color: theme.colors.primary, fontWeight: '900', letterSpacing: 1.7, fontSize: 10 }, greeting: { fontSize: 30, fontWeight: '900', color: theme.colors.ink, marginTop: 2 }, site: { color: theme.colors.ink, fontWeight: '800', fontSize: 15 }, organization: { color: theme.colors.muted, marginTop: 1 }, exit: { color: theme.colors.muted, fontSize: 11, fontWeight: '800' },
  syncBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF7ED', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#FED7AA' }, bannerTitle: { color: '#9A3412', fontWeight: '900' }, bannerCopy: { color: '#C2410C', fontSize: 11, marginTop: 2 }, bannerAction: { color: '#EA580C', fontWeight: '900', fontSize: 12 },
  reviewBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#EFF6FF', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#BFDBFE' }, reviewTitle: { color: '#1D4ED8', fontWeight: '900' }, reviewCopy: { color: '#3B82F6', fontSize: 11, marginTop: 2 }, chevron: { color: '#2563EB', fontSize: 28, fontWeight: '300' },
  register: { backgroundColor: '#0F766E', minHeight: 208, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginTop: 2, shadowColor: '#0F766E', shadowOpacity: 0.22, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 6 }, micCircle: { width: 78, height: 78, borderRadius: 39, backgroundColor: 'rgba(255,255,255,.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 9 }, mic: { fontSize: 40 }, registerTitle: { color: '#fff', fontSize: 25, fontWeight: '900', letterSpacing: 1.2 }, registerCopy: { color: '#CCFBF1', marginTop: 5, fontWeight: '600' },
  quickActions: { flexDirection: 'row', gap: 9 }, quick: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.line, borderRadius: 16, minHeight: 68, alignItems: 'center', justifyContent: 'center', gap: 3 }, quickIcon: { fontSize: 20 }, quickLabel: { color: theme.colors.ink, fontWeight: '800', fontSize: 11 },
  metricsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }, section: { fontSize: 18, fontWeight: '900', color: theme.colors.ink }, compliance: { color: theme.colors.success, fontSize: 11, fontWeight: '900' }, metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, metric: { width: '48.7%', backgroundColor: '#fff', padding: 15, borderRadius: 17, borderWidth: 1, borderColor: theme.colors.line }, metricValue: { fontSize: 28, fontWeight: '900' }, metricLabel: { color: theme.colors.muted, fontSize: 11, fontWeight: '800', marginTop: 2 },
  critical: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 15, padding: 13 }, criticalText: { color: '#991B1B', fontWeight: '900' }, criticalAction: { color: '#DC2626', fontWeight: '900', fontSize: 11 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }, seeAll: { color: theme.colors.primary, fontWeight: '900', fontSize: 12 },
  emptyCard: { backgroundColor: '#fff', padding: 24, borderRadius: 22, borderWidth: 1, borderColor: theme.colors.line, alignItems: 'center', gap: 7 }, emptyIcon: { color: theme.colors.primary, fontSize: 32 }, emptyTitle: { color: theme.colors.ink, fontSize: 18, fontWeight: '900' }, emptyCopy: { color: theme.colors.muted, textAlign: 'center', lineHeight: 19 }, demoButton: { marginTop: 6, backgroundColor: theme.colors.ink, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 16 }, demoButtonText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  runtimeNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 4 }, runtimeDot: { width: 6, height: 6, borderRadius: 3 }, runtimeText: { color: theme.colors.muted, fontSize: 10, flexShrink: 1, textAlign: 'center' },
});
