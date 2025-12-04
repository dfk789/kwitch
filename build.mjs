/**
 * Build script for Kwitch extension
 * Uses esbuild to create self-contained bundles for each script
 */
import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Clean dist folder
if (existsSync('dist')) {
  rmSync('dist', { recursive: true });
}

// Create directories
mkdirSync('dist/background', { recursive: true });
mkdirSync('dist/content', { recursive: true });
mkdirSync('dist/popup', { recursive: true });
mkdirSync('dist/assets', { recursive: true });

// Build background service worker (ES module for service workers)
await esbuild.build({
  entryPoints: ['src/background/service-worker.ts'],
  bundle: true,
  outfile: 'dist/background/service-worker.js',
  format: 'esm',
  target: 'esnext',
  sourcemap: 'inline',
});
console.log('✓ Built background/service-worker.js');

// Build content script (IIFE - no module support in content scripts)
await esbuild.build({
  entryPoints: ['src/content/inject-sidebar.ts'],
  bundle: true,
  outfile: 'dist/content/inject-sidebar.js',
  format: 'iife',
  target: 'esnext',
  sourcemap: 'inline',
});
console.log('✓ Built content/inject-sidebar.js');

// Build popup script (IIFE for simplicity)
await esbuild.build({
  entryPoints: ['src/popup/popup.ts'],
  bundle: true,
  outfile: 'dist/popup/popup.js',
  format: 'iife',
  target: 'esnext',
  sourcemap: 'inline',
});
console.log('✓ Built popup/popup.js');

// Copy static files
copyFileSync('manifest.json', 'dist/manifest.json');
copyFileSync('src/popup/popup.html', 'dist/popup/popup.html');
copyFileSync('src/popup/popup.css', 'dist/popup/popup.css');
copyFileSync('styles/content.css', 'dist/assets/content.css');

// Copy icons
if (existsSync('assets/icons/icon-16.png')) {
  copyFileSync('assets/icons/icon-16.png', 'dist/assets/icon-16.png');
}
if (existsSync('assets/icons/icon-48.png')) {
  copyFileSync('assets/icons/icon-48.png', 'dist/assets/icon-48.png');
}
if (existsSync('assets/icons/icon-128.png')) {
  copyFileSync('assets/icons/icon-128.png', 'dist/assets/icon-128.png');
}

console.log('📦 Static files copied to dist/');
console.log('✅ Build complete!');
