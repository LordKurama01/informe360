import { StyleSheet, Text, View } from 'react-native';
import type { AiRuntimeStatus } from '../services/ai-status';

const tone = { ready: { bg: '#ECFDF5', dot: '#16A34A', text: '#166534' }, manual: { bg: '#EFF6FF', dot: '#2563EB', text: '#1D4ED8' }, offline: { bg: '#FFF7ED', dot: '#EA580C', text: '#9A3412' } } as const;

export function AiStatusPill({ status }: { status: AiRuntimeStatus }) {
  const colors = tone[status.state];
  return <View style={[styles.wrap, { backgroundColor: colors.bg }]}><View style={[styles.dot, { backgroundColor: colors.dot }]}/><Text style={[styles.text, { color: colors.text }]}>{status.label}</Text></View>;
}

const styles = StyleSheet.create({ wrap: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }, dot: { width: 7, height: 7, borderRadius: 4 }, text: { fontWeight: '900', fontSize: 10 } });
