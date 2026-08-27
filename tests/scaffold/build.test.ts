import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { basePathFor } from '../../vite.config';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const DIST = join(ROOT, 'dist');

/**
 * The asset references the built entry document makes — the `src`/`href` of the
 * tags that load bundled output, with anything carrying a scheme or a
 * protocol-relative prefix dropped. An external link the document may grow
 * later is not an asset and the base path does not govern it.
 */
function assetPaths(html: string): string[] {
  return [...html.matchAll(/<(?:script|link)\b[^>]*>/gi)]
    .flatMap((tag) => [...tag[0].matchAll(/\b(?:src|href)="([^"]*)"/gi)])
    .map((match) => match[1])
    .filter((path) => !/^[a-z][a-z0-9+.-]*:/i.test(path) && !path.startsWith('//'));
}

/**
 * The names this repository actually goes by. `basename(ROOT)` is deliberately
 * not among them: it is the checkout directory, which a clone, a rename or a
 * worktree changes freely, so it stops testing anything real on a rename — and
 * reds the gate outright on a directory named `base`, `app`, `repo` or `config`,
 * all of which vite.config.ts contains for unrelated reasons.
 */
function repositoryNames(): string[] {
  const names = new Set<string>();

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { name?: string };
  if (pkg.name !== undefined && pkg.name !== '') {
    names.add(pkg.name);
  }

  const remote = spawnSync('git', ['config', '--get', 'remote.origin.url'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (remote.status === 0) {
    const slug = remote.stdout
      .trim()
      .replace(/\.git$/, '')
      .split(/[/:]/)
      .pop();
    if (slug !== undefined && slug !== '') {
      names.add(slug);
    }
  }

  return [...names];
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

    const names = repositoryNames();
    expect(
      names.length,
      'no repository name could be derived from package.json or the git remote, ' +
        'so this assertion would pass vacuously',
    ).toBeGreaterThan(0);

    const pinned = names.filter((name) => config.includes(name));
    expect(
      pinned,
      'the base path is derived at build time (PRD §10.6), so this repository ' +
        'name must not appear in the config',
    ).toEqual([]);
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

/*
 * The two builds above exercise basePathFor end-to-end on the only two inputs
 * a build can produce. These are the inputs it handles explicitly and that no
 * build reaches — a repository slug with no owner, a trailing slash, and the
 * whitespace a shell can leave behind.
 */
describe('basePathFor', () => {
  it('falls back to the root for anything that names no repository', () => {
    expect(basePathFor(undefined)).toBe('/');
    expect(basePathFor('')).toBe('/');
    expect(basePathFor('owner')).toBe('/');
    expect(basePathFor('owner/')).toBe('/');
    expect(basePathFor('owner/   ')).toBe('/');
  });

  it('serves from the repository segment when one is present', () => {
    expect(basePathFor('acme/demo')).toBe('/demo/');
    expect(basePathFor('acme/demo/extra')).toBe('/demo/');
    expect(basePathFor('acme/  demo  ')).toBe('/demo/');
  });
});
