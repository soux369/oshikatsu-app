import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Card, Text, Badge, Divider } from 'react-native-paper';
import { StreamInfo } from '../../types/youtube';
import { getMemberById } from '../../constants/members';

interface StreamCardProps {
    stream: StreamInfo;
}

export const StreamCard: React.FC<StreamCardProps> = ({ stream }) => {
    const member = getMemberById(stream.channelId);
    const isLive = stream.status === 'live';

    const handlePress = () => {
        const url = `https://www.youtube.com/watch?v=${stream.id}`;
        Linking.openURL(url);
    };

    const startTimeStr = stream.scheduledStartTime
        ? new Date(stream.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

    return (
        <Card style={styles.card} onPress={handlePress}>
            <Card.Cover source={{ uri: stream.thumbnailUrl }} style={styles.thumbnail} />
            <Card.Content style={styles.content}>
                <View style={styles.header}>
                    <Text variant="titleMedium" numberOfLines={1} style={styles.title}>
                        {stream.title}
                    </Text>
                    <Badge
                        style={[styles.badge, { backgroundColor: isLive ? '#ff0000' : '#2196F3' }]}
                    >
                        {isLive ? 'LIVE' : 'UPCOMING'}
                    </Badge>
                </View>
                <View style={styles.info}>
                    <Text variant="bodySmall" style={{ color: member?.color || '#666' }}>
                        {stream.channelTitle}
                    </Text>
                    {!isLive && startTimeStr && (
                        <Text variant="bodySmall" style={styles.time}>
                            {startTimeStr} 開始予定
                        </Text>
                    )}
                </View>
            </Card.Content>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginVertical: 8,
        marginHorizontal: 16,
        overflow: 'hidden',
    },
    thumbnail: {
        height: 180,
    },
    content: {
        paddingTop: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        flex: 1,
        marginRight: 8,
    },
    badge: {
        color: 'white',
        fontWeight: 'bold',
    },
    info: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    time: {
        fontFamily: 'monospace',
    },
});
