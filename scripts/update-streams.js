require('dotenv').config(); // Load .env locally
const axios = require('axios');
const fs = require('fs');

const API_KEY = process.env.YOUTUBE_API_KEY;

// Aogiri Members List
const MEMBERS = [
    { id: 'UCt7_srJeiw55kTcK7M9ID6g', name: '音霊 魂子' },
    { id: 'UC7wZb5INldbGweowOhBIs8Q', name: '石狩 あかり' },
    { id: 'UCs-lYkwb-NYKE9_ssTRDK3Q', name: '山黒 音玄' },
    { id: 'UCXXnWssOLdB2jg-4CznteAA', name: '栗駒 こまる' },
    { id: 'UCyY6YeINiwQoA-FnmdQCkug', name: '千代浦 蝶美' },
    { id: 'UCFvEuP2EDkvrgJpHI6-pyNw', name: '我部 りえる' },
    { id: 'UCAHXqn4nAd2j3LRu1Qyi_JA', name: 'エトラ' },
    { id: 'UCmiYJycZXBGc4s_zjIRUHhQ', name: '春雨 麗女' },
    { id: 'UC1sBUU-y9FlHNukwsrR4bmA', name: 'ぷわぷわぽぷら' },
    { id: 'UCIwHOJn_3QjBTwQ_gNj7WRA', name: '萌実' },
    { id: 'UCxy3KNlLQiN64tikKipnQNg', name: '月赴 ゐぶき' },
    { id: 'UCdi5pj0MDQ-3LFNUFIFmD8w', name: 'うる虎 がーる' },
    { id: 'UCXXlhNCp1EPbDQ2pzmmy9aw', name: '八十科 むじな' },
    { id: 'UCPLeqi7rIqS9uY4_TrSUOMg', name: 'あおぎり高校 公式' },
];

function parseISO8601Duration(duration) {
    if (!duration) return 0;
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const h = parseInt(match[1] || 0);
    const m = parseInt(match[2] || 0);
    const s = parseInt(match[3] || 0);
    return h * 3600 + m * 60 + s;
}

async function update() {
    if (!API_KEY) {
        console.error('YOUTUBE_API_KEY is missing');
        return;
    }

    try {
        console.log('Resolving Uploads Playlist IDs from Channels API...');
        const channelIds = MEMBERS.map(m => m.id);
        const uploadsMap = await fetchUploadsPlaylistIds(channelIds);

        console.log('Fetching latest items from playlists (max 50)...');
        let allVideoIds = [];
        let fetchedPlaylistsCount = 0;

        // 1. Fetch recent videos/archives
        const promises = MEMBERS.map(async (member) => {
            let playlistId = uploadsMap[member.id];
            let videoIds = [];

            if (playlistId) {
                videoIds = await fetchRecentVideosFromPlaylist(playlistId);
            } else {
                const fallbackPlaylistId = member.id.replace(/^UC/, 'UU');
                videoIds = await fetchRecentVideosFromPlaylist(fallbackPlaylistId);
            }

            if (videoIds.length === 0) {
                console.log(`Playlist fetch failed for ${member.name}, trying Search API...`);
                videoIds = await fetchVideosBySearch(member.id);
            }

            if (videoIds.length > 0) fetchedPlaylistsCount++;
            return videoIds;
        });

        const results = await Promise.all(promises);
        results.forEach(ids => allVideoIds.push(...ids));
        console.log(`Fetched content IDs from ${fetchedPlaylistsCount}/${MEMBERS.length} channels.`);

        // 2. Fetch Upcoming Streams
        console.log('Fetching upcoming streams from Search API...');
        const upcomingIds = await fetchUpcomingStreams();
        allVideoIds.push(...upcomingIds);

        // Deduplicate
        allVideoIds = [...new Set(allVideoIds)];

        if (allVideoIds.length === 0) {
            console.log('No videos found.');
            fs.writeFileSync('streams.json', JSON.stringify([], null, 2));
            return;
        }

        console.log(`Verifying details for ${allVideoIds.length} videos...`);
        let verifiedItems = await fetchVideoDetails(allVideoIds);

        // Deduplicate items by title and duration
        const sortedByQuality = verifiedItems.sort((a, b) => {
            const durA = parseISO8601Duration(a.duration || '');
            const durB = parseISO8601Duration(b.duration || '');
            return durB - durA;
        });

        const uniqueItemsMap = new Map();
        for (const item of sortedByQuality) {
            const key = `${item.channelId}_${item.title.trim()}`;
            if (!uniqueItemsMap.has(key)) {
                uniqueItemsMap.set(key, item);
            }
        }

        let finalItems = Array.from(uniqueItemsMap.values());
        finalItems.sort((a, b) => {
            const timeA = new Date(a.scheduledStartTime || 0).getTime();
            const timeB = new Date(b.scheduledStartTime || 0).getTime();
            return timeB - timeA;
        });

        fs.writeFileSync('streams.json', JSON.stringify(finalItems, null, 2));
        console.log(`Successfully updated streams.json with ${finalItems.length} unique items.`);
    } catch (e) {
        console.error('Update failed:', e.message);
    }
}

