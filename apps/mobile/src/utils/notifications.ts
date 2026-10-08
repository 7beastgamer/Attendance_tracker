import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Task } from '../shared';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#64ffda',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

export async function scheduleTaskReminders(tasks: Task[]) {
  // Clear all previously scheduled notifications to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  
  for (const task of tasks) {
    if (task.done) continue;

    const dueDate = new Date(task.dueAt);
    
    // Schedule a reminder 1 hour before the task is due
    const reminderTime = new Date(dueDate.getTime() - 60 * 60 * 1000);
    
    // Only schedule if the reminder time is in the future
    if (reminderTime > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Upcoming Deadline ⏰",
          body: `"${task.title}" is due soon! Don't forget to submit.`,
          data: { taskId: task.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderTime,
        },
      });
    }
  }
}
