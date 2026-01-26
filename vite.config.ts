import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    // host: '192.168.1.68',
    port: 5173,
    proxy: {
      '/api': {
        // target: 'http://10.192.220.182:8000',
        // target: 'http://localhost:8000',
        target: 'http://192.168.1.68:8000',
        // target: 'http://172.20.10.3:8000',
        // target: 'http://10.192.223.172:8000',
        // target: 'http://0.0.0.0:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
