import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Switch } from 'react-native';
import { AOGIRI_MEMBERS, Member } from '../src/constants/members';
import { getMemberSettings, saveMemberSettings, MemberSettingsMap } from '../src/services/memberSettings';
import { COLORS } from '../src/constants/theme';

export default function MemberListScreen() {
    const [settings, setSettings] = useState<MemberSettingsMap>({});

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const data = await getMemberSettings();
        setSettings(data);
    };

    const updatePref = async (id: string, key: 'display' | 'notify', value: boolean) => {
        const current = settings[id] || { display: true, notify: true };
        const newSettings = {
            ...settings,
            [id]: { ...current, [key]: value }
        };
        setSettings(newSettings);
        await saveMemberSettings(newSettings);
    };

    const renderItem = ({ item }: { item: Member }) => {
        const pref = settings[item.id] || { display: true, notify: true };

        return (
            <View style={styles.itemContainer}>
                <View style={styles.memberInfo}>
                    <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                    <Text style={styles.memberName}>{item.name}</Text>
                </View>
                <View style={styles.switchGroup}>
                    <View style={styles.switchItem}>
                        <Text style={styles.switchLabel}>表示</Text>
                        <Switch
                            trackColor={{ false: '#444', true: COLORS.primary }}
                            thumbColor={pref.display ? '#fff' : '#aaa'}
                            onValueChange={(val) => updatePref(item.id, 'display', val)}
                            value={pref.display}
                        />
                    </View>
                    <View style={styles.switchItem}>
                        <Text style={styles.switchLabel}>通知</Text>
                        <Switch
                            trackColor={{ false: '#444', true: '#FFC107' }} // Distinguish notify with amber/yellow
                            thumbColor={pref.notify ? '#fff' : '#aaa'}
                            onValueChange={(val) => updatePref(item.id, 'notify', val)}
                            value={pref.notify}
                        />
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={AOGIRI_MEMBERS}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>メンバー設定</Text>
                        <Text style={styles.headerDesc}>
                            表示：リスト（ホーム・動画）への表示切り替え{"\n"}
                            通知：配信開始時のプッシュ通知
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
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
    },
    memberName: {
        fontSize: 16,
        color: COLORS.textPrimary,
        fontWeight: '600',
    },
    switchGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    switchItem: {
        alignItems: 'center',
        marginLeft: 15,
    },
    switchLabel: {
        color: COLORS.textSecondary,
        fontSize: 10,
        marginBottom: 2,
        fontWeight: 'bold',
    },
    header: {
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 6,
    },
    headerDesc: {
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
});
