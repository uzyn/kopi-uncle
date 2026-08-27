import { defineConfig } from 'vitest/config';

/**
 * Minimal by design (S1-2). Coverage thresholds, the node/jsdom project split
 * and PRD §10.7's exclusions are deliberately absent here — they land in
 * Sprint 8 (S8-1), which substitutes its configuration over this file once
 * `src/game/` holds real code to hold to 100%.
 *
 * Until then this is a real Vitest, not a placeholder: `npm run test` runs the
 * committed suite from the first merge.
 */
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: ['**/node_modules/**', 'tests/e2e/**', 'tests/lint/fixtures/**'],
  },
});
