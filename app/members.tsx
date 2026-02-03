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
                                ※本アプリは「あおぎり高校」ファン有志による非公式の応援アプリです。公式（株式会社アップランド）とは一切関係ありません。
                            </Text>
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
});
