import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { useAuth } from '../src/providers/auth-provider';
import { theme } from '../src/theme';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(kind: 'in' | 'up') { setBusy(true); try { const message = await (kind === 'in' ? signIn(email, password) : signUp(email, password)); if (message) Alert.alert(kind === 'up' ? 'Registro' : 'No se pudo ingresar', message); else router.replace('/'); } finally { setBusy(false); } }
  return <Screen style={styles.root}><Text style={styles.eyebrow}>INFORME360</Text><Text style={styles.title}>HSE Copilot</Text><Text style={styles.copy}>Tu memoria operativa de campo.</Text><TextInput autoCapitalize="none" keyboardType="email-address" placeholder="Correo" value={email} onChangeText={setEmail} style={styles.input}/><TextInput secureTextEntry placeholder="Contraseña" value={password} onChangeText={setPassword} style={styles.input}/><PrimaryButton title="Ingresar" busy={busy} onPress={() => void submit('in')}/><PrimaryButton title="Crear cuenta piloto" disabled={busy} tone="neutral" onPress={() => void submit('up')}/></Screen>;
}
const styles = StyleSheet.create({ root: { justifyContent: 'center' }, eyebrow: { color: theme.colors.primary, fontWeight: '900', letterSpacing: 2 }, title: { fontSize: 36, fontWeight: '900', color: theme.colors.ink }, copy: { color: theme.colors.muted, fontSize: 17, marginBottom: 12 }, input: { backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.line, borderRadius: 14, minHeight: 52, paddingHorizontal: 15, fontSize: 16 } });
