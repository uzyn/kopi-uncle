import type { ComponentType } from 'react';
import type { Phase } from '../game/types';
import TitleScreen from './TitleScreen';
import HowToPlay from './HowToPlay';
import GameScreen from './GameScreen';
import GameOver from './GameOver';
import Pause from './Pause';
import StatsScreen from './StatsScreen';

/**
 * The screen registry.
 *
 * Every screen is registered here up front against a placeholder module, so a
 * sprint that fills a screen writes its own `<Screen>.tsx` / `<Screen>.module.css`
 * pair and never has to open this file. That is a convention that keeps
 * concurrent sprints file-disjoint (PRD §10.2), not a freeze: a sprint that
 * genuinely needs to change the registry changes it and declares
 * `src/app/App.tsx` in its `**Touches:**`.
 */

/**
 * Two screens are reachable without being engine phases: How to Play and Stats
 * are entered from the title and return to it (S32-1, S50-1). `Route` is
 * therefore `Phase` widened by those two, and `Phase` remains the engine's.
 */
export type Route = Phase | 'howToPlay' | 'stats';

/**
 * `Record<Route, ...>` makes exhaustiveness a compile-time property: a Route
 * added without a screen fails `npm run typecheck`.
 *
 * `break` renders the game screen — PRD §8.5's break card is an overlay on the
 * counter, not a screen of its own (its component lands in `src/components/break/`).
 */
export const SCREEN_REGISTRY: Record<Route, ComponentType> = {
  title: TitleScreen,
  playing: GameScreen,
  paused: Pause,
  break: GameScreen,
  gameover: GameOver,
  howToPlay: HowToPlay,
  stats: StatsScreen,
};

export function screenFor(route: Route): ComponentType {
  return SCREEN_REGISTRY[route];
}

export default function App({ route = 'title' }: { route?: Route }) {
  const Screen = screenFor(route);
  return <Screen />;
}
