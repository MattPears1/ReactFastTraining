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
    port: 8081,
    strictPort: true, // CRITICAL: Do NOT allow Vite to use any other port
    open: true,
    host: '192.168.0.84', // Only show this specific IP
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/ping': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      // Ensure React is in the first chunk
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        // Cache busting: Add timestamp to chunk names
        chunkFileNames: (chunkInfo) => {
          const timestamp = Date.now();
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/js/[name]-${timestamp}-[hash].js`;
        },
        entryFileNames: () => {
          const timestamp = Date.now();
          return `assets/js/[name]-${timestamp}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const timestamp = Date.now();
          const extType = assetInfo.name?.split('.').pop();
          if (extType === 'css') {
            return `assets/css/[name]-${timestamp}-[hash].css`;
          }
          return `assets/[ext]/[name]-${timestamp}-[hash].[ext]`;
        },
        manualChunks(id) {
          // Disable manual chunks in production to fix loading order issue
          if (process.env.NODE_ENV === 'production') {
            return undefined;
          }
          
          if (id.includes('node_modules')) {
            // Core React dependencies - keep react and react-dom together
            if (id.includes('react') && !id.includes('react-router') && !id.includes('react-hook-form') && !id.includes('react-helmet')) {
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
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true,
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})