async function fetchUploadsPlaylistIds(channelIds) {
    const url = `https://www.googleapis.com/youtube/v3/channels`;
    try {
        const response = await axios.get(url, {
            params: {
                part: 'contentDetails',
                id: channelIds.join(','),
                key: API_KEY,
            }
        });

        const map = {};
        response.data.items.forEach(item => {
            map[item.id] = item.contentDetails.relatedPlaylists.uploads;
        });
        return map;
    } catch (error) {
        console.error('Channels API failed:', error.message);
        return {};
    }
}

async function fetchRecentVideosFromPlaylist(playlistId) {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems`;
    try {
        const response = await axios.get(url, {
            params: {
                part: 'contentDetails',
                playlistId: playlistId,
                maxResults: 50,
                key: API_KEY,
            }
        });
        return response.data.items.map(item => item.contentDetails.videoId);
    } catch (error) {
        return [];
    }
}

async function fetchVideosBySearch(channelId) {
    const url = `https://www.googleapis.com/youtube/v3/search`;
    try {
        const response = await axios.get(url, {
            params: {
                part: 'snippet',
                channelId: channelId,
                type: 'video',
                order: 'date',
                maxResults: 20,
                key: API_KEY,
            }
        });
        return response.data.items.map(item => item.id.videoId);
    } catch (error) {
        return [];
    }
}

async function fetchUpcomingStreams() {
    const url = `https://www.googleapis.com/youtube/v3/search`;
    const CHANNEL_IDS = MEMBERS.map(m => m.id);
    try {
        const response = await axios.get(url, {
            params: {
                part: 'snippet',
                q: 'あおぎり高校',
                type: 'video',
                eventType: 'upcoming',
                key: API_KEY,
                maxResults: 50,
                order: 'date',
            }
        });

        return response.data.items
            .filter(item => CHANNEL_IDS.includes(item.snippet.channelId))
            .map(item => item.id.videoId);
    } catch (error) {
        return [];
    }
}

async function fetchVideoDetails(videoIds) {
    const url = `https://www.googleapis.com/youtube/v3/videos`;
    try {
        const allItems = [];
        for (let i = 0; i < videoIds.length; i += 50) {
            const batchIds = videoIds.slice(i, i + 50);
            const response = await axios.get(url, {
                params: {
                    part: 'snippet,liveStreamingDetails,contentDetails',
                    id: batchIds.join(','),
                    key: API_KEY,
                }
            });
            allItems.push(...response.data.items);
        }

        // Fetch Channel Thumbnails
        const chanIds = [...new Set(allItems.map(item => item.snippet.channelId))];
        const channelThumbnails = {};
        for (let i = 0; i < chanIds.length; i += 50) {
            const batchIds = chanIds.slice(i, i + 50);
            const channelResponse = await axios.get(`https://www.googleapis.com/youtube/v3/channels`, {
                params: {
                    part: 'snippet',
                    id: batchIds.join(','),
                    key: API_KEY,
                }
            });
            channelResponse.data.items.forEach(c => {
                channelThumbnails[c.id] = c.snippet.thumbnails.default?.url || c.snippet.thumbnails.medium?.url;
            });
        }

        return allItems.map(item => {
            let status = item.snippet.liveBroadcastContent;
            const liveDetails = item.liveStreamingDetails;
            const contentDetails = item.contentDetails;

            const durationSec = parseISO8601Duration(contentDetails?.duration || '');
            const isLongVideo = durationSec > 25 * 60;

            let type = liveDetails ? 'stream' : 'video';
            if (type === 'stream' && !isLongVideo && status === 'none') {
                type = 'video';
            }

            if (liveDetails) {
                if (liveDetails.actualEndTime || status === 'none') {
                    status = 'ended';
                }
                const startTimeStr = liveDetails.scheduledStartTime || item.snippet.publishedAt;
                if (status === 'upcoming' && startTimeStr) {
                    const diffHours = (new Date().getTime() - new Date(startTimeStr).getTime()) / (3600 * 1000);
                    if (diffHours > 2) status = 'ended';
                }
            } else {
                status = 'ended';
            }

            return {
                id: item.id,
                title: item.snippet.title,
                thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
                status: status,
                type: type,
                channelTitle: item.snippet.channelTitle,
                channelId: item.snippet.channelId,
                channelThumbnailUrl: channelThumbnails[item.snippet.channelId],
                scheduledStartTime: liveDetails?.scheduledStartTime || item.snippet.publishedAt,
                duration: contentDetails?.duration,
                updatedAt: new Date().toISOString()
            };
        });
    } catch (error) {
        console.error('Video details fetch failed:', error.message);
        return [];
    }
}

update();
