import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { createWorkspace } from '../src/services/workspace';
import { useWorkspace } from '../src/providers/workspace-provider';
import { theme } from '../src/theme';

export default function Onboarding() {
  const { refresh } = useWorkspace();
  const [company, setCompany] = useState('');
  const [site, setSite] = useState('');
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!company.trim() || !site.trim()) return Alert.alert('Faltan datos', 'Ingresá empresa y sitio.');
    setBusy(true);
    try {
      await createWorkspace(company, site);
      await refresh();
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('No se pudo crear', error instanceof Error ? error.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return <Screen style={styles.root}>
    <View style={styles.step}><Text style={styles.stepNumber}>1</Text><Text style={styles.stepText}>PREPARAR ESPACIO DE CAMPO</Text></View>
    <Text style={styles.title}>Decinos dónde vas a trabajar</Text>
    <Text style={styles.copy}>Con una empresa y un sitio alcanza para empezar. Después podés registrar hallazgos e inspecciones reales.</Text>

    <View style={styles.form}>
      <View style={styles.field}><Text style={styles.label}>Empresa / contratista</Text><TextInput placeholder="Ej.: Contratista Norte" placeholderTextColor={theme.colors.muted} value={company} onChangeText={setCompany} style={styles.input}/></View>
      <View style={styles.field}><Text style={styles.label}>Sitio / equipo / obra</Text><TextInput placeholder="Ej.: Equipo 12 · Planta Sur" placeholderTextColor={theme.colors.muted} value={site} onChangeText={setSite} style={styles.input}/></View>
      <PrimaryButton title="Crear espacio HSE" busy={busy} onPress={() => void create()}/>
    </View>

    <View style={styles.note}><View style={styles.noteIcon}><Text style={styles.noteIconText}>✓</Text></View><Text style={styles.noteText}>Podés cambiar de contexto más adelante. Esto sólo crea el primer espacio operativo.</Text></View>
  </Screen>;
}

const styles = StyleSheet.create({
  root: { justifyContent: 'center', paddingBottom: theme.spacing.xxl },
  step: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepNumber: { width: 28, height: 28, lineHeight: 28, textAlign: 'center', borderRadius: 9, overflow: 'hidden', backgroundColor: theme.colors.primarySoft, color: theme.colors.primary, fontWeight: '900', fontSize: 12 },
  stepText: { color: theme.colors.primary, fontWeight: '900', fontSize: 10, letterSpacing: 1.2 },
  title: { fontSize: 30, lineHeight: 35, fontWeight: '900', color: theme.colors.ink, letterSpacing: -0.5 },
  copy: { color: theme.colors.muted, fontSize: 14, lineHeight: 20, marginBottom: theme.spacing.sm },
  form: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.xl, padding: theme.spacing.lg, gap: theme.spacing.md, ...theme.shadow.card },
  field: { gap: 6 },
  label: { color: theme.colors.inkSoft, fontWeight: '900', fontSize: 11 },
  input: { backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.md, minHeight: 54, paddingHorizontal: theme.spacing.lg, color: theme.colors.ink, fontSize: 15 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radius.md, padding: theme.spacing.md, marginTop: theme.spacing.sm },
  noteIcon: { width: 26, height: 26, borderRadius: 9, backgroundColor: theme.colors.successSoft, alignItems: 'center', justifyContent: 'center' },
  noteIconText: { color: theme.colors.success, fontWeight: '900' },
  noteText: { flex: 1, color: theme.colors.muted, fontSize: 11, lineHeight: 16 },
});
