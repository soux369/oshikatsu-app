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
    'UCPLeqi7rIqS5CFl0_5-pkNw', // あおぎり高校 公式
];

async function update() {
    if (!API_KEY) {
        console.error('YOUTUBE_API_KEY is missing');
        return;
    }

    try {
        console.log('Fetching candidate streams from Search API...');
        // 1. Get raw candidates from Search API
        // Fetch Live & Upcoming
        const liveCandidates = await fetchCandidateIds('live', 50);
        const upcomingCandidates = await fetchCandidateIds('upcoming', 50);

        // Fetch Recent Archives (completed)
        const completedCandidates = await fetchCandidateIds('completed', 20);

        // Fetch Uploaded Videos (no eventType) - mainly for official channel videos
        // We limit this to 20 recent videos
        const videoCandidates = await fetchCandidateIds(undefined, 20);

        // Deduplicate IDs
        const allIds = [...new Set([
            ...liveCandidates,
            ...upcomingCandidates,
            ...completedCandidates,
            ...videoCandidates
        ])];

        if (allIds.length === 0) {
            console.log('No streams found.');
            fs.writeFileSync('streams.json', JSON.stringify([], null, 2));
            return;
        }

        console.log(`Verifying status for ${allIds.length} videos...`);
        // 2. Verify accurate status using Videos API
        const verifiedItems = await fetchVideoDetails(allIds);

        // 3. Sort by Date (Descending - Newest first)
        // For streams: scheduledStartTime. For videos: publishedAt.
        verifiedItems.sort((a, b) => {
            const timeA = new Date(a.scheduledStartTime || a.publishedAt || 0).getTime();
            const timeB = new Date(b.scheduledStartTime || b.publishedAt || 0).getTime();
            return timeB - timeA;
        });

        // 3. Save result
        fs.writeFileSync('streams.json', JSON.stringify(verifiedItems, null, 2));
        console.log(`Successfully updated streams.json with ${verifiedItems.length} verified items.`);
    } catch (e) {
        console.error('Update failed:', e.message);
        if (e.response) {
            console.error('Response data:', e.response.data);
        }
    }
}

async function fetchCandidateIds(eventType, maxResults) {
    const url = `https://www.googleapis.com/youtube/v3/search`;
    const params = {
        part: 'snippet',
        q: 'あおぎり高校',
        type: 'video',
        key: API_KEY,
        maxResults: maxResults,
        order: 'date',
    };

    if (eventType) {
        params.eventType = eventType;
    }

    try {
        const response = await axios.get(url, { params });

        return response.data.items
            .filter(item => CHANNEL_IDS.includes(item.snippet.channelId))
            .map(item => item.id.videoId);
    } catch (error) {
        console.warn(`Search for ${eventType || 'video'} failed:`, error.message);
        return [];
    }
}

async function fetchVideoDetails(videoIds) {
    const url = `https://www.googleapis.com/youtube/v3/videos`;
    try {
        // Videos API max limit is 50 IDs per request.
        // Slice first 50.
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
            const liveDetails = item.liveStreamingDetails;

            // Determine Type
            const isStream = !!liveDetails;
            const type = isStream ? 'stream' : 'video';

            // Determine Status for Streams
            if (isStream) {
                const actualEndTime = liveDetails.actualEndTime;
                if (actualEndTime || status === 'none') {
                    status = 'ended';
                }

                // Fail-safe logic
                const startTimeStr = liveDetails.scheduledStartTime || item.snippet.publishedAt;
                if (status === 'upcoming' && startTimeStr) {
                    const diffHours = (new Date().getTime() - new Date(startTimeStr).getTime()) / (3600 * 1000);
                    if (diffHours > 2) status = 'ended';
                }
            } else {
                // For regular videos, status is usually 'none', but we want to display it as a video.
                // We'll map 'none' to 'uploaded' or just reuse 'ended' or keep 'none'.
                // Ideally, videos don't have "status" in the same way.
                // Let's set status to 'ended' just for consistency in filtering, 
                // OR introduce a new status.
                // Re-using 'ended' is fine if we differentiate by `type: video`.
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
