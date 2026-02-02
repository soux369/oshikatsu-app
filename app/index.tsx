import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Animated, Easing } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getStreams, StreamInfo } from '../src/api/streams';
import { getMemberSettings } from '../src/services/memberSettings';
import StreamCard from '../src/components/stream/StreamCard';
import { COLORS } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function StreamListScreen() {
    const [streams, setStreams] = useState<StreamInfo[]>([]);
    const [allData, setAllData] = useState<{ liveAndUpcoming: StreamInfo[], ended: StreamInfo[] }>({ liveAndUpcoming: [], ended: [] });
    const [visibleCount, setVisibleCount] = useState(6);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const scrollY = useRef(new Animated.Value(0)).current;
    const spinAnim = useRef(new Animated.Value(0)).current;

    const loadStreams = useCallback(async (force = false) => {
        try {
            const [data, settings] = await Promise.all([
                getStreams(force),
                getMemberSettings()
            ]);

            const filtered = data.filter(s => {
                const isStream = s.type === 'stream' || !s.type;
                const pref = settings[s.channelId];
                const isAllowed = pref ? pref.display : true;
                return isStream && isAllowed;
            });

            const liveAndUpcoming = filtered.filter(s => s.status === 'live' || s.status === 'upcoming');
            const ended = filtered.filter(s => s.status === 'ended');

            setAllData({ liveAndUpcoming, ended });

            if (force) {
                setVisibleCount(6);
            }
        } catch (error) {
            console.error('Failed to load streams', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadStreams();
        }, [loadStreams])
    );

    // Auto-refresh every 10 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            console.log('Auto-refreshing streams...');
            loadStreams(true);
        }, 10 * 60 * 1000); // 10 minutes

        return () => clearInterval(interval);
    }, [loadStreams]);

    useEffect(() => {
        const displayEnded = allData.ended.slice(0, visibleCount);
        setStreams([...allData.liveAndUpcoming, ...displayEnded]);
    }, [allData, visibleCount]);

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
    }, [refreshing]);

    const onRefresh = () => {
        setRefreshing(true);
        loadStreams(true);
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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const hasMore = allData.ended.length > visibleCount;

    return (
        <View style={styles.container}>
            {/* The indicator is placed first in the JSX, so it's behind the FlatList content */}
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
                data={streams}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <StreamCard stream={item} />}
                // We add a background color to the list content so it covers the indicator behind it
                contentContainerStyle={[
                    styles.listContent,
                    { backgroundColor: COLORS.background }
                ]}
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
                        allData.ended.length > 0 ? <View style={{ height: 40 }} /> : null
                    )
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>予定されている配信はありません</Text>
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
    pullIndicator: {
        position: 'absolute',
        top: 35,
        left: 0,
        right: 0,
        alignItems: 'center',
        // No zIndex here, standard draw order will put it behind the FlatList
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
