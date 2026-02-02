import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { List, Switch, Appbar, Avatar, Surface, Text } from 'react-native-paper';
import { AOGIRI_MEMBERS, Member } from '../src/constants/members';
import { getMemberSettings, saveMemberSettings } from '../src/services/memberSettings';

export default function MembersScreen() {
    const [settings, setSettings] = useState<{ [id: string]: boolean }>({});

    useEffect(() => {
        const loadSettings = async () => {
            const data = await getMemberSettings();
            setSettings(data);
        };
        loadSettings();
    }, []);

    const toggleSwitch = async (channelId: string) => {
        const newSettings = { ...settings, [channelId]: !(settings[channelId] ?? true) };
        setSettings(newSettings);
        await saveMemberSettings(newSettings);
    };

    const toggleAll = async (value: boolean) => {
        const newSettings: { [id: string]: boolean } = {};
        AOGIRI_MEMBERS.forEach(m => {
            newSettings[m.id] = value;
        });
        setSettings(newSettings);
        await saveMemberSettings(newSettings);
    };

    const allOn = AOGIRI_MEMBERS.every(m => settings[m.id] ?? true);

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.header}>
                <Appbar.Content title="推し設定" titleStyle={styles.headerTitle} />
                <Appbar.Action
                    icon={allOn ? "bell-check" : "bell-off"}
                    onPress={() => toggleAll(!allOn)}
                />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Surface style={styles.card} elevation={1}>
                    <List.Section>
                        <List.Subheader style={styles.subheader}>通知を受け取るメンバーを選択</List.Subheader>
                        {AOGIRI_MEMBERS.map((member) => (
                            <List.Item
                                key={member.id}
                                title={member.name}
                                titleStyle={styles.itemTitle}
                                left={() => (
                                    <Avatar.Text
                                        size={40}
                                        label={member.name.substring(0, 1)}
                                        style={[styles.avatar, { backgroundColor: member.color }]}
                                        labelStyle={styles.avatarLabel}
                                    />
                                )}
                                right={() => (
                                    <Switch
                                        value={settings[member.id] ?? true}
                                        onValueChange={() => toggleSwitch(member.id)}
                                        color="#ff0000"
                                    />
                                )}
                                style={styles.listItem}
                            />
                        ))}
                    </List.Section>
                </Surface>
                <View style={styles.footer}>
                    <Text variant="bodySmall" style={styles.footerText}>
                        ※設定を変更すると、次回の情報更新時に通知が再スケジュールされます。
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 16,
    },
    card: {
        borderRadius: 12,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    subheader: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    listItem: {
        paddingVertical: 8,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    avatar: {
        marginLeft: 8,
    },
    avatarLabel: {
        color: '#fff',
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    footer: {
        marginTop: 24,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    footerText: {
        color: '#999',
        textAlign: 'center',
    },
});
