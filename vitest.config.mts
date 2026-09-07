import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    env: { NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3000' },
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: { provider: 'v8', reportsDirectory: './coverage', include: ['src/**/*.{ts,tsx}'], exclude: ['src/lib/api/schema.d.ts'] }
  }
});
