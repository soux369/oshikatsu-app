import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestNotificationPermissions, scheduleStreamNotification, cancelAllNotifications, notifyNewContent } from '../services/notification';
import { getMemberSettings } from '../services/memberSettings';
import { StreamInfo } from '../types/youtube';

const NOTIFIED_IDS_KEY = 'NOTIFIED_CONTENT_IDS';

export const useNotifications = (streams: StreamInfo[], onRefresh?: () => void) => {
    const isFirstRun = useRef(true);

    // Listen for notification received while in foreground
    useEffect(() => {
        const subscription = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification received in foreground, refreshing data...');
            if (onRefresh) onRefresh();
        });
        return () => subscription.remove();
    }, [onRefresh]);

    // Listener for notification clicks
    useEffect(() => {
        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            const url = response.notification.request.content.data?.url;
            if (typeof url === 'string') {
                Linking.openURL(url);
            }
        });
        return () => subscription.remove();
    }, []);

    useEffect(() => {
        const setup = async () => {
            const granted = await requestNotificationPermissions();
            if (!granted) return;

            // When streams list updates, sync notifications
            await syncNotifications(streams);
        };

        setup();
    }, [streams]);

    const syncNotifications = async (currentStreams: StreamInfo[]) => {
        // Strategy for Scheduled Reminders: Cancel all and reschedule
        // (Simple but effective for upcoming start times)
        await cancelAllNotifications();

        const settings = await getMemberSettings();

        // --- Part 1: Scheduled Reminders (Stream Start) ---
        const upcomingStreams = currentStreams.filter(s => s.status === 'upcoming');
        for (const stream of upcomingStreams) {
            const pref = settings[stream.channelId];
            const isEnabled = pref ? pref.notify : true;
            if (isEnabled) {
                await scheduleStreamNotification(stream);
            }
        }

        // --- Part 2: New Content Notifications (New discovery) ---
        // We only notify for NEW entries that we haven't seen before.
        // We skip this check on the very first run of the app to avoid spamming 50+ notifications.
        const notifiedStr = await AsyncStorage.getItem(NOTIFIED_IDS_KEY);
        const notifiedIds = notifiedStr ? JSON.parse(notifiedStr) as string[] : [];

        if (isFirstRun.current) {
            // First time we see data in this session, just mark everything as 'seen'
            const currentIds = currentStreams.map(s => s.id);
            await AsyncStorage.setItem(NOTIFIED_IDS_KEY, JSON.stringify([...new Set([...notifiedIds, ...currentIds])]));
            isFirstRun.current = false;
            return;
        }

        const newItems = [];
        for (const stream of currentStreams) {
            if (!notifiedIds.includes(stream.id)) {
                const pref = settings[stream.channelId];
                const isEnabled = pref ? pref.notify : true;
                if (isEnabled) {
                    newItems.push(stream);
                }
            }
        }

        if (newItems.length > 0) {
            // Notify for up to 3 new items at once to avoid spam
            for (const item of newItems.slice(0, 3)) {
                await notifyNewContent(item);
            }

            // Mark all as notified
            const allNotified = [...new Set([...notifiedIds, ...currentStreams.map(s => s.id)])];
            await AsyncStorage.setItem(NOTIFIED_IDS_KEY, JSON.stringify(allNotified));
        }
    };
};
