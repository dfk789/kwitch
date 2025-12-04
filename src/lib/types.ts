/**
 * Kwitch - Shared Type Definitions
 */

/** Kick channel data from API */
export interface KickChannel {
  slug: string;
  displayName: string;
  profilePic: string;
  isLive: boolean;
  title?: string;
  viewerCount?: number;
  category?: string;
  lastUpdated: number;
}

/** Raw Kick API response for channel */
export interface KickApiChannelResponse {
  id: number;
  slug: string;
  user: {
    username: string;
    profile_pic: string | null;
  };
  livestream: {
    is_live: boolean;
    session_title: string;
    viewer_count: number;
    categories?: Array<{
      name: string;
    }>;
  } | null;
}

/** Extension settings stored in chrome.storage.sync */
export interface ExtensionSettings {
  pollingIntervalSeconds: number;
  embedEnabled: boolean;
  popoutEnabled: boolean;
  showOfflineChannels: boolean;
}

/** Message types for communication between scripts */
export type MessageType =
  | { type: 'CHANNELS_UPDATED'; channels: KickChannel[] }
  | { type: 'WATCH_KICK_CHANNEL'; slug: string }
  | { type: 'FORCE_REFRESH' }
  | { type: 'GET_CHANNELS' }
  | { type: 'GET_CHANNELS_RESPONSE'; channels: KickChannel[] };

/** Storage keys */
export const STORAGE_KEYS = {
  CHANNELS: 'kickChannels',
  SETTINGS: 'settings',
  CHANNEL_STATE: 'channelState',
} as const;

/** Default settings */
export const DEFAULT_SETTINGS: ExtensionSettings = {
  pollingIntervalSeconds: 60,
  embedEnabled: true,
  popoutEnabled: true,
  showOfflineChannels: true,
};

/** Default channels - pre-populated for demo */
export const DEFAULT_CHANNELS: string[] = [
  'kyootbot',
  'brotherzac',
];
