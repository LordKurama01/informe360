import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
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

function captureId() {
  return `cap-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function Register() {
  const { workspace } = useWorkspace();
  const { refreshPending } = useSync();
  const [mode, setMode] = useState<Mode>('text');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, directory: 'document' });
  const recorderState = useAudioRecorderState(recorder);

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
    try {
      await submit({ id: captureId(), workspace, inputType: 'text', rawText: text.trim(), createdAt: new Date().toISOString(), attempts: 0 });
    } finally {
      setBusy(false);
    }
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
    try {
      await submit({ id: captureId(), workspace, inputType: 'photo', rawText: text.trim() || null, mediaUri: asset.uri, mimeType: asset.mimeType || 'image/jpeg', createdAt: new Date().toISOString(), attempts: 0 });
    } finally {
      setBusy(false);
    }
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
      } catch (error) {
        Alert.alert('Audio', error instanceof Error ? error.message : 'No se pudo guardar la grabación');
      } finally {
        setBusy(false);
      }
      return;
    }
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) return Alert.alert('Micrófono', 'Necesitamos permiso para grabar.');
    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  return <Screen>
    <View style={styles.head}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Volver</Text></Pressable>
      <Text style={styles.eyebrow}>CAPTURA DE CAMPO</Text>
      <Text style={styles.title}>Registrar hallazgo</Text>
      <Text style={styles.subtitle}>La captura original se conserva. La IA ayuda a estructurar; vos confirmás antes de crear el hallazgo.</Text>
    </View>

    <View style={styles.switch}>
      {(['text', 'audio', 'photo'] as Mode[]).map(item => <Pressable key={item} onPress={() => setMode(item)} style={[styles.mode, mode === item && styles.modeOn]}>
        <Text style={[styles.modeText, mode === item && styles.modeTextOn]}>{item === 'text' ? '✍️ Texto' : item === 'audio' ? '🎙️ Voz' : '📷 Foto'}</Text>
      </Pressable>)}
    </View>

    {mode === 'text' ? <>
      <Text style={styles.label}>Contalo como lo dirías normalmente. Lugar, problema, responsable y fecha pueden ir en una sola frase.</Text>
      <TextInput multiline placeholder="Ej.: Sala de bombas. Hay una pérdida en la manguera hidráulica. Que mantenimiento la revise mañana." value={text} onChangeText={setText} style={styles.textarea}/>
      <PrimaryButton title="Revisar hallazgo" busy={busy} onPress={() => void processText()}/>
    </> : null}

    {mode === 'audio' ? <View style={styles.center}>
      <Pressable onPress={() => void toggleAudio()} style={[styles.audio, recorderState.isRecording && styles.recording]}>
        <Text style={styles.audioIcon}>{recorderState.isRecording ? '■' : '🎙️'}</Text>
      </Pressable>
      <Text style={styles.audioTitle}>{recorderState.isRecording ? 'Grabando… tocá para terminar' : 'Tocá y hablá'}</Text>
      <Text style={styles.label}>{recorderState.isRecording ? `${Math.round(recorderState.durationMillis / 1000)} s` : 'El audio queda guardado incluso si perdés conexión.'}</Text>
    </View> : null}

    {mode === 'photo' ? <>
      <Text style={styles.label}>Agregá una nota opcional y sacá la foto. Se comprime antes de subir para ahorrar datos sin perder detalle operativo.</Text>
      <TextInput multiline placeholder="Ej.: etiqueta ilegible del matafuego del taller" value={text} onChangeText={setText} style={styles.textarea}/>
      <PrimaryButton title="Abrir cámara" busy={busy} onPress={() => void pickPhoto()}/>
    </> : null}
  </Screen>;
}

const styles = StyleSheet.create({
  head: { gap: 6 }, back: { color: theme.colors.primary, fontWeight: '800' }, eyebrow: { color: theme.colors.primary, fontWeight: '900', letterSpacing: 1.6, fontSize: 10, marginTop: 4 },
  title: { fontSize: 32, fontWeight: '900', color: theme.colors.ink }, subtitle: { color: theme.colors.muted, lineHeight: 20 },
  switch: { flexDirection: 'row', gap: 8 }, mode: { flex: 1, paddingVertical: 12, borderRadius: 13, backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.line, alignItems: 'center' }, modeOn: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }, modeText: { fontWeight: '800', color: theme.colors.muted, fontSize: 12 }, modeTextOn: { color: '#fff' },
  label: { color: theme.colors.muted, lineHeight: 20 }, textarea: { minHeight: 150, backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.line, borderRadius: 16, padding: 15, textAlignVertical: 'top', fontSize: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }, audio: { width: 156, height: 156, borderRadius: 78, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 6 }, recording: { backgroundColor: theme.colors.danger }, audioIcon: { fontSize: 48, color: '#fff' }, audioTitle: { fontSize: 20, fontWeight: '900', color: theme.colors.ink },
});
