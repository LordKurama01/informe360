import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createWorkspace, resolveWorkspace } from '../src/services/workspace';
import { useWorkspace } from '../src/providers/workspace-provider';
import { theme } from '../src/theme';

function readableError(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo completar la operación. Volvé a intentar.';
}

export default function Onboarding() {
  const { workspace, refresh, loading } = useWorkspace();
  const [company, setCompany] = useState('');
  const [site, setSite] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // An organization can be provisioned after the user first reached this route.
  // Always re-check membership instead of forcing an additional organization signup.
  useEffect(() => {
    let active = true;
    setChecking(true);
    void refresh().catch(reason => {
      if (active) setError(readableError(reason));
    }).finally(() => {
      if (active) setChecking(false);
    });
    return () => { active = false; };
  }, [refresh]);

  useEffect(() => {
    if (workspace) router.replace('/(tabs)');
  }, [workspace]);

  async function enterExisting() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const existing = await resolveWorkspace();
      if (!existing) {
        setError('Todavía no encontramos un espacio asociado a tu cuenta. Podés reintentar o crear uno abajo.');
        return;
      }
      await refresh();
      router.replace('/(tabs)');
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setBusy(false);
    }
  }

  async function create() {
    if (busy) return;
    setError(null);
    if (!company.trim() || !site.trim()) {
      setError('Completá el nombre de empresa y el sitio para continuar.');
      return;
    }
    setBusy(true);
    try {
      // Prevent duplicate organizations when a workspace has already been assigned.
      const existing = await resolveWorkspace();
      if (!existing) await createWorkspace(company, site);
      await refresh();
      router.replace('/(tabs)');
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setBusy(false);
    }
  }

  if (checking || loading || workspace) {
    return <SafeAreaView edges={['top', 'left', 'right']} style={styles.loadingRoot}>
      <View style={styles.loadingMark}><Text style={styles.loadingMarkText}>HSE</Text></View>
      <ActivityIndicator color="#FF9A2E" size="large"/>
      <Text style={styles.loadingTitle}>Abriendo tu espacio de trabajo</Text>
      <Text style={styles.loadingHint}>Estamos recuperando la empresa y el sitio asociados a tu cuenta.</Text>
    </SafeAreaView>;
  }

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.heading}>
          <Text style={styles.kicker}>INFORME360  /  ACCESO</Text>
          <Text style={styles.title}>Entrá a tu espacio HSE.</Text>
          <Text style={styles.intro}>Si ya te asignamos una empresa, podés continuar sin configurar nada.</Text>
        </View>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void enterExisting()} style={({ pressed }) => [styles.enter, (pressed || busy) && styles.dim]}>
          <Text style={styles.enterText}>{busy ? 'Comprobando acceso…' : 'Entrar al panel  ›'}</Text>
        </Pressable>
        {error ? <View accessibilityLiveRegion="polite" style={styles.feedback}><Text style={styles.feedbackText}>{error}</Text></View> : null}
        <View style={styles.divider}/>
        <Text style={styles.secondaryTitle}>¿Es tu primera empresa?</Text>
        <Text style={styles.secondaryCopy}>La siguiente opción es solo para cuentas nuevas que todavía no tengan un espacio asignado.</Text>
        <View style={styles.form}>
          <Text style={styles.label}>Empresa o contratista</Text>
          <TextInput accessibilityLabel="Empresa o contratista" editable={!busy} placeholder="Nombre de empresa" placeholderTextColor="#819299" value={company} onChangeText={setCompany} style={styles.input}/>
          <Text style={styles.label}>Sitio, equipo u obra</Text>
          <TextInput accessibilityLabel="Sitio, equipo u obra" editable={!busy} placeholder="Nombre del sitio" placeholderTextColor="#819299" value={site} onChangeText={setSite} style={styles.input}/>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void create()} style={({ pressed }) => [styles.createButton, (pressed || busy) && styles.dim]}>
            <Text style={styles.createText}>Crear un espacio nuevo</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: '#F2F5F5' },
  loadingRoot: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, gap: 20, backgroundColor: theme.colors.dark },
  loadingMark: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: theme.colors.primary },
  loadingMarkText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', letterSpacing: 0.8 },
  loadingTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '900', textAlign: 'center' },
  loadingHint: { color: '#AAC5C5', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  scroll: { flexGrow: 1, paddingTop: 34, paddingBottom: 65, paddingHorizontal: 23, gap: 17, maxWidth: 560, width: '100%', alignSelf: 'center' },
  heading: { gap: 13, paddingTop: 16, paddingBottom: 7 },
  kicker: { color: theme.colors.primary, letterSpacing: 1.7, fontSize: 11, fontWeight: '900' },
  title: { color: '#10232D', fontSize: 31, fontWeight: '900', lineHeight: 37, letterSpacing: -0.5 },
  intro: { color: '#62737D', fontSize: 15, lineHeight: 22 },
  enter: { minHeight: 58, backgroundColor: '#0B6F67', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  enterText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  dim: { opacity: 0.64 },
  feedback: { borderRadius: 12, backgroundColor: '#FFF0ED', borderWidth: 1, borderColor: '#F4D7D1', padding: 13 },
  feedbackText: { color: '#9D271C', fontSize: 13, lineHeight: 20, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#D7E0E2', marginTop: 13, marginBottom: 4 },
  secondaryTitle: { fontSize: 18, fontWeight: '900', color: theme.colors.ink },
  secondaryCopy: { fontSize: 13, lineHeight: 20, color: theme.colors.muted },
  form: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E8EA', borderRadius: 20, padding: 18, gap: 11 },
  label: { color: '#344550', fontSize: 13, fontWeight: '800', marginTop: 3 },
  input: { height: 52, borderRadius: 12, borderWidth: 1, borderColor: '#DCE5E8', backgroundColor: '#F6F8F8', paddingHorizontal: 14, color: '#0B1720', fontSize: 15 },
  createButton: { minHeight: 52, borderRadius: 13, borderWidth: 1, borderColor: '#E4C7B5', backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  createText: { color: theme.colors.primaryDark, fontSize: 14, fontWeight: '900' },
});
