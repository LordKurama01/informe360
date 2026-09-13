import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { theme } from '../../src/theme';
const Icon = ({ value }: { value: string }) => <Text style={{ fontSize: 18 }}>{value}</Text>;
export default function TabsLayout() { return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: theme.colors.primary, tabBarStyle: { height: 66, paddingBottom: 8, paddingTop: 6 } }}><Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: () => <Icon value="⌂"/> }}/><Tabs.Screen name="findings" options={{ title: 'Hallazgos', tabBarIcon: () => <Icon value="✓"/> }}/><Tabs.Screen name="alerts" options={{ title: 'Alertas', tabBarIcon: () => <Icon value="!"/> }}/></Tabs>; }
