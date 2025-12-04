/**
 * Kwitch - Twitch Sidebar Injection
 * 
 * Injects Kick channels into the Twitch left sidebar.
 */

import { KickChannel, MessageType } from '../lib/types';

// Constants
const SIDEBAR_SELECTORS = [
  '.side-nav-section',
  '[data-a-target="side-nav-header-expanded"]',
  '.side-nav',
];
const POLL_INTERVAL = 1000; // Check for sidebar every second
const MAX_POLL_ATTEMPTS = 30; // Give up after 30 seconds

let channels: KickChannel[] = [];
let sectionElement: HTMLElement | null = null;
let isCollapsed = false;

/**
 * Initialize the content script
 */
async function init(): Promise<void> {
  console.log('[Kwitch] Content script loading...');
  
  // Request initial channel state
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_CHANNELS' }) as MessageType;
    if (response?.type === 'GET_CHANNELS_RESPONSE') {
      channels = response.channels;
    }
  } catch (error) {
    console.log('[Kwitch] Could not get initial channels:', error);
  }
  
  // Wait for sidebar to appear and inject
  waitForSidebar();
  
  // Listen for updates from background
  chrome.runtime.onMessage.addListener(handleMessage);
  
  // Watch for navigation changes (Twitch is a SPA)
  observeNavigation();
}

/**
 * Wait for Twitch sidebar to load
 */
function waitForSidebar(): void {
  let attempts = 0;
  
  const checkInterval = setInterval(() => {
    attempts++;
    
    const sidebar = findSidebar();
    if (sidebar) {
      clearInterval(checkInterval);
      injectSection(sidebar);
      return;
    }
    
    if (attempts >= MAX_POLL_ATTEMPTS) {
      clearInterval(checkInterval);
      console.log('[Kwitch] Sidebar not found after max attempts');
    }
  }, POLL_INTERVAL);
}

/**
 * Find the Twitch sidebar element
 */
function findSidebar(): HTMLElement | null {
  for (const selector of SIDEBAR_SELECTORS) {
    const element = document.querySelector(selector);
    if (element) {
      return element as HTMLElement;
    }
  }
  return null;
}

/**
 * Inject the Kwitch section into the sidebar
 */
function injectSection(sidebar: HTMLElement): void {
  // Check if already injected
  if (document.querySelector('.kwitch-section')) {
    return;
  }
  
  // Check if sidebar is collapsed
  isCollapsed = sidebar.clientWidth < 100;
  
  // Create section
  sectionElement = document.createElement('div');
  sectionElement.className = `kwitch-section${isCollapsed ? ' collapsed' : ''}`;
  
  // Insert at the top of the sidebar
  const firstChild = sidebar.firstChild;
  if (firstChild) {
    sidebar.insertBefore(sectionElement, firstChild);
  } else {
    sidebar.appendChild(sectionElement);
  }
  
  // Render channels
  renderChannels();
  
  // Watch for sidebar collapse/expand
  observeSidebarResize(sidebar);
  
  console.log('[Kwitch] Section injected');
}

/**
 * Render the channel list
 */
function renderChannels(): void {
  if (!sectionElement) return;
  
  sectionElement.innerHTML = '';
  
  // Header
  const header = document.createElement('div');
  header.className = 'kwitch-section-header';
  header.innerHTML = '<span>Kick Channels</span>';
  sectionElement.appendChild(header);
  
  if (channels.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'kwitch-empty';
    empty.textContent = 'No channels';
    empty.style.cssText = 'padding: 10px; color: #6d6d70; font-size: 12px; text-align: center;';
    sectionElement.appendChild(empty);
    return;
  }
  
  // Channel cards
  for (const channel of channels) {
    const card = createChannelCard(channel);
    sectionElement.appendChild(card);
  }
}

/**
 * Create a channel card element
 */
function createChannelCard(channel: KickChannel): HTMLElement {
  const card = document.createElement('a');
  card.className = `kwitch-channel${channel.isLive ? '' : ' offline'}`;
  card.href = '#';
  card.title = channel.isLive 
    ? `${channel.displayName} - ${channel.title || 'Live'} (${formatViewers(channel.viewerCount)} viewers)`
    : `${channel.displayName} - Offline`;
  
  card.innerHTML = `
    <div class="kwitch-avatar-wrapper">
      <img 
        src="${channel.profilePic || getDefaultAvatar(channel.slug)}" 
        alt="${escapeHtml(channel.displayName)}"
        class="kwitch-avatar"
      >
      ${channel.isLive ? '<div class="kwitch-live-indicator"></div>' : ''}
    </div>
    <div class="kwitch-channel-info">
      <div class="kwitch-channel-name">${escapeHtml(channel.displayName)}</div>
      <div class="kwitch-channel-game">${escapeHtml(channel.category || (channel.isLive ? 'Live' : 'Offline'))}</div>
    </div>
    ${channel.isLive ? `<div class="kwitch-viewer-count">${formatViewers(channel.viewerCount)}</div>` : ''}
  `;
  
  card.addEventListener('click', (e) => {
    e.preventDefault();
    handleChannelClick(channel);
  });
  
  return card;
}

/**
 * Handle clicking on a channel
 */
function handleChannelClick(channel: KickChannel): void {
  console.log(`[Kwitch] Opening ${channel.slug}`);
  
  // For MVP, open in new tab (embedding will be added later)
  window.open(`https://kick.com/${channel.slug}`, '_blank');
  
  // TODO: Try embedding first, fall back to popout
  // chrome.runtime.sendMessage({ type: 'WATCH_KICK_CHANNEL', slug: channel.slug });
}

/**
 * Handle messages from background script
 */
function handleMessage(message: MessageType): void {
  if (message.type === 'CHANNELS_UPDATED') {
    channels = message.channels;
    renderChannels();
  }
}

/**
 * Watch for navigation changes in Twitch SPA
 */
function observeNavigation(): void {
  // Re-inject if our section gets removed (e.g., React re-render)
  const observer = new MutationObserver(() => {
    if (!document.querySelector('.kwitch-section')) {
      const sidebar = findSidebar();
      if (sidebar) {
        injectSection(sidebar);
      }
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Watch for sidebar resize (collapse/expand)
 */
function observeSidebarResize(sidebar: HTMLElement): void {
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const newIsCollapsed = entry.contentRect.width < 100;
      if (newIsCollapsed !== isCollapsed) {
        isCollapsed = newIsCollapsed;
        if (sectionElement) {
          sectionElement.classList.toggle('collapsed', isCollapsed);
        }
      }
    }
  });
  
  resizeObserver.observe(sidebar);
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
 * Get default avatar URL
 */
function getDefaultAvatar(slug: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(slug)}&background=00e701&color=fff&size=64`;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
