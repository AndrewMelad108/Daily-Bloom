import { Platform } from "react-native";
import notifee, { AndroidImportance, AuthorizationStatus } from "@notifee/react-native";
import { Language, translate } from "./locale";
import { timerNotificationState } from "./timerState";

const notificationId = "daily-bloom-focus-timer";
const channelId = "focus-timer";
// Serialize updates so a slow start cannot resurrect a cancelled or replaced timer.
let pending: Promise<void> = Promise.resolve();

export async function requestTimerPermission() {
  if (Platform.OS !== "android") return true;
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
}

export function syncTimerNotification(
  timer: { end: number | null; remaining: number } | null,
  name: string,
  language: Language,
): Promise<void> {
  const update = async () => {
    if (Platform.OS !== "android") return;
    const state = timerNotificationState(timer, Date.now());
    // Replace instead of update to clear Android's previous timeout when pausing.
    await notifee.cancelNotification(notificationId);
    if (!state) return;
    const settings = await notifee.getNotificationSettings();
    if (settings.authorizationStatus !== AuthorizationStatus.AUTHORIZED) return;
    await notifee.createChannel({
      id: channelId,
      name: translate(language, "إشعارات المؤقّت"),
      importance: AndroidImportance.LOW,
      vibration: false,
    });
    await notifee.displayNotification({
      id: notificationId,
      title: name,
      body: state.running
        ? translate(language, "الوقت المتبقي")
        : `${translate(language, "المؤقّت متوقف مؤقتًا")} · ${state.label}`,
      android: {
        channelId,
        smallIcon: "ic_stat_timer",
        ongoing: true,
        autoCancel: false,
        onlyAlertOnce: true,
        pressAction: { id: "default", launchActivity: "default" },
        ...(state.running ? {
          timestamp: state.end,
          showChronometer: true,
          chronometerDirection: "down" as const,
          // Android removes it at zero even when JS is suspended.
          timeoutAfter: state.timeout,
        } : { showChronometer: false }),
      },
    });
  };
  pending = pending.catch(() => {}).then(update);
  return pending;
}
