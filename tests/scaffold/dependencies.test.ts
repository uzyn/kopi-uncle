import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

interface PackageJson {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

interface Lockfile {
  packages: Record<string, { version?: string }>;
}

const pkg: PackageJson = JSON.parse(
  readFileSync(join(ROOT, 'package.json'), 'utf8'),
) as PackageJson;
const lock: Lockfile = JSON.parse(
  readFileSync(join(ROOT, 'package-lock.json'), 'utf8'),
) as Lockfile;

/** PRD §10.1 — the runtime surface is React and nothing else. */
const RUNTIME_DEPENDENCIES = ['react', 'react-dom'] as const;

/** S1-2 — every dependency either track is known to need, installed once. */
const REQUIRED_DEV_DEPENDENCIES = [
  'vite',
  '@vitejs/plugin-react',
  'typescript',
  '@types/react',
  '@types/react-dom',
  '@types/node',
  'eslint',
  '@eslint/js',
  'globals',
  'typescript-eslint',
  'eslint-plugin-react-hooks',
  'eslint-config-prettier',
  'prettier',
  'vitest',
  '@vitest/coverage-v8',
  'jsdom',
  '@testing-library/react',
  '@testing-library/dom',
  '@testing-library/user-event',
  '@playwright/test',
  '@fontsource/anton',
  '@fontsource/nunito-sans',
] as const;

/**
 * PRD §10.1: "Do not introduce a CSS framework, a state-management library, a
 * game engine, or an animation library without a story that justifies it."
 * Adding one means adding it here too, deliberately, in that story.
 */
const DENIED = {
  'CSS framework': [
    'tailwindcss',
    'bootstrap',
    'bulma',
    'foundation-sites',
    '@mui/material',
    '@chakra-ui/react',
    '@mantine/core',
    'antd',
    'styled-components',
    '@emotion/react',
    '@emotion/styled',
    'sass',
    'less',
    'stylus',
  ],
  'state-management library': [
    'redux',
    'react-redux',
    '@reduxjs/toolkit',
    'zustand',
    'jotai',
    'recoil',
    'mobx',
    'mobx-react',
    'valtio',
    'xstate',
    'effector',
  ],
  'game engine': [
    'phaser',
    'pixi.js',
    'three',
    'babylonjs',
    '@babylonjs/core',
    'matter-js',
    'planck-js',
    'excalibur',
    'kaboom',
  ],
  'animation library': [
    'framer-motion',
    'motion',
    'gsap',
    'animejs',
    'react-spring',
    '@react-spring/web',
    'popmotion',
    'lottie-web',
    'lottie-react',
    'react-transition-group',
  ],
} as const;

describe('the dependency surface', () => {
  it('declares exactly react and react-dom as dependencies', () => {
    expect(Object.keys(pkg.dependencies).sort()).toEqual([...RUNTIME_DEPENDENCIES].sort());
  });

  it.each(REQUIRED_DEV_DEPENDENCIES)('installs %s as a devDependency', (name) => {
    expect(
      pkg.devDependencies[name],
      `${name} is named in the sprint plan but is not installed — installing the ` +
        'known surface once is what keeps later sprints out of the manifest',
    ).toBeTruthy();
  });

  it('installs ESLint 9, the major Sprint 2 configures', () => {
    expect(pkg.devDependencies.eslint).toMatch(/^\^?9\./);
    expect(lock.packages['node_modules/eslint']?.version).toMatch(/^9\./);
  });

  it('does not install eslint-plugin-prettier', () => {
    const allDeclared = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(
      allDeclared['eslint-plugin-prettier'],
      'routing formatting through lint makes every reformat a gate failure with a ' +
        'stack trace attached — Prettier runs as a formatter and eslint-config-prettier ' +
        'keeps the two from fighting',
    ).toBeUndefined();
  });

  it.each(Object.entries(DENIED))('installs no %s', (_category, denied) => {
    const allDeclared = { ...pkg.dependencies, ...pkg.devDependencies };
    const present = denied.filter((name) => allDeclared[name] !== undefined);
    expect(present, 'PRD §10.1 requires a story justifying this before it is installed').toEqual(
      [],
    );
  });
});
