/**
 * YouTube Data API v3 Video Item (Partial)
 */
export interface YouTubeVideoItem {
    id: {
        videoId: string;
    };
    snippet: {
        title: string;
        description: string;
        thumbnails: {
            high: {
                url: string;
            };
        };
        channelTitle: string;
        liveBroadcastContent: 'live' | 'upcoming' | 'none';
        publishedAt: string;
    };
}

/**
 * YouTube Search API Response
 */
export interface YouTubeSearchResponse {
    items: YouTubeVideoItem[];
    error?: {
        code: number;
        message: string;
    };
}

/**
 * Internal Stream Information Type
 */
export interface StreamInfo {
    id: string;
    title: string;
    thumbnailUrl: string;
    scheduledStartTime?: string; // ISO 8601 string
    status: 'live' | 'upcoming';
    channelTitle: string;
    channelId: string;
}
