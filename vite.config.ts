import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * PRD §10.6 — the Pages subpath is derived at build time, never written as a
 * literal. `GITHUB_REPOSITORY` is `<owner>/<repo>` under GitHub Actions, so the
 * project site lives at `/<repo>/`; anywhere else (a local `npm run dev`, a
 * clone under any name, a fork, a rename) it is unset and the app is served
 * from the root. The deploy workflow itself lands in the final sprint.
 */
export function basePathFor(githubRepository: string | undefined): string {
  const repo = githubRepository?.split('/')[1]?.trim();
  return repo ? `/${repo}/` : '/';
}

export default defineConfig({
  base: basePathFor(process.env.GITHUB_REPOSITORY),
  plugins: [react()],
});
