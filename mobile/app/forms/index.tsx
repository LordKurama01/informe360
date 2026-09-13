import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useWorkspace } from '../../src/providers/workspace-provider';
import { listActiveFormTemplates } from '../../src/services/forms';
import { listOfflineFormDrafts } from '../../src/services/form-offline';
import type { FormTemplateSummary } from '../../src/types/forms';
import { theme } from '../../src/theme';

export default function FormsCatalog() {
  const { workspace } = useWorkspace();
  const [templates,setTemplates]=useState<FormTemplateSummary[]>([]);
  const [drafts,setDrafts]=useState(0);
  const [loading,setLoading]=useState(false);
  const load=useCallback(async()=>{ if(!workspace)return; setLoading(true); try{const [items,local]=await Promise.all([listActiveFormTemplates(workspace),listOfflineFormDrafts()]);setTemplates(items);setDrafts(local.length);}catch(error){Alert.alert('Formularios',error instanceof Error?error.message:'No se pudieron cargar');}finally{setLoading(false);}},[workspace]);
  useEffect(()=>{void load();},[load]);
  return <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load}/>} contentContainerStyle={styles.content}>
    <Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Volver</Text></Pressable>
    <View><Text style={styles.kicker}>HSE · FORMULARIOS</Text><Text style={styles.title}>Inspeccionar y evaluar</Text><Text style={styles.copy}>Una sola biblioteca para checklists, inspecciones, IPCR y futuros permisos de trabajo.</Text></View>
    {drafts>0?<View style={styles.draftBanner}><Text style={styles.draftTitle}>{drafts} borrador{drafts===1?'':'es'} local{drafts===1?'':'es'}</Text><Text style={styles.draftCopy}>El contenido permanece guardado en este teléfono hasta sincronizar.</Text></View>:null}
    <View style={styles.grid}>{templates.map(item=><Pressable key={item.id} onPress={()=>router.push(`/forms/${item.id}`)} style={styles.card}><View style={styles.cardTop}><Text style={styles.category}>{item.category.toUpperCase()}</Text><Text style={styles.version}>v{item.version}</Text></View><Text style={styles.cardTitle}>{item.name}</Text><Text style={styles.cardCopy}>{item.description||item.schema.description||'Formulario operativo HSE'}</Text><Text style={styles.open}>Abrir →</Text></Pressable>)}</View>
    {!templates.length&&!loading?<View style={styles.empty}><Text style={styles.emptyTitle}>No hay formularios publicados</Text><Text style={styles.emptyCopy}>Un administrador puede crear y publicar plantillas desde HSE Control Desktop.</Text></View>:null}
  </ScrollView>;
}
const styles=StyleSheet.create({content:{paddingTop:54,paddingHorizontal:18,paddingBottom:40,gap:16,backgroundColor:theme.colors.bg,minHeight:'100%'},back:{color:theme.colors.primary,fontWeight:'900'},kicker:{fontSize:10,letterSpacing:1.6,fontWeight:'900',color:theme.colors.primary},title:{fontSize:30,fontWeight:'900',color:theme.colors.ink,marginTop:2},copy:{color:theme.colors.muted,lineHeight:19,marginTop:4},draftBanner:{padding:14,borderRadius:15,backgroundColor:'#FFF7ED',borderWidth:1,borderColor:'#FED7AA'},draftTitle:{fontWeight:'900',color:'#9A3412'},draftCopy:{fontSize:11,color:'#C2410C',marginTop:2},grid:{gap:10},card:{backgroundColor:'#fff',borderWidth:1,borderColor:theme.colors.line,borderRadius:18,padding:16,gap:6},cardTop:{flexDirection:'row',justifyContent:'space-between'},category:{fontSize:10,fontWeight:'900',letterSpacing:1,color:theme.colors.primary},version:{fontSize:10,fontWeight:'800',color:theme.colors.muted},cardTitle:{fontSize:18,fontWeight:'900',color:theme.colors.ink},cardCopy:{color:theme.colors.muted,lineHeight:18},open:{marginTop:5,color:theme.colors.primary,fontWeight:'900'},empty:{backgroundColor:'#fff',borderWidth:1,borderColor:theme.colors.line,borderRadius:18,padding:24,alignItems:'center'},emptyTitle:{fontSize:17,fontWeight:'900',color:theme.colors.ink},emptyCopy:{textAlign:'center',color:theme.colors.muted,marginTop:5}});
