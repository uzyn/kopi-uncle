import styles from './GameOver.module.css';

/**
 * Placeholder screen registered by src/app/App.tsx so that the sprint filling
 * this screen writes its own file pair rather than editing the router.
 * Filled in by S39-1 (Sprint 39 — the R16 game-over screen).
 */
export default function GameOver() {
  return (
    <main className={styles.screen}>
      <h1 className={styles.heading}>Game Over</h1>
      <p className={styles.placeholderNote}>Not built yet.</p>
    </main>
  );
}
