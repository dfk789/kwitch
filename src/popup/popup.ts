/**
 * Kwitch - Popup Script
 * 
 * Manages the extension popup UI for adding/removing channels.
 */

import { addChannel, removeChannel, getChannelSlugs } from '../lib/storage';
import { KickChannel, MessageType } from '../lib/types';

// DOM Elements
const addForm = document.getElementById('add-form') as HTMLFormElement;
const channelInput = document.getElementById('channel-input') as HTMLInputElement;
const channelList = document.getElementById('channel-list') as HTMLUListElement;
const emptyMessage = document.getElementById('empty-message') as HTMLParagraphElement;
const refreshBtn = document.getElementById('refresh-btn') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLSpanElement;

// Current channel state
let channels: KickChannel[] = [];

/**
 * Initialize popup
 */
async function init(): Promise<void> {
  // Request current channel state from background
  const response = await chrome.runtime.sendMessage({ type: 'GET_CHANNELS' }) as MessageType;
  
  if (response?.type === 'GET_CHANNELS_RESPONSE') {
    channels = response.channels;
  }
  
  // If no state yet, just show slugs
  if (channels.length === 0) {
    const slugs = await getChannelSlugs();
    channels = slugs.map(slug => ({
      slug,
      displayName: slug,
      profilePic: '',
      isLive: false,
      lastUpdated: 0,
    }));
  }
  
  renderChannels();
  setStatus(`${channels.filter(c => c.isLive).length} live`);
}

/**
 * Render the channel list
 */
function renderChannels(): void {
  channelList.innerHTML = '';
  
  if (channels.length === 0) {
    emptyMessage.hidden = false;
    return;
  }
  
  emptyMessage.hidden = true;
  
  for (const channel of channels) {
    const li = document.createElement('li');
    li.className = `channel-item ${channel.isLive ? 'live' : 'offline'}`;
    
    li.innerHTML = `
      <div class="channel-info">
        <img 
          src="${channel.profilePic || getDefaultAvatar(channel.slug)}" 
          alt="${channel.displayName}"
          class="channel-avatar"
        >
        <div class="channel-details">
          <span class="channel-name">${escapeHtml(channel.displayName)}</span>
          ${channel.isLive 
            ? `<span class="channel-status live">🔴 ${formatViewers(channel.viewerCount)} watching</span>`
            : '<span class="channel-status offline">Offline</span>'
          }
        </div>
      </div>
      <button class="btn-remove" data-slug="${channel.slug}" title="Remove channel">×</button>
    `;
    
    // Click to open channel
    li.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('btn-remove')) return;
      window.open(`https://kick.com/${channel.slug}`, '_blank');
    });
    
    channelList.appendChild(li);
  }
  
  // Add remove handlers
  document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const slug = (e.target as HTMLButtonElement).dataset.slug!;
      await handleRemoveChannel(slug);
    });
  });
}

/**
 * Handle adding a new channel
 */
async function handleAddChannel(slug: string): Promise<void> {
  const normalized = slug.toLowerCase().trim().replace(/^@/, '');
  
  if (!normalized) return;
  
  // Check if already added
  if (channels.some(c => c.slug === normalized)) {
    setStatus('Already added!');
    return;
  }
  
  setStatus('Adding...');
  await addChannel(normalized);
  
  // Add to local list immediately
  channels.push({
    slug: normalized,
    displayName: normalized,
    profilePic: '',
    isLive: false,
    lastUpdated: 0,
  });
  
  renderChannels();
  channelInput.value = '';
  setStatus('Added! Refreshing...');
  
  // Trigger a refresh
  chrome.runtime.sendMessage({ type: 'FORCE_REFRESH' });
}

/**
 * Handle removing a channel
 */
async function handleRemoveChannel(slug: string): Promise<void> {
  setStatus('Removing...');
  await removeChannel(slug);
  
  channels = channels.filter(c => c.slug !== slug);
  renderChannels();
  setStatus('Removed');
}

/**
 * Handle refresh button
 */
function handleRefresh(): void {
  setStatus('Refreshing...');
  refreshBtn.classList.add('spinning');
  
  chrome.runtime.sendMessage({ type: 'FORCE_REFRESH' });
  
  // Re-fetch after a delay
  setTimeout(async () => {
    const response = await chrome.runtime.sendMessage({ type: 'GET_CHANNELS' }) as MessageType;
    if (response?.type === 'GET_CHANNELS_RESPONSE') {
      channels = response.channels;
      renderChannels();
    }
    refreshBtn.classList.remove('spinning');
    setStatus(`${channels.filter(c => c.isLive).length} live`);
  }, 2000);
}

/**
 * Set status text
 */
function setStatus(text: string): void {
  statusEl.textContent = text;
}

/**
 * Get default avatar URL
 */
function getDefaultAvatar(slug: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(slug)}&background=00e701&color=fff&size=32`;
}

/**
 * Format viewer count
 */
function formatViewers(count?: number): string {
  if (!count) return '0';
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Event listeners
addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  handleAddChannel(channelInput.value);
});

refreshBtn.addEventListener('click', handleRefresh);

// Listen for updates from background
chrome.runtime.onMessage.addListener((message: MessageType) => {
  if (message.type === 'CHANNELS_UPDATED') {
    channels = message.channels;
    renderChannels();
    setStatus(`${channels.filter(c => c.isLive).length} live`);
  }
});

// Initialize
init();
