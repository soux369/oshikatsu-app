import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Animated, Easing, Alert, TextInput, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { getStreams, StreamInfo } from '../src/api/streams';
import { getMemberSettings } from '../src/services/memberSettings';
import StreamCard from '../src/components/stream/StreamCard';
import { useNotifications } from '../src/hooks/useNotifications';
import { COLORS } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const normalizeText = (text: string) => {
    return text
        .replace(/[ァ-ン]/g, s => String.fromCharCode(s.charCodeAt(0) - 0x60)) // Katakana to Hiragana
        .replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xfee0)) // Full-width to Half-width
        .replace(/[－‐‑–—―−－⁻₋]/g, 'ー') // Normalize all dashes to the long vowel mark
        .replace(/[\s\t\n\r]/g, '') // Remove all whitespace
        .toLowerCase();
};

const getLevenshteinDistance = (a: string, b: string): number => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

const isFuzzyMatch = (target: string, query: string) => {
    const nTarget = normalizeText(target);
    const nQuery = normalizeText(query);
    if (nTarget.includes(nQuery)) return true;

    // For typos: only allow for relatively long queries to avoid false positives
    // e.g., length 5+ allows 1 typo, length 10+ allows 2 typos
    if (nQuery.length >= 5) {
        const threshold = nQuery.length >= 10 ? 2 : 1;
        for (let i = 0; i <= nTarget.length - nQuery.length; i++) {
            const sub = nTarget.substring(i, i + nQuery.length);
            const dist = getLevenshteinDistance(sub, nQuery);
            if (dist <= threshold) return true;
        }
    }
    return false;
};

const SearchBar = React.memo(({ onChange }: { onChange: (text: string) => void }) => {
    const [localValue, setLocalValue] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            onChange(localValue);
        }, 500);
        return () => clearTimeout(timer);
    }, [localValue, onChange]);

    return (
        <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
                style={styles.searchInput}
                placeholder="検索..."
                placeholderTextColor={COLORS.textSecondary}
                value={localValue}
                onChangeText={setLocalValue}
                autoCapitalize="none"
                autoCorrect={false}
                blurOnSubmit={true}
                returnKeyType="search"
                onSubmitEditing={(e) => {
                    onChange(e.nativeEvent.text);
                }}
            />
            {localValue.length > 0 && (
                <TouchableOpacity onPress={() => setLocalValue('')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
            )}
        </View>
    );
});

