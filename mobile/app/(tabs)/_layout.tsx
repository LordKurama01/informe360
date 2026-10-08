import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../src/theme';

function TabIcon({ name, focused }: { name: ComponentProps<typeof MaterialCommunityIcons>['name']; focused: boolean }) {
  return <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
    <MaterialCommunityIcons name={name} size={21} color={focused ? theme.colors.primary : '#74827D'}/>
  </View>;
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
    <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: ({ focused }) => <TabIcon name={focused ? "home-variant" : "home-variant-outline"} focused={focused}/> }}/>
    <Tabs.Screen name="findings" options={{ title: 'Hallazgos', tabBarIcon: ({ focused }) => <TabIcon name="clipboard-text-outline" focused={focused}/> }}/>
    <Tabs.Screen name="capture" options={{
      title: 'Capturar',
      tabBarButton: ({ onPress, accessibilityState }) => <Pressable accessibilityRole="button" accessibilityState={accessibilityState} onPress={onPress} style={({ pressed }) => [styles.captureButton, pressed && styles.capturePressed]}>
        <View style={styles.captureCircle}><MaterialCommunityIcons name="plus" size={29} color="#FFFFFF"/></View>
        <Text style={styles.captureLabel}>Capturar</Text>
      </Pressable>,
    }}/>
    <Tabs.Screen name="inspections" options={{ title: 'Inspecciones', tabBarIcon: ({ focused }) => <TabIcon name="clipboard-check-outline" focused={focused}/> }}/>
    <Tabs.Screen name="alerts" options={{ title: 'Alertas', tabBarIcon: ({ focused }) => <TabIcon name={focused ? "bell" : "bell-outline"} focused={focused}/> }}/>
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
  captureButton: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -5, gap: 1 },
  captureCircle: {
    width: 44, height: 44, borderRadius: 15,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  captureLabel: { color: theme.colors.primary, fontSize: 10, fontWeight: '800' },
  capturePressed: { opacity: 0.78, transform: [{ scale: 0.96 }] },
});
