import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AiStatusPill } from '../../src/components/AiStatusPill';
import { FindingCard } from '../../src/components/FindingCard';
import { useAuth } from '../../src/providers/auth-provider';
import { useSync } from '../../src/providers/sync-provider';
import { useWorkspace } from '../../src/providers/workspace-provider';
import { getAiRuntimeStatus, type AiRuntimeStatus } from '../../src/services/ai-status';
import { getDashboardSummary, listFindings } from '../../src/services/findings';
import { listPendingReviews } from '../../src/services/pending-reviews';
import type { DashboardSummary, Finding } from '../../src/types/hse';
import { theme } from '../../src/theme';

const emptySummary: DashboardSummary = {
  open: 0, overdue: 0, dueNext7Days: 0, closed: 0,
  closedOnTime: 0, closureCompliancePct: 0, criticalOpen: 0,
};

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Buen día' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
}

export default function Home() {
  const { workspace } = useWorkspace();
  const { signOut } = useAuth();
  const { pendingCount, syncing, syncNow, refreshPending } = useSync();
  const [items, setItems] = useState<Finding[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [reviewCount, setReviewCount] = useState(0);
  const [aiStatus, setAiStatus] = useState<AiRuntimeStatus>({
    state: 'manual', label: 'Comprobando IA', detail: '',
  });
  const [refreshing, setRefreshing] = useState(false);
  const [dataState, setDataState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async (manual = false) => {
    if (!workspace) return;
    if (manual) setRefreshing(true);
    setLoadError(null);
    try {
      const [findings, dashboard, reviews, runtime] = await Promise.all([
        listFindings(workspace),
        getDashboardSummary(workspace),
        listPendingReviews(workspace),
        getAiRuntimeStatus(),
      ]);
      setItems(findings);
      setSummary(dashboard);
      setReviewCount(reviews.length);
      setAiStatus(runtime);
      setDataState('ready');
      void refreshPending().catch(() => undefined);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudieron consultar los datos.';
      setLoadError(message);
      setDataState('error');
      if (manual) Alert.alert('No se pudo actualizar', message);
    } finally {
      if (manual) setRefreshing(false);
    }
  }, [workspace, refreshPending]);

  useEffect(() => { void load(); }, [load]);

  async function manualSync() {
    try {
      const result = await syncNow();
      if (result.synced) Alert.alert('Sincronización completa',
        `${result.synced} captura${result.synced === 1 ? '' : 's'} sincronizada${result.synced === 1 ? '' : 's'}.`);
    } catch (cause) {
      Alert.alert('Sincronización', cause instanceof Error ? cause.message : 'No se pudo sincronizar.');
    }
    await load(true);
  }

  const metricValue = (value: number) => dataState === 'ready' ? String(value) : '—';
  const compliance = dataState === 'ready'
    ? summary.closed > 0 ? `${summary.closureCompliancePct}% de cierres en plazo` : 'Sin cierres registrados'
    : dataState === 'loading' ? 'Actualizando indicadores…' : 'Datos no disponibles';

  return <SafeAreaView edges={['top','left','right']} style={styles.safe}>
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.colors.primary} />}
      contentContainerStyle={styles.content}>

      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>INFORME360 <Text style={styles.brandAccent}>/ HSE</Text></Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión" onPress={() => void signOut()} style={styles.exitButton}>
            <Text style={styles.exitText}>Salir</Text>
          </Pressable>
        </View>
        <Text style={styles.greeting}>{greeting()}</Text>
        <Text style={styles.site} numberOfLines={1}>{workspace?.siteName || 'Seleccioná un sitio'}</Text>
        {workspace?.organizationName ? <Text style={styles.organization} numberOfLines={1}>{workspace.organizationName}</Text> : null}
        <View style={styles.headerStatus}>
          <AiStatusPill status={aiStatus}/>
          {pendingCount > 0 ? <Text style={styles.pendingIndicator}>{pendingCount} por sincronizar</Text> : null}
        </View>
      </View>

      <View style={styles.body}>
        {pendingCount > 0 ? <Pressable accessibilityRole="button" onPress={() => void manualSync()} style={styles.notice}>
          <Text style={styles.noticeIcon}>↻</Text>
          <View style={styles.noticeCopy}>
            <Text style={styles.noticeTitle}>{syncing ? 'Sincronizando capturas…' : `${pendingCount} captura${pendingCount === 1 ? '' : 's'} pendiente${pendingCount === 1 ? '' : 's'}`}</Text>
            <Text style={styles.noticeSub}>Se conservan en el teléfono hasta enviarlas.</Text>
          </View>
          <Text style={styles.noticeAction}>{syncing ? '•••' : 'Enviar ›'}</Text>
        </Pressable> : null}

        {reviewCount > 0 ? <Pressable accessibilityRole="button" onPress={() => router.push('/pending-reviews')} style={styles.notice}>
          <Text style={styles.noticeIcon}>✓</Text>
          <View style={styles.noticeCopy}>
            <Text style={styles.noticeTitle}>{reviewCount} captura{reviewCount === 1 ? '' : 's'} para revisar</Text>
            <Text style={styles.noticeSub}>Sincronizadas; falta confirmación humana.</Text>
          </View>
          <Text style={styles.noticeAction}>Revisar ›</Text>
        </Pressable> : null}

        <Text style={styles.sectionEyebrow}>ACCESO RÁPIDO</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Registrar un hallazgo por voz" onPress={() => router.push('/register?mode=audio')}
          style={({pressed}) => [styles.voiceAction, pressed && styles.pressed]}>
          <View style={styles.voiceMark}><MaterialCommunityIcons name="microphone" size={25} color="#FFFFFF"/></View>
          <View style={styles.voiceCopy}>
            <Text style={styles.voiceLabel}>CAPTURA DE CAMPO</Text>
            <Text style={styles.voiceTitle}>Registrar por voz</Text>
            <Text style={styles.voiceSub}>Hablá y seguí trabajando</Text>
          </View>
          <Text style={styles.voiceArrow}>›</Text>
        </Pressable>

        <View style={styles.quickRow}>
          <QuickAction icon="clipboard-check-outline" title="Inspeccionar" onPress={() => router.push('/(tabs)/inspections')}/>
          <QuickAction icon="camera-outline" title="Fotografía" onPress={() => router.push('/register?mode=photo')}/>
          <QuickAction icon="pencil-outline" title="Escribir" onPress={() => router.push('/register?mode=text')}/>
        </View>

        <View style={styles.sectionTop}>
          <View>
            <Text style={styles.sectionTitle}>Estado del sitio</Text>
            <Text style={styles.sectionSubtitle}>{compliance}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/findings')} style={styles.sectionLink}>
            <Text style={styles.sectionLinkText}>Hallazgos ›</Text>
          </Pressable>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <CompactMetric label="Abiertos" value={metricValue(summary.open)} tint={theme.colors.primary} onPress={() => router.push('/(tabs)/findings?filter=open')}/>
            <View style={styles.verticalRule}/>
            <CompactMetric label="Vencidos" value={metricValue(summary.overdue)} tint={theme.colors.danger} onPress={() => router.push('/(tabs)/findings?filter=overdue')}/>
          </View>
          <View style={styles.horizontalRule}/>
          <View style={styles.summaryRow}>
            <CompactMetric label="Próximos 7 días" value={metricValue(summary.dueNext7Days)} tint={theme.colors.warning} onPress={() => router.push('/(tabs)/findings?filter=upcoming')}/>
            <View style={styles.verticalRule}/>
            <CompactMetric label="Cerrados" value={metricValue(summary.closed)} tint={theme.colors.success} onPress={() => router.push('/(tabs)/findings?filter=closed')}/>
          </View>
        </View>

        {loadError ? <Pressable accessibilityRole="button" onPress={() => void load(true)} style={styles.errorNotice}>
          <Text style={styles.errorText}>No se pudo actualizar el panel. Tocá para reintentar.</Text>
        </Pressable> : null}

        {summary.criticalOpen > 0 && dataState === 'ready' ? <Pressable accessibilityRole="button"
          onPress={() => router.push('/(tabs)/findings?filter=critical')} style={styles.critical}>
          <View style={styles.criticalIcon}><Text style={styles.criticalSymbol}>!</Text></View>
          <View style={styles.noticeCopy}>
            <Text style={styles.criticalTitle}>{summary.criticalOpen} hallazgo{summary.criticalOpen === 1 ? '' : 's'} crítico{summary.criticalOpen === 1 ? '' : 's'}</Text>
            <Text style={styles.criticalSub}>Requiere atención prioritaria</Text>
          </View><Text style={styles.noticeAction}>Ver ›</Text>
        </Pressable> : null}

        <View style={styles.sectionTop}>
          <Text style={styles.sectionTitle}>Actividad reciente</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/findings')} style={styles.sectionLink}>
            <Text style={styles.sectionLinkText}>Ver todos ›</Text>
          </Pressable>
        </View>
        {items.length > 0 && dataState === 'ready' ? <View style={styles.recent}>
          {items.slice(0,3).map(item => <FindingCard key={item.id} finding={item} onPress={() => router.push(`/finding/${item.id}`)}/>)}
        </View> : dataState === 'ready' ? <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Sin actividad registrada</Text>
          <Text style={styles.emptyText}>Los hallazgos que registres en campo aparecerán acá.</Text>
        </View> : null}

        <Text style={styles.bottomNote}>{aiStatus.detail || 'Captura disponible desde el teléfono.'}</Text>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

