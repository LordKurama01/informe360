import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { DynamicForm } from '../../src/components/forms/DynamicForm';
import { getFormRunBundle, submitFormRun } from '../../src/services/forms';
import { removeOfflineFormDraft, saveOfflineFormDraft } from '../../src/services/form-offline';
import type { FormRunBundle, HseFormAnswers } from '../../src/types/forms';
import { theme } from '../../src/theme';

export default function FormRunPage(){
  const {runId}=useLocalSearchParams<{runId:string}>();
  const [bundle,setBundle]=useState<FormRunBundle|null>(null);
  const [answers,setAnswers]=useState<HseFormAnswers>({});
  const [busy,setBusy]=useState(false);
  const load=useCallback(async()=>{if(!runId)return;try{const next=await getFormRunBundle(runId);setBundle(next);setAnswers(next.answers);}catch(error){Alert.alert('Formulario',error instanceof Error?error.message:'No se pudo cargar');}},[runId]);
  useEffect(()=>{void load();},[load]);
  async function persistLocal(next:HseFormAnswers){if(!bundle||!runId)return;setAnswers(next);await saveOfflineFormDraft({clientRunId:runId,serverRunId:runId,templateVersionId:bundle.version.id,templateId:bundle.template.id,siteId:bundle.run.site_id,answers:next});}
  async function submit(next:HseFormAnswers){if(!bundle||!runId)return;setBusy(true);try{await submitFormRun(runId,next);await removeOfflineFormDraft(runId);Alert.alert('Formulario enviado','Las respuestas quedaron registradas y versionadas.',[{text:'OK',onPress:()=>router.replace('/forms')}]);}catch(error){await persistLocal(next);Alert.alert('Guardado en el teléfono','No pudimos enviar ahora. El formulario quedó guardado localmente y no se enviará sin tu confirmación.',[{text:'Entendido'}]);}finally{setBusy(false);}}
  if(!bundle)return <View style={styles.loading}><Text>Cargando ejecución…</Text></View>;
  const readOnly=['submitted','reviewed','cancelled'].includes(bundle.run.status);
  return <ScrollView contentContainerStyle={styles.content}>
    <View style={styles.top}><Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Volver</Text></Pressable><Text style={styles.status}>{bundle.run.status.toUpperCase()}</Text></View>
    <View><Text style={styles.kicker}>{bundle.template.category.toUpperCase()} · v{bundle.version.version}</Text><Text style={styles.title}>{bundle.template.name}</Text><Text style={styles.copy}>Iniciado {new Date(bundle.run.started_at).toLocaleString('es-AR')}</Text></View>
    <DynamicForm schema={bundle.version.schema_json} initialAnswers={answers} readOnly={readOnly} submitLabel={busy?'Guardando…':'Enviar formulario'} onChange={next=>{if(!readOnly)void persistLocal(next);}} onSubmit={submit}/>
    {readOnly?<View style={styles.locked}><Text style={styles.lockedTitle}>Ejecución cerrada para edición</Text><Text style={styles.lockedCopy}>Las respuestas corresponden a una versión histórica de la plantilla y permanecen auditables.</Text></View>:null}
  </ScrollView>;
}
const styles=StyleSheet.create({loading:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:theme.colors.bg},content:{paddingTop:54,paddingHorizontal:18,paddingBottom:44,gap:16,backgroundColor:theme.colors.bg,minHeight:'100%'},top:{flexDirection:'row',justifyContent:'space-between'},back:{color:theme.colors.primary,fontWeight:'900'},status:{fontSize:10,fontWeight:'900',color:theme.colors.muted,letterSpacing:1},kicker:{fontSize:10,fontWeight:'900',color:theme.colors.primary,letterSpacing:1.2},title:{fontSize:28,fontWeight:'900',color:theme.colors.ink,marginTop:2},copy:{fontSize:11,color:theme.colors.muted,marginTop:3},locked:{backgroundColor:'#F8FAFC',borderRadius:14,padding:14,borderWidth:1,borderColor:theme.colors.line},lockedTitle:{fontWeight:'900',color:theme.colors.ink},lockedCopy:{fontSize:11,color:theme.colors.muted,marginTop:3,lineHeight:16}});
