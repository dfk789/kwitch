/**
 * Kwitch - Chrome Storage Wrapper
 */

import {
  KickChannel,
  ExtensionSettings,
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  DEFAULT_CHANNELS,
} from './types';

/**
 * Get the list of Kick channel slugs the user is watching
 */
export async function getChannelSlugs(): Promise<string[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.CHANNELS);
  const slugs = result[STORAGE_KEYS.CHANNELS];
  
  if (!Array.isArray(slugs)) {
    // Initialize with defaults on first run
    await setChannelSlugs(DEFAULT_CHANNELS);
    return DEFAULT_CHANNELS;
  }
  
  return slugs;
}

/**
 * Set the list of Kick channel slugs
 */
export async function setChannelSlugs(slugs: string[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.CHANNELS]: slugs });
}

/**
 * Add a channel to the watchlist
 */
export async function addChannel(slug: string): Promise<void> {
  const normalized = slug.trim();
  const current = await getChannelSlugs();
  
  // Case-insensitive check to avoid duplicates, but preserve original case
  if (!current.some(c => c.toLowerCase() === normalized.toLowerCase())) {
    await setChannelSlugs([...current, normalized]);
  }
}

/**
 * Remove a channel from the watchlist
 */
export async function removeChannel(slug: string): Promise<void> {
  const normalized = slug.trim();
  const current = await getChannelSlugs();
  // Case-insensitive removal
  await setChannelSlugs(current.filter(s => s.toLowerCase() !== normalized.toLowerCase()));
}

/**
 * Get cached channel state (live status, titles, etc.)
 */
export async function getChannelState(): Promise<KickChannel[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.CHANNEL_STATE);
  return result[STORAGE_KEYS.CHANNEL_STATE] || [];
}

/**
 * Set cached channel state
 */
export async function setChannelState(channels: KickChannel[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.CHANNEL_STATE]: channels });
}

/**
 * Get extension settings
 */
export async function getSettings(): Promise<ExtensionSettings> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS);
  const settings = result[STORAGE_KEYS.SETTINGS];
  
  if (!settings || typeof settings !== 'object') {
    return DEFAULT_SETTINGS;
  }
  
  // Merge with defaults to handle missing keys
  return { ...DEFAULT_SETTINGS, ...settings };
}

/**
 * Set extension settings
 */
export async function setSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  const current = await getSettings();
  await chrome.storage.sync.set({
    [STORAGE_KEYS.SETTINGS]: { ...current, ...settings },
  });
}
