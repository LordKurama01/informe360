import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getPublishedTemplate, startFormRun } from '../../src/services/forms';
import type { FormTemplateSummary } from '../../src/types/forms';
import { theme } from '../../src/theme';

export default function FormTemplatePage() {
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const { workspace } = useWorkspace();
  const [template, setTemplate] = useState<FormTemplateSummary | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!templateId) return;
    void getPublishedTemplate(templateId).then(setTemplate).catch(error => Alert.alert('Formulario', error instanceof Error ? error.message : 'No se pudo abrir'));
  }, [templateId]);

  async function start() {
    if (!template || !workspace) return;
    setBusy(true);
    try {
      const { runId } = await startFormRun(template.publishedVersionId, workspace.siteId);
      router.replace(`/form-run/${runId}`);
    } catch (error) {
      Alert.alert('No se pudo iniciar', error instanceof Error ? error.message : 'Verificá la conexión');
    } finally {
      setBusy(false);
    }
  }

  if (!template) return <View style={styles.loading}><Text style={styles.loadingText}>Cargando formulario…</Text></View>;
  const fields = template.schema.sections.reduce((sum, section) => sum + section.fields.length, 0);

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>‹ Volver</Text></Pressable>

      <View style={styles.hero}>
        <View style={styles.heroTop}><Text style={styles.kicker}>{template.category.toUpperCase()}</Text><Text style={styles.version}>VERSIÓN {template.version}</Text></View>
        <Text style={styles.title}>{template.name}</Text>
        <Text style={styles.copy}>{template.description || template.schema.description || 'Formulario operativo HSE'}</Text>
        <View style={styles.meta}><Meta value={template.schema.sections.length} label="secciones"/><Meta value={fields} label="campos"/></View>
      </View>

      <View style={styles.previewTitle}><Text style={styles.previewHeading}>Qué vas a revisar</Text><Text style={styles.previewMeta}>Vista previa del contenido publicado</Text></View>
      <View style={styles.preview}>{template.schema.sections.map((section, index) => <View key={section.id} style={styles.section}>
        <View style={styles.sectionNumber}><Text style={styles.sectionNumberText}>{index + 1}</Text></View>
        <View style={styles.sectionBody}><Text style={styles.sectionTitle}>{section.title}</Text>{section.description ? <Text style={styles.sectionCopy}>{section.description}</Text> : null}<Text style={styles.sectionCount}>{section.fields.length} campo{section.fields.length === 1 ? '' : 's'}</Text></View>
      </View>)}</View>

      <Pressable accessibilityRole="button" disabled={busy} onPress={() => void start()} style={({ pressed }) => [styles.primary, (pressed || busy) && styles.primaryPressed]}><Text style={styles.primaryText}>{busy ? 'Iniciando…' : 'Iniciar formulario'}</Text></Pressable>
      <View style={styles.note}><View style={styles.noteDot}/><Text style={styles.noteText}>Esta ejecución conserva la versión publicada de hoy aunque la plantilla cambie después.</Text></View>
    </ScrollView>
  </SafeAreaView>;
}

function Meta({ value, label }: { value: number; label: string }) {
  return <View style={styles.metaItem}><Text style={styles.metaValue}>{value}</Text><Text style={styles.metaLabel}>{label}</Text></View>;
}

import { useWorkspace } from '../../src/providers/workspace-provider';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg },
  loadingText: { color: theme.colors.muted, fontWeight: '800' },
  content: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: 80, gap: theme.spacing.lg },
  backButton: { alignSelf: 'flex-start', minHeight: 42, justifyContent: 'center' },
  back: { color: theme.colors.primary, fontWeight: '900' },
  hero: { backgroundColor: theme.colors.dark, borderRadius: theme.radius.xl, padding: theme.spacing.xl, gap: 7, ...theme.shadow.card },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { color: '#7DE5D9', fontWeight: '900', fontSize: 9, letterSpacing: 1.2 },
  version: { color: '#9FB0B8', fontWeight: '800', fontSize: 9, letterSpacing: 0.8 },
  title: { fontSize: 27, lineHeight: 32, fontWeight: '900', color: theme.colors.white, letterSpacing: -0.5 },
  copy: { color: '#C1CDD2', lineHeight: 18, fontSize: 12 },
  meta: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: 7 },
  metaItem: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: theme.radius.md, padding: theme.spacing.md },
  metaValue: { color: theme.colors.white, fontSize: 19, fontWeight: '900' },
  metaLabel: { color: '#9FB0B8', fontSize: 9, fontWeight: '800', marginTop: 1 },
  previewTitle: { gap: 2 },
  previewHeading: { color: theme.colors.ink, fontSize: 18, fontWeight: '900' },
  previewMeta: { color: theme.colors.muted, fontSize: 10 },
  preview: { gap: theme.spacing.sm },
  section: { minHeight: 76, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.lg, padding: theme.spacing.md, flexDirection: 'row', gap: theme.spacing.md, alignItems: 'flex-start' },
  sectionNumber: { width: 32, height: 32, borderRadius: 11, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  sectionNumberText: { color: theme.colors.primary, fontSize: 11, fontWeight: '900' },
  sectionBody: { flex: 1 },
  sectionTitle: { fontWeight: '900', color: theme.colors.ink, fontSize: 14 },
  sectionCopy: { fontSize: 10, color: theme.colors.muted, marginTop: 3, lineHeight: 15 },
  sectionCount: { fontSize: 9, color: theme.colors.primary, fontWeight: '900', marginTop: 6 },
  primary: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, minHeight: 54, alignItems: 'center', justifyContent: 'center', ...theme.shadow.raised },
  primaryPressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  primaryText: { color: theme.colors.white, fontWeight: '900', fontSize: 14 },
  note: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 7, paddingHorizontal: theme.spacing.lg },
  noteDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.success, marginTop: 5 },
  noteText: { flex: 1, fontSize: 9, color: theme.colors.muted, lineHeight: 14, textAlign: 'center' },
});