export default function StreamListScreen() {
    const [streams, setStreams] = useState<StreamInfo[]>([]);
    const [rawStreams, setRawStreams] = useState<StreamInfo[]>([]);
    const [allData, setAllData] = useState<{ liveAndUpcoming: StreamInfo[], ended: StreamInfo[] }>({ liveAndUpcoming: [], ended: [] });
    const [visibleCount, setVisibleCount] = useState(6);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState<'latest' | 'oldest'>('latest');

    const scrollY = useRef(new Animated.Value(0)).current;
    const spinAnim = useRef(new Animated.Value(0)).current;

    useNotifications(rawStreams);

    const loadStreams = useCallback(async (force = false) => {
        try {
            // If it's a silent/auto refresh, don't set loading to true to prevent screen clearing
            if (!force && rawStreams.length === 0) {
                setLoading(true);
            }

            const [data, settings] = await Promise.all([
                getStreams(force),
                getMemberSettings()
            ]);

            setRawStreams(data);

            const filtered = data.filter(s => {
                const isStream = s.type === 'stream' || !s.type;
                const isPremiere = s.type === 'video' && (s.status === 'live' || s.status === 'upcoming');
                const pref = settings[s.channelId];
                const isAllowed = pref ? pref.display : true;
                return (isStream || isPremiere) && isAllowed;
            });

            const liveAndUpcoming = filtered.filter(s => s.status === 'live' || s.status === 'upcoming');
            const ended = filtered.filter(s => s.status === 'ended');

            setAllData({ liveAndUpcoming, ended });

            // Only reset visible count if it's a manual pull-to-refresh
            // (We keep previous visibility during auto-refresh to avoid jumps)
        } catch (error) {
            console.error('Failed to load streams', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []); // Empty dependencies to keep loadStreams stable

    useFocusEffect(
        useCallback(() => {
            loadStreams();
        }, [loadStreams])
    );

    // First launch disclaimer
    useEffect(() => {
        const checkFirstLaunch = async () => {
            const hasLaunched = await AsyncStorage.getItem('HAS_LAUNCHED');
            if (!hasLaunched) {
                Alert.alert(
                    'ご利用にあたって',
                    '本アプリは「あおぎり高校」ファンの非公式応援アプリです。\n\n公式とは一切関係ありません。コンテンツの著作権は各権利者に帰属します。',
                    [
                        {
                            text: '同意して利用する',
                            onPress: async () => {
                                await AsyncStorage.setItem('HAS_LAUNCHED', 'true');
                            }
                        }
                    ]
                );
            }
        };
        checkFirstLaunch();
    }, []);

    // Auto-refresh every 10 minutes (Silent refresh)
    useEffect(() => {
        const interval = setInterval(() => {
            console.log('Auto-refreshing streams...');
            loadStreams(true); // Fetches new data but doesn't trigger 'loading' state
        }, 10 * 60 * 1000);

        return () => clearInterval(interval);
    }, [loadStreams]);

    useEffect(() => {
        let filtered = [...allData.liveAndUpcoming, ...allData.ended];

        // Search
        if (searchQuery) {
            filtered = filtered.filter(s =>
                isFuzzyMatch(s.title, searchQuery) ||
                isFuzzyMatch(s.channelTitle, searchQuery)
            );
        }

        // Sort
        if (sortOption === 'oldest') {
            filtered.sort((a, b) => {
                const timeA = new Date(a.scheduledStartTime || 0).getTime();
                const timeB = new Date(b.scheduledStartTime || 0).getTime();
                return timeA - timeB;
            });
        } else {
            // Latest
            filtered.sort((a, b) => {
                const timeA = new Date(a.scheduledStartTime || 0).getTime();
                const timeB = new Date(b.scheduledStartTime || 0).getTime();
                return timeB - timeA;
            });
        }

        const displayEndedFiltered = filtered.filter(s => s.status === 'ended');
        const liveUpcomingFiltered = filtered.filter(s => s.status !== 'ended');

        setStreams([...liveUpcomingFiltered, ...displayEndedFiltered.slice(0, visibleCount)]);
    }, [allData, visibleCount, searchQuery, sortOption]);

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
        // Force refresh AND reset count for manual pull
        setVisibleCount(6);
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

    // Initial full screen loading only
    if (loading && rawStreams.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const hasMore = allData.ended.length > visibleCount;

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
                <Ionicons name="refresh-circle" size={48} color="rgba(255,255,255,0.4)" />
            </Animated.View>

            <View style={styles.headerControls}>
                <View style={styles.searchRow}>
                    <SearchBar onChange={setSearchQuery} />
                    <TouchableOpacity
                        style={styles.sortToggle}
                        onPress={() => setSortOption(sortOption === 'latest' ? 'oldest' : 'latest')}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name="chevron-up"
                            size={14}
                            color={sortOption === 'oldest' ? "#fff" : "rgba(255,255,255,0.2)"}
                        />
                        <Ionicons
                            name="chevron-down"
                            size={14}
                            color={sortOption === 'latest' ? "#fff" : "rgba(255,255,255,0.2)"}
                        />
                        <Text style={styles.sortToggleText}>
                            {sortOption === 'latest' ? '最新' : '古い'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Animated.FlatList
                data={streams}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <StreamCard stream={item} />}
                contentContainerStyle={[
                    styles.listContent,
                    { backgroundColor: COLORS.background }
                ]}
                indicatorStyle="white"
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    {
                        useNativeDriver: true,
                        listener: (event: any) => {
                            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
                            const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height;
                            const pullUpDistance = (layoutMeasurement.height + contentOffset.y) - contentSize.height;

                            // Trigger load more only on "VERY strong" overscroll at bottom (120px)
                            if (isAtBottom && pullUpDistance > 120 && hasMore && !loading) {
                                loadMore();
                            }
                        }
                    }
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
                        <View style={styles.moreButton}>
                            <Ionicons name="arrow-up" size={14} color="#888" style={{ marginBottom: 4 }} />
                            <Text style={styles.moreButtonText}>
                                さらに引き上げて{Math.min(10, allData.ended.length - visibleCount)}件表示
                            </Text>
                        </View>
                    ) : (
                        streams.length > 0 ? <View style={{ height: 40 }} /> : null
                    )
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>予定されている配信はありません</Text>
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
        top: 60, // Peak from under search bar
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 5, // Under header (10)
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
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    moreButtonText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    headerControls: {
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 4,
        zIndex: 10,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 40,
        borderWidth: 1,
        borderColor: '#333',
    },
    searchInput: {
        flex: 1,
        color: COLORS.textPrimary,
        fontSize: 15,
        paddingVertical: 8,
    },
    clearButton: {
        padding: 4,
    },
    sortToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a', // Match Search Bar
        borderRadius: 12,
        paddingHorizontal: 10,
        height: 40,
        gap: 0,
        borderWidth: 1,
        borderColor: '#333', // Always same border
    },
    sortToggleText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 6,
    },
});
