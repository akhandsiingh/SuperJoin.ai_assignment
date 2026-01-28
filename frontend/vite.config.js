import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/sync': 'http://localhost:3001',
      '/sheet': 'http://localhost:3001',
      '/db': 'http://localhost:3001',
    },
  },
});
