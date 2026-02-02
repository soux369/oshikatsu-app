import * as Notifications from 'expo-notifications';
import { StreamInfo } from '../types/youtube';
import { Platform } from 'react-native';

// Configure how notifications should behave when the app is foregrounded
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    return finalStatus === 'granted';
};

/**
 * Schedule a local notification for an upcoming stream
 * @param stream The stream info
 * @param minutesBefore How many minutes before start to notify
 */
export const scheduleStreamNotification = async (stream: StreamInfo, minutesBefore: number = 5) => {
    if (!stream.scheduledStartTime) return;

    const startTime = new Date(stream.scheduledStartTime).getTime();
    const triggerTime = startTime - minutesBefore * 60 * 1000;

    // Don't schedule if the trigger time is in the past
    if (triggerTime <= Date.now()) return;

    const identifier = await Notifications.scheduleNotificationAsync({
        content: {
            title: `【配信予約】${stream.channelTitle}`,
            body: `${stream.title}\nもうすぐ配信が始まります！`,
            data: { url: `https://www.youtube.com/watch?v=${stream.id}` },
        },
        trigger: {
            date: new Date(triggerTime),
        },
    });

    return identifier;
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
};

/**
 * Helper to open YouTube app from notification data
 */
export const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const url = response.notification.request.content.data?.url;
    if (url) {
        // Logic to open URL in browser or YouTube app
        console.log('Opening URL:', url);
    }
};
