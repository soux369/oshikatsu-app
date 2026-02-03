import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import axios from 'axios';

// GASのウェブアプリURLをExpoの設定から取得
const GAS_URL = Constants.expoConfig?.extra?.gasUrl;

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

        // ProjectID is required for Expo Go and newer SDKs.
        // If you haven't set up EAS yet, this might be undefined.
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

        try {
            token = (await Notifications.getExpoPushTokenAsync(
                projectId && !projectId.includes('your-project-id') ? { projectId } : undefined
            )).data;
            console.log('Expo Push Token:', token);
        } catch (tokenError) {
            console.error('Failed to get Expo Push Token. If you are using Expo Go, make sure you are logged in.', tokenError);
            return;
        }

        // GASにトークンを登録
        if (GAS_URL) {
            try {
                await axios.post(GAS_URL, {
                    action: 'register',
                    token: token
                });
                console.log('Token registered to GAS');
                Alert.alert('通知設定', 'スマホの登録が完了しました！これで通知が届きます。');
            } catch (e) {
                console.error('Failed to register token to GAS', e);
                Alert.alert('通知設定エラー', 'GASへの登録に失敗しました。URLを確認してください。');
            }
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}
