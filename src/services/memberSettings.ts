import AsyncStorage from '@react-native-async-storage/async-storage';

const MEMBER_SETTINGS_KEY = 'MEMBER_NOTIF_SETTINGS';

/**
 * Member-specific notification settings
 * key: channelId, value: boolean
 */
export interface MemberSettings {
    [channelId: string]: boolean;
}

export const saveMemberSettings = async (settings: MemberSettings) => {
    await AsyncStorage.setItem(MEMBER_SETTINGS_KEY, JSON.stringify(settings));
};

export const getMemberSettings = async (): Promise<MemberSettings> => {
    const data = await AsyncStorage.getItem(MEMBER_SETTINGS_KEY);
    return data ? JSON.parse(data) : {};
};

/**
 * Toggle notification for a specific channel
 */
export const toggleMemberNotification = async (channelId: string) => {
    const settings = await getMemberSettings();
    settings[channelId] = !settings[channelId];
    await saveMemberSettings(settings);
    return settings[channelId];
};
