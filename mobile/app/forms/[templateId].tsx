import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useWorkspace } from '../../src/providers/workspace-provider';
import { getPublishedTemplate, startFormRun } from '../../src/services/forms';
import type { FormTemplateSummary } from '../../src/types/forms';
import { theme } from '../../src/theme';

export default function FormTemplatePage(){
  const { templateId }=useLocalSearchParams<{templateId:string}>();
  const { workspace }=useWorkspace();
  const [template,setTemplate]=useState<FormTemplateSummary|null>(null);
  const [busy,setBusy]=useState(false);
  useEffect(()=>{if(!templateId)return;void getPublishedTemplate(templateId).then(setTemplate).catch(error=>Alert.alert('Formulario',error instanceof Error?error.message:'No se pudo abrir'));},[templateId]);
  async function start(){if(!template||!workspace)return;setBusy(true);try{const {runId}=await startFormRun(template.publishedVersionId,workspace.siteId);router.replace(`/form-run/${runId}`);}catch(error){Alert.alert('No se pudo iniciar',error instanceof Error?error.message:'Verificá la conexión');}finally{setBusy(false);}}
  if(!template)return <View style={styles.loading}><Text>Cargando formulario…</Text></View>;
  const fields=template.schema.sections.reduce((sum,section)=>sum+section.fields.length,0);
  return <ScrollView contentContainerStyle={styles.content}>
    <Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Volver</Text></Pressable>
    <View style={styles.hero}><Text style={styles.kicker}>{template.category.toUpperCase()} · VERSIÓN {template.version}</Text><Text style={styles.title}>{template.name}</Text><Text style={styles.copy}>{template.description||template.schema.description||'Formulario operativo HSE'}</Text><View style={styles.meta}><Text style={styles.metaText}>{template.schema.sections.length} secciones</Text><Text style={styles.metaText}>{fields} campos</Text></View></View>
    <View style={styles.preview}>{template.schema.sections.map(section=><View key={section.id} style={styles.section}><Text style={styles.sectionTitle}>{section.title}</Text>{section.description?<Text style={styles.sectionCopy}>{section.description}</Text>:null}<Text style={styles.sectionCount}>{section.fields.length} campo{section.fields.length===1?'':'s'}</Text></View>)}</View>
    <Pressable disabled={busy} onPress={()=>void start()} style={styles.primary}><Text style={styles.primaryText}>{busy?'Iniciando…':'Iniciar formulario'}</Text></Pressable><Text style={styles.note}>Las respuestas se guardan bajo la versión publicada actual. Si la plantilla cambia mañana, esta ejecución conserva exactamente lo que se preguntó hoy.</Text>
  </ScrollView>;
}
const styles=StyleSheet.create({loading:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:theme.colors.bg},content:{paddingTop:54,paddingHorizontal:18,paddingBottom:40,gap:16,backgroundColor:theme.colors.bg,minHeight:'100%'},back:{color:theme.colors.primary,fontWeight:'900'},hero:{backgroundColor:theme.colors.ink,borderRadius:24,padding:20,gap:6},kicker:{color:'#99F6E4',fontWeight:'900',fontSize:10,letterSpacing:1.2},title:{fontSize:29,fontWeight:'900',color:'#fff'},copy:{color:'#CBD5E1',lineHeight:19},meta:{flexDirection:'row',gap:8,marginTop:7},metaText:{backgroundColor:'rgba(255,255,255,.08)',color:'#E2E8F0',paddingVertical:6,paddingHorizontal:9,borderRadius:9,fontSize:10,fontWeight:'800'},preview:{gap:8},section:{backgroundColor:'#fff',borderWidth:1,borderColor:theme.colors.line,borderRadius:15,padding:14},sectionTitle:{fontWeight:'900',color:theme.colors.ink},sectionCopy:{fontSize:11,color:theme.colors.muted,marginTop:3},sectionCount:{fontSize:10,color:theme.colors.primary,fontWeight:'900',marginTop:7},primary:{backgroundColor:theme.colors.primary,borderRadius:14,minHeight:52,alignItems:'center',justifyContent:'center'},primaryText:{color:'#fff',fontWeight:'900'},note:{fontSize:10,color:theme.colors.muted,textAlign:'center',lineHeight:15}});
