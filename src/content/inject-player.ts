/**
 * Kwitch - Kick Player Injection
 * 
 * Embeds Kick player (player.kick.com) and chat (popout) in Twitch,
 * replacing the Twitch player/chat while preserving the sidebar.
 */

// State
let isKickActive = false;
let kickContainer: HTMLElement | null = null;

// Twitch selectors
const TWITCH_PLAYER_SELECTOR = '.persistent-player, .video-player, [data-a-target="video-player-layout"]';
const TWITCH_CHAT_SELECTOR = '[data-a-target="right-column-chat-bar"], .right-column--theatre, .stream-chat';

/**
 * Show the Kick player - embeds player + chat
 */
export function showKickPlayer(slug: string): void {
  console.log(`[Kwitch] Showing Kick player for ${slug}`);
  
  if (isKickActive) {
    closePlayer();
  }
  
  // Pause Twitch video
  pauseTwitchVideo();
  
  // Hide Twitch player
  const twitchPlayer = document.querySelector(TWITCH_PLAYER_SELECTOR) as HTMLElement;
  if (twitchPlayer) {
    twitchPlayer.style.display = 'none';
  }
  
  // Hide Twitch chat
  const twitchChat = document.querySelector(TWITCH_CHAT_SELECTOR) as HTMLElement;
  if (twitchChat) {
    twitchChat.style.display = 'none';
  }
  
  // Create Kick container
  kickContainer = document.createElement('div');
  kickContainer.id = 'kwitch-container';
  kickContainer.innerHTML = `
    <div class="kwitch-header">
      <div class="kwitch-title">
        <span class="kwitch-badge">KICK</span>
        <span class="kwitch-streamer">${escapeHtml(slug)}</span>
      </div>
      <div class="kwitch-controls">
        <button class="kwitch-btn" id="kwitch-popout">Pop Out</button>
        <button class="kwitch-btn kwitch-btn-close" id="kwitch-close">✕ Back to Twitch</button>
      </div>
    </div>
    <div class="kwitch-content">
      <iframe 
        src="https://player.kick.com/${encodeURIComponent(slug)}"
        class="kwitch-player"
        allow="autoplay; fullscreen; encrypted-media"
        allowfullscreen
      ></iframe>
      <iframe 
        src="https://kick.com/popout/${encodeURIComponent(slug)}/chat"
        class="kwitch-chat"
      ></iframe>
    </div>
  `;
  
  // Detect sidebar width (collapsed ~50px, expanded ~240px)
  const sideNav = document.querySelector('.side-nav, [data-a-target="side-nav-bar"]') as HTMLElement;
  const sidebarWidth = sideNav ? sideNav.offsetWidth : 50;
  kickContainer.style.left = `${sidebarWidth}px`;
  
  // Add to body
  document.body.appendChild(kickContainer);
  
  // Event listeners
  kickContainer.querySelector('#kwitch-close')?.addEventListener('click', closePlayer);
  kickContainer.querySelector('#kwitch-popout')?.addEventListener('click', () => openPopout(slug));
  
  // Keyboard shortcut
  document.addEventListener('keydown', handleKeydown);
  
  isKickActive = true;
  console.log('[Kwitch] Kick player embedded');
}

/**
 * Close Kick player and restore Twitch
 */
export function closePlayer(): void {
  if (!isKickActive) return;
  
  console.log('[Kwitch] Closing Kick player');
  
  // Remove Kick container
  if (kickContainer) {
    kickContainer.remove();
    kickContainer = null;
  }
  
  // Show Twitch player
  const twitchPlayer = document.querySelector(TWITCH_PLAYER_SELECTOR) as HTMLElement;
  if (twitchPlayer) {
    twitchPlayer.style.display = '';
  }
  
  // Show Twitch chat
  const twitchChat = document.querySelector(TWITCH_CHAT_SELECTOR) as HTMLElement;
  if (twitchChat) {
    twitchChat.style.display = '';
  }
  
  // Resume Twitch
  resumeTwitchVideo();
  
  document.removeEventListener('keydown', handleKeydown);
  isKickActive = false;
}

/**
 * Open in popout window
 */
export function openPopout(slug: string): void {
  window.open(
    `https://kick.com/${encodeURIComponent(slug)}`,
    `kwitch-${slug}`,
    'width=1280,height=800,resizable=yes'
  );
  closePlayer();
}

/**
 * Pause Twitch video
 */
function pauseTwitchVideo(): void {
  const video = document.querySelector('video') as HTMLVideoElement;
  if (video && !video.paused) {
    video.pause();
    console.log('[Kwitch] Paused Twitch');
  }
}

/**
 * Resume Twitch video
 */
function resumeTwitchVideo(): void {
  const video = document.querySelector('video') as HTMLVideoElement;
  if (video) {
    video.play().catch(() => {});
  }
}

/**
 * Keyboard handler
 */
function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && isKickActive) {
    closePlayer();
  }
}

/**
 * Escape HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Message listener
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'WATCH_KICK_CHANNEL' && message.slug) {
    showKickPlayer(message.slug);
  }
});
