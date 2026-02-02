const axios = require('axios');
const fs = require('fs');

/**
 * BACKGROUND SCRIPT: For GitHub Actions
 * This script fetches data from YouTube and saves it as streams.json.
 */

const API_KEY = process.env.YOUTUBE_API_KEY;
const GROUP_KEYWORD = 'あおぎり高校';
const CHANNEL_IDS = [
    'UCPG_p9shR2IdjUjvyO03pRA', // 音霊魂子
    'UC1YvO_6YI8GisE0pT606S-A', // 石狩あかり
    'UCR_6MvSPrTzG_U_Xv-vX_fA', // 大代真白
    'UCl_V378ZvT9V6U_f9mS8A-g', // 山黒音玄
    'UC_8O_uS9_p9x_-w8I8yv8Cg', // 栗駒こまる
    'UCV_r_p7_S8r-s-S7p9G_v8Q', // 千代浦蝶美
    'UCM_8O_uS9_p9x_-w8I8yv8Cg', // 我部りあ (Example ID)
    // ... 他のメンバーのIDを追加
];

async function update() {
    if (!API_KEY) {
        console.error('YOUTUBE_API_KEY is missing');
        return;
    }

    try {
        const live = await fetchByType('live');
        const upcoming = await fetchByType('upcoming');

        const combined = [...live, ...upcoming];

        fs.writeFileSync('streams.json', JSON.stringify(combined, null, 2));
        console.log(`Updated streams.json with ${combined.length} items`);
    } catch (e) {
        console.error('Update failed:', e);
    }
}

async function fetchByType(eventType) {
    const url = `https://www.googleapis.com/youtube/v3/search`;
    const response = await axios.get(url, {
        params: {
            part: 'snippet',
            q: GROUP_KEYWORD,
            type: 'video',
            eventType: eventType,
            key: API_KEY,
            maxResults: 50,
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
            updatedAt: new Date().toISOString()
        }));
}

update();
