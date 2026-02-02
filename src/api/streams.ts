import axios from 'axios';
import { StreamInfo } from '../types/youtube';
import { getLocalCache, saveToLocalCache } from '../services/storage';

// URL of the auto-updated JSON file. 
// After pushing to GitHub and enabling GitHub Pages, this will be:
// https://<YOUR_GITHUB_USERNAME>.github.io/<YOUR_REPO_NAME>/streams.json
const HOSTED_JSON_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/streams.json';

/**
 * Main fetcher for the app. 
 * Reads from a hosted JSON file that is updated automatically via GitHub Actions.
 */
export const getLatestStreams = async (): Promise<StreamInfo[]> => {
    // 1. Try Local Cache first (AsyncStorage)
    const cached = await getLocalCache<StreamInfo[]>();
    if (cached) {
        return cached;
    }

    // 2. Fetch from Hosted JSON
    try {
        if (HOSTED_JSON_URL.includes('YOUR_USERNAME')) {
            console.warn('Hosted URL is not configured yet.');
            return [];
        }

        const response = await axios.get<StreamInfo[]>(HOSTED_JSON_URL);
        const data = response.data;

        // 3. Save to Local Cache
        await saveToLocalCache(data);

        return data;
    } catch (error) {
        console.error('Failed to fetch hosted streams:', error);
        return [];
    }
};
