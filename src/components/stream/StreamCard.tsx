import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StreamInfo } from '../../api/streams';
import { getMemberById } from '../../constants/members';
import { COLORS } from '../../constants/theme';

interface Props {
    stream: StreamInfo;
}

export default function StreamCard({ stream }: Props) {
    const member = getMemberById(stream.channelId);
    const [timeLeft, setTimeLeft] = React.useState('');

    React.useEffect(() => {
        if (stream.status !== 'upcoming' || !stream.scheduledStartTime) return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const start = new Date(stream.scheduledStartTime!).getTime();
            const diff = start - now;

            if (diff <= 0) {
                setTimeLeft('間もなく開始');
                return;
            }

            const hrs = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            if (hrs > 0) {
                setTimeLeft(`あと ${hrs}時間${mins}分`);
            } else if (mins > 0) {
                setTimeLeft(`あと ${mins}分${secs}秒`);
            } else {
                setTimeLeft(`あと ${secs}秒`);
            }
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [stream.status, stream.scheduledStartTime]);

    const openStream = () => {
        Linking.openURL(`https://www.youtube.com/watch?v=${stream.id}`);
    };

    const durationStr = React.useMemo(() => {
        if (!stream.duration) return '';
        const match = stream.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return '';
        const h = parseInt(match[1] || '0');
        const m = parseInt(match[2] || '0');
        const s = parseInt(match[3] || '0');

        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }, [stream.duration]);

    const isShort = React.useMemo(() => {
        if (!stream.duration) return false;
        const match = stream.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return false;
        const h = parseInt(match[1] || '0');
        const m = parseInt(match[2] || '0');
        const s = parseInt(match[3] || '0');
        const totalSec = h * 3600 + m * 60 + s;
        return totalSec < 62;
    }, [stream.duration]);

    // Format date/time
    const date = stream.scheduledStartTime ? new Date(stream.scheduledStartTime) : new Date();

    const dateStr = React.useMemo(() => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

        // If it's upcoming or live, show the scheduled/started time
        if (stream.status !== 'ended') {
            return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        }

        // For ended (Archive / Video), show relative time
        if (diffHrs < 1) {
            const diffMins = Math.floor(diffMs / (1000 * 60));
            return `${diffMins || 1}分前`;
        } else if (diffHrs < 24) {
            return `${diffHrs}時間前`;
        } else {
            const diffDays = Math.floor(diffHrs / 24);
            if (diffDays < 7) {
                return `${diffDays}日前`;
            } else if (diffDays < 30) {
                return `${Math.floor(diffDays / 7)}週間前`;
            } else if (diffDays < 365) {
                return `${Math.floor(diffDays / 30)}ヶ月前`;
            } else {
                return `${Math.floor(diffDays / 365)}年前`;
            }
        }
    }, [date, stream.status]);

    const getStatusBadge = () => {
        if (isShort) {
            return (
                <View style={[styles.badge, { backgroundColor: '#FF0000', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }]}>
                    <MaterialCommunityIcons name="play-circle" size={16} color="white" />
                </View>
            );
        }
        if (stream.type === 'video') {
            return (
                <View style={[styles.badge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                    <Text style={styles.badgeText}>動画</Text>
                </View>
            );
        }
        if (stream.status === 'live') {
            return (
                <View style={[styles.badge, { backgroundColor: '#cc0000' }]}>
                    <Text style={styles.badgeText}>ライブ</Text>
                </View>
            );
        } else if (stream.status === 'ended') {
            return (
                <View style={[styles.badge, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}>
                    <Text style={styles.badgeText}>アーカイブ</Text>
                </View>
            );
        }
        return (
            <View style={[styles.badge, { backgroundColor: '#E91E63' }]}>
                <Text style={styles.badgeText}>配信予定</Text>
            </View>
        );
    };

    // Should we dim the card? Only for ended streams (archives), not for general videos.
    const isActualEndedStream = stream.type === 'stream' && stream.status === 'ended';

    const getAvatarTextColor = (hexColor: string) => {
        // Simple human perception brightness calculation (YIQ)
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 180 ? '#222' : '#fff'; // Use dark text for bright backgrounds
    };

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
                    {durationStr !== '' && (
                        <View style={[styles.badge, styles.durationBadge]}>
                            <Text style={styles.badgeText}>{durationStr}</Text>
                        </View>
                    )}
                </View>
            </View>
            <View style={styles.infoContainer}>
                <View style={styles.headerRow}>
                    {member && (
                        <View style={[
                            styles.avatarPlaceholder,
                            { backgroundColor: isActualEndedStream ? '#444' : member.color },
                            stream.status === 'live' && styles.avatarLiveBorder
                        ]}>
                            {stream.channelThumbnailUrl ? (
                                <Image
                                    source={{ uri: stream.channelThumbnailUrl }}
                                    style={[
                                        styles.avatarImage,
                                        isActualEndedStream && styles.avatarEnded
                                    ]}
                                />
                            ) : (
                                <Text style={[
                                    styles.avatarText,
                                    { color: isActualEndedStream ? '#888' : getAvatarTextColor(member.color) },
                                    isActualEndedStream && styles.avatarEnded
                                ]}>
                                    {member.name[0]}
                                </Text>
                            )}
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
                            <Text style={styles.time}>{stream.status === 'upcoming' && timeLeft ? timeLeft : dateStr}</Text>
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
        left: 8,
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    durationBadge: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarLiveBorder: {
        borderWidth: 2,
        borderColor: '#ff0000',
    },
    avatarEnded: {
        opacity: 0.4,
    },
    avatarText: {
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
