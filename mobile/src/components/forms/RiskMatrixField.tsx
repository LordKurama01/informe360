import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';

export type RiskMatrixValue = { likelihood: number; consequence: number; score: number; level: 'low'|'medium'|'high'|'critical' };
function level(score: number): RiskMatrixValue['level'] { return score <= 4 ? 'low' : score <= 9 ? 'medium' : score <= 16 ? 'high' : 'critical'; }

export function RiskMatrixField({ value, onChange, max = 5 }: { value?: Partial<RiskMatrixValue> | null; onChange(value: RiskMatrixValue): void; max?: number }) {
  const likelihood = value?.likelihood || 0;
  const consequence = value?.consequence || 0;
  const update = (nextLikelihood: number, nextConsequence: number) => {
    const score = nextLikelihood * nextConsequence;
    onChange({ likelihood: nextLikelihood, consequence: nextConsequence, score, level: level(score) });
  };
  return <View style={styles.wrap}>
    <Scale label="Probabilidad" value={likelihood} max={max} onPress={n => update(n, consequence || 1)}/>
    <Scale label="Consecuencia" value={consequence} max={max} onPress={n => update(likelihood || 1, n)}/>
    {likelihood && consequence ? <View style={styles.result}><Text style={styles.resultScore}>{likelihood} × {consequence} = {likelihood * consequence}</Text><Text style={styles.resultLevel}>{level(likelihood * consequence).toUpperCase()}</Text></View> : null}
  </View>;
}

function Scale({ label, value, max, onPress }: { label: string; value: number; max: number; onPress(n: number): void }) {
  return <View style={styles.group}><Text style={styles.label}>{label}</Text><View style={styles.row}>{Array.from({ length: max }, (_, i) => i + 1).map(n => <Pressable key={n} onPress={() => onPress(n)} style={[styles.cell, value === n && styles.cellOn]}><Text style={[styles.cellText, value === n && styles.cellTextOn]}>{n}</Text></Pressable>)}</View></View>;
}

const styles = StyleSheet.create({ wrap:{gap:10},group:{gap:5},label:{fontSize:12,fontWeight:'800',color:theme.colors.muted},row:{flexDirection:'row',gap:6},cell:{flex:1,minHeight:42,borderRadius:10,borderWidth:1,borderColor:theme.colors.line,alignItems:'center',justifyContent:'center',backgroundColor:'#fff'},cellOn:{backgroundColor:theme.colors.ink,borderColor:theme.colors.ink},cellText:{fontWeight:'900',color:theme.colors.ink},cellTextOn:{color:'#fff'},result:{flexDirection:'row',justifyContent:'space-between',padding:11,borderRadius:11,backgroundColor:'#F8FAFC'},resultScore:{fontWeight:'900',color:theme.colors.ink},resultLevel:{fontWeight:'900',color:theme.colors.primary,fontSize:11} });
