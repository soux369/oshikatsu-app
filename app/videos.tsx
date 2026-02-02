import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getStreams, StreamInfo } from '../src/api/streams';
import { getNotificationSettings } from '../src/services/memberSettings';
import StreamCard from '../src/components/stream/StreamCard';
import { COLORS } from '../src/constants/theme';

export default function VideoListScreen() {
    const [videos, setVideos] = useState<StreamInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadVideos = useCallback(async (force = false) => {
        try {
            const [data, settings] = await Promise.all([
                getStreams(force),
                getNotificationSettings()
            ]);

            const filtered = data.filter(s => {
                const isVideo = s.type === 'video';
                const isAllowed = settings[s.channelId] !== false; // Default ON
                return isVideo && isAllowed;
            });

            setVideos(filtered);
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

    const onRefresh = () => {
        setRefreshing(true);
        loadVideos(true);
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
                data={videos}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <StreamCard stream={item} />}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                        title="動画情報を取得中..."
                        titleColor={COLORS.textSecondary}
                        colors={[COLORS.primary]}
                        progressBackgroundColor={COLORS.cardBackground}
                        progressViewOffset={10}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>現在新しい動画はありません</Text>
                    </View>
                }
            />
            {/* Manual Refresh FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => loadVideos(true)}
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
