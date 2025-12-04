/**
 * Kwitch - Kick Player 
 * 
 * Since Kick doesn't have a player-only embed, we open Kick in a popout window.
 * This keeps Twitch intact and gives the best Kick viewing experience.
 */

/**
 * Show the Kick player - opens in a popout window
 * This is the cleanest approach since Kick doesn't offer embeddable players
 */
export function showKickPlayer(slug: string): void {
  console.log(`[Kwitch] Opening Kick popout for ${slug}`);
  openPopout(slug);
}

/**
 * Open Kick stream in a popout window
 */
export function openPopout(slug: string): void {
  const url = `https://kick.com/${encodeURIComponent(slug)}`;
  const width = 1280;
  const height = 800;
  const left = window.screenX + 50;
  const top = window.screenY + 50;
  
  window.open(
    url,
    `kwitch-${slug}`,
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
  );
  
  console.log(`[Kwitch] Opened popout for ${slug}`);
}

/**
 * Close player (no-op since we use popout)
 */
export function closePlayer(): void {
  // No-op - popout is a separate window
}

// Listen for messages
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'WATCH_KICK_CHANNEL' && message.slug) {
    showKickPlayer(message.slug);
  }
});
