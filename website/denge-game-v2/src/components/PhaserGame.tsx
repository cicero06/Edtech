import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

import { createGameConfig } from '../Game/config';

/**
 * Mounts exactly one Phaser.Game into a React-owned container.
 *
 * WHY THE DEFERRED DESTROY
 * ------------------------
 * React StrictMode intentionally runs effects mount -> cleanup -> mount to
 * surface non-idempotent setup. A naive `new Phaser.Game()` in the effect plus
 * `destroy()` in the cleanup therefore boots the game TWICE per page load:
 * duplicate asset loads, duplicate scene creation and duplicate global input
 * listeners.
 *
 * StrictMode's double invoke happens synchronously within one task, so we
 * schedule the teardown on a timeout instead of running it immediately. The
 * remount cancels the pending teardown and reuses the existing instance, while
 * a real unmount lets the timeout fire and destroys the game properly.
 *
 * This keeps StrictMode enabled rather than hiding the problem by removing it.
 */
export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const teardownRef = useRef<number | null>(null);

  useEffect(() => {
    // A remount arrived before the scheduled teardown ran - keep the instance.
    if (teardownRef.current !== null) {
      window.clearTimeout(teardownRef.current);
      teardownRef.current = null;
    }

    if (!gameRef.current && containerRef.current) {
      gameRef.current = new Phaser.Game(createGameConfig(containerRef.current));
      // Dev/test hook: lets browser smoke tests inspect the running scene.
      (window as unknown as { __dengeGame?: Phaser.Game }).__dengeGame = gameRef.current;
    }

    return () => {
      teardownRef.current = window.setTimeout(() => {
        gameRef.current?.destroy(true);
        gameRef.current = null;
        teardownRef.current = null;
        delete (window as unknown as { __dengeGame?: Phaser.Game }).__dengeGame;
      }, 0);
    };
  }, []);

  return <div id="game-container" ref={containerRef} />;
}
