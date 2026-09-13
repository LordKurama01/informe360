import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { FieldHeader } from '../src/components/FieldHeader';
import { Screen } from '../src/components/Screen';
import { useWorkspace } from '../src/providers/workspace-provider';
import { listPendingReviews, openPendingReview, type PendingReview } from '../src/services/pending-reviews';
import { theme } from '../src/theme';

export default function PendingReviewsScreen() {
  const { workspace } = useWorkspace();
  const [items, setItems] = useState<PendingReview[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!workspace) return;
    setBusy(true);
    try { setItems(await listPendingReviews(workspace)); }
    catch (error) { Alert.alert('Pendientes', error instanceof Error ? error.message : 'No se pudieron cargar'); }
    finally { setBusy(false); }
  }, [workspace]);

  useEffect(() => { void load(); }, [load]);

  async function review(item: PendingReview) {
    await openPendingReview(item);
    router.push('/review-draft');
  }

  return <Screen scroll={false}>
    <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>‹ Volver</Text></Pressable>
    <FieldHeader kicker="SINCRONIZADO · FALTA CONFIRMAR" title="Pendientes de revisión" subtitle="Ya llegaron al servidor. No se convierten en hallazgo hasta que una persona los confirma."/>

    <View style={styles.summary}><View style={styles.summaryMark}><Text style={styles.summaryValue}>{items.length}</Text></View><View style={styles.summaryCopy}><Text style={styles.summaryTitle}>captura{items.length === 1 ? '' : 's'} esperando decisión</Text><Text style={styles.summaryText}>Revisalas antes de seguir acumulando observaciones pendientes.</Text></View></View>

    <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={busy} onRefresh={load}/>} contentContainerStyle={styles.list}>
      {items.map(item => <Pressable accessibilityRole="button" key={item.id} onPress={() => void review(item)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={styles.cardTop}><Text style={styles.code}>BORRADOR</Text><Text style={styles.date}>{new Date(item.capturedAt).toLocaleString('es-AR')}</Text></View>
        <Text style={styles.cardTitle}>{item.pending.draft.title}</Text>
        <View style={styles.metaRow}><Text style={styles.provider}>{item.pending.provider.toUpperCase()}</Text><Text style={styles.meta}>confianza {Math.round(item.pending.draft.confidence * 100)}%</Text></View>
        {item.rawText ? <Text style={styles.raw} numberOfLines={2}>{item.rawText}</Text> : null}
        <View style={styles.cardFooter}><Text style={styles.open}>Revisar captura</Text><Text style={styles.arrow}>›</Text></View>
      </Pressable>)}

      {!items.length && !busy ? <View style={styles.empty}><View style={styles.emptyIcon}><Text style={styles.emptyIconText}>✓</Text></View><Text style={styles.emptyTitle}>Sin pendientes</Text><Text style={styles.emptyCopy}>Todas las capturas sincronizadas ya fueron revisadas.</Text></View> : null}
    </ScrollView>
  </Screen>;
}

const styles = StyleSheet.create({
  backButton: { alignSelf: 'flex-start', minHeight: 42, justifyContent: 'center' },
  back: { color: theme.colors.primary, fontWeight: '900' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, backgroundColor: theme.colors.infoSoft, borderRadius: theme.radius.lg, padding: theme.spacing.md },
  summaryMark: { width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(37,87,167,0.1)', alignItems: 'center', justifyContent: 'center' },
  summaryValue: { color: theme.colors.info, fontSize: 20, fontWeight: '900' },
  summaryCopy: { flex: 1 },
  summaryTitle: { color: theme.colors.info, fontWeight: '900', fontSize: 12 },
  summaryText: { color: '#4B6FAF', fontSize: 10, lineHeight: 15, marginTop: 2 },
  list: { gap: theme.spacing.sm, paddingBottom: 96 },
  card: { backgroundColor: theme.colors.surface, padding: theme.spacing.lg, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.line, gap: 7, ...theme.shadow.card },
  pressed: { opacity: 0.8, transform: [{ scale: 0.995 }] },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  code: { color: theme.colors.warning, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  date: { color: theme.colors.muted, fontSize: 9 },
  cardTitle: { color: theme.colors.ink, fontSize: 16, lineHeight: 21, fontWeight: '900' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  provider: { color: theme.colors.primary, backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius.pill, paddingHorizontal: 8, paddingVertical: 4, fontSize: 8, fontWeight: '900' },
  meta: { color: theme.colors.muted, fontSize: 10 },
  raw: { color: theme.colors.inkSoft, lineHeight: 17, fontSize: 11, backgroundColor: theme.colors.bg, borderRadius: theme.radius.md, padding: theme.spacing.md },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.colors.line, paddingTop: 9 },
  open: { color: theme.colors.primary, fontWeight: '900', fontSize: 11 },
  arrow: { color: theme.colors.primary, fontSize: 24, fontWeight: '300' },
  empty: { minHeight: 230, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.lg, padding: theme.spacing.xxl },
  emptyIcon: { width: 52, height: 52, borderRadius: 17, backgroundColor: theme.colors.successSoft, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.sm },
  emptyIconText: { color: theme.colors.success, fontWeight: '900', fontSize: 22 },
  emptyTitle: { color: theme.colors.ink, fontSize: 17, fontWeight: '900' },
  emptyCopy: { color: theme.colors.muted, fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 4 },
});
