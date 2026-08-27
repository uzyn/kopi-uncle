import styles from './GameScreen.module.css';

/**
 * Placeholder screen registered by src/app/App.tsx so that the sprint filling
 * this screen writes its own file pair rather than editing the router.
 * Filled in by S33-1 (Sprint 33 — the portrait composition).
 */
export default function GameScreen() {
  return (
    <main className={styles.screen}>
      <h1 className={styles.heading}>Game</h1>
      <p className={styles.placeholderNote}>Not built yet.</p>
    </main>
  );
}
