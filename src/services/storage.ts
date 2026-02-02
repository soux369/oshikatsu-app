import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'STREAM_CACHE';
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes in milliseconds

interface CacheData<T> {
    timestamp: number;
    data: T;
}

/**
 * Save data with timestamp
 */
export const saveToLocalCache = async <T>(data: T): Promise<void> => {
    try {
        const cache: CacheData<T> = {
            timestamp: Date.now(),
            data: data,
        };
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.error('Failed to save local cache', e);
    }
};

/**
 * Get data if not expired
 */
export const getLocalCache = async <T>(): Promise<T | null> => {
    try {
        const jsonValue = await AsyncStorage.getItem(CACHE_KEY);
        if (!jsonValue) return null;

        const cache: CacheData<T> = JSON.parse(jsonValue);
        const isExpired = Date.now() - cache.timestamp > CACHE_EXPIRY;

        if (isExpired) {
            return null;
        }
        return cache.data;
    } catch (e) {
        console.error('Failed to fetch local cache', e);
        return null;
    }
};
