import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, writeFileSync, readFileSync } from 'fs';

// Copy static files to dist
function copyStaticFiles() {
  return {
    name: 'copy-static-files',
    closeBundle() {
      // Create directories
      const distAssets = resolve(__dirname, 'dist/assets');
      const distPopup = resolve(__dirname, 'dist/popup');
      
      if (!existsSync(distAssets)) mkdirSync(distAssets, { recursive: true });
      if (!existsSync(distPopup)) mkdirSync(distPopup, { recursive: true });
      
      // Copy manifest
      copyFileSync(
        resolve(__dirname, 'manifest.json'),
        resolve(__dirname, 'dist/manifest.json')
      );
      
      // Copy popup HTML and CSS
      copyFileSync(
        resolve(__dirname, 'src/popup/popup.html'),
        resolve(__dirname, 'dist/popup/popup.html')
      );
      copyFileSync(
        resolve(__dirname, 'src/popup/popup.css'),
        resolve(__dirname, 'dist/popup/popup.css')
      );
      
      // Copy content CSS
      copyFileSync(
        resolve(__dirname, 'styles/content.css'),
        resolve(__dirname, 'dist/assets/content.css')
      );
      
      // Copy icons
      const iconsDir = resolve(__dirname, 'assets/icons');
      if (existsSync(iconsDir)) {
        if (existsSync(resolve(iconsDir, 'icon-16.png'))) {
          copyFileSync(resolve(iconsDir, 'icon-16.png'), resolve(distAssets, 'icon-16.png'));
        }
        if (existsSync(resolve(iconsDir, 'icon-48.png'))) {
          copyFileSync(resolve(iconsDir, 'icon-48.png'), resolve(distAssets, 'icon-48.png'));
        }
        if (existsSync(resolve(iconsDir, 'icon-128.png'))) {
          copyFileSync(resolve(iconsDir, 'icon-128.png'), resolve(distAssets, 'icon-128.png'));
        }
      }
      
      console.log('📦 Static files copied to dist/');
    },
  };
}

// For content scripts, we need to build as IIFE with everything inlined
// We'll do this by having separate build configs
const isContentScript = process.env.BUILD_TARGET === 'content';
const isBackground = process.env.BUILD_TARGET === 'background';
const isPopup = process.env.BUILD_TARGET === 'popup';

// Default: build all as separate files, but each fully bundled
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: false,
    rollupOptions: {
      input: {
        'background/service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        'content/inject-sidebar': resolve(__dirname, 'src/content/inject-sidebar.ts'),
        'popup/popup': resolve(__dirname, 'src/popup/popup.ts'),
      },
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        // Inline all chunks into the entry files
        inlineDynamicImports: true,
      },
      // Ensure each entry is self-contained
      preserveEntrySignatures: 'allow-extension',
    },
    target: 'esnext',
    minify: false,
    sourcemap: 'inline',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [copyStaticFiles()],
});
