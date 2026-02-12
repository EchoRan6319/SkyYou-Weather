
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    process.env.NODE_ENV === 'development' ? basicSsl() : null,
    // 禁用 Android 构建的压缩
    process.env.BUILD_TARGET !== 'android' ? compression({ algorithm: 'gzip' }) : null,
    process.env.BUILD_TARGET !== 'android' ? compression({ algorithm: 'brotliCompress' }) : null
  ].filter(Boolean),
  server: {
    host: '0.0.0.0'
  },
  base: process.env.BUILD_TARGET === 'android' ? '/' : '/SkyYou-Weather/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'icons': ['lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
