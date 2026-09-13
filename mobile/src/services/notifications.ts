import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }) });

export async function ensureNotificationPermission() { const current = await Notifications.getPermissionsAsync(); if (current.granted) return true; const next = await Notifications.requestPermissionsAsync(); return next.granted; }
export async function scheduleFindingReminder(findingId: string, title: string, dueAt: string | null) {
  if (!dueAt) return null;
  const date = new Date(dueAt);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return null;
  if (!(await ensureNotificationPermission())) return null;
  return Notifications.scheduleNotificationAsync({ content: { title: 'HSE Copilot · Vencimiento', body: title, data: { url: `/finding/${findingId}`, findingId } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date } });
}
