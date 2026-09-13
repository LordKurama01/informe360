import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { useAuth } from '../src/providers/auth-provider';
import { theme } from '../src/theme';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(kind: 'in' | 'up') {
    setBusy(true);
    try {
      const message = await (kind === 'in' ? signIn(email, password) : signUp(email, password));
      if (message) Alert.alert(kind === 'up' ? 'Registro' : 'No se pudo ingresar', message);
      else router.replace('/');
    } finally {
      setBusy(false);
    }
  }

  return <Screen style={styles.root}>
    <View style={styles.brand}>
      <View style={styles.brandMark}><Text style={styles.brandMarkText}>360</Text></View>
      <Text style={styles.eyebrow}>INFORME360</Text>
      <Text style={styles.title}>HSE Copilot</Text>
      <Text style={styles.copy}>Tu herramienta operativa de campo.</Text>
    </View>

    <View style={styles.form}>
      <View style={styles.field}><Text style={styles.label}>Correo</Text><TextInput autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="nombre@empresa.com" placeholderTextColor={theme.colors.muted} value={email} onChangeText={setEmail} style={styles.input}/></View>
      <View style={styles.field}><Text style={styles.label}>Contraseña</Text><TextInput secureTextEntry placeholder="••••••••" placeholderTextColor={theme.colors.muted} value={password} onChangeText={setPassword} style={styles.input}/></View>
      <PrimaryButton title="Ingresar" busy={busy} onPress={() => void submit('in')}/>
      <PrimaryButton title="Crear cuenta piloto" disabled={busy} tone="neutral" onPress={() => void submit('up')}/>
    </View>

    <View style={styles.fieldNote}><View style={styles.fieldDot}/><Text style={styles.fieldNoteText}>Diseñado para registrar, inspeccionar y seguir acciones desde el teléfono.</Text></View>
  </Screen>;
}

const styles = StyleSheet.create({
  root: { justifyContent: 'center', paddingBottom: theme.spacing.xxl },
  brand: { alignItems: 'center', marginBottom: theme.spacing.xl },
  brandMark: { width: 64, height: 64, borderRadius: 21, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.lg, ...theme.shadow.raised },
  brandMarkText: { color: theme.colors.white, fontWeight: '900', fontSize: 17, letterSpacing: -0.5 },
  eyebrow: { color: theme.colors.primary, fontWeight: '900', letterSpacing: 2, fontSize: theme.type.micro },
  title: { fontSize: 34, lineHeight: 39, fontWeight: '900', color: theme.colors.ink, letterSpacing: -0.7, marginTop: 3 },
  copy: { color: theme.colors.muted, fontSize: 15, marginTop: 3 },
  form: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.xl, padding: theme.spacing.lg, gap: theme.spacing.md, ...theme.shadow.card },
  field: { gap: 6 },
  label: { color: theme.colors.inkSoft, fontSize: 11, fontWeight: '900' },
  input: { backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.md, minHeight: 54, paddingHorizontal: theme.spacing.lg, fontSize: 15, color: theme.colors.ink },
  fieldNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: theme.spacing.lg, paddingHorizontal: theme.spacing.xl },
  fieldDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.colors.success },
  fieldNoteText: { flexShrink: 1, color: theme.colors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center' },
});
