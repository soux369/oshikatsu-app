import axios from 'axios';
import { StreamInfo } from '../types/youtube';

/**
 * Shared Storage Service
 * In a real app, use Supabase, Firebase, or a simple JSONBin.
 * Here we provide a logic template for "Shared Cache".
 */

// Example: Using JSONBin.io (Free Tier)
const SHARED_STORE_URL = 'https://api.jsonbin.io/v3/b/YOUR_BIN_ID';
const MASTER_KEY = 'YOUR_MASTER_KEY';

export const getSharedData = async (): Promise<{ data: StreamInfo[], updatedAt: number } | null> => {
    try {
        // Return null if not configured
        if (SHARED_STORE_URL.includes('YOUR_BIN_ID')) return null;

        const response = await axios.get(SHARED_STORE_URL, {
            headers: { 'X-Master-Key': MASTER_KEY }
        });
        return {
            data: response.data.record.streams,
            updatedAt: response.data.record.updatedAt
        };
    } catch (e) {
        console.error('Failed to fetch shared data', e);
        return null;
    }
};

export const updateSharedData = async (streams: StreamInfo[]): Promise<void> => {
    try {
        if (SHARED_STORE_URL.includes('YOUR_BIN_ID')) return;

        await axios.put(SHARED_STORE_URL, {
            record: {
                streams: streams,
                updatedAt: Date.now()
            }
        }, {
            headers: { 'X-Master-Key': MASTER_KEY, 'Content-Type': 'application/json' }
        });
    } catch (e) {
        console.error('Failed to update shared data', e);
    }
};

/**
 * ORCHESTRATOR LOGIC:
 * 1. Check Local Cache (AsyncStorage) -> If < 5 mins, return.
 * 2. Check Shared Store (JSONBin/Supabase) -> If < 15 mins, save to Local and return.
 * 3. Fetch from YouTube API (Combined Search) -> Save to Shared Store AND Local Store.
 */
