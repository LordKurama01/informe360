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
  bar: {
    height: 69, paddingTop: 5, paddingBottom: 7,
    backgroundColor: '#FFFFFF', borderTopColor: '#E1E7E2', borderTopWidth: 1,
  },
  item: { paddingVertical: 0, justifyContent: 'center' },
  label: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  iconWrap: { width: 30, height: 29, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: '#FDEFE5' },
  icon: { color: '#74827D', fontSize: 20, fontWeight: '700' },
  iconActive: { color: theme.colors.primary },
  captureButton: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -5, gap: 1 },
  captureCircle: {
    width: 44, height: 44, borderRadius: 15,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  capturePlus: { color: '#FFFFFF', fontSize: 28, lineHeight: 31, fontWeight: '600' },
  captureLabel: { color: theme.colors.primary, fontSize: 10, fontWeight: '800' },
  capturePressed: { opacity: 0.78, transform: [{ scale: 0.96 }] },
});
