import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { FieldHeader } from '../../src/components/FieldHeader';
import { Screen } from '../../src/components/Screen';
import { theme } from '../../src/theme';

export default function CaptureHub() {
  return <Screen>
    <FieldHeader kicker="CAPTURA DE CAMPO" title="Registrá lo que ves" subtitle="Elegí la forma más rápida. La captura se guarda y después la revisás antes de convertirla en hallazgo."/>

    <Pressable accessibilityRole="button" onPress={() => router.push('/register?mode=audio')} style={({ pressed }) => [styles.voice, pressed && styles.pressed]}>
      <View style={styles.voiceIcon}><Text style={styles.voiceIconText}>●</Text></View>
      <View style={styles.voiceCopy}>
        <Text style={styles.voiceKicker}>MÁS RÁPIDO EN CAMPO</Text>
        <Text style={styles.voiceTitle}>Hablar</Text>
        <Text style={styles.voiceText}>Tocá, describí el hallazgo y seguí caminando.</Text>
      </View>
      <Text style={styles.voiceArrow}>›</Text>
    </Pressable>

    <Text style={styles.or}>O registrá con</Text>
    <View style={styles.grid}>
      <CaptureCard icon="▣" title="Foto" description="Documentá la condición y agregá una nota opcional." onPress={() => router.push('/register?mode=photo')}/>
      <CaptureCard icon="T" title="Texto" description="Escribí una frase corta con lugar, problema y acción." onPress={() => router.push('/register?mode=text')}/>
    </View>

    <View style={styles.offline}>
      <View style={styles.offlineDot}/>
      <View style={styles.offlineCopy}><Text style={styles.offlineTitle}>Preparado para mala conexión</Text><Text style={styles.offlineText}>Si no hay red, Informe360 guarda la captura en este teléfono y la sincroniza después.</Text></View>
    </View>
  </Screen>;
}

function CaptureCard({ icon, title, description, onPress }: { icon: string; title: string; description: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
    <View style={styles.cardIcon}><Text style={styles.cardIconText}>{icon}</Text></View>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardText}>{description}</Text>
    <Text style={styles.cardAction}>Abrir →</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  voice: { minHeight: 176, borderRadius: theme.radius.xl, backgroundColor: theme.colors.primary, padding: theme.spacing.xl, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, ...theme.shadow.raised },
  voiceIcon: { width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  voiceIconText: { color: theme.colors.white, fontSize: 28, lineHeight: 30 },
  voiceCopy: { flex: 1 },
  voiceKicker: { color: '#B8FFF7', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  voiceTitle: { color: theme.colors.white, fontSize: 27, lineHeight: 32, fontWeight: '900', marginTop: 3 },
  voiceText: { color: '#D9FFFB', fontSize: 12, lineHeight: 17, marginTop: 4 },
  voiceArrow: { color: theme.colors.white, fontSize: 34, fontWeight: '300' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  or: { color: theme.colors.muted, fontSize: 11, fontWeight: '800', textAlign: 'center', marginTop: 2 },
  grid: { flexDirection: 'row', gap: theme.spacing.sm },
  card: { flex: 1, minHeight: 188, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: theme.colors.surface, padding: theme.spacing.lg, ...theme.shadow.card },
  cardIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md },
  cardIconText: { color: theme.colors.primary, fontSize: 18, fontWeight: '900' },
  cardTitle: { color: theme.colors.ink, fontSize: 18, fontWeight: '900' },
  cardText: { flex: 1, color: theme.colors.muted, fontSize: 11, lineHeight: 16, marginTop: 5 },
  cardAction: { color: theme.colors.primary, fontSize: 11, fontWeight: '900', marginTop: theme.spacing.md },
  offline: { marginTop: 2, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surfaceMuted, padding: theme.spacing.lg, flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md },
  offlineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: theme.colors.success, marginTop: 5 },
  offlineCopy: { flex: 1 },
  offlineTitle: { color: theme.colors.ink, fontSize: 13, fontWeight: '900' },
  offlineText: { color: theme.colors.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
});
