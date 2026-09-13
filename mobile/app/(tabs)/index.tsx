import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AiStatusPill } from '../../src/components/AiStatusPill';
import { FindingCard } from '../../src/components/FindingCard';
import { MetricTile } from '../../src/components/MetricTile';
import { SectionHeader } from '../../src/components/SectionHeader';
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

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
    <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={busy} onRefresh={load}/>} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>HSE COPILOT · CAMPO</Text>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.site}>{workspace?.siteName || 'Sin sitio seleccionado'}</Text>
          {workspace?.organizationName ? <Text style={styles.organization}>{workspace.organizationName}</Text> : null}
        </View>
        <View style={styles.headerActions}>
          <AiStatusPill status={aiStatus}/>
          <Pressable accessibilityRole="button" onPress={() => void signOut()} style={styles.exitButton}><Text style={styles.exit}>Salir</Text></Pressable>
        </View>
      </View>

      {pendingCount > 0 ? <Pressable accessibilityRole="button" onPress={() => void manualSync()} style={styles.syncBanner}>
        <View style={styles.bannerIcon}><Text style={styles.bannerIconText}>↻</Text></View>
        <View style={styles.bannerBody}><Text style={styles.bannerTitle}>{syncing ? 'Sincronizando…' : `${pendingCount} captura${pendingCount === 1 ? '' : 's'} sin sincronizar`}</Text><Text style={styles.bannerCopy}>Están guardadas de forma segura en este teléfono.</Text></View>
        <Text style={styles.bannerAction}>{syncing ? '•••' : 'Enviar'}</Text>
      </Pressable> : null}

      {reviewCount > 0 ? <Pressable accessibilityRole="button" onPress={() => router.push('/pending-reviews')} style={styles.reviewBanner}>
        <View style={styles.reviewDot}/><View style={styles.bannerBody}><Text style={styles.reviewTitle}>{reviewCount} captura{reviewCount === 1 ? '' : 's'} para confirmar</Text><Text style={styles.reviewCopy}>Ya sincronizadas. Falta revisión humana.</Text></View><Text style={styles.chevron}>›</Text>
      </Pressable> : null}

      <Pressable accessibilityRole="button" onPress={() => router.push('/register?mode=audio')} style={({ pressed }) => [styles.captureHero, pressed && styles.pressed]}>
        <View style={styles.captureIcon}><Text style={styles.captureIconText}>●</Text></View>
        <View style={styles.captureCopy}>
          <Text style={styles.captureKicker}>CAPTURA RÁPIDA</Text>
          <Text style={styles.captureTitle}>Registrar hablando</Text>
          <Text style={styles.captureText}>Tocá, describí lo que encontraste y seguí caminando.</Text>
        </View>
        <Text style={styles.captureArrow}>›</Text>
      </Pressable>

      <View style={styles.quickActions}>
        <QuickAction icon="✓" label="Inspeccionar" onPress={() => router.push('/(tabs)/inspections')}/>
        <QuickAction icon="▣" label="Foto" onPress={() => router.push('/register?mode=photo')}/>
        <QuickAction icon="T" label="Escribir" onPress={() => router.push('/register?mode=text')}/>
        <QuickAction icon="⌕" label="Buscar" onPress={() => router.push('/(tabs)/findings')}/>
      </View>

      <SectionHeader title="Situación operativa" meta={`${summary.closureCompliancePct}% de cierres en plazo`}/>
      <View style={styles.metricsGrid}>
        <MetricTile label="Abiertos" value={summary.open} tone="primary" onPress={() => router.push('/(tabs)/findings?filter=open')}/>
        <MetricTile label="Vencidos" value={summary.overdue} tone="danger" onPress={() => router.push('/(tabs)/findings?filter=overdue')}/>
        <MetricTile label="Próximos 7 días" value={summary.dueNext7Days} tone="warning" onPress={() => router.push('/(tabs)/findings?filter=upcoming')}/>
        <MetricTile label="Cerrados" value={summary.closed} tone="success" onPress={() => router.push('/(tabs)/findings?filter=closed')}/>
      </View>

      {summary.criticalOpen > 0 ? <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/findings?filter=critical')} style={styles.critical}>
        <View style={styles.criticalMark}><Text style={styles.criticalMarkText}>!</Text></View>
        <View style={styles.bannerBody}><Text style={styles.criticalTitle}>{summary.criticalOpen} crítico{summary.criticalOpen === 1 ? '' : 's'} abierto{summary.criticalOpen === 1 ? '' : 's'}</Text><Text style={styles.criticalCopy}>Requiere atención prioritaria.</Text></View><Text style={styles.criticalAction}>Ver →</Text>
      </Pressable> : null}

      <SectionHeader title="Actividad reciente" meta="Últimos hallazgos" action={<Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/findings')} style={styles.linkButton}><Text style={styles.link}>Ver todos</Text></Pressable>}/>
      <View style={styles.recent}>{items.slice(0, 4).map(finding => <FindingCard key={finding.id} finding={finding} onPress={() => router.push(`/finding/${finding.id}`)}/>)}</View>

      {!items.length && !busy ? <View style={styles.emptyCard}>
        <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>◎</Text></View>
        <Text style={styles.emptyTitle}>Todavía no hay actividad</Text>
        <Text style={styles.emptyCopy}>Registrá el primer hallazgo o cargá una demo para recorrer el circuito completo.</Text>
        <Pressable disabled={demoBusy} onPress={() => void loadDemo()} style={styles.demoButton}><Text style={styles.demoButtonText}>{demoBusy ? 'Preparando demo…' : 'Cargar demo comercial'}</Text></Pressable>
      </View> : null}

      <View style={styles.runtimeNote}><View style={[styles.runtimeDot, { backgroundColor: aiStatus.state === 'ready' ? theme.colors.success : aiStatus.state === 'offline' ? theme.colors.warning : theme.colors.primary }]}/><Text style={styles.runtimeText}>{aiStatus.detail}</Text></View>
    </ScrollView>
  </SafeAreaView>;
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.quick, pressed && styles.pressed]}><View style={styles.quickIconWrap}><Text style={styles.quickIcon}>{icon}</Text></View><Text style={styles.quickLabel}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: 112, gap: theme.spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing.md },
  headerCopy: { flex: 1 },
  headerActions: { alignItems: 'flex-end', gap: theme.spacing.sm },
  kicker: { color: theme.colors.primary, fontWeight: '900', letterSpacing: 1.45, fontSize: theme.type.micro },
  greeting: { fontSize: 29, lineHeight: 34, fontWeight: '900', color: theme.colors.ink, letterSpacing: -0.5, marginTop: 2 },
  site: { color: theme.colors.inkSoft, fontWeight: '900', fontSize: 14, marginTop: 2 },
  organization: { color: theme.colors.muted, fontSize: 11, marginTop: 1 },
  exitButton: { minHeight: 36, paddingHorizontal: 6, justifyContent: 'center' },
  exit: { color: theme.colors.muted, fontSize: 10, fontWeight: '900' },
  syncBanner: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, backgroundColor: theme.colors.warningSoft, padding: theme.spacing.md, borderRadius: theme.radius.lg },
  bannerIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(179,90,0,0.09)', alignItems: 'center', justifyContent: 'center' },
  bannerIconText: { color: theme.colors.warning, fontSize: 20, fontWeight: '900' },
  bannerBody: { flex: 1 },
  bannerTitle: { color: '#8C4700', fontWeight: '900', fontSize: 13 },
  bannerCopy: { color: theme.colors.warning, fontSize: 10, marginTop: 2 },
  bannerAction: { color: theme.colors.warning, fontWeight: '900', fontSize: 11 },
  reviewBanner: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, backgroundColor: theme.colors.infoSoft, padding: theme.spacing.md, borderRadius: theme.radius.lg },
  reviewDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: theme.colors.info },
  reviewTitle: { color: theme.colors.info, fontWeight: '900', fontSize: 13 },
  reviewCopy: { color: '#4B6FAF', fontSize: 10, marginTop: 2 },
  chevron: { color: theme.colors.info, fontSize: 26, fontWeight: '300' },
  captureHero: { minHeight: 144, borderRadius: theme.radius.xl, backgroundColor: theme.colors.primary, padding: theme.spacing.xl, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, ...theme.shadow.raised },
  captureIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  captureIconText: { color: theme.colors.white, fontSize: 28 },
  captureCopy: { flex: 1 },
  captureKicker: { color: '#B8FFF7', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  captureTitle: { color: theme.colors.white, fontSize: 21, lineHeight: 26, fontWeight: '900', marginTop: 3 },
  captureText: { color: '#D9FFFB', fontSize: 11, lineHeight: 16, marginTop: 3 },
  captureArrow: { color: theme.colors.white, fontSize: 34, fontWeight: '300' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  quickActions: { flexDirection: 'row', gap: theme.spacing.sm },
  quick: { flex: 1, minHeight: 72, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', gap: 5 },
  quickIconWrap: { width: 30, height: 30, borderRadius: 10, backgroundColor: theme.colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  quickIcon: { color: theme.colors.primary, fontSize: 14, fontWeight: '900' },
  quickLabel: { color: theme.colors.inkSoft, fontWeight: '800', fontSize: 9 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  critical: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, backgroundColor: theme.colors.dangerSoft, borderRadius: theme.radius.lg, padding: theme.spacing.md },
  criticalMark: { width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(180,35,24,0.1)', alignItems: 'center', justifyContent: 'center' },
  criticalMarkText: { color: theme.colors.danger, fontSize: 20, fontWeight: '900' },
  criticalTitle: { color: theme.colors.danger, fontWeight: '900', fontSize: 13 },
  criticalCopy: { color: '#9F443D', fontSize: 10, marginTop: 2 },
  criticalAction: { color: theme.colors.danger, fontWeight: '900', fontSize: 11 },
  linkButton: { minHeight: 40, justifyContent: 'center', paddingLeft: 10 },
  link: { color: theme.colors.primary, fontWeight: '900', fontSize: 11 },
  recent: { gap: theme.spacing.sm },
  emptyCard: { backgroundColor: theme.colors.surface, padding: theme.spacing.xxl, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.line, alignItems: 'center', gap: theme.spacing.sm },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  emptyIconText: { color: theme.colors.primary, fontSize: 25 },
  emptyTitle: { color: theme.colors.ink, fontSize: 17, fontWeight: '900' },
  emptyCopy: { color: theme.colors.muted, textAlign: 'center', lineHeight: 18, fontSize: 12 },
  demoButton: { marginTop: 4, minHeight: 44, backgroundColor: theme.colors.dark, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.lg, alignItems: 'center', justifyContent: 'center' },
  demoButtonText: { color: theme.colors.white, fontWeight: '900', fontSize: 11 },
  runtimeNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  runtimeDot: { width: 6, height: 6, borderRadius: 3 },
  runtimeText: { color: theme.colors.muted, fontSize: 9, flexShrink: 1, textAlign: 'center' },
});
