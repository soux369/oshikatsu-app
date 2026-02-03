import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Switch, Image, TouchableOpacity, Linking } from 'react-native';
import { AOGIRI_MEMBERS, Member } from '../src/constants/members';
import { getMemberSettings, saveMemberSettings, MemberSettingsMap } from '../src/services/memberSettings';
import { getStreams, StreamInfo } from '../src/api/streams';
import { COLORS } from '../src/constants/theme';

export default function MemberListScreen() {
    const [settings, setSettings] = useState<MemberSettingsMap>({});
    const [streams, setStreams] = useState<StreamInfo[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [settingsData, streamsData] = await Promise.all([
            getMemberSettings(),
            getStreams()
        ]);
        setSettings(settingsData);
        setStreams(streamsData);
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

    const bulkUpdate = async (key: 'display' | 'notify', type: 'all' | 'none' | 'invert') => {
        const newSettings = { ...settings };
        AOGIRI_MEMBERS.forEach(member => {
            const current = newSettings[member.id] || { display: true, notify: true };
            let newValue = true;
            if (type === 'none') newValue = false;
            else if (type === 'invert') newValue = !current[key];

            newSettings[member.id] = { ...current, [key]: newValue };
        });
        setSettings(newSettings);
        await saveMemberSettings(newSettings);
    };

    const renderItem = ({ item }: { item: Member }) => {
        const pref = settings[item.id] || { display: true, notify: true };
        const stream = streams.find(s => s.channelId === item.id);

        return (
            <View style={styles.itemContainer}>
                <TouchableOpacity
                    style={styles.memberInfo}
                    onPress={async () => {
                        const url = `https://www.youtube.com/channel/${item.id}`;
                        try {
                            const supported = await Linking.canOpenURL(url);
                            if (supported) {
                                await Linking.openURL(url);
                            } else {
                                console.warn("Don't know how to open URI: " + url);
                                // Fallback to a standard web URL
                                await Linking.openURL(`https://www.youtube.com/channel/${item.id}`);
                            }
                        } catch (err) {
                            console.error('An error occurred', err);
                        }
                    }}
                    activeOpacity={0.7}
                >
                    <View style={[styles.avatarPlaceholder, { backgroundColor: item.color }]}>
                        {stream?.channelThumbnailUrl ? (
                            <Image source={{ uri: stream.channelThumbnailUrl }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarTextPlaceholder}>{item.name[0]}</Text>
                        )}
                    </View>
                    <View>
                        <Text style={styles.memberName}>{item.name}</Text>
                        <Text style={styles.linkHint}>チャンネルを開く</Text>
                    </View>
                </TouchableOpacity>
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
                        <View style={styles.disclaimerBox}>
                            <Text style={styles.headerDisclaimer}>
                                ※本アプリは「あおぎり高校」ファンの非公式応援アプリです。公式とは一切関係ありません。
                            </Text>
                        </View>

                        <View style={styles.bulkActionRow}>
                            <Text style={styles.bulkLabel}>一括設定:</Text>
                            <View style={styles.bulkButtons}>
                                <TouchableOpacity style={styles.bulkBtn} onPress={() => bulkUpdate('display', 'all')}>
                                    <Text style={styles.bulkBtnText}>全て表示</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.bulkBtn} onPress={() => bulkUpdate('display', 'none')}>
                                    <Text style={styles.bulkBtnText}>解除</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.bulkBtn} onPress={() => bulkUpdate('display', 'invert')}>
                                    <Text style={styles.bulkBtnText}>反転</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.bulkActionRow}>
                            <Text style={styles.bulkLabel}>通知設定:</Text>
                            <View style={styles.bulkButtons}>
                                <TouchableOpacity style={[styles.bulkBtn, { borderColor: '#FFC107' }]} onPress={() => bulkUpdate('notify', 'all')}>
                                    <Text style={[styles.bulkBtnText, { color: '#FFC107' }]}>全て通知</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.bulkBtn, { borderColor: '#FFC107' }]} onPress={() => bulkUpdate('notify', 'none')}>
                                    <Text style={[styles.bulkBtnText, { color: '#FFC107' }]}>解除</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.bulkBtn, { borderColor: '#FFC107' }]} onPress={() => bulkUpdate('notify', 'invert')}>
                                    <Text style={[styles.bulkBtnText, { color: '#FFC107' }]}>反転</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
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
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    avatarImage: {
        width: 44,
        height: 44,
    },
    avatarTextPlaceholder: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    memberName: {
        fontSize: 16,
        color: COLORS.textPrimary,
        fontWeight: '600',
    },
    linkHint: {
        fontSize: 10,
        color: COLORS.primary,
        marginTop: 2,
    },
    disclaimer: {
        fontSize: 10,
        color: COLORS.textSecondary,
        opacity: 0.6,
        fontStyle: 'italic',
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
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    disclaimerBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 8,
    },
    headerDisclaimer: {
        fontSize: 12,
        color: COLORS.textSecondary,
        lineHeight: 18,
        textAlign: 'center',
    },
    bulkActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingHorizontal: 4,
    },
    bulkLabel: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: 'bold',
        width: 60,
    },
    bulkButtons: {
        flex: 1,
        flexDirection: 'row',
        gap: 8,
    },
    bulkBtn: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    bulkBtnText: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
});
