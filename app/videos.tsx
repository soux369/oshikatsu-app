import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Animated, Easing, TextInput } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getStreams, StreamInfo } from '../src/api/streams';
import { getMemberSettings } from '../src/services/memberSettings';
import StreamCard from '../src/components/stream/StreamCard';
import { useNotifications } from '../src/hooks/useNotifications';
import { COLORS } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function VideoListScreen() {
    const [videos, setVideos] = useState<StreamInfo[]>([]);
    const [rawStreams, setRawStreams] = useState<StreamInfo[]>([]);
    const [allVideos, setAllVideos] = useState<StreamInfo[]>([]);
    const [visibleCount, setVisibleCount] = useState(6);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState<'date' | 'name'>('date');

    const scrollY = useRef(new Animated.Value(0)).current;
    const spinAnim = useRef(new Animated.Value(0)).current;

    useNotifications(rawStreams);

    const loadVideos = useCallback(async (force = false) => {
        try {
            if (!force && videos.length === 0) {
                setLoading(true);
            }

            const [data, settings] = await Promise.all([
                getStreams(force),
                getMemberSettings()
            ]);

            setRawStreams(data);

            const filtered = data.filter(s => {
                const isVideo = s.type === 'video';
                const pref = settings[s.channelId];
                const isAllowed = pref ? pref.display : true;
                return isVideo && isAllowed;
            });

            filtered.sort((a, b) => {
                const timeA = new Date(a.scheduledStartTime || 0).getTime();
                const timeB = new Date(b.scheduledStartTime || 0).getTime();
                return timeB - timeA;
            });

            setAllVideos(filtered);
        } catch (error) {
            console.error('Failed to load videos', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [videos.length]);

    useFocusEffect(
        useCallback(() => {
            loadVideos();
        }, [loadVideos])
    );

    // Auto-refresh every 10 minutes (Silent refresh)
    useEffect(() => {
        const interval = setInterval(() => {
            console.log('Auto-refreshing videos...');
            loadVideos(true);
        }, 10 * 60 * 1000);

        return () => clearInterval(interval);
    }, [loadVideos]);

    useEffect(() => {
        let filtered = [...allVideos];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s =>
                s.title.toLowerCase().includes(query) ||
                s.channelTitle.toLowerCase().includes(query)
            );
        }

        if (sortOption === 'name') {
            filtered.sort((a, b) => a.channelTitle.localeCompare(b.channelTitle));
        } else {
            filtered.sort((a, b) => {
                const timeA = new Date(a.scheduledStartTime || 0).getTime();
                const timeB = new Date(b.scheduledStartTime || 0).getTime();
                return timeB - timeA;
            });
        }

        setVideos(filtered.slice(0, visibleCount));
    }, [allVideos, visibleCount, searchQuery, sortOption]);

    useEffect(() => {
        if (refreshing) {
            Animated.loop(
                Animated.timing(spinAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            spinAnim.setValue(0);
        }
    }, [refreshing, spinAnim]);

    const onRefresh = () => {
        setRefreshing(true);
        setVisibleCount(6);
        loadVideos(true);
    };

    const loadMore = () => {
        setVisibleCount(prev => prev + 10);
    };

    const pullIconRotate = scrollY.interpolate({
        inputRange: [-100, 0],
        outputRange: ['180deg', '0deg'],
        extrapolate: 'clamp',
    });

    const activeSpinRotate = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const pullIconScale = scrollY.interpolate({
        inputRange: [-80, -30, 0],
        outputRange: [1, 0.5, 0],
        extrapolate: 'clamp',
    });

    const pullIndicatorOpacity = scrollY.interpolate({
        inputRange: [-60, -20],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    if (loading && videos.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const hasMore = allVideos.length > visibleCount;

    return (
        <View style={styles.container}>
            <Animated.View style={[
                styles.pullIndicator,
                {
                    opacity: refreshing ? 1 : pullIndicatorOpacity,
                    transform: [
                        { scale: refreshing ? 1 : pullIconScale },
                        { rotate: refreshing ? activeSpinRotate : pullIconRotate }
                    ]
                }
            ]}>
                <Ionicons name="refresh-circle" size={48} color="#222" />
            </Animated.View>

            <Animated.FlatList
                data={videos}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <StreamCard stream={item} />}
                contentContainerStyle={[
                    styles.listContent,
                    { backgroundColor: COLORS.background }
                ]}
                ListHeaderComponent={
                    <View style={styles.headerControls}>
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="検索（タイトル・名前）"
                                placeholderTextColor={COLORS.textSecondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                clearButtonMode="while-editing"
                            />
                        </View>
                        <View style={styles.sortContainer}>
                            <TouchableOpacity
                                style={[styles.sortButton, sortOption === 'date' && styles.sortButtonActive]}
                                onPress={() => setSortOption('date')}
                            >
                                <Text style={[styles.sortButtonText, sortOption === 'date' && styles.sortButtonTextActive]}>日付順</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.sortButton, sortOption === 'name' && styles.sortButtonActive]}
                                onPress={() => setSortOption('name')}
                            >
                                <Text style={[styles.sortButtonText, sortOption === 'name' && styles.sortButtonTextActive]}>名前順</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                }
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="transparent"
                        colors={['transparent']}
                        progressBackgroundColor="transparent"
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
    pullIndicator: {
        position: 'absolute',
        top: 35,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    listContent: {
        paddingTop: 12,
        paddingBottom: 80,
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
    headerControls: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 40,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#333',
    },
    searchInput: {
        flex: 1,
        color: COLORS.textPrimary,
        fontSize: 14,
    },
    sortContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    sortButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
    },
    sortButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    sortButtonText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    sortButtonTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
