import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

// Copy static files to dist
function copyStaticFiles() {
  return {
    name: 'copy-static-files',
    writeBundle() {
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
      
      // Copy icons (placeholder - we'll generate these)
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

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyDirFirst: true,
    rollupOptions: {
      input: {
        'background/service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        'content/inject-sidebar': resolve(__dirname, 'src/content/inject-sidebar.ts'),
        'content/inject-player': resolve(__dirname, 'src/content/inject-player.ts'),
        'popup/popup': resolve(__dirname, 'src/popup/popup.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name][extname]',
      },
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
