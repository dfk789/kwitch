/**
 * Kwitch - Twitch Sidebar Injection
 * 
 * Injects Kick channels into the Twitch left sidebar.
 */

import { KickChannel, MessageType, ExtensionSettings } from '../lib/types';
import { getSettings } from '../lib/storage';
import { showKickPlayer } from './inject-player';

// Constants
const POLL_INTERVAL = 1000;
const MAX_POLL_ATTEMPTS = 30;
const INITIAL_VISIBLE_COUNT = 6;

// State
let channels: KickChannel[] = [];
let settings: ExtensionSettings | null = null;
let sectionElement: HTMLElement | null = null;
let isCollapsed = false;
let isExpandedList = false;

/**
 * Initialize the content script
 */
async function init(): Promise<void> {
  console.log('[Kwitch] Content script loading...');
  
  try {
    settings = await getSettings();
  } catch (error) {
    console.log('[Kwitch] Could not load settings:', error);
  }

  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_CHANNELS' }) as MessageType;
    if (response?.type === 'GET_CHANNELS_RESPONSE') {
      channels = response.channels;
    }
  } catch (error) {
    console.log('[Kwitch] Could not get initial channels:', error);
  }
  
  waitForSidebar();
  chrome.runtime.onMessage.addListener(handleMessage);
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
  const followedHeader = document.querySelector('[aria-label="Followed Channels"], [aria-label="Followed channels"]');
  if (followedHeader) {
    return followedHeader.closest('.side-nav-section') as HTMLElement || 
           followedHeader.closest('nav') as HTMLElement ||
           document.querySelector('.side-nav-section') as HTMLElement;
  }
  
  return document.querySelector('.side-nav-section') as HTMLElement;
}

/**
 * Inject the Kwitch section into the sidebar
 */
function injectSection(sidebar: HTMLElement): void {
  if (document.querySelector('.kwitch-section')) {
    return;
  }
  
  const sidebarRoot = document.querySelector('.side-nav, [data-a-target="side-nav-bar"]');
  isCollapsed = sidebarRoot ? sidebarRoot.clientWidth < 200 : false;
  
  sectionElement = document.createElement('div');
  sectionElement.className = `kwitch-section${isCollapsed ? ' collapsed' : ''}`;
  
  const position = settings?.sidebarPosition || 'above_followed';
  insertAtPosition(sidebar, sectionElement, position);
  
  renderChannels();
  
  if (sidebarRoot) {
    observeSidebarResize(sidebarRoot as HTMLElement);
  }
  
  console.log('[Kwitch] Section injected at', position);
}

/**
 * Insert the section at the configured position
 */
function insertAtPosition(sidebar: HTMLElement, element: HTMLElement, position: string): void {
  const findSection = (ariaLabel: string) => {
    const header = document.querySelector(`[aria-label="${ariaLabel}"], [aria-label="${ariaLabel.toLowerCase()}"]`);
    if (!header) return null;
    return header.closest('.side-nav-section') || header.closest('div[role="group"]');
  };

  const followedSection = findSection('Followed Channels');
  const recommendedSection = findSection('Recommended Channels') || findSection('Live Channels');
  
  const findHeaderByText = (text: string) => {
    const headers = Array.from(document.querySelectorAll('h2, h3, .side-nav-header'));
    return headers.find(h => h.textContent?.toLowerCase().includes(text.toLowerCase()));
  };
  const viewersAlsoWatchHeader = findHeaderByText('Viewers Also Watch');
  const viewersAlsoWatchSection = viewersAlsoWatchHeader ? viewersAlsoWatchHeader.closest('.side-nav-section') || viewersAlsoWatchHeader.closest('div[role="group"]') : null;

  try {
    switch (position) {
      case 'above_followed':
        // Insert right BEFORE "Followed Channels" section
        if (followedSection) {
          followedSection.parentNode?.insertBefore(element, followedSection);
        } else {
          // Fallback: append to sidebar
          sidebar.appendChild(element);
        }
        break;
        
      case 'below_followed':
        if (followedSection && followedSection.nextSibling) {
          followedSection.parentNode?.insertBefore(element, followedSection.nextSibling);
        } else if (followedSection) {
          followedSection.parentNode?.appendChild(element);
        } else {
          sidebar.appendChild(element);
        }
        break;
        
      case 'below_live':
        if (recommendedSection && recommendedSection.nextSibling) {
          recommendedSection.parentNode?.insertBefore(element, recommendedSection.nextSibling);
        } else if (recommendedSection) {
          recommendedSection.parentNode?.appendChild(element);
        } else {
          insertAtPosition(sidebar, element, 'below_followed');
        }
        break;
        
      case 'below_viewers_also_watch':
        if (viewersAlsoWatchSection && viewersAlsoWatchSection.nextSibling) {
          viewersAlsoWatchSection.parentNode?.insertBefore(element, viewersAlsoWatchSection.nextSibling);
        } else if (viewersAlsoWatchSection) {
          viewersAlsoWatchSection.parentNode?.appendChild(element);
        } else {
          sidebar.appendChild(element);
        }
        break;
        
      default:
        sidebar.insertBefore(element, sidebar.firstChild);
    }
  } catch (e) {
    console.error('[Kwitch] Error inserting section:', e);
    sidebar.insertBefore(element, sidebar.firstChild);
  }
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
  
  // Icon (only visible when collapsed, handled by CSS)
  const kickIcon = document.createElement('div');
  kickIcon.className = 'kwitch-section-icon';
  kickIcon.innerHTML = `<svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
    <path d="M4 2h2v4l3-4h3l-3 5 4 6h-3l-3-5-2 3v2H4V2z"/>
  </svg>`;
  
  header.appendChild(kickIcon);
  
  const headerText = document.createElement('span');
  headerText.className = 'kwitch-header-text';
  headerText.textContent = 'KICK CHANNELS';
  header.appendChild(headerText);
  
  sectionElement.appendChild(header);
  
  if (channels.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'kwitch-empty';
    empty.textContent = 'No channels';
    sectionElement.appendChild(empty);
    return;
  }
  
  // Sort: Live first, then by viewer count
  const sortedChannels = [...channels].sort((a, b) => {
    if (a.isLive && !b.isLive) return -1;
    if (!a.isLive && b.isLive) return 1;
    return (b.viewerCount || 0) - (a.viewerCount || 0);
  });
  
  // Determine visible channels
  const visibleChannels = isExpandedList ? sortedChannels : sortedChannels.slice(0, INITIAL_VISIBLE_COUNT);
  const hasMore = sortedChannels.length > INITIAL_VISIBLE_COUNT;
  
  // Render cards
  for (const channel of visibleChannels) {
    const card = createChannelCard(channel);
    sectionElement.appendChild(card);
  }
  
  // Show More / Show Less button
  if (hasMore) {
    const showMoreBtn = document.createElement('button');
    showMoreBtn.className = 'kwitch-show-more';
    showMoreBtn.innerHTML = `
      <span class="kwitch-show-more-text">${isExpandedList ? 'Show Less' : 'Show More'}</span>
    `;
    showMoreBtn.addEventListener('click', () => {
      isExpandedList = !isExpandedList;
      renderChannels();
    });
    sectionElement.appendChild(showMoreBtn);
  }
}

