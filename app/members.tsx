import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Switch } from 'react-native';
import { AOGIRI_MEMBERS, Member } from '../src/constants/members';
import { getNotificationSettings, saveNotificationSettings, NotificationSettings } from '../src/services/memberSettings';
import { COLORS } from '../src/constants/theme';

export default function MemberListScreen() {
    const [settings, setSettings] = useState<NotificationSettings>({});

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const data = await getNotificationSettings();
        setSettings(data);
    };

    const toggleSwitch = async (id: string, value: boolean) => {
        const newSettings = { ...settings, [id]: value };
        setSettings(newSettings);
        await saveNotificationSettings(newSettings);
    };

    const renderItem = ({ item }: { item: Member }) => (
        <View style={styles.itemContainer}>
            <View style={styles.memberInfo}>
                <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                <Text style={styles.memberName}>{item.name}</Text>
            </View>
            <Switch
                trackColor={{ false: '#444', true: COLORS.primary }} // Darker track for off
                thumbColor={settings[item.id] ? '#fff' : '#aaa'}
                onValueChange={(val) => toggleSwitch(item.id, val)}
                value={settings[item.id] ?? true} // Default true
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={AOGIRI_MEMBERS}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>表示・通知設定</Text>
                        <Text style={styles.headerDesc}>
                            スイッチをONにすると、リストへの表示とライブ開始通知が有効になります。
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    listContent: {
        padding: 16,
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    memberName: {
        fontSize: 16,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    header: {
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    headerDesc: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
});
