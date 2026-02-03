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
    const sessionNotifiedIds = useRef<Set<string>>(new Set());

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
            if (streams && streams.length > 0) {
                await syncNotifications(streams);
            }
        };

        setup();
    }, [streams]);

    const syncNotifications = async (currentStreams: StreamInfo[]) => {
        // --- Part 1: Scheduled Reminders (Stream Start) ---
        // (Don't cancel all immediately to avoid notification gaps; only cancel if needed)
        // For simplicity in this current architecture, we still do it, but focused on Part 1
        await cancelAllNotifications();

        const settings = await getMemberSettings();
        const upcomingStreams = currentStreams.filter(s => s.status === 'upcoming');
        for (const stream of upcomingStreams) {
            const pref = settings[stream.channelId];
            if (pref ? pref.notify : true) {
                await scheduleStreamNotification(stream);
            }
        }

        // --- Part 2: New Content Notifications (Discovery) ---
        const notifiedStr = await AsyncStorage.getItem(NOTIFIED_IDS_KEY);
        const persistedNotifiedIds = notifiedStr ? JSON.parse(notifiedStr) as string[] : [];

        // Merge persistent and session IDs
        const knownIds = new Set([...persistedNotifiedIds, ...Array.from(sessionNotifiedIds.current)]);

        if (isFirstRun.current) {
            // Mark all current IDs as known without notifying
            const allCurrentIds = currentStreams.map(s => s.id);
            const newNotifiedList = [...new Set([...persistedNotifiedIds, ...allCurrentIds])];
            await AsyncStorage.setItem(NOTIFIED_IDS_KEY, JSON.stringify(newNotifiedList));
            allCurrentIds.forEach(id => sessionNotifiedIds.current.add(id));
            isFirstRun.current = false;
            return;
        }

        const newItemsToNotify: StreamInfo[] = [];
        for (const stream of currentStreams) {
            if (!knownIds.has(stream.id)) {
                const pref = settings[stream.channelId];
                if (pref ? pref.notify : true) {
                    newItemsToNotify.push(stream);
                }
            }
        }

        if (newItemsToNotify.length > 0) {
            // Notify for up to 3 new items at once
            for (const item of newItemsToNotify.slice(0, 3)) {
                await notifyNewContent(item);
                sessionNotifiedIds.current.add(item.id);
            }
        }

        // ALWAYS update the persisted list with ALL currently seen IDs
        // This ensures that even if we didn't notify (e.g. settings off), we won't treat them as 'new' later
        const finalNotifiedList = [...new Set([...persistedNotifiedIds, ...currentStreams.map(s => s.id)])];
        await AsyncStorage.setItem(NOTIFIED_IDS_KEY, JSON.stringify(finalNotifiedList));
        currentStreams.forEach(s => sessionNotifiedIds.current.add(s.id));
    };
};
