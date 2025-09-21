import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  root: "./client",
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
