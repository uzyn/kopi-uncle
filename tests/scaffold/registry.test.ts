import { describe, expect, it } from 'vitest';
import type { Phase } from '../../src/game/types';
import { SCREEN_REGISTRY, screenFor } from '../../src/app/App';

/**
 * The five PRD §10.3 phases, written out so the assertion is over runtime
 * values rather than over whatever the registry happens to hold. `Record<Route, …>`
 * in App.tsx catches the other direction at compile time: a phase without a
 * screen fails `npm run typecheck`.
 */
const PHASES: Phase[] = ['title', 'playing', 'paused', 'break', 'gameover'];

/** The six screen modules PRD §10.2 gives their own file pair. */
const SCREEN_NAMES = [
  'TitleScreen',
  'HowToPlay',
  'GameScreen',
  'GameOver',
  'Pause',
  'StatsScreen',
] as const;

describe('the screen registry', () => {
  it.each(PHASES)('resolves phase %s to a component', (phase) => {
    const Screen = screenFor(phase);
    expect(typeof Screen, `no screen registered for phase "${phase}"`).toBe('function');
  });

  it('registers every phase with no gaps', () => {
    const missing = PHASES.filter((phase) => SCREEN_REGISTRY[phase] === undefined);
    expect(missing).toEqual([]);
  });

  it('registers all six PRD §10.2 screen modules', () => {
    const registered = new Set(Object.values(SCREEN_REGISTRY).map((screen) => screen.name));
    for (const name of SCREEN_NAMES) {
      expect(registered, `${name} is not reachable from the registry`).toContain(name);
    }
  });

  it('routes the two non-phase screens as well', () => {
    expect(typeof screenFor('howToPlay')).toBe('function');
    expect(typeof screenFor('stats')).toBe('function');
  });
});
