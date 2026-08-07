import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'



export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:5001',
      '/admin': 'http://localhost:5001',
      '/candidate': 'http://localhost:5001',
      '/addit': 'http://localhost:5001',
      '/api': 'http://localhost:5001',
      '/blog': 'http://localhost:5001',
      '^/clientspoc/': 'http://localhost:5001',
      '/clientspocstats': 'http://localhost:5001',
      '/download': 'http://localhost:5001',
      '/recruiterstats': 'http://localhost:5001',
      '/positionstats': 'http://localhost:5001',
      '/dashboardstats': 'http://localhost:5001',
      '/candidatestats': 'http://localhost:5001'
    }
  }
});

