import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
  },
  preview: {
    // Distinct from the dev server so both can run at once.
    port: 3001,
    strictPort: true,
  },
});
