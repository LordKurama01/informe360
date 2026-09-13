import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
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

  return <Screen>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Volver</Text></Pressable>
    <Text style={styles.kicker}>SINCRONIZADO · FALTA CONFIRMAR</Text>
    <Text style={styles.title}>Pendientes de revisión</Text>
    <Text style={styles.copy}>Son capturas que ya llegaron al servidor. No se convierten en hallazgo hasta que una persona las confirma.</Text>
    <ScrollView refreshControl={<RefreshControl refreshing={busy} onRefresh={load}/>} contentContainerStyle={styles.list}>
      {items.map(item => <Pressable key={item.id} onPress={() => void review(item)} style={styles.card}>
        <View style={styles.row}><Text style={styles.code}>BORRADOR</Text><Text style={styles.date}>{new Date(item.capturedAt).toLocaleString('es-AR')}</Text></View>
        <Text style={styles.cardTitle}>{item.pending.draft.title}</Text>
        <Text style={styles.meta}>{item.pending.provider} · confianza {Math.round(item.pending.draft.confidence * 100)}%</Text>
        {item.rawText ? <Text style={styles.raw} numberOfLines={2}>{item.rawText}</Text> : null}
        <Text style={styles.open}>Revisar →</Text>
      </Pressable>)}
      {!items.length && !busy ? <Text style={styles.empty}>No hay capturas esperando revisión.</Text> : null}
    </ScrollView>
  </Screen>;
}

const styles = StyleSheet.create({
  back: { color: theme.colors.primary, fontWeight: '800' }, kicker: { color: theme.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 }, title: { fontSize: 30, fontWeight: '900', color: theme.colors.ink }, copy: { color: theme.colors.muted, lineHeight: 20 }, list: { gap: 10, paddingBottom: 24 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.line, gap: 7 }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, code: { color: theme.colors.warning, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, date: { color: theme.colors.muted, fontSize: 11 }, cardTitle: { color: theme.colors.ink, fontSize: 17, fontWeight: '900' }, meta: { color: theme.colors.muted, fontSize: 12 }, raw: { color: theme.colors.ink, lineHeight: 19 }, open: { color: theme.colors.primary, fontWeight: '900', marginTop: 3 }, empty: { color: theme.colors.muted, textAlign: 'center', padding: 30 },
});
