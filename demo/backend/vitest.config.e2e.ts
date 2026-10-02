import 'dotenv/config';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // e2e runs against whatever DATABASE_URL is configured; the hosted
    // Supabase pooler adds latency vs. a local Postgres.
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
