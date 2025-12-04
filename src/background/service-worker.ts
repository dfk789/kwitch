/**
 * Kwitch - Background Service Worker
 * 
 * Polls Kick API for channel status and broadcasts updates to content scripts.
 */

import { fetchMultipleChannels } from '../lib/kick-api';
import {
  getChannelSlugs,
  getSettings,
  setChannelState,
  getChannelState,
} from '../lib/storage';
import { KickChannel, MessageType } from '../lib/types';

const ALARM_NAME = 'kwitch-poll';

/**
 * Initialize the extension
 */
async function init(): Promise<void> {
  console.log('[Kwitch] Service worker starting...');
  
  // Set up polling alarm
  const settings = await getSettings();
  await setupAlarm(settings.pollingIntervalSeconds);
  
  // Do an initial poll
  await pollChannels();
  
  console.log('[Kwitch] Service worker ready');
}

/**
 * Set up the periodic polling alarm
 */
async function setupAlarm(intervalSeconds: number): Promise<void> {
  // Clear existing alarm
  await chrome.alarms.clear(ALARM_NAME);
  
  // Create new alarm (minimum is 1 minute in Chrome)
  const periodInMinutes = Math.max(1, intervalSeconds / 60);
  await chrome.alarms.create(ALARM_NAME, {
    periodInMinutes,
    delayInMinutes: 0, // Start immediately
  });
  
  console.log(`[Kwitch] Polling alarm set for every ${periodInMinutes} minute(s)`);
}

/**
 * Poll all watched channels for their current status
 */
async function pollChannels(): Promise<void> {
  console.log('[Kwitch] Polling channels...');
  
  try {
    const slugs = await getChannelSlugs();
    
    if (slugs.length === 0) {
      console.log('[Kwitch] No channels to poll');
      await setChannelState([]);
      await broadcastUpdate([]);
      return;
    }
    
    const channels = await fetchMultipleChannels(slugs);
    
    // Sort: live channels first, then alphabetically
    channels.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return a.displayName.localeCompare(b.displayName);
    });
    
    await setChannelState(channels);
    await broadcastUpdate(channels);
    
    console.log(`[Kwitch] Polled ${channels.length} channels (${channels.filter(c => c.isLive).length} live)`);
  } catch (error) {
    console.error('[Kwitch] Polling error:', error);
  }
}

/**
 * Broadcast channel updates to all Twitch tabs
 */
async function broadcastUpdate(channels: KickChannel[]): Promise<void> {
  const message: MessageType = { type: 'CHANNELS_UPDATED', channels };
  
  try {
    const tabs = await chrome.tabs.query({ url: 'https://www.twitch.tv/*' });
    
    for (const tab of tabs) {
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch {
          // Tab might not have content script loaded yet
        }
      }
    }
  } catch (error) {
    console.error('[Kwitch] Broadcast error:', error);
  }
}

// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    pollChannels();
  }
});

// Listen for messages from popup/content scripts
chrome.runtime.onMessage.addListener((message: MessageType, _sender, sendResponse) => {
  if (message.type === 'FORCE_REFRESH') {
    pollChannels();
    return false;
  }
  
  if (message.type === 'GET_CHANNELS') {
    getChannelState().then(channels => {
      sendResponse({ type: 'GET_CHANNELS_RESPONSE', channels });
    });
    return true; // Will send response async
  }
  
  return false;
});

// Listen for storage changes to re-poll when channel list changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.kickChannels) {
    console.log('[Kwitch] Channel list changed, re-polling...');
    pollChannels();
  }
});

// Initialize
init();
