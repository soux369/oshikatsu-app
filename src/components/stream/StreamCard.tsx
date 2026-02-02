import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { StreamInfo } from '../../api/streams';
import { getMemberById } from '../../constants/members';
import { COLORS } from '../../constants/theme';

interface Props {
    stream: StreamInfo;
}

export default function StreamCard({ stream }: Props) {
    const member = getMemberById(stream.channelId);

    const openStream = () => {
        Linking.openURL(`https://www.youtube.com/watch?v=${stream.id}`);
    };

    // Format date
    const date = stream.scheduledStartTime ? new Date(stream.scheduledStartTime) : new Date();
    const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;

    const getStatusBadge = () => {
        if (stream.type === 'video') {
            return (
                <View style={styles.upcomingBadge}>
                    <Text style={styles.upcomingText}>VIDEO</Text>
                </View>
            );
        }
        if (stream.status === 'live') {
            return (
                <View style={styles.liveBadge}>
                    <Text style={styles.liveText}>LIVE</Text>
                </View>
            );
        } else if (stream.status === 'ended') {
            return (
                <View style={styles.endedBadge}>
                    <Text style={styles.endedText}>ENDED</Text>
                </View>
            );
        }
        return (
            <View style={styles.upcomingBadge}>
                <Text style={styles.upcomingText}>UPCOMING</Text>
            </View>
        );
    };

    return (
        <TouchableOpacity style={[styles.card, stream.status === 'ended' && styles.cardEnded]} onPress={openStream}>
            <View>
                <Image
                    source={{ uri: stream.thumbnailUrl }}
                    style={[styles.thumbnail, stream.status === 'ended' && styles.thumbnailEnded]}
                />
                <View style={styles.badgeContainer}>
                    {getStatusBadge()}
                </View>
            </View>
            <View style={styles.infoContainer}>
                <View style={styles.headerRow}>
                    {member && (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: member.color }]}>
                            <Text style={styles.avatarText}>{member.name[0]}</Text>
                        </View>
                    )}
                    <View style={styles.textContainer}>
                        <Text style={[styles.title, stream.status === 'ended' && styles.titleEnded]} numberOfLines={2}>
                            {stream.title}
                        </Text>
                        <Text style={styles.channelName}>{member?.name || stream.channelId}</Text>
                        <Text style={styles.time}>{dateStr}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.cardBackground,
        marginBottom: 16,
    },
    cardEnded: {
        opacity: 0.9,
    },
    thumbnail: {
        width: '100%',
        aspectRatio: 16 / 9,
    },
    thumbnailEnded: {
        opacity: 0.7,
    },
    badgeContainer: {
        position: 'absolute',
        bottom: 8,
        right: 8,
    },
    liveBadge: {
        backgroundColor: '#cc0000', // YouTube Red
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    liveText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    endedBadge: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    endedText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    upcomingBadge: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    upcomingText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    infoContainer: {
        padding: 12,
    },
    headerRow: {
        flexDirection: 'row',
    },
    avatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        marginTop: 2,
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 4,
        lineHeight: 20,
    },
    titleEnded: {
        color: COLORS.textSecondary,
    },
    channelName: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    time: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
});
