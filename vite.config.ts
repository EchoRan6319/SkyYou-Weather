
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    react(),
    process.env.NODE_ENV === 'development' ? basicSsl() : null
  ].filter(Boolean),
  server: {
    host: '0.0.0.0' // Listen on all local IPs
  },
  base: '/SkyYou-Weather/'
});
