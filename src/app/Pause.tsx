import styles from './Pause.module.css';

/**
 * Placeholder screen registered by src/app/App.tsx so that the sprint filling
 * this screen writes its own file pair rather than editing the router.
 * Filled in by S43-1 (Sprint 43 — mid-game help behind R19 PAUSE).
 */
export default function Pause() {
  return (
    <main className={styles.screen}>
      <h1 className={styles.heading}>Paused</h1>
      <p className={styles.placeholderNote}>Not built yet.</p>
    </main>
  );
}
