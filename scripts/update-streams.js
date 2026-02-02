require('dotenv').config(); // Load .env locally
const axios = require('axios');
const fs = require('fs');

const API_KEY = process.env.YOUTUBE_API_KEY;

// Aogiri Members List (Excluding retired members)
const CHANNEL_IDS = [
    'UCt7_srJeiw55kTcK7M9ID6g', // 音霊 魂子
    'UC7wZb5INldbGweowOhBIs8Q', // 石狩 あかり
    'UCs-lYkwb-NYKE9_ssTRDK3Q', // 山黒 音玄
    'UCXXnWssOLdB2jg-4CznteAA', // 栗駒 こまる
    'UCyY6YeINiwQoA-FnmdQCkug', // 千代浦 蝶美
    'UCFvEuP2EDkvrgJpHI6-pyNw', // 我部 りえる
    'UCAHXqn4nAd2j3LRu1Qyi_JA', // エトラ
    'UCmiYJycZXBGc4s_zjIRUHhQ', // 春雨 麗女
    'UC7u_W9WfB_g35m9nK_S460w', // ぷわぷわぽぷら
    'UCIwHOJn_3QjBTwQ_gNj7WRA', // 萌実
    'UCxy3KNlLQiN64tikKipnQNg', // 月赴 ゐぶき
    'UCdi5pj0MDQ-3LFNUFIFmD8w', // うる虎 がーる
    'UCXXlhNCp1EPbDQ2pzmmy9aw', // 八十科 むじな
];

async function update() {
    if (!API_KEY) {
        console.error('YOUTUBE_API_KEY is missing');
        return;
    }

    try {
        console.log('Fetching candidate streams from Search API...');
        // 1. Get raw candidates from Search API
        // Fetch Live & Upcoming (Limit 50 each)
        const liveCandidates = await fetchCandidateIds('live', 50);
        const upcomingCandidates = await fetchCandidateIds('upcoming', 50);
        // Fetch Recent Archives (Limit 20 to save quota)
        const completedCandidates = await fetchCandidateIds('completed', 20);

        // Deduplicate IDs
        const allIds = [...new Set([...liveCandidates, ...upcomingCandidates, ...completedCandidates])];

        if (allIds.length === 0) {
            console.log('No streams found.');
            fs.writeFileSync('streams.json', JSON.stringify([], null, 2));
            return;
        }

        console.log(`Verifying status for ${allIds.length} videos...`);
        // 2. Verify accurate status using Videos API
        const verifiedStreams = await fetchVideoDetails(allIds);

        // 3. Sort by Scheduled Start Time (Descending - Newest first)
        verifiedStreams.sort((a, b) => {
            const timeA = new Date(a.scheduledStartTime || 0).getTime();
            const timeB = new Date(b.scheduledStartTime || 0).getTime();
            return timeB - timeA;
        });

        // 3. Save result
        fs.writeFileSync('streams.json', JSON.stringify(verifiedStreams, null, 2));
        console.log(`Successfully updated streams.json with ${verifiedStreams.length} verified items.`);
    } catch (e) {
        console.error('Update failed:', e.message);
        if (e.response) {
            console.error('Response data:', e.response.data);
        }
    }
}

async function fetchCandidateIds(eventType, maxResults) {
    const url = `https://www.googleapis.com/youtube/v3/search`;
    try {
        const response = await axios.get(url, {
            params: {
                part: 'snippet',
                q: 'あおぎり高校',
                type: 'video',
                eventType: eventType,
                key: API_KEY,
                maxResults: maxResults,
                order: 'date',
            }
        });

        return response.data.items
            .filter(item => CHANNEL_IDS.includes(item.snippet.channelId))
            .map(item => item.id.videoId);
    } catch (error) {
        console.warn(`Search for ${eventType} failed:`, error.message);
        return [];
    }
}

async function fetchVideoDetails(videoIds) {
    const url = `https://www.googleapis.com/youtube/v3/videos`;
    try {
        // Videos API max limit is 50 IDs per request.
        // If we have more than 50, we need to batch.
        // For simplicity now, let's just slice first 50. 
        // (Aogiri members are few, unlikely to have >50 active/recent streams at once mostly)
        const idsToFetch = videoIds.slice(0, 50);

        const response = await axios.get(url, {
            params: {
                part: 'snippet,liveStreamingDetails',
                id: idsToFetch.join(','),
                key: API_KEY,
            }
        });

        return response.data.items.map(item => {
            let status = item.snippet.liveBroadcastContent; // 'live', 'upcoming', 'none'
            if (status === 'none') {
                status = 'ended';
            }

            // Allow 'none' (finished streams) now. No filtering.

            // Use liveStreamingDetails for more accurate times
            const startTime = item.liveStreamingDetails?.scheduledStartTime || item.snippet.publishedAt;

            return {
                id: item.id,
                title: item.snippet.title,
                thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
                status: status,
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