function QuickAction({icon,title,onPress}:{icon:ComponentProps<typeof MaterialCommunityIcons>['name'];title:string;onPress:()=>void}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress}
    style={({pressed}) => [styles.quickAction,pressed && styles.pressed]}>
    <View style={styles.quickIcon}><MaterialCommunityIcons name={icon} size={19} color={theme.colors.primary}/></View>
    <Text style={styles.quickText}>{title}</Text>
  </Pressable>;
}

function CompactMetric({label,value,tint,onPress}:{label:string;value:string;tint:string;onPress:()=>void}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} onPress={onPress}
    style={({pressed})=>[styles.metric,pressed && styles.pressed]}>
    <Text style={[styles.metricValue,{color:tint}]}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:theme.colors.dark},
  scroll:{flex:1,backgroundColor:'#F5F7F4'},
  content:{paddingBottom:88},
  header:{backgroundColor:theme.colors.dark,paddingHorizontal:22,paddingTop:15,paddingBottom:22,borderBottomLeftRadius:24,borderBottomRightRadius:24},
  brandRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:13},
  brand:{color:'#F7FAF8',fontWeight:'900',fontSize:11,letterSpacing:1.6},
  brandAccent:{color:'#F7AB73'},
  exitButton:{minHeight:38,minWidth:52,alignItems:'center',justifyContent:'center',borderRadius:12,borderWidth:1,borderColor:'#30413F'},
  exitText:{color:'#DAE4DF',fontSize:11,fontWeight:'700'},
  greeting:{fontSize:26,lineHeight:31,fontWeight:'800',letterSpacing:-0.5,color:'#FFFFFF'},
  site:{fontSize:15,lineHeight:21,color:'#E4EDEA',fontWeight:'700',marginTop:5},
  organization:{fontSize:11,color:'#A7B8B2',marginTop:1},
  headerStatus:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:13,minHeight:30},
  pendingIndicator:{color:'#FFCEA7',fontSize:11,fontWeight:'700'},
  body:{paddingHorizontal:17,paddingTop:21,gap:13},
  sectionEyebrow:{fontSize:10,fontWeight:'800',letterSpacing:1.3,color:'#78857F',marginBottom:-4},
  voiceAction:{minHeight:104,backgroundColor:theme.colors.primary,borderRadius:18,paddingHorizontal:16,paddingVertical:17,flexDirection:'row',alignItems:'center',gap:12},
  voiceMark:{width:45,height:45,borderRadius:15,backgroundColor:'rgba(255,255,255,0.15)',alignItems:'center',justifyContent:'center'},
  voiceCopy:{flex:1,gap:3},
  voiceLabel:{fontSize:9,color:'#FFE4D0',fontWeight:'900',letterSpacing:1.1},
  voiceTitle:{fontSize:19,lineHeight:23,color:'#FFFFFF',fontWeight:'900'},
  voiceSub:{fontSize:11,color:'#FFF1E8'},
  voiceArrow:{fontSize:30,color:'#FFFFFF',fontWeight:'300'},
  quickRow:{flexDirection:'row',gap:10},
  quickAction:{flex:1,minHeight:86,borderRadius:16,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#DFE5E1',alignItems:'center',justifyContent:'center',gap:8},
  quickIcon:{width:29,height:29,borderRadius:10,backgroundColor:'#F2F5F2',justifyContent:'center',alignItems:'center'},
  quickText:{fontSize:11,color:'#27372F',fontWeight:'800'},
  sectionTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10,marginTop:7},
  sectionTitle:{fontSize:18,lineHeight:22,color:'#15231F',fontWeight:'900',letterSpacing:-0.4},
  sectionSubtitle:{fontSize:11,color:'#697973',marginTop:3},
  sectionLink:{minHeight:38,justifyContent:'center',paddingLeft:8},
  sectionLinkText:{fontSize:11,fontWeight:'800',color:theme.colors.primary},
  summaryCard:{backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#E0E6E2',borderRadius:18,paddingHorizontal:12,paddingVertical:4},
  summaryRow:{flexDirection:'row',alignItems:'center',minHeight:82},
  metric:{flex:1,paddingHorizontal:12,paddingVertical:13},
  metricValue:{fontSize:26,fontWeight:'900',lineHeight:30},
  metricLabel:{color:'#5E6B65',fontSize:11,fontWeight:'700',marginTop:1},
  verticalRule:{width:1,height:43,backgroundColor:'#E4EAE5'},
  horizontalRule:{height:1,backgroundColor:'#E8ECE8',marginHorizontal:12},
  notice:{backgroundColor:'#FFF4E9',borderWidth:1,borderColor:'#F8D8C2',minHeight:69,borderRadius:14,padding:12,flexDirection:'row',alignItems:'center',gap:11},
  noticeIcon:{fontSize:23,color:theme.colors.primary,fontWeight:'700'},
  noticeCopy:{flex:1,gap:3},
  noticeTitle:{fontSize:12,fontWeight:'800',color:'#563B2E'},
  noticeSub:{fontSize:11,lineHeight:16,color:'#806C61'},
  noticeAction:{fontSize:11,fontWeight:'900',color:theme.colors.primary},
  critical:{backgroundColor:'#FFF2F1',borderColor:'#F6D8D3',borderWidth:1,minHeight:64,borderRadius:14,padding:12,flexDirection:'row',gap:10,alignItems:'center'},
  criticalIcon:{width:29,height:29,borderRadius:10,backgroundColor:'#F9DCD7',alignItems:'center',justifyContent:'center'},
  criticalSymbol:{fontSize:16,color:theme.colors.danger,fontWeight:'900'},
  criticalTitle:{fontSize:12,fontWeight:'900',color:theme.colors.danger},
  criticalSub:{fontSize:11,color:'#895B54'},
  errorNotice:{borderRadius:12,borderWidth:1,borderColor:'#F1C2BE',backgroundColor:'#FFF2F1',padding:14},
  errorText:{color:theme.colors.danger,fontSize:12,fontWeight:'700'},
  recent:{gap:9},
  emptyCard:{backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#E0E6E2',borderRadius:17,padding:19,gap:5},
  emptyTitle:{fontSize:14,fontWeight:'800',color:'#20312A'},
  emptyText:{fontSize:12,lineHeight:18,color:'#74827C'},
  bottomNote:{fontSize:10,lineHeight:15,color:'#76857C',textAlign:'center',paddingVertical:8},
  pressed:{opacity:0.77,transform:[{scale:0.985}]},
});
