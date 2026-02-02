import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getStreams, StreamInfo } from '../src/api/streams';
import { getMemberSettings } from '../src/services/memberSettings';
import StreamCard from '../src/components/stream/StreamCard';
import { COLORS } from '../src/constants/theme';

export default function VideoListScreen() {
    const [videos, setVideos] = useState<StreamInfo[]>([]);
    const [allVideos, setAllVideos] = useState<StreamInfo[]>([]);
    const [visibleCount, setVisibleCount] = useState(10);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadVideos = useCallback(async (force = false) => {
        try {
            const [data, settings] = await Promise.all([
                getStreams(force),
                getMemberSettings()
            ]);

            const filtered = data.filter(s => {
                const isVideo = s.type === 'video';
                const pref = settings[s.channelId];
                const isAllowed = pref ? pref.display : true;
                return isVideo && isAllowed;
            });

            // Ensure sorted by date (newest first)
            filtered.sort((a, b) => {
                const timeA = new Date(a.scheduledStartTime || 0).getTime();
                const timeB = new Date(b.scheduledStartTime || 0).getTime();
                return timeB - timeA;
            });

            setAllVideos(filtered);

            if (force) {
                setVisibleCount(10);
            }
        } catch (error) {
            console.error('Failed to load videos', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadVideos();
        }, [loadVideos])
    );

    useEffect(() => {
        setVideos(allVideos.slice(0, visibleCount));
    }, [allVideos, visibleCount]);

    const onRefresh = () => {
        setRefreshing(true);
        loadVideos(true);
    };

    const loadMore = () => {
        setVisibleCount(prev => prev + 10);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const hasMore = allVideos.length > visibleCount;

    return (
        <View style={styles.container}>
            <FlatList
                data={videos}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <StreamCard stream={item} />}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                        title="最新動画を取得中..."
                        titleColor={COLORS.textSecondary}
                        colors={[COLORS.primary]}
                        progressBackgroundColor={COLORS.cardBackground}
                    />
                }
                ListFooterComponent={
                    hasMore ? (
                        <TouchableOpacity
                            style={styles.moreButton}
                            onPress={loadMore}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.moreButtonText}>さらに10件表示</Text>
                        </TouchableOpacity>
                    ) : (
                        allVideos.length > 0 ? <View style={{ height: 40 }} /> : null
                    )
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>動画が見つかりませんでした</Text>
                    </View>
                }
            />
            <TouchableOpacity
                style={styles.fab}
                onPress={onRefresh}
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
        paddingTop: 12,
        paddingBottom: 20,
        flexGrow: 1,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    moreButton: {
        paddingVertical: 14,
        alignItems: 'center',
        backgroundColor: '#262626',
        marginHorizontal: 16,
        marginVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    moreButtonText: {
        color: '#eee',
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
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        zIndex: 1000,
    },
    fabText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
});
