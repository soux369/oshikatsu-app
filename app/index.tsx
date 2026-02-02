import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getStreams, StreamInfo } from '../src/api/streams';
import { getNotificationSettings } from '../src/services/memberSettings';
import StreamCard from '../src/components/stream/StreamCard';
import { COLORS } from '../src/constants/theme';

export default function StreamListScreen() {
    const [streams, setStreams] = useState<StreamInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadStreams = useCallback(async (force = false) => {
        try {
            const [data, settings] = await Promise.all([
                getStreams(force),
                getNotificationSettings()
            ]);

            // Filter logic:
            // 1. Filter by type 'stream' (or missing type for backward compat)
            // 2. Filter by member settings
            const filtered = data.filter(s => {
                const isStream = s.type === 'stream' || !s.type;
                const isAllowed = settings[s.channelId] !== false; // Default ON
                return isStream && isAllowed;
            });

            // 3. Separate and limit ended streams
            const liveAndUpcoming = filtered.filter(s => s.status === 'live' || s.status === 'upcoming');
            const ended = filtered.filter(s => s.status === 'ended');

            // Limit ended streams (archives) to avoid clutter, user requested max 10
            const restrictedEnded = ended.slice(0, 10);

            setStreams([...liveAndUpcoming, ...restrictedEnded]);
        } catch (error) {
            console.error('Failed to load streams', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Refresh when screen comes into focus (e.g. returning from settings)
    // using useFocusEffect from expo-router (wraps React Navigation's useFocusEffect)
    useFocusEffect(
        useCallback(() => {
            loadStreams();
        }, [loadStreams])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadStreams(true);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={streams}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <StreamCard stream={item} />}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                        title="最新情報を取得中..."
                        titleColor={COLORS.textSecondary}
                        colors={[COLORS.primary]}
                        progressBackgroundColor={COLORS.cardBackground}
                        progressViewOffset={10}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>現在予定されている配信はありません</Text>
                    </View>
                }
            />
            {/* Manual Refresh FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => loadStreams(true)}
                disabled={loading || refreshing}
            >
                {refreshing ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.fabText}>↻</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    listContent: {
        paddingBottom: 20,
        flexGrow: 1,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 30,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        zIndex: 1000,
    },
    fabText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
});
