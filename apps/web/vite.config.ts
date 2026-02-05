import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Direct Vite to the actual source index file in the packages folder
      "@repo/client-core": path.resolve(__dirname, "../../packages/client-core/index.ts"),
      "@repo/shared-types": path.resolve(__dirname, "../../packages/shared-types/index.ts"),
    },
  },
  server: {
    fs: {
      // Crucial: Allow Vite to "climb" up to the packages folder
      allow: ['../..'],
    },
  },
});