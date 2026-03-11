/* eslint-env node */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import nodePolyfills from 'rollup-plugin-node-polyfills'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  optimizeDeps: {
    include: ['simple-peer', 'events', 'util']
  },
  build: {
    rollupOptions: {
      plugins: [nodePolyfills()]
    }
  },
  resolve: {
    alias: {
      // prefer the polyfilled util and events (use absolute paths to avoid duplicate modules)
      util: resolve(process.cwd(), 'node_modules/rollup-plugin-node-polyfills/polyfills/util.js'),
      events: resolve(process.cwd(), 'node_modules/rollup-plugin-node-polyfills/polyfills/events.js'),
      // provide a browser process shim (use polyfill bundled with rollup-plugin-node-polyfills)
      process: resolve(process.cwd(), 'node_modules/rollup-plugin-node-polyfills/polyfills/process-es6.js'),
      // sometimes readable-stream expects buffer
      buffer: resolve(process.cwd(), 'node_modules/rollup-plugin-node-polyfills/polyfills/buffer-es6.js')
    }
  }
  ,define: {
    // ensure process.env exists in client code to avoid reading undefined
    'process.env': {}
  }
})