/**
 * Create a channel card element with Twitch-style hover tooltip
 */
function createChannelCard(channel: KickChannel): HTMLElement {
  const card = document.createElement('a');
  card.className = `kwitch-channel${channel.isLive ? '' : ' offline'}`;
  card.href = '#';
  
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
      <div class="kwitch-info-row">
        <span class="kwitch-channel-name">${escapeHtml(channel.displayName)}</span>
        ${channel.isLive ? `<span class="kwitch-viewer-count">${formatViewers(channel.viewerCount)}</span>` : ''}
      </div>
      <div class="kwitch-channel-game">${escapeHtml(channel.category || (channel.isLive ? 'Live' : 'Offline'))}</div>
    </div>
  `;
  
  // Create tooltip element (Twitch-style)
  const tooltip = document.createElement('div');
  tooltip.className = 'kwitch-tooltip';
  tooltip.innerHTML = channel.isLive ? `
    <div class="kwitch-tooltip-header">
      <span class="kwitch-tooltip-name">${escapeHtml(channel.displayName)}</span>
      <span class="kwitch-tooltip-category">${escapeHtml(channel.category || 'Live')}</span>
    </div>
    <div class="kwitch-tooltip-title">${escapeHtml(channel.title || 'Live on Kick')}</div>
    <div class="kwitch-tooltip-footer">
      <span class="kwitch-tooltip-live">● Live</span>
      <span class="kwitch-tooltip-viewers">${formatViewers(channel.viewerCount)} viewers</span>
    </div>
  ` : `
    <div class="kwitch-tooltip-header">
      <span class="kwitch-tooltip-name">${escapeHtml(channel.displayName)}</span>
    </div>
    <div class="kwitch-tooltip-offline">Offline</div>
  `;
  
  // Add tooltip hover handlers
  card.addEventListener('mouseenter', (e) => {
    document.body.appendChild(tooltip);
    positionTooltip(e as MouseEvent, tooltip);
  });
  
  card.addEventListener('mouseleave', () => {
    tooltip.remove();
  });
  
  card.addEventListener('click', (e) => {
    e.preventDefault();
    tooltip.remove();
    handleChannelClick(channel);
  });
  
  return card;
}

/**
 * Position tooltip near the cursor/element
 */
function positionTooltip(e: MouseEvent, tooltip: HTMLElement): void {
  const rect = (e.target as HTMLElement).getBoundingClientRect();
  tooltip.style.left = `${rect.right + 10}px`;
  tooltip.style.top = `${rect.top}px`;
}

/**
 * Handle clicking on a channel
 */
function handleChannelClick(channel: KickChannel): void {
  showKickPlayer(channel.slug);
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
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(slug)}&background=2f2f35&color=fff&size=64`;
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
