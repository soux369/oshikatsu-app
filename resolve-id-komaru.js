const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.YOUTUBE_API_KEY;
const HANDLE = '@kurikoma_komaru';

async function resolve() {
    console.log(`Resolving ID for ${HANDLE}...`);
    try {
        const response = await axios.get(`https://www.googleapis.com/youtube/v3/channels`, {
            params: {
                part: 'id,snippet',
                forHandle: HANDLE,
                key: API_KEY
            }
        });

        if (response.data.items && response.data.items.length > 0) {
            console.log('ID Found:', response.data.items[0].id);
            console.log('Title:', response.data.items[0].snippet.title);
        } else {
            console.log('Not found.');
        }
    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) console.error(e.response.data);
    }
}

resolve();
