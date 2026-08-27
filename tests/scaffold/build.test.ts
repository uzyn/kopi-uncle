import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const DIST = join(ROOT, 'dist');

/** Every asset reference the built entry document makes. */
function assetPaths(html: string): string[] {
  return [...html.matchAll(/(?:src|href)="([^"]*)"/g)].map((match) => match[1]);
}

function build(githubRepository: string | undefined): string {
  const env = { ...process.env };
  if (githubRepository === undefined) {
    delete env.GITHUB_REPOSITORY;
  } else {
    env.GITHUB_REPOSITORY = githubRepository;
  }
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: ROOT,
    env,
    encoding: 'utf8',
  });
  expect(result.status, `npm run build failed:\n${result.stdout}\n${result.stderr}`).toBe(0);
  return readFileSync(join(DIST, 'index.html'), 'utf8');
}

describe('the production build', () => {
  let rootHtml = '';
  let subpathHtml = '';

  beforeAll(() => {
    subpathHtml = build('acme/demo');
    // Built last so the working tree is left in its default, root-served state.
    rootHtml = build(undefined);
  }, 180_000);

  it('serves from the repository subpath when GITHUB_REPOSITORY is set', () => {
    const paths = assetPaths(subpathHtml);
    expect(paths.length).toBeGreaterThan(0);
    const nonConforming = paths.filter((path) => !path.startsWith('/demo/'));
    expect(nonConforming, 'every asset path must resolve under the Pages subpath').toEqual([]);
  });

  it('serves from the root when GITHUB_REPOSITORY is unset', () => {
    const paths = assetPaths(rootHtml);
    expect(paths.length).toBeGreaterThan(0);
    const nonConforming = paths.filter((path) => !path.startsWith('/') || path.startsWith('//'));
    expect(nonConforming, 'every asset path must resolve from the root').toEqual([]);
    expect(paths.some((path) => path.startsWith('/demo/'))).toBe(false);
  });

  it('pins no repository name as a literal', () => {
    const config = readFileSync(join(ROOT, 'vite.config.ts'), 'utf8');
    expect(config).toContain('GITHUB_REPOSITORY');
    expect(
      config,
      'the base path is derived at build time (PRD §10.6), so this repository ' +
        'name must not appear in the config',
    ).not.toContain(basename(ROOT));
  });

  it('emits CSS Modules with scoped class names', () => {
    const cssFiles = readdirSync(join(DIST, 'assets')).filter((file) => file.endsWith('.css'));
    expect(cssFiles.length, 'the build emitted no stylesheet').toBeGreaterThan(0);

    const css = cssFiles.map((file) => readFileSync(join(DIST, 'assets', file), 'utf8')).join('\n');
    const selectors = [...css.matchAll(/\.([A-Za-z0-9_-]*wordmark[A-Za-z0-9_-]*)/g)].map(
      (match) => match[1],
    );

    expect(
      selectors.length,
      'src/app/TitleScreen.module.css declares .wordmark but no class carrying ' +
        'that name reached the built stylesheet — CSS Modules is not wired',
    ).toBeGreaterThan(0);
    expect(
      selectors.every((selector) => selector !== 'wordmark'),
      `class names must be scoped by the CSS Modules transform, got: ${selectors.join(', ')}`,
    ).toBe(true);
  });

  it('leaves a dist/ the gate can serve', () => {
    expect(existsSync(join(DIST, 'index.html'))).toBe(true);
  });
});
