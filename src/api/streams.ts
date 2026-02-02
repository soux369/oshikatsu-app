import axios from 'axios';
import { StreamInfo } from '../types/youtube';
import { getLocalCache, saveToLocalCache } from '../services/storage';

// URL of the auto-updated JSON file. 
// After pushing to GitHub and enabling GitHub Pages, this will be:
// https://<YOUR_GITHUB_USERNAME>.github.io/<YOUR_REPO_NAME>/streams.json
const HOSTED_JSON_URL = 'https://raw.githubusercontent.com/soux369/oshikatsu-app/main/streams.json';

// Re-export StreamInfo for consumers
export { StreamInfo };

/**
 * Main fetcher for the app. 
 * Reads from a hosted JSON file that is updated automatically via GitHub Actions.
 */
export const getStreams = async (forceRefresh: boolean = false): Promise<StreamInfo[]> => {
    // 1. Try Local Cache first (AsyncStorage), unless forced
    if (!forceRefresh) {
        const cached = await getLocalCache<StreamInfo[]>();
        if (cached) {
            return cached;
        }
    }

    // 2. Fetch from Hosted JSON
    try {
        // Add a timestamp query param to prevent caching by GitHub Raw/CDN
        const timestamp = new Date().getTime();
        const response = await axios.get<StreamInfo[]>(`${HOSTED_JSON_URL}?t=${timestamp}`);
        const data = response.data;

        // 3. Save to Local Cache
        await saveToLocalCache(data);

        return data;
    } catch (error) {
        console.error('Failed to fetch hosted streams:', error);
        return [];
    }
};

// Alias for backward compatibility if needed, though we use getStreams now
export const getLatestStreams = getStreams;
