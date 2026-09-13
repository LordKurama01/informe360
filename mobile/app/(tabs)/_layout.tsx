import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../src/theme';

function TabIcon({ value, focused }: { value: string; focused: boolean }) {
  return <View style={[styles.iconWrap, focused && styles.iconWrapActive]}><Text style={[styles.icon, focused && styles.iconActive]}>{value}</Text></View>;
}

export default function TabsLayout() {
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: theme.colors.muted,
    tabBarHideOnKeyboard: true,
    tabBarLabelStyle: styles.label,
    tabBarStyle: styles.bar,
    tabBarItemStyle: styles.item,
  }}>
    <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: ({ focused }) => <TabIcon value="⌂" focused={focused}/> }}/>
    <Tabs.Screen name="findings" options={{ title: 'Hallazgos', tabBarIcon: ({ focused }) => <TabIcon value="◇" focused={focused}/> }}/>
    <Tabs.Screen name="capture" options={{
      title: 'Capturar',
      tabBarButton: ({ onPress, accessibilityState }) => <Pressable accessibilityRole="button" accessibilityState={accessibilityState} onPress={onPress} style={({ pressed }) => [styles.captureButton, pressed && styles.capturePressed]}>
        <View style={styles.captureCircle}><Text style={styles.capturePlus}>＋</Text></View>
        <Text style={styles.captureLabel}>Capturar</Text>
      </Pressable>,
    }}/>
    <Tabs.Screen name="inspections" options={{ title: 'Inspecciones', tabBarIcon: ({ focused }) => <TabIcon value="✓" focused={focused}/> }}/>
    <Tabs.Screen name="alerts" options={{ title: 'Alertas', tabBarIcon: ({ focused }) => <TabIcon value="!" focused={focused}/> }}/>
  </Tabs>;
}

const styles = StyleSheet.create({
  bar: { height: 78, paddingTop: 7, paddingBottom: 9, backgroundColor: theme.colors.surface, borderTopColor: theme.colors.line, borderTopWidth: 1, ...theme.shadow.card },
  item: { paddingVertical: 1 },
  label: { fontSize: 9, fontWeight: '800', marginTop: 1 },
  iconWrap: { width: 30, height: 27, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: theme.colors.primarySoft },
  icon: { color: theme.colors.muted, fontSize: 18, fontWeight: '900' },
  iconActive: { color: theme.colors.primary },
  captureButton: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', marginTop: -19 },
  captureCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: theme.colors.primary, borderWidth: 5, borderColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center', ...theme.shadow.raised },
  capturePlus: { color: theme.colors.white, fontSize: 30, lineHeight: 32, fontWeight: '500' },
  captureLabel: { color: theme.colors.primary, fontSize: 9, fontWeight: '900', marginTop: 2 },
  capturePressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
