import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import axios from 'axios';

// GASのウェブアプリURLをここに設定
const GAS_URL = 'あなたのGASウェブアプリURL';

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }

        // ProjectID is required for Expo Go and newer SDKs
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('Expo Push Token:', token);

        // GASにトークンを登録
        if (GAS_URL && GAS_URL !== 'あなたのGASウェブアプリURL') {
            try {
                await axios.post(GAS_URL, {
                    action: 'register',
                    token: token
                });
                console.log('Token registered to GAS');
            } catch (e) {
                console.error('Failed to register token to GAS', e);
            }
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}
