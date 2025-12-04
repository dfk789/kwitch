/**
 * Kwitch - Kick API Client
 */

import { KickChannel, KickApiChannelResponse } from './types';

const KICK_API_BASE = 'https://kick.com/api/v2';

/**
 * Fetch a single channel's info from Kick API
 */
export async function fetchChannel(slug: string): Promise<KickChannel | null> {
  try {
    const response = await fetch(`${KICK_API_BASE}/channels/${slug}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`[Kwitch] Channel not found: ${slug}`);
        return null;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data: KickApiChannelResponse = await response.json();
    return parseChannelResponse(slug, data);
  } catch (error) {
    console.error(`[Kwitch] Failed to fetch channel ${slug}:`, error);
    return null;
  }
}

/**
 * Fetch multiple channels with rate limiting
 */
export async function fetchMultipleChannels(
  slugs: string[],
  delayMs: number = 200
): Promise<KickChannel[]> {
  const results: KickChannel[] = [];

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    const channel = await fetchChannel(slug);
    
    if (channel) {
      results.push(channel);
    }

    // Rate limit: wait between requests (except for last one)
    if (i < slugs.length - 1) {
      await delay(delayMs);
    }
  }

  return results;
}

/**
 * Parse Kick API response into our KickChannel type
 */
function parseChannelResponse(slug: string, data: KickApiChannelResponse): KickChannel {
  const isLive = data.livestream?.is_live ?? false;
  
  return {
    slug: data.slug || slug,
    displayName: data.user?.username || slug,
    profilePic: data.user?.profile_pic || getDefaultAvatar(slug),
    isLive,
    title: isLive ? data.livestream?.session_title : undefined,
    viewerCount: isLive ? data.livestream?.viewer_count : undefined,
    category: isLive ? data.livestream?.categories?.[0]?.name : undefined,
    lastUpdated: Date.now(),
  };
}

/**
 * Generate a default avatar URL for channels without one
 */
function getDefaultAvatar(slug: string): string {
  // Use a colored placeholder based on the first letter
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(slug)}&background=00e701&color=fff&size=64`;
}

/**
 * Utility: delay for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get the embed URL for Kick player
 */
export function getPlayerEmbedUrl(slug: string): string {
  return `https://kick.com/${slug}`;
}

/**
 * Get the embed URL for Kick chat
 */
export function getChatEmbedUrl(slug: string): string {
  return `https://kick.com/popout/${slug}/chat`;
}

/**
 * Get the popout URL for watching in a new window
 */
export function getPopoutUrl(slug: string): string {
  return `https://kick.com/${slug}`;
}
