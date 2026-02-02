import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getStreams, StreamInfo } from '../src/api/streams';
import { getNotificationSettings } from '../src/services/memberSettings';
import StreamCard from '../src/components/stream/StreamCard';
import { COLORS } from '../src/constants/theme';

export default function StreamListScreen() {
    const [streams, setStreams] = useState<StreamInfo[]>([]);
    const [hasMoreArchives, setHasMoreArchives] = useState(false);
    const [showAllArchives, setShowAllArchives] = useState(false);
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

            // Separate Live/Upcoming from Ended
            const liveAndUpcoming = filtered.filter(s => s.status === 'live' || s.status === 'upcoming');
            const ended = filtered.filter(s => s.status === 'ended');

            setHasMoreArchives(ended.length > 10);

            // If showAllArchives is true, show all. Otherwise show 10.
            const displayEnded = (showAllArchives || force === true) ? ended : ended.slice(0, 10);

            setStreams([...liveAndUpcoming, ...displayEnded]);
        } catch (error) {
            console.error('Failed to load streams', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [showAllArchives]);

    // Refresh when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadStreams();
        }, [loadStreams])
    );

    // If showAllArchives changes, reload the list
    useEffect(() => {
        loadStreams();
    }, [showAllArchives]);

    const onRefresh = () => {
        setRefreshing(true);
        setShowAllArchives(false); // Reset on refresh
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
                ListFooterComponent={
                    hasMoreArchives && !showAllArchives ? (
                        <TouchableOpacity
                            style={styles.moreButton}
                            onPress={() => setShowAllArchives(true)}
                        >
                            <Text style={styles.moreButtonText}>過去の配信をもっと見る</Text>
                        </TouchableOpacity>
                    ) : null
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
                onPress={() => onRefresh()}
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
    moreButton: {
        padding: 16,
        alignItems: 'center',
        backgroundColor: COLORS.cardBackground,
        marginHorizontal: 16,
        marginVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.divider,
    },
    moreButtonText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: 'bold',
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
