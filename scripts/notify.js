const axios = require('axios');
const fs = require('fs');

const GAS_URL = process.env.GAS_URL;
const PENDING_FILE = '.github/pending_notifications.json';

async function checkThumbnail(url) {
    if (!url) return true;
    try {
        const response = await axios.head(url, { timeout: 5000 });
        if (response.status !== 200) return false;
        const contentLength = parseInt(response.headers['content-length'] || '0');
        // YouTube placeholders are typically ~1097 bytes. Real ones are > 5000.
        return contentLength > 2000;
    } catch (e) {
        return false;
    }
}

async function run() {
    if (!GAS_URL) {
        console.log('GAS_URL not set, skipping notifications.');
        return;
    }

    if (!fs.existsSync(PENDING_FILE)) {
        console.log('No pending notifications.');
        return;
    }

    const notifications = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8'));
    console.log(`Processing ${notifications.length} notifications...`);

    for (const note of notifications) {
        console.log(`Checking thumbnail for: ${note.id}`);

        // Retry thumbnail check up to 6 times (60 seconds total)
        let ready = false;
        for (let i = 0; i < 6; i++) {
            ready = await checkThumbnail(note.thumbnailUrl);
            if (ready) break;
            console.log(`  Thumbnail not ready, waiting 10s... (Attempt ${i + 1}/6)`);
            await new Promise(r => setTimeout(r, 10000));
        }

        if (!ready) {
            console.log('  Thumbnail still not ready, notifying anyway to avoid further delay.');
        }

        console.log(`  Sending notification for: ${note.title}`);
        try {
            await axios.post(GAS_URL, {
                action: 'notify',
                title: note.title,
                body: note.body,
                thumbnailUrl: note.thumbnailUrl // Add this
            });
            console.log('  Success.');
        } catch (err) {
            console.error('  GAS Notification failed:', err.message);
        }
    }

    // Clean up
    fs.unlinkSync(PENDING_FILE);
}

run();
