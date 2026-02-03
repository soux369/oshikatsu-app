import {
    createMaterialTopTabNavigator,
    MaterialTopTabNavigationOptions,
    MaterialTopTabNavigationEventMap,
} from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import { COLORS } from '../src/constants/theme';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext<
    MaterialTopTabNavigationOptions,
    typeof Navigator,
    TabNavigationState<ParamListBase>,
    MaterialTopTabNavigationEventMap
>(Navigator);

import { useEffect } from 'react';
import { registerForPushNotificationsAsync } from '../src/services/notifications';

export default function Layout() {
    useEffect(() => {
        registerForPushNotificationsAsync();
    }, []);

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top']}>
                <StatusBar style="light" backgroundColor={COLORS.background} />
                <MaterialTopTabs
                    screenOptions={{
                        tabBarStyle: {
                            backgroundColor: COLORS.background,
                            borderBottomColor: COLORS.divider,
                            borderBottomWidth: 1,
                        },
                        tabBarLabelStyle: {
                            fontWeight: 'bold',
                            textTransform: 'none',
                            fontSize: 16,
                        },
                        tabBarActiveTintColor: COLORS.tabBarActive,
                        tabBarInactiveTintColor: COLORS.tabBarInactive,
                        tabBarIndicatorStyle: {
                            backgroundColor: COLORS.tabBarIndicator,
                            height: 2,
                        },
                        sceneStyle: { backgroundColor: COLORS.background },
                    }}
                >
                    <MaterialTopTabs.Screen
                        name="index"
                        options={{ title: '配信リスト' }}
                    />
                    <MaterialTopTabs.Screen
                        name="videos"
                        options={{ title: '動画' }}
                    />
                    <MaterialTopTabs.Screen
                        name="members"
                        options={{ title: '設定' }}
                    />
                </MaterialTopTabs>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}
