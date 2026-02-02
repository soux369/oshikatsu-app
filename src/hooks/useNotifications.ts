import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { requestNotificationPermissions, scheduleStreamNotification, cancelAllNotifications } from '../services/notification';
import { getMemberSettings } from '../services/memberSettings';
import { StreamInfo } from '../types/youtube';

export const useNotifications = (streams: StreamInfo[]) => {
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
        // Strategy: Cancel all and reschedule based on current filtered streams
        // This is simple but effective for a prototype
        await cancelAllNotifications();

        const settings = await getMemberSettings();
        const upcomingStreams = currentStreams.filter(s => s.status === 'upcoming');

        for (const stream of upcomingStreams) {
            // Default to ON if not set specifically
            const pref = settings[stream.channelId];
            const isEnabled = pref ? pref.notify : true; // Default true
            if (isEnabled) {
                await scheduleStreamNotification(stream);
            }
        }
    };

    // Listener for notification clicks
    useEffect(() => {
        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            const url = response.notification.request.content.data?.url;
            if (url) {
                Linking.openURL(url);
            }
        });
        return () => subscription.remove();
    }, []);
};
