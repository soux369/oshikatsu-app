import AsyncStorage from '@react-native-async-storage/async-storage';

const MEMBER_SETTINGS_KEY = 'MEMBER_V3_SETTINGS'; // New key for the new format

export interface MemberPreference {
    display: boolean;
    notify: boolean;
}

export interface MemberSettingsMap {
    [channelId: string]: MemberPreference;
}

export const saveMemberSettings = async (settings: MemberSettingsMap) => {
    await AsyncStorage.setItem(MEMBER_SETTINGS_KEY, JSON.stringify(settings));
};

export const getMemberSettings = async (): Promise<MemberSettingsMap> => {
    const data = await AsyncStorage.getItem(MEMBER_SETTINGS_KEY);
    if (!data) {
        // Migration or default
        const oldKey = 'MEMBER_NOTIF_SETTINGS';
        const oldData = await AsyncStorage.getItem(oldKey);
        if (oldData) {
            const parsed = JSON.parse(oldData);
            const migrated: MemberSettingsMap = {};
            Object.keys(parsed).forEach(id => {
                migrated[id] = { display: parsed[id], notify: parsed[id] };
            });
            return migrated;
        }
        return {};
    }
    return JSON.parse(data);
};

// Aliases for compatibility during transition
export const getNotificationSettings = getMemberSettings;
export const saveNotificationSettings = saveMemberSettings;
export type NotificationSettings = MemberSettingsMap;
