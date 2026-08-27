import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

interface PackageJson {
  scripts: Record<string, string>;
}

const pkg: PackageJson = JSON.parse(
  readFileSync(join(ROOT, 'package.json'), 'utf8'),
) as PackageJson;

describe('Prettier', () => {
  it('ships a config and both scripts', () => {
    expect(existsSync(join(ROOT, '.prettierrc'))).toBe(true);
    expect(existsSync(join(ROOT, '.prettierignore'))).toBe(true);
    expect(pkg.scripts.format).toBeTruthy();
    expect(pkg.scripts['format:check']).toBeTruthy();
  });

  it('leaves planning documents and vendored skills alone', () => {
    const ignored = readFileSync(join(ROOT, '.prettierignore'), 'utf8');
    // Reformatting either would produce a diff in the thousands of lines and
    // neither is this project's code.
    expect(ignored).toMatch(/^docs\/$/m);
    expect(ignored).toMatch(/^\.claude\/$/m);
  });

  it('finds the tree already formatted', () => {
    const result = spawnSync('npx', ['prettier', '--check', '.'], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    expect(
      result.status,
      `prettier --check reported unformatted files. Run \`npm run format\`.\n${result.stdout}\n${result.stderr}`,
    ).toBe(0);
  }, 120_000);
});
