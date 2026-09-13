import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { FieldHeader } from '../src/components/FieldHeader';
import { Screen } from '../src/components/Screen';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { useWorkspace } from '../src/providers/workspace-provider';
import { useSync } from '../src/providers/sync-provider';
import { processCapture } from '../src/services/capture-pipeline';
import { clearRawDraft, loadRawDraft, saveRawDraft } from '../src/services/drafts';
import { persistCaptureFile } from '../src/services/media';
import { hasInternetConnection } from '../src/services/network';
import { queueOfflineCapture, type OfflineCapture } from '../src/services/offline-queue';
import { theme } from '../src/theme';

type Mode = 'text' | 'audio' | 'photo';

function captureId() { return `cap-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }
function validMode(value?: string): Mode { return value === 'audio' || value === 'photo' ? value : 'text'; }

const modeCopy: Record<Mode, { title: string; hint: string }> = {
  audio: { title: 'Contalo hablando', hint: 'Ideal para recorridas. Grabá lo que ves sin frenar la tarea.' },
  photo: { title: 'Documentalo con una foto', hint: 'Capturá la condición y agregá contexto si hace falta.' },
  text: { title: 'Escribilo en una frase', hint: 'Lugar, problema, responsable y fecha pueden ir juntos.' },
};

export default function Register() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const { workspace } = useWorkspace();
  const { refreshPending } = useSync();
  const [mode, setMode] = useState<Mode>(() => validMode(params.mode));
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, directory: 'document' });
  const recorderState = useAudioRecorderState(recorder);

  useEffect(() => { setMode(validMode(params.mode)); }, [params.mode]);
  useEffect(() => {
    void loadRawDraft().then(draft => { if (draft?.text) setText(draft.text); });
    void AudioModule.requestRecordingPermissionsAsync();
    void setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
  }, []);

  async function queue(capture: OfflineCapture) {
    let mediaUri = capture.mediaUri;
    if (mediaUri && capture.inputType === 'photo') mediaUri = await persistCaptureFile(mediaUri, 'jpg');
    if (mediaUri && capture.inputType === 'audio') mediaUri = await persistCaptureFile(mediaUri, 'm4a');
    await queueOfflineCapture({ ...capture, mediaUri, lastError: null });
    await refreshPending();
    await clearRawDraft();
    Alert.alert('Guardado offline', 'La captura quedó segura en el teléfono. Se sincronizará cuando vuelva la conexión y quedará pendiente de revisión.');
    router.replace('/(tabs)');
  }

  async function submit(capture: OfflineCapture) {
    const online = await hasInternetConnection();
    if (!online) return queue(capture);
    try {
      await processCapture(capture, true);
      await clearRawDraft();
      router.push('/review-draft');
    } catch {
      await queue(capture);
    }
  }

  async function processText() {
    if (!workspace || text.trim().length < 3) return Alert.alert('Falta el hallazgo', 'Escribí al menos una frase.');
    setBusy(true);
    await saveRawDraft({ mode: 'text', text, savedAt: new Date().toISOString() });
    try { await submit({ id: captureId(), workspace, inputType: 'text', rawText: text.trim(), createdAt: new Date().toISOString(), attempts: 0 }); }
    finally { setBusy(false); }
  }

  async function pickPhoto() {
    if (!workspace) return;
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return Alert.alert('Cámara', 'Necesitamos permiso de cámara.');
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (result.canceled) return;
    const asset = result.assets[0];
    setBusy(true);
    await saveRawDraft({ mode: 'photo', text, savedAt: new Date().toISOString() });
    try { await submit({ id: captureId(), workspace, inputType: 'photo', rawText: text.trim() || null, mediaUri: asset.uri, mimeType: asset.mimeType || 'image/jpeg', createdAt: new Date().toISOString(), attempts: 0 }); }
    finally { setBusy(false); }
  }

  async function toggleAudio() {
    if (!workspace) return;
    if (recorderState.isRecording) {
      setBusy(true);
      try {
        await recorder.stop();
        const uri = recorder.uri;
        if (!uri) throw new Error('No se generó el audio');
        await submit({ id: captureId(), workspace, inputType: 'audio', rawText: text.trim() || null, mediaUri: uri, mimeType: 'audio/mp4', createdAt: new Date().toISOString(), attempts: 0 });
      } catch (error) { Alert.alert('Audio', error instanceof Error ? error.message : 'No se pudo guardar la grabación'); }
      finally { setBusy(false); }
      return;
    }
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) return Alert.alert('Micrófono', 'Necesitamos permiso para grabar.');
    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  return <Screen>
    <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>‹ Volver</Text></Pressable>
    <FieldHeader kicker="CAPTURA DE CAMPO" title={modeCopy[mode].title} subtitle={modeCopy[mode].hint}/>

    <View style={styles.switch}>{(['audio', 'photo', 'text'] as Mode[]).map(item => <Pressable accessibilityRole="button" key={item} onPress={() => setMode(item)} style={[styles.mode, mode === item && styles.modeOn]}><Text style={[styles.modeIcon, mode === item && styles.modeIconOn]}>{item === 'audio' ? '●' : item === 'photo' ? '▣' : 'T'}</Text><Text style={[styles.modeText, mode === item && styles.modeTextOn]}>{item === 'audio' ? 'Voz' : item === 'photo' ? 'Foto' : 'Texto'}</Text></Pressable>)}</View>

    {mode === 'text' ? <View style={styles.panel}>
      <Text style={styles.label}>Describí el hallazgo como lo dirías normalmente.</Text>
      <TextInput multiline placeholder="Ej.: Sala de bombas. Hay una pérdida en la manguera hidráulica. Que mantenimiento la revise mañana." placeholderTextColor={theme.colors.muted} value={text} onChangeText={setText} style={styles.textarea}/>
      <PrimaryButton title="Revisar hallazgo" busy={busy} onPress={() => void processText()}/>
    </View> : null}

    {mode === 'audio' ? <View style={styles.audioPanel}>
      <View style={[styles.recordState, recorderState.isRecording && styles.recordStateOn]}><View style={[styles.recordDot, recorderState.isRecording && styles.recordDotOn]}/><Text style={[styles.recordStateText, recorderState.isRecording && styles.recordStateTextOn]}>{recorderState.isRecording ? 'GRABANDO' : 'LISTO PARA GRABAR'}</Text></View>
      <Pressable accessibilityRole="button" onPress={() => void toggleAudio()} disabled={busy} style={({ pressed }) => [styles.audio, recorderState.isRecording && styles.recording, (pressed || busy) && styles.pressed]}><Text style={styles.audioIcon}>{recorderState.isRecording ? '■' : '●'}</Text></Pressable>
      <Text style={styles.audioTitle}>{recorderState.isRecording ? 'Tocá para terminar' : 'Tocá y hablá'}</Text>
      <Text style={styles.audioHelp}>{recorderState.isRecording ? `${Math.round(recorderState.durationMillis / 1000)} segundos` : 'El audio queda guardado incluso si perdés conexión.'}</Text>
      {busy ? <Text style={styles.processing}>Procesando captura…</Text> : null}
    </View> : null}

    {mode === 'photo' ? <View style={styles.panel}>
      <View style={styles.photoHint}><View style={styles.photoIcon}><Text style={styles.photoIconText}>▣</Text></View><Text style={styles.photoHintText}>La foto se comprime antes de subir para ahorrar datos sin perder detalle operativo.</Text></View>
      <Text style={styles.label}>Nota opcional</Text>
      <TextInput multiline placeholder="Ej.: etiqueta ilegible del matafuego del taller" placeholderTextColor={theme.colors.muted} value={text} onChangeText={setText} style={styles.textarea}/>
      <PrimaryButton title="Abrir cámara" busy={busy} onPress={() => void pickPhoto()}/>
    </View> : null}

    <View style={styles.safety}><View style={styles.safetyDot}/><Text style={styles.safetyText}>La captura original se conserva. La IA estructura y vos confirmás antes de crear el hallazgo.</Text></View>
  </Screen>;
}

const styles = StyleSheet.create({
  backButton: { alignSelf: 'flex-start', minHeight: 42, justifyContent: 'center' },
  back: { color: theme.colors.primary, fontWeight: '900' },
  switch: { flexDirection: 'row', gap: theme.spacing.sm, backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radius.lg, padding: 5 },
  mode: { flex: 1, minHeight: 56, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', gap: 2 },
  modeOn: { backgroundColor: theme.colors.surface, ...theme.shadow.card },
  modeIcon: { color: theme.colors.muted, fontSize: 13, fontWeight: '900' },
  modeIconOn: { color: theme.colors.primary },
  modeText: { color: theme.colors.muted, fontWeight: '800', fontSize: 10 },
  modeTextOn: { color: theme.colors.ink },
  panel: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.xl, padding: theme.spacing.lg, gap: theme.spacing.md, ...theme.shadow.card },
  label: { color: theme.colors.inkSoft, fontSize: 12, lineHeight: 18, fontWeight: '800' },
  textarea: { minHeight: 150, backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.md, padding: theme.spacing.lg, textAlignVertical: 'top', fontSize: 15, lineHeight: 21, color: theme.colors.ink },
  audioPanel: { minHeight: 360, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.xl, padding: theme.spacing.xl, gap: theme.spacing.md, ...theme.shadow.card },
  recordState: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  recordStateOn: { backgroundColor: theme.colors.dangerSoft },
  recordDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.colors.muted },
  recordDotOn: { backgroundColor: theme.colors.danger },
  recordStateText: { color: theme.colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  recordStateTextOn: { color: theme.colors.danger },
  audio: { width: 154, height: 154, borderRadius: 77, backgroundColor: theme.colors.primary, borderWidth: 12, borderColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center', ...theme.shadow.raised },
  recording: { backgroundColor: theme.colors.danger, borderColor: theme.colors.dangerSoft },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  audioIcon: { fontSize: 45, color: theme.colors.white },
  audioTitle: { fontSize: 20, fontWeight: '900', color: theme.colors.ink },
  audioHelp: { color: theme.colors.muted, lineHeight: 18, fontSize: 12, textAlign: 'center' },
  processing: { color: theme.colors.primary, fontSize: 11, fontWeight: '900' },
  photoHint: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius.md, padding: theme.spacing.md },
  photoIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(11,111,103,0.1)', alignItems: 'center', justifyContent: 'center' },
  photoIconText: { color: theme.colors.primary, fontWeight: '900' },
  photoHintText: { flex: 1, color: theme.colors.primaryDark, fontSize: 11, lineHeight: 16 },
  safety: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingHorizontal: theme.spacing.sm },
  safetyDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.colors.success, marginTop: 5 },
  safetyText: { flex: 1, color: theme.colors.muted, fontSize: 10, lineHeight: 15 },
});
