require('dotenv').config(); // Load .env locally
const axios = require('axios');
const fs = require('fs');

const API_KEY = process.env.YOUTUBE_API_KEY;

// Updated Aogiri Members List (Excluding retired members)
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
        console.log('Fetching live streams...');
        const live = await fetchStreams('live');

        console.log('Fetching upcoming streams...');
        const upcoming = await fetchStreams('upcoming');

        const combined = [...live, ...upcoming];

        fs.writeFileSync('streams.json', JSON.stringify(combined, null, 2));
        console.log(`Successfully updated streams.json with ${combined.length} items.`);
    } catch (e) {
        console.error('Update failed:', e.message);
        if (e.response) {
            console.error('Response data:', e.response.data);
        }
    }
}

async function fetchStreams(eventType) {
    const url = `https://www.googleapis.com/youtube/v3/search`;

    // API Quota Optimization: 
    // Instead of string searching "Aogiri", we should ideally filter by channel ID.
    // However, search endpoint with channelId only accepts ONE channel ID.
    // So we search for "あおぎり高校" and then filter results client-side by our ID list.
    // This isn't perfect but saves multiple API calls.

    // Note: To be more robust, we might loop through IDs, but that consumes quota fast.
    // For now, let's stick to keyword search + filter.

    const response = await axios.get(url, {
        params: {
            part: 'snippet',
            q: 'あおぎり高校',
            type: 'video',
            eventType: eventType,
            key: API_KEY,
            maxResults: 50,
            order: 'date', // Get latest
        }
    });

    return response.data.items
        .filter(item => CHANNEL_IDS.includes(item.snippet.channelId))
        .map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnailUrl: item.snippet.thumbnails.high.url,
            status: eventType,
            channelTitle: item.snippet.channelTitle,
            channelId: item.snippet.channelId,
            scheduledStartTime: item.snippet.publishedAt, // approximate for search results
            updatedAt: new Date().toISOString()
        }));
}

update();
