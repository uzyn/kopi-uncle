import styles from './TitleScreen.module.css';

/**
 * The front door (S12-1).
 *
 * The screen is deliberately inert: no timer, no frame loop, no animation. PRD
 * §9.8's frame budget is for play, and a title that ticks sixty times a second
 * drains a phone while the player reads it. The rAF loop that feeds `dtMs`
 * therefore starts at `phase === 'playing'`, not here.
 *
 * It is also handler-driven rather than dispatch-driven. `START_RUN` and the
 * `Route` change both live in the wiring layer that owns the reducer
 * (`src/app/EngineContext.tsx`, S13-1), which is the only place that can read
 * `?seed=` / `?date=` and resolve the Daily's seed. This component's job is to
 * say *which* run the player asked for; the layer above turns that into an
 * action.
 */

/**
 * `seed` is `null` for the Daily on purpose. A Daily that drew a random seed
 * would not be the same run for everyone — its seed is
 * `hashDateSeed(singaporeDateString(now))`, overridable by `?date=`, and only
 * the wiring layer knows the clock and the query string.
 */
export interface StartRequest {
  mode: 'endless' | 'daily';
  seed: number | null;
}

/** The two screens reachable from the title that are not engine phases. */
export type TitleRoute = 'howToPlay' | 'stats';

export interface TitleScreenProps {
  onStart?: (request: StartRequest) => void;
  onNavigate?: (route: TitleRoute) => void;
  /** Injectable for tests and for a `?seed=` override; defaults to `freshSeed`. */
  makeSeed?: () => number;
}

const UINT32 = 0x100000000;

/**
 * A fresh uint32 run seed — mulberry32's state space (S14-1).
 *
 * `crypto.getRandomValues` is the source wherever it exists; the fallback is
 * for an insecure context, where `crypto` can be absent altogether. `Date.now`
 * alone would not do: two presses inside the same millisecond would hand the
 * player the identical run twice.
 */
export function freshSeed(): number {
  const source = globalThis.crypto;
  if (typeof source?.getRandomValues === 'function') {
    return source.getRandomValues(new Uint32Array(1))[0];
  }
  return (Math.floor(Math.random() * UINT32) ^ Date.now()) >>> 0;
}

export default function TitleScreen({
  onStart,
  onNavigate,
  makeSeed = freshSeed,
}: TitleScreenProps = {}) {
  return (
    <main className={styles.screen}>
      <h1 className={styles.wordmark}>KOPI UNCLE</h1>
      <p className={styles.tagline}>Can you take the order or not?</p>

      <nav className={styles.menu} aria-label="Main menu">
        <button
          type="button"
          className={`${styles.control} ${styles.primary}`}
          onClick={() => onStart?.({ mode: 'endless', seed: makeSeed() })}
        >
          Play
        </button>
        <button
          type="button"
          className={styles.control}
          onClick={() => onStart?.({ mode: 'daily', seed: null })}
        >
          Daily Challenge
        </button>
        <button type="button" className={styles.control} onClick={() => onNavigate?.('howToPlay')}>
          How to Play
        </button>
        <button type="button" className={styles.control} onClick={() => onNavigate?.('stats')}>
          Stats
        </button>
      </nav>
    </main>
  );
}
