import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@types': path.resolve(__dirname, './src/types'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@services': path.resolve(__dirname, './src/services'),
    },
  },
  server: {
    port: 3000,
    open: true,
    host: '0.0.0.0', // Listen on all network interfaces
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Core React dependencies
            if (id.includes('react') && !id.includes('react-')) {
              return 'react-vendor';
            }
            
            // React ecosystem
            if (id.includes('react-router-dom') || id.includes('react-helmet')) {
              return 'react-ecosystem';
            }
            
            // Animation libraries
            if (id.includes('framer-motion')) {
              return 'animation';
            }
            
            // Icon libraries
            if (id.includes('lucide-react') || id.includes('@heroicons/react')) {
              return 'icons';
            }
            
            // Form handling
            if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
              return 'forms';
            }
            
            // Data fetching
            if (id.includes('@tanstack/react-query')) {
              return 'data-fetching';
            }
            
            // Monitoring
            if (id.includes('@sentry')) {
              return 'monitoring';
            }
            
            // Utilities
            if (id.includes('axios') || id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge') || id.includes('uuid')) {
              return 'utils';
            }
          }
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})