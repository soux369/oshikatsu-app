import AsyncStorage from '@react-native-async-storage/async-storage';

const MEMBER_SETTINGS_KEY = 'MEMBER_NOTIF_SETTINGS';

/**
 * Member-specific notification settings
 * key: channelId, value: boolean
 */
export interface NotificationSettings {
    [channelId: string]: boolean;
}

export const saveNotificationSettings = async (settings: NotificationSettings) => {
    await AsyncStorage.setItem(MEMBER_SETTINGS_KEY, JSON.stringify(settings));
};

export const getNotificationSettings = async (): Promise<NotificationSettings> => {
    const data = await AsyncStorage.getItem(MEMBER_SETTINGS_KEY);
    return data ? JSON.parse(data) : {};
};

/**
 * Toggle notification for a specific channel
 */
export const toggleMemberNotification = async (channelId: string) => {
    const settings = await getNotificationSettings();
    settings[channelId] = !settings[channelId];
    await saveNotificationSettings(settings);
    return settings[channelId];
};
