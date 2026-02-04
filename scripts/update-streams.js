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

const TARGET_CHANNEL_ID = process.env.TARGET_CHANNEL_ID;

async function update() {
    if (!API_KEY) {
        console.error('YOUTUBE_API_KEY is missing');
        return;
    }

    try {
        let existingItems = [];
        if (fs.existsSync('streams.json')) {
            try {
                existingItems = JSON.parse(fs.readFileSync('streams.json', 'utf8'));
            } catch (e) {
                existingItems = [];
            }
        }

        const isPartialUpdate = !!TARGET_CHANNEL_ID;
        const targetMembers = isPartialUpdate
            ? MEMBERS.filter(m => m.id === TARGET_CHANNEL_ID)
            : MEMBERS;

        if (isPartialUpdate) {
            console.log(`Partial update triggered for channel: ${TARGET_CHANNEL_ID}`);
        } else {
            console.log('Full scheduled update triggered.');
        }

        console.log('Resolving Uploads Playlist IDs...');
        const channelIds = targetMembers.map(m => m.id);
        const uploadsMap = await fetchUploadsPlaylistIds(channelIds);

        console.log('Fetching latest items from playlists...');
        let allVideoIds = [];
        const playlistPromises = targetMembers.map(async (member) => {
            let playlistId = uploadsMap[member.id] || member.id.replace(/^UC/, 'UU');
            return await fetchRecentVideosFromPlaylist(playlistId);
        });

        const playlistResults = await Promise.all(playlistPromises);
        playlistResults.forEach(ids => allVideoIds.push(...ids));

        // 2. Fetch Upcoming Streams
        // If it's a priority full sync (forced) or it's time for the periodic heavy sync
        if (!isPartialUpdate) {
            const forceSync = process.env.FORCE_UPCOMING_SYNC === 'true';
            const currentMinute = new Date().getUTCMinutes();

            if (forceSync || currentMinute % 30 < 10) {
                console.log(forceSync ? 'Forced Priority Sync: Fetching upcoming streams...' : 'Periodic heavy sync: Fetching upcoming streams...');
                const upcomingIds = await fetchUpcomingStreams();
                allVideoIds.push(...upcomingIds);
            } else {
                console.log('Skipping upcoming check for this cycle to save quota.');
            }
        }

        allVideoIds = [...new Set(allVideoIds)];
        if (allVideoIds.length === 0 && !isPartialUpdate) {
            console.log('No videos found.');
            fs.writeFileSync('streams.json', JSON.stringify([], null, 2));
            return;
        }

        console.log(`Verifying details for ${allVideoIds.length} videos...`);
        let newVerifiedItems = await fetchVideoDetails(allVideoIds);

        // Merge logic: If partial, keep others. If full, replace all.
        let mergedItems = isPartialUpdate
            ? existingItems.filter(item => item.channelId !== TARGET_CHANNEL_ID)
            : [];
        mergedItems.push(...newVerifiedItems);

        // Deduplicate and Sort
        const idMap = new Map();

        // Use the most recent version of an item if IDs match
        for (const item of mergedItems) {
            idMap.set(item.id, item);
        }

        let deduplicatedItems = Array.from(idMap.values());

        // Remove ghost upcoming frames (same title on same channel within 24h of a live/ended one)
        // This happens if a streamer creates a scheduled frame but starts the stream with a different video ID.
        deduplicatedItems = deduplicatedItems.filter(item => {
            if (item.status !== 'upcoming') return true;

            // 「配信予定」かつ「動画の長さが0」のものだけを削除対象とする
            const durationSec = parseISO8601Duration(item.duration || '');
            if (durationSec > 0) return true;

            const hasActiveVersion = deduplicatedItems.some(other =>
                other.id !== item.id &&
                other.channelId === item.channelId &&
                other.title.trim() === item.title.trim() &&
                other.status !== 'upcoming' &&
                Math.abs(new Date(other.scheduledStartTime).getTime() - new Date(item.scheduledStartTime).getTime()) < 24 * 3600 * 1000
            );
            return !hasActiveVersion;
        });

        const GAS_URL = process.env.GAS_URL;

        // Final Sort
        let finalItems = [...deduplicatedItems];
        finalItems.sort((a, b) => {
            const timeA = new Date(a.scheduledStartTime || 0).getTime();
            const timeB = new Date(b.scheduledStartTime || 0).getTime();
            return timeB - timeA;
        });

        // Notification Logic: Detect new LIVE or UPCOMING streams
        if (GAS_URL) {
            const newLiveUpcoming = newVerifiedItems.filter(item => item.status === 'live' || item.status === 'upcoming');
            for (const item of newLiveUpcoming) {
                const wasKnown = existingItems.find(ex => ex.id === item.id);
                const isNewlyLive = item.status === 'live' && (!wasKnown || wasKnown.status !== 'live');
                const isNewlyScheduled = item.status === 'upcoming' && !wasKnown;

                if (isNewlyLive || isNewlyScheduled) {
                    console.log(`New stream detected: ${item.title}. Notifying GAS...`);
                    try {
                        await axios.post(GAS_URL, {
                            action: 'notify',
                            title: item.status === 'live' ? '【ライブ開始】' + item.channelTitle : '【配信予約】' + item.channelTitle,
                            body: item.title
                        });
                    } catch (err) {
                        console.error('GAS Notification failed:', err.message);
                    }
                }
            }
        }

        finalItems = finalItems.slice(0, 500);
        fs.writeFileSync('streams.json', JSON.stringify(finalItems, null, 2));
        console.log(`Update complete. ${finalItems.length} total items in streams.json.`);
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

    // メンバー全員の名前を OR で繋いで検索クエリを作成 (検索漏れ防止)
    const query = [
        'あおぎり高校',
        ...MEMBERS.map(m => m.name.split(' ')[0])
    ].join(' | ');

    try {
        console.log(`Searching for upcoming with query: ${query}`);
        const response = await axios.get(url, {
            params: {
                part: 'snippet',
                q: query,
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
        console.error('Upcoming search failed:', error.message);
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

            let duration = contentDetails?.duration;
            const durationSec = parseISO8601Duration(duration || '');

            // For Shorts: If title contains #shorts and duration is under 2 mins, 
            // ensure it's treated as a short by the app (which expects < 62s)
            const hasShortsTag = item.snippet.title.toLowerCase().includes('#shorts');
            if (hasShortsTag && durationSec > 0 && durationSec < 120) {
                if (durationSec >= 62) {
                    duration = 'PT60S';
                }
            }

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
                duration: duration,
                updatedAt: new Date().toISOString()
            };
        });
    } catch (error) {
        console.error('Video details fetch failed:', error.message);
        return [];
    }
}

update();
