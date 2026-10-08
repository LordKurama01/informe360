import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../src/providers/auth-provider';
import { theme } from '../src/theme';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function submit(kind: 'in' | 'up') {
    if (busy) return;
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setFeedback('Ingresá un correo electrónico válido.');
      return;
    }
    if (password.length < 6) {
      setFeedback('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const message = await (kind === 'in' ? signIn(email.trim(), password) : signUp(email.trim(), password));
      if (message) setFeedback(message);
      else router.replace('/');
    } catch {
      setFeedback('No se pudo conectar. Comprobá tu conexión e intentá nuevamente.');
    } finally {
      setBusy(false);
    }
  }

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
    <StatusBar style="light"/>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.shell}>
          <View style={styles.hero}>
            <View style={styles.heroAccent}/>
            <View style={styles.brandRow}>
              <View style={styles.brandMark} accessible accessibilityLabel="Informe360 HSE, casco de seguridad">
                <View style={styles.helmetDome}/>
                <View style={styles.helmetRidge}/>
                <View style={styles.helmetBrim}/>
              </View>
              <View style={styles.brandCopy}>
                <Text style={styles.brandName}>INFORME360</Text>
                <Text style={styles.brandDescriptor}>HSE  /  FIELD OPERATIONS</Text>
              </View>
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroEyebrow}>PLATAFORMA OPERATIVA</Text>
              <Text style={styles.heroTitle}>Seguridad en cada operación.</Text>
              <Text style={styles.heroSubtitle}>Inspecciones, hallazgos y evidencias. Todo desde el campo.</Text>
            </View>
            <View style={styles.heroRule}><View style={styles.heroRuleActive}/></View>
          </View>

          <View style={styles.body}>
            <View style={styles.loginPanel}>
              <View style={styles.panelHeading}>
                <Text style={styles.panelTitle}>Accedé a tu espacio</Text>
                <Text style={styles.panelSubtitle}>Ingresá con tus credenciales de trabajo.</Text>
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Correo electrónico</Text>
                <TextInput
                  accessibilityLabel="Correo electrónico"
                  accessibilityHint="Ingresá el correo de tu cuenta Informe360"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  returnKeyType="next"
                  placeholder="tu@empresa.com"
                  placeholderTextColor="#87949A"
                  value={email}
                  editable={!busy}
                  onChangeText={value => { setEmail(value); setFeedback(null); }}
                  style={styles.input}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    accessibilityLabel="Contraseña"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    secureTextEntry={!passwordVisible}
                    placeholder="Ingresá tu contraseña"
                    placeholderTextColor="#87949A"
                    value={password}
                    editable={!busy}
                    onChangeText={value => { setPassword(value); setFeedback(null); }}
                    onSubmitEditing={() => void submit('in')}
                    returnKeyType="go"
                    style={styles.passwordInput}
                  />
                  <Pressable accessibilityRole="button" accessibilityLabel={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'} onPress={() => setPasswordVisible(value => !value)} hitSlop={8} style={styles.passwordAction}>
                    <Text style={styles.passwordActionText}>{passwordVisible ? 'Ocultar' : 'Ver'}</Text>
                  </Pressable>
                </View>
              </View>

              {feedback ? <View style={styles.feedback} accessibilityLiveRegion="polite"><Text style={styles.feedbackText}>{feedback}</Text></View> : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ingresar a Informe360"
                disabled={busy}
                onPress={() => void submit('in')}
                style={({ pressed }) => [styles.submit, (pressed || busy) && styles.submitPressed]}
              >
                {busy ? <ActivityIndicator color={theme.colors.white}/> : <Text style={styles.submitText}>Ingresar al sistema  ›</Text>}
              </Pressable>

              <View style={styles.panelDivider}/>
              <View style={styles.pilotRow}>
                <Text style={styles.pilotQuestion}>¿Tu empresa todavía no tiene acceso?</Text>
                <Pressable accessibilityRole="button" disabled={busy} onPress={() => void submit('up')} hitSlop={8}>
                  <Text style={styles.pilotLink}>Crear cuenta piloto  →</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.footer}>
              <View style={styles.footerRule}/>
              <Text style={styles.footerText}>INFORME360  ·  SEGURIDAD E HIGIENE INDUSTRIAL</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.dark },
  keyboard: { flex: 1 },
  scroll: { flexGrow: 1, backgroundColor: '#F2F5F5' },
  shell: { flexGrow: 1, width: '100%', maxWidth: 560, alignSelf: 'center', backgroundColor: '#F2F5F5' },
  hero: { position: 'relative', backgroundColor: '#07131F', paddingTop: 26, paddingHorizontal: 25, paddingBottom: 71, overflow: 'hidden' },
  heroAccent: { position: 'absolute', right: -110, top: 48, width: 225, height: 225, borderWidth: 1, borderRadius: 115, borderColor: 'rgba(255,138,31,0.18)' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandMark: { width: 48, height: 48, borderRadius: 13, backgroundColor: '#172A38', alignItems: 'center', justifyContent: 'center' },
  helmetDome: { position: 'absolute', top: 15, left: 11, width: 26, height: 17, borderTopLeftRadius: 14, borderTopRightRadius: 14, backgroundColor: '#E4F8F1' },
  helmetRidge: { position: 'absolute', top: 12, left: 22, width: 4, height: 20, borderRadius: 3, backgroundColor: '#FF8A1F' },
  helmetBrim: { position: 'absolute', top: 31, left: 7, width: 34, height: 4, borderRadius: 3, backgroundColor: '#E4F8F1' },
  brandCopy: { flex: 1, gap: 3 },
  brandName: { color: '#F5FFFF', fontSize: 17, fontWeight: '900', letterSpacing: 2.1 },
  brandDescriptor: { color: '#AAB7C1', fontSize: 9, fontWeight: '800', letterSpacing: 1.25 },
  heroText: { marginTop: 34, maxWidth: 345, gap: 11 },
  heroEyebrow: { color: '#FF9A2E', fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  heroTitle: { color: '#FFFFFF', fontSize: 31, lineHeight: 37, letterSpacing: -0.6, fontWeight: '900' },
  heroSubtitle: { color: '#C9D3DA', fontSize: 13, lineHeight: 20, maxWidth: 310 },
  heroRule: { width: 62, height: 3, marginTop: 24, backgroundColor: 'rgba(255,138,31,0.20)', borderRadius: 3, overflow: 'hidden' },
  heroRuleActive: { height: 3, width: 32, borderRadius: 3, backgroundColor: '#FF8A1F' },
  body: { flex: 1, marginTop: -41, paddingHorizontal: 17, paddingBottom: 26, justifyContent: 'space-between', gap: 30 },
  loginPanel: { paddingTop: 25, paddingBottom: 22, paddingHorizontal: 22, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3E9EA', gap: 16, ...theme.shadow.card },
  panelHeading: { gap: 5, marginBottom: 4 },
  panelTitle: { color: theme.colors.ink, fontSize: 22, lineHeight: 28, letterSpacing: -0.35, fontWeight: '900' },
  panelSubtitle: { color: '#667782', fontSize: 13, lineHeight: 18 },
  formField: { gap: 8 },
  label: { color: '#263C43', fontSize: 12, fontWeight: '800' },
  input: { height: 52, paddingHorizontal: 14, borderWidth: 1, borderColor: '#D5E0E2', borderRadius: 12, backgroundColor: '#F6F8F8', fontSize: 15, color: theme.colors.ink },
  passwordRow: { minHeight: 52, borderWidth: 1, borderColor: '#D5E0E2', borderRadius: 12, backgroundColor: '#F6F8F8', flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, minWidth: 0, height: 50, paddingHorizontal: 14, color: theme.colors.ink, fontSize: 15 },
  passwordAction: { minHeight: 44, minWidth: 58, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  passwordActionText: { color: theme.colors.primary, fontWeight: '800', fontSize: 12 },
  feedback: { borderRadius: 10, padding: 12, backgroundColor: '#FFF0ED', borderWidth: 1, borderColor: '#F4D7D1' },
  feedbackText: { color: '#9D271C', fontSize: 12, lineHeight: 18, fontWeight: '600' },
  submit: { height: 54, backgroundColor: theme.colors.primary, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  submitPressed: { opacity: 0.72 },
  submitText: { color: theme.colors.white, fontSize: 15, fontWeight: '900', letterSpacing: 0.1 },
  panelDivider: { height: 1, backgroundColor: '#E6ECEC', marginTop: 1 },
  pilotRow: { alignItems: 'center', gap: 8, paddingTop: 1 },
  pilotQuestion: { fontSize: 12, color: '#6A7A80', textAlign: 'center' },
  pilotLink: { color: theme.colors.primary, fontWeight: '800', fontSize: 13 },
  footer: { alignItems: 'center', gap: 12, paddingBottom: 10 },
  footerRule: { width: 28, height: 3, backgroundColor: '#B5C8C7', borderRadius: 2 },
  footerText: { fontSize: 9, lineHeight: 14, fontWeight: '800', textAlign: 'center', color: '#8B999D', letterSpacing: 0.8 },
});
