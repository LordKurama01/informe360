import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { createWorkspace } from '../src/services/workspace';
import { useWorkspace } from '../src/providers/workspace-provider';
import { theme } from '../src/theme';

export default function Onboarding() {
  const { refresh } = useWorkspace(); const [company, setCompany] = useState(''); const [site, setSite] = useState(''); const [busy, setBusy] = useState(false);
  async function create() { if (!company.trim() || !site.trim()) return Alert.alert('Faltan datos', 'Ingresá empresa y sitio.'); setBusy(true); try { await createWorkspace(company, site); await refresh(); router.replace('/(tabs)'); } catch (error) { Alert.alert('No se pudo crear', error instanceof Error ? error.message : 'Error'); } finally { setBusy(false); } }
  return <Screen style={styles.root}><Text style={styles.title}>Preparar piloto</Text><Text style={styles.copy}>Una empresa y un sitio alcanzan para empezar a registrar hallazgos reales.</Text><TextInput placeholder="Empresa / contratista" value={company} onChangeText={setCompany} style={styles.input}/><TextInput placeholder="Sitio / equipo / obra" value={site} onChangeText={setSite} style={styles.input}/><PrimaryButton title="Crear espacio HSE" busy={busy} onPress={() => void create()}/></Screen>;
}
const styles = StyleSheet.create({ root: { justifyContent: 'center' }, title: { fontSize: 30, fontWeight: '900', color: theme.colors.ink }, copy: { color: theme.colors.muted, fontSize: 16 }, input: { backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.line, borderRadius: 14, minHeight: 52, paddingHorizontal: 15 } });
