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

    // Helper to parse duration: PT1M5S -> total seconds
    const isShort = React.useMemo(() => {
        if (!stream.duration) return false;
        const match = stream.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return false;
        const h = parseInt(match[1] || '0');
        const m = parseInt(match[2] || '0');
        const s = parseInt(match[3] || '0');
        const totalSec = h * 3600 + m * 60 + s;
        // YouTube Shorts are < 60s. Aogiri "skits" might be longer, but they are 'video' type.
        // If it's very short, it's definitely a Short.
        return totalSec < 62; // 62s buffer
    }, [stream.duration]);

    // Format date
    const date = stream.scheduledStartTime ? new Date(stream.scheduledStartTime) : new Date();
    const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;

    const getStatusBadge = () => {
        if (isShort) {
            return (
                <View style={[styles.badge, { backgroundColor: '#FF0000' }]}>
                    <Text style={styles.badgeText}>SHORT</Text>
                </View>
            );
        }
        if (stream.type === 'video') {
            return (
                <View style={[styles.badge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                    <Text style={styles.badgeText}>VIDEO</Text>
                </View>
            );
        }
        if (stream.status === 'live') {
            return (
                <View style={[styles.badge, { backgroundColor: '#cc0000' }]}>
                    <Text style={styles.badgeText}>LIVE</Text>
                </View>
            );
        } else if (stream.status === 'ended') {
            return (
                <View style={[styles.badge, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}>
                    <Text style={styles.badgeText}>ARCHIVE</Text>
                </View>
            );
        }
        return (
            <View style={[styles.badge, { backgroundColor: '#E91E63' }]}>
                <Text style={styles.badgeText}>UPCOMING</Text>
            </View>
        );
    };

    // Should we dim the card? Only for ended streams (archives), not for general videos.
    const isActualEndedStream = stream.type === 'stream' && stream.status === 'ended';

    return (
        <TouchableOpacity
            style={[styles.card, isActualEndedStream && styles.cardEnded]}
            onPress={openStream}
            activeOpacity={0.7}
        >
            <View>
                <Image
                    source={{ uri: stream.thumbnailUrl }}
                    style={[styles.thumbnail, isActualEndedStream && styles.thumbnailEnded]}
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
                        <Text
                            style={[styles.title, isActualEndedStream && styles.titleEnded]}
                            numberOfLines={2}
                        >
                            {stream.title}
                        </Text>
                        <View style={styles.metaRow}>
                            <Text style={styles.channelName}>{member?.name || stream.channelId}</Text>
                            <Text style={styles.separator}>•</Text>
                            <Text style={styles.time}>{dateStr}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.cardBackground,
        marginBottom: 12,
        borderRadius: 12,
        overflow: 'hidden',
        marginHorizontal: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardEnded: {
        opacity: 0.85,
    },
    thumbnail: {
        width: '100%',
        aspectRatio: 16 / 9,
    },
    thumbnailEnded: {
        opacity: 0.6,
    },
    badgeContainer: {
        position: 'absolute',
        bottom: 8,
        right: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '900',
    },
    infoContainer: {
        padding: 12,
    },
    headerRow: {
        flexDirection: 'row',
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
        lineHeight: 20,
    },
    titleEnded: {
        color: COLORS.textSecondary,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    channelName: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    separator: {
        color: COLORS.textSecondary,
        marginHorizontal: 6,
        fontSize: 12,
    },
    time: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
});
