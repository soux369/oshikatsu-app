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
    { id: 'UC7u_W9WfB_g35m9nK_S460w', name: 'ぷわぷわぽぷら' },
    { id: 'UCIwHOJn_3QjBTwQ_gNj7WRA', name: '萌実' },
    { id: 'UCxy3KNlLQiN64tikKipnQNg', name: '月赴 ゐぶき' },
    { id: 'UCdi5pj0MDQ-3LFNUFIFmD8w', name: 'うる虎 がーる' },
    { id: 'UCXXlhNCp1EPbDQ2pzmmy9aw', name: '八十科 むじな' },
    { id: 'UCPLeqi7rIqS5CFl0_5-pkNw', name: 'あおぎり高校 公式' },
];

async function update() {
    if (!API_KEY) {
        console.error('YOUTUBE_API_KEY is missing');
        return;
    }

    try {
        console.log('Resolving Uploads Playlist IDs from Channels API...');
        const channelIds = MEMBERS.map(m => m.id);
        const uploadsMap = await fetchUploadsPlaylistIds(channelIds);

        console.log('Fetching latest videos from playlists...');
        let allVideoIds = [];
        let fetchedPlaylistsCount = 0;

        // 1. Fetch recent videos/archives from Playlists
        const playlistPromises = MEMBERS.map(async (member) => {
            let playlistId = uploadsMap[member.id];
            if (!playlistId) {
                // Fallback: Use UU replacement if API didn't return (or failed)
                // console.warn(`Fallback to UU for ${member.name}`);
                playlistId = member.id.replace(/^UC/, 'UU');
            }
            const videoIds = await fetchRecentVideosFromPlaylist(playlistId);
            if (videoIds.length > 0) fetchedPlaylistsCount++;
            return videoIds;
        });

        const playlistResults = await Promise.all(playlistPromises);
        playlistResults.forEach(ids => allVideoIds.push(...ids));
        console.log(`Fetched from ${fetchedPlaylistsCount}/${MEMBERS.length} playlists.`);

        // 2. Fetch Upcoming Streams explicitly via Search API
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

        console.log(`Verifying status for ${allVideoIds.length} videos...`);
        const verifiedItems = await fetchVideoDetails(allVideoIds);

        // Sort by Date Newest
        verifiedItems.sort((a, b) => {
            const timeA = new Date(a.scheduledStartTime || a.publishedAt || 0).getTime();
            const timeB = new Date(b.scheduledStartTime || b.publishedAt || 0).getTime();
            return timeB - timeA;
        });

        fs.writeFileSync('streams.json', JSON.stringify(verifiedItems, null, 2));
        console.log(`Successfully updated streams.json with ${verifiedItems.length} verified items.`);
    } catch (e) {
        console.error('Update failed:', e.message);
        if (e.response) {
            console.error('Response data:', e.response.data);
        }
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

        // Create Map: ChannelID -> UploadsID
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
                part: 'snippet,contentDetails',
                playlistId: playlistId,
                maxResults: 10,
                key: API_KEY,
            }
        });
        return response.data.items.map(item => item.contentDetails.videoId);
    } catch (error) {
        // console.warn(`Failed to fetch playlist ${playlistId}`);
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
        console.warn(`Search for upcoming failed:`, error.message);
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
                    part: 'snippet,liveStreamingDetails',
                    id: batchIds.join(','),
                    key: API_KEY,
                }
            });
            allItems.push(...response.data.items);
        }

        return allItems.map(item => {
            let status = item.snippet.liveBroadcastContent; // 'live', 'upcoming', 'none'
            const liveDetails = item.liveStreamingDetails;

            const isStream = !!liveDetails;
            const type = isStream ? 'stream' : 'video';

            if (isStream) {
                const actualEndTime = liveDetails.actualEndTime;
                if (actualEndTime || status === 'none') {
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

            const startTime = liveDetails?.scheduledStartTime || item.snippet.publishedAt;

            return {
                id: item.id,
                title: item.snippet.title,
                thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
                status: status,
                type: type,
                channelTitle: item.snippet.channelTitle,
                channelId: item.snippet.channelId,
                scheduledStartTime: startTime,
                updatedAt: new Date().toISOString()
            };
        });
    } catch (error) {
        console.error('Video details fetch failed:', error.message);
        return [];
    }
}

update();
