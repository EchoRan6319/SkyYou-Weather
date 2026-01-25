
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
    compression({ algorithm: 'gzip' }),
    compression({ algorithm: 'brotliCompress' })
  ].filter(Boolean),
  server: {
    host: '0.0.0.0'
  },
  base: '/SkyYou-Weather/',
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
