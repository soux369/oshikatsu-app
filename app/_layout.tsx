import { Tabs } from 'expo-router';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RootLayout() {
    return (
        <PaperProvider theme={MD3LightTheme}>
            <Tabs screenOptions={{ headerShown: false }}>
                <Tabs.Screen
                    name="index"
                    options={{
                        title: '配信一覧',
                        tabBarIcon: ({ color, size }) => (
                            <MaterialCommunityIcons name="video-live" color={color} size={size} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="members"
                    options={{
                        title: '設定',
                        tabBarIcon: ({ color, size }) => (
                            <MaterialCommunityIcons name="account-group" color={color} size={size} />
                        ),
                    }}
                />
            </Tabs>
        </PaperProvider>
    );
}
