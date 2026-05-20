import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'



export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:5000',
      '/admin': 'http://localhost:5000',
      '/candidate': 'http://localhost:5000',
      '/addit': 'http://localhost:5000',
      '/api': 'http://localhost:5000',
      '/blog': 'http://localhost:5000',
      '/clientspoc': 'http://localhost:5000',
      '/clientspocstats': 'http://localhost:5000',
      '/download': 'http://localhost:5000',
      '/recruiterstats': 'http://localhost:5000',
      '/positionstats': 'http://localhost:5000',
      '/dashboardstats': 'http://localhost:5000',
      '/candidatestats': 'http://localhost:5000'
    }
  }
});



