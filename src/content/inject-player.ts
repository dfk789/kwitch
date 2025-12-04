/**
 * Kwitch - Kick Player Injection
 * 
 * Handles embedding Kick player and chat on Twitch pages.
 * This script is loaded on-demand when user wants to watch a Kick stream.
 */

import { getPlayerEmbedUrl, getChatEmbedUrl, getPopoutUrl } from '../lib/kick-api';

// Player state
let overlayElement: HTMLElement | null = null;

/**
 * Show the Kick player overlay
 */
export function showKickPlayer(slug: string): void {
  console.log(`[Kwitch] Showing player for ${slug}`);
  
  // Close existing overlay if any
  if (overlayElement) {
    closePlayer();
  }
  
  // Create overlay
  overlayElement = document.createElement('div');
  overlayElement.className = 'kwitch-player-overlay';
  overlayElement.innerHTML = `
    <div class="kwitch-player-container">
      <div class="kwitch-player-header">
        <div class="kwitch-player-title">
          <span class="kick-badge">KICK</span>
          <span>${slug}</span>
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
        src="${getPlayerEmbedUrl(slug)}"
        class="kwitch-player-frame"
        allow="autoplay; fullscreen"
        allowfullscreen
      ></iframe>
    </div>
    <div class="kwitch-chat-container">
      <div class="kwitch-chat-header">Chat</div>
      <iframe 
        src="${getChatEmbedUrl(slug)}"
        class="kwitch-chat-frame"
      ></iframe>
    </div>
  `;
  
  // Add event listeners
  overlayElement.querySelector('#kwitch-close-btn')?.addEventListener('click', closePlayer);
  overlayElement.querySelector('#kwitch-popout-btn')?.addEventListener('click', () => openPopout(slug));
  
  // Add keyboard shortcut to close
  document.addEventListener('keydown', handleKeydown);
  
  // Append to body
  document.body.appendChild(overlayElement);
}

/**
 * Close the player overlay
 */
export function closePlayer(): void {
  if (overlayElement) {
    overlayElement.remove();
    overlayElement = null;
  }
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
 * Check if embedding is blocked and handle fallback
 * This is called when the iframe fails to load
 */
export function handleEmbedBlocked(slug: string): void {
  console.log(`[Kwitch] Embed blocked for ${slug}, offering popout`);
  
  // Show a fallback message
  if (overlayElement) {
    const container = overlayElement.querySelector('.kwitch-player-container');
    if (container) {
      container.innerHTML = `
        <div class="kwitch-player-header">
          <div class="kwitch-player-title">
            <span class="kick-badge">KICK</span>
            <span>${slug}</span>
          </div>
          <div class="kwitch-player-actions">
            <button class="kwitch-btn kwitch-btn-secondary" id="kwitch-close-btn">
              Close
            </button>
          </div>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px;">
          <p style="color: #adadb8; font-size: 16px;">Embedding is blocked. Open in a new window instead?</p>
          <button class="kwitch-btn kwitch-btn-primary" id="kwitch-open-btn" style="padding: 12px 24px; font-size: 16px;">
            Open ${slug} on Kick
          </button>
        </div>
      `;
      
      container.querySelector('#kwitch-close-btn')?.addEventListener('click', closePlayer);
      container.querySelector('#kwitch-open-btn')?.addEventListener('click', () => openPopout(slug));
    }
  }
}

// Listen for messages to show player
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'WATCH_KICK_CHANNEL' && message.slug) {
    showKickPlayer(message.slug);
  }
});
