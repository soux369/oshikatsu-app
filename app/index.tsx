import React, { useState, useEffect } from 'react';
import { FlatList, StyleSheet, View, RefreshControl } from 'react-native';
import { Appbar, ActivityIndicator, Text } from 'react-native-paper';
import { StreamCard } from '../src/components/stream/StreamCard';
import { getLatestStreams } from '../src/api/streams';
import { StreamInfo } from '../src/types/youtube';
import { useNotifications } from '../src/hooks/useNotifications';

export default function HomeScreen() {
    const [streams, setStreams] = useState<StreamInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Initialize notifications logic
    useNotifications(streams);

    const loadData = async () => {
        setLoading(true);
        const data = await getLatestStreams();
        setStreams(data);
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        const data = await getLatestStreams();
        setStreams(data);
        setRefreshing(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading && streams.length === 0) {
        return (
            <View style={styles.center}>
                <ActivityIndicator animating={true} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.Content title="あおぎり配信通知" />
            </Appbar.Header>

            <FlatList
                data={streams}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <StreamCard stream={item} />}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text>現在、配信予定はありません</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
});
