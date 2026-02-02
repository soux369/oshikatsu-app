import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { StreamInfo } from '../../api/streams';
import { getMemberById } from '../../constants/members';
import { COLORS } from '../../constants/theme'; // Import new theme

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

    return (
        <TouchableOpacity style={styles.card} onPress={openStream}>
            <Image source={{ uri: stream.thumbnailUrl }} style={styles.thumbnail} />
            <View style={styles.infoContainer}>
                <View style={styles.headerRow}>
                    {member && (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: member.color }]}>
                            <Text style={styles.avatarText}>{member.name[0]}</Text>
                        </View>
                    )}
                    <View style={styles.textContainer}>
                        <Text style={styles.title} numberOfLines={2}>{stream.title}</Text>
                        <Text style={styles.channelName}>{member?.name || stream.channelId}</Text>
                        <Text style={styles.time}>{dateStr} • {stream.status === 'live' ? 'LIVE NOW' : 'Upcoming'}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.cardBackground,
        marginBottom: 16, // Spacing between cards
        // Removed shadows for cleaner flat dark UI, typical of YouTube mobile
    },
    thumbnail: {
        width: '100%',
        aspectRatio: 16 / 9,
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
