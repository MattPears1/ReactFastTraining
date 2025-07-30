import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Simplified production config to fix initialization errors
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
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2015',
    minify: 'esbuild', // Use esbuild instead of terser for better compatibility
    rollupOptions: {
      output: {
        // Preserve module structure to avoid initialization issues
        preserveModules: false,
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom', 'axios'],
          'ui': ['@headlessui/react', '@heroicons/react', 'lucide-react'],
          'utils': ['date-fns', 'clsx', 'tailwind-merge'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  esbuild: {
    // Keep names to avoid minification issues
    keepNames: true,
    minifyIdentifiers: false,
    minifySyntax: true,
    minifyWhitespace: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios'],
    esbuildOptions: {
      target: 'es2015',
    },
  },
})