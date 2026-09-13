import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FieldHeader } from '../../src/components/FieldHeader';
import { useWorkspace } from '../../src/providers/workspace-provider';
import { listActiveFormTemplates } from '../../src/services/forms';
import { listOfflineFormDrafts } from '../../src/services/form-offline';
import type { FormTemplateSummary } from '../../src/types/forms';
import { theme } from '../../src/theme';

export default function FormsCatalog() {
  const { workspace } = useWorkspace();
  const [templates, setTemplates] = useState<FormTemplateSummary[]>([]);
  const [drafts, setDrafts] = useState(0);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      const [items, local] = await Promise.all([listActiveFormTemplates(workspace), listOfflineFormDrafts()]);
      setTemplates(items);
      setDrafts(local.length);
    } catch (error) {
      Alert.alert('Formularios', error instanceof Error ? error.message : 'No se pudieron cargar');
    } finally {
      setLoading(false);
    }
  }, [workspace]);
  useEffect(() => { void load(); }, [load]);

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
    <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={load}/>} contentContainerStyle={styles.content}>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>‹ Volver</Text></Pressable>
      <FieldHeader kicker="HSE · FORMULARIOS" title="Inspeccionar y evaluar" subtitle="Una sola biblioteca para checklists, inspecciones y evaluaciones operativas."/>

      {drafts > 0 ? <View style={styles.draftBanner}><View style={styles.draftMark}><Text style={styles.draftMarkText}>↻</Text></View><View style={styles.draftBody}><Text style={styles.draftTitle}>{drafts} borrador{drafts === 1 ? '' : 'es'} local{drafts === 1 ? '' : 'es'}</Text><Text style={styles.draftCopy}>El contenido permanece guardado en este teléfono hasta sincronizar.</Text></View></View> : null}

      <View style={styles.grid}>{templates.map(item => <Pressable accessibilityRole="button" key={item.id} onPress={() => router.push(`/forms/${item.id}`)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={styles.cardTop}><View style={styles.categoryPill}><Text style={styles.category}>{item.category.toUpperCase()}</Text></View><Text style={styles.version}>v{item.version}</Text></View>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text numberOfLines={3} style={styles.cardCopy}>{item.description || item.schema.description || 'Formulario operativo HSE'}</Text>
        <View style={styles.cardFooter}><Text style={styles.open}>Abrir formulario</Text><Text style={styles.arrow}>›</Text></View>
      </Pressable>)}</View>

      {!templates.length && !loading ? <View style={styles.empty}><View style={styles.emptyIcon}><Text style={styles.emptyIconText}>□</Text></View><Text style={styles.emptyTitle}>No hay formularios publicados</Text><Text style={styles.emptyCopy}>Las plantillas publicadas desde HSE Control aparecerán acá para uso de campo.</Text></View> : null}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  content: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: 96, gap: theme.spacing.lg },
  backButton: { alignSelf: 'flex-start', minHeight: 42, justifyContent: 'center' },
  back: { color: theme.colors.primary, fontWeight: '900' },
  draftBanner: { padding: theme.spacing.md, borderRadius: theme.radius.lg, backgroundColor: theme.colors.warningSoft, flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' },
  draftMark: { width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(179,90,0,0.09)', alignItems: 'center', justifyContent: 'center' },
  draftMarkText: { color: theme.colors.warning, fontSize: 18, fontWeight: '900' },
  draftBody: { flex: 1 },
  draftTitle: { fontWeight: '900', color: '#8C4700', fontSize: 13 },
  draftCopy: { fontSize: 10, color: theme.colors.warning, marginTop: 2, lineHeight: 15 },
  grid: { gap: theme.spacing.sm },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.lg, padding: theme.spacing.lg, gap: 7, ...theme.shadow.card },
  pressed: { opacity: 0.8, transform: [{ scale: 0.995 }] },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryPill: { backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius.pill, paddingHorizontal: 9, paddingVertical: 5 },
  category: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8, color: theme.colors.primary },
  version: { fontSize: 10, fontWeight: '800', color: theme.colors.muted },
  cardTitle: { fontSize: 17, lineHeight: 22, fontWeight: '900', color: theme.colors.ink },
  cardCopy: { color: theme.colors.muted, lineHeight: 17, fontSize: 11 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: theme.colors.line, paddingTop: 9, marginTop: 2 },
  open: { color: theme.colors.primary, fontWeight: '900', fontSize: 11 },
  arrow: { color: theme.colors.primary, fontSize: 24, fontWeight: '300' },
  empty: { minHeight: 240, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.lg, padding: theme.spacing.xxl, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: theme.colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.sm },
  emptyIconText: { color: theme.colors.primary, fontSize: 22 },
  emptyTitle: { fontSize: 17, fontWeight: '900', color: theme.colors.ink, textAlign: 'center' },
  emptyCopy: { textAlign: 'center', color: theme.colors.muted, marginTop: 5, lineHeight: 17, fontSize: 11 },
});
