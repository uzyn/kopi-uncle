import styles from './TitleScreen.module.css';

/**
 * The front door. Sprint 1 renders the wordmark and nothing else — S12-1
 * (Sprint 12 — title screen) adds Play, Daily Challenge, How to Play and Stats.
 */
export default function TitleScreen() {
  return (
    <main className={styles.screen}>
      <h1 className={styles.wordmark}>KOPI UNCLE</h1>
      <p className={styles.tagline}>Can you take the order or not?</p>
      <p className={styles.scaffoldNote}>Scaffold — the game arrives sprint by sprint.</p>
    </main>
  );
}
