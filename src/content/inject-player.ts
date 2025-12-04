/**
 * Kwitch - Kick Player Injection
 * 
 * Handles embedding Kick player and chat on Twitch pages.
 * Replaces only the main content area, preserving the Twitch sidebar.
 */

import { getPopoutUrl } from '../lib/kick-api';

// Player state
let overlayElement: HTMLElement | null = null;
let twitchPlayerPaused = false;

// Twitch player/content selectors
const TWITCH_MAIN_CONTENT = '.persistent-player, [data-a-target="video-player"]';
const TWITCH_RIGHT_COLUMN = '.right-column, [data-a-target="right-column-chat-bar"]';

/**
 * Show the Kick player overlay
 */
export function showKickPlayer(slug: string): void {
  console.log(`[Kwitch] Showing player for ${slug}`);
  
  // Close existing overlay if any
  if (overlayElement) {
    closePlayer();
  }
  
  // Pause Twitch player
  pauseTwitchPlayer();
  
  // Hide Twitch main content and chat
  hideTwitchContent();
  
  // Create overlay - positioned in main content area only
  overlayElement = document.createElement('div');
  overlayElement.className = 'kwitch-player-overlay';
  overlayElement.innerHTML = `
    <div class="kwitch-player-header">
      <div class="kwitch-player-title">
        <span class="kick-badge">KICK</span>
        <span>${escapeHtml(slug)}</span>
      </div>
      <div class="kwitch-player-actions">
        <button class="kwitch-btn kwitch-btn-secondary" id="kwitch-popout-btn">
          Pop Out
        </button>
        <button class="kwitch-btn kwitch-btn-secondary" id="kwitch-close-btn">
          Close
        </button>
      </div>
    </div>
    <iframe 
      src="https://kick.com/${encodeURIComponent(slug)}"
      class="kwitch-player-frame"
      allow="autoplay; fullscreen"
      allowfullscreen
    ></iframe>
  `;
  
  // Add event listeners
  overlayElement.querySelector('#kwitch-close-btn')?.addEventListener('click', closePlayer);
  overlayElement.querySelector('#kwitch-popout-btn')?.addEventListener('click', () => openPopout(slug));
  
  // Add keyboard shortcut to close
  document.addEventListener('keydown', handleKeydown);
  
  // Find main content area and insert overlay
  const mainContent = document.querySelector('.channel-root, .channel-root__info, main, [data-a-target="player-overlay-click-handler"]')?.closest('.channel-root') 
    || document.querySelector('main')
    || document.body;
  
  mainContent.appendChild(overlayElement);
}

/**
 * Pause the Twitch player
 */
function pauseTwitchPlayer(): void {
  try {
    // Try to find and pause the video element
    const video = document.querySelector('video') as HTMLVideoElement;
    if (video && !video.paused) {
      video.pause();
      twitchPlayerPaused = true;
      console.log('[Kwitch] Paused Twitch player');
    }
    
    // Also try clicking the pause button as backup
    const pauseBtn = document.querySelector('[data-a-target="player-play-pause-button"]') as HTMLButtonElement;
    if (pauseBtn && pauseBtn.getAttribute('aria-label')?.toLowerCase().includes('pause')) {
      pauseBtn.click();
    }
  } catch (e) {
    console.log('[Kwitch] Could not pause Twitch player:', e);
  }
}

/**
 * Resume the Twitch player
 */
function resumeTwitchPlayer(): void {
  if (!twitchPlayerPaused) return;
  
  try {
    const video = document.querySelector('video') as HTMLVideoElement;
    if (video && video.paused) {
      video.play();
      console.log('[Kwitch] Resumed Twitch player');
    }
  } catch (e) {
    console.log('[Kwitch] Could not resume Twitch player:', e);
  }
  twitchPlayerPaused = false;
}

/**
 * Hide Twitch main content (player + chat)
 */
function hideTwitchContent(): void {
  // Hide the main player area
  const player = document.querySelector(TWITCH_MAIN_CONTENT) as HTMLElement;
  if (player) {
    player.style.display = 'none';
    player.dataset.kwitchHidden = 'true';
  }
  
  // Hide the right column (Twitch chat)
  const rightCol = document.querySelector(TWITCH_RIGHT_COLUMN) as HTMLElement;
  if (rightCol) {
    rightCol.style.display = 'none';
    rightCol.dataset.kwitchHidden = 'true';
  }
}

/**
 * Show Twitch main content again
 */
function showTwitchContent(): void {
  // Restore all hidden elements
  document.querySelectorAll('[data-kwitch-hidden="true"]').forEach((el) => {
    (el as HTMLElement).style.display = '';
    delete (el as HTMLElement).dataset.kwitchHidden;
  });
}

/**
 * Close the player overlay
 */
export function closePlayer(): void {
  if (overlayElement) {
    overlayElement.remove();
    overlayElement = null;
  }
  
  // Show Twitch content again
  showTwitchContent();
  
  // Resume Twitch player
  resumeTwitchPlayer();
  
  document.removeEventListener('keydown', handleKeydown);
  console.log('[Kwitch] Player closed');
}

/**
 * Open Kick stream in a popout window
 */
export function openPopout(slug: string): void {
  const url = getPopoutUrl(slug);
  const width = 1280;
  const height = 720;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  
  window.open(
    url,
    `kwitch-${slug}`,
    `width=${width},height=${height},left=${left},top=${top},resizable=yes`
  );
  
  // Close overlay if popout was opened from there
  closePlayer();
  
  console.log(`[Kwitch] Opened popout for ${slug}`);
}

/**
 * Handle keyboard shortcuts
 */
function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && overlayElement) {
    closePlayer();
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Listen for messages to show player
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'WATCH_KICK_CHANNEL' && message.slug) {
    showKickPlayer(message.slug);
  }
});
