import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useWorkspace } from '../../src/providers/workspace-provider';
import { listPendingReminders } from '../../src/services/findings';
import { theme } from '../../src/theme';

type ReminderFinding = { title:string; code:string };
type ReminderRow = { id:string; scheduled_for:string; status:string; finding_id:string|null; findings:ReminderFinding|null };
type RawReminderRow = Omit<ReminderRow,'findings'> & { findings:ReminderFinding|ReminderFinding[]|null };

export default function Alerts(){
  const{workspace}=useWorkspace();
  const[items,setItems]=useState<ReminderRow[]>([]);
  const[busy,setBusy]=useState(false);
  const load=useCallback(async()=>{if(!workspace)return;setBusy(true);try{const raw=await listPendingReminders(workspace) as unknown as RawReminderRow[];setItems(raw.map(item=>({...item,findings:Array.isArray(item.findings)?item.findings[0]||null:item.findings})));}finally{setBusy(false)}},[workspace]);
  useEffect(()=>{void load()},[load]);
  const grouped=useMemo(()=>{const now=Date.now(), day=86400000;return {overdue:items.filter(i=>new Date(i.scheduled_for).getTime()<now),today:items.filter(i=>{const t=new Date(i.scheduled_for).getTime();return t>=now&&t<now+day}),later:items.filter(i=>new Date(i.scheduled_for).getTime()>=now+day)}},[items]);
  return <View style={styles.safe}><ScrollView refreshControl={<RefreshControl refreshing={busy} onRefresh={load}/>} contentContainerStyle={styles.content}>
    <Text style={styles.kicker}>SEGUIMIENTO OPERATIVO</Text><Text style={styles.title}>Alertas</Text><Text style={styles.copy}>La fecha almacenada en Informe360 es la fuente de verdad. La notificación sólo es el canal de aviso.</Text>
    <AlertGroup title="Vencidas" items={grouped.overdue} danger/><AlertGroup title="Hoy" items={grouped.today}/><AlertGroup title="Próximas" items={grouped.later}/>
    {!items.length&&!busy?<View style={styles.empty}><Text style={styles.emptyIcon}>✓</Text><Text style={styles.emptyTitle}>Sin alertas pendientes</Text><Text style={styles.copy}>No hay vencimientos operativos esperando atención.</Text></View>:null}
  </ScrollView></View>
}
function AlertGroup({title,items,danger=false}:{title:string;items:ReminderRow[];danger?:boolean}){if(!items.length)return null;return <View style={styles.group}><Text style={[styles.section,danger&&styles.sectionDanger]}>{title} · {items.length}</Text>{items.map(item=><Pressable key={item.id} disabled={!item.finding_id} onPress={()=>item.finding_id&&router.push(`/finding/${item.finding_id}`)} style={[styles.card,danger&&styles.cardDanger]}><View style={styles.row}><Text style={styles.code}>{item.findings?.code||'HSE'}</Text><Text style={[styles.date,danger&&styles.dateDanger]}>{new Date(item.scheduled_for).toLocaleString('es-AR')}</Text></View><Text style={styles.cardTitle}>{item.findings?.title||'Hallazgo'}</Text><Text style={styles.open}>Abrir seguimiento →</Text></Pressable>)}</View>}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:theme.colors.bg},content:{paddingTop:58,paddingHorizontal:18,paddingBottom:34,gap:12},kicker:{color:theme.colors.primary,fontSize:10,fontWeight:'900',letterSpacing:1.5},title:{fontSize:30,fontWeight:'900',color:theme.colors.ink},copy:{color:theme.colors.muted,lineHeight:19},group:{gap:8,marginTop:4},section:{fontWeight:'900',color:theme.colors.ink,fontSize:16},sectionDanger:{color:theme.colors.danger},card:{backgroundColor:'#fff',padding:15,borderRadius:16,borderWidth:1,borderColor:theme.colors.line,gap:6},cardDanger:{borderColor:'#FECACA',backgroundColor:'#FFFBFB'},row:{flexDirection:'row',justifyContent:'space-between',gap:8},code:{fontWeight:'900',fontSize:10,color:theme.colors.primary,letterSpacing:.5},cardTitle:{fontWeight:'900',color:theme.colors.ink,fontSize:15},date:{color:theme.colors.warning,fontSize:11,fontWeight:'800'},dateDanger:{color:theme.colors.danger},open:{color:theme.colors.primary,fontWeight:'900',fontSize:11},empty:{backgroundColor:'#fff',borderWidth:1,borderColor:theme.colors.line,borderRadius:18,padding:24,alignItems:'center',gap:6},emptyIcon:{fontSize:28,color:theme.colors.success},emptyTitle:{fontSize:17,fontWeight:'900',color:theme.colors.ink}});
