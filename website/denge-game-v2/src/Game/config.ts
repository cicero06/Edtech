import Phaser from 'phaser';

import GameScene from './scenes/GameScene';

/**
 * The world is laid out for a ~270px-tall world-space viewport (540 CSS px at
 * zoom 2). GameScene derives the camera zoom from the actual viewport height,
 * so wider screens simply reveal more of the town horizontally.
 */
export const VISIBLE_WORLD_HEIGHT = 270;

/**
 * A FACTORY, not a shared object.
 *
 * Phaser mutates the config it is handed, so reusing one module-level object
 * across game instances causes subtle breakage. Every `new Phaser.Game()` gets
 * its own fresh config.
 */
export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,

    /**
     * RENDER DECISION: linear filtering, not pixelArt.
     *
     * The world is now built from smooth illustrated PNGs, and RESIZE mode
     * produces fractional camera zooms (viewport height / 270). Nearest
     * neighbour would shimmer and alias the artwork at those zoom levels.
     */
    render: {
      pixelArt: false,
      roundPixels: true,
    },

    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },

    // Dark green so any un-painted world edge reads as "outside the town"
    // rather than looking like a rendering failure.
    backgroundColor: '#20301f',

    physics: {
      default: 'arcade',
      arcade: {
        // Runtime toggle lives in GameScene (backtick key) via
        // world.createDebugGraphic(), so this stays off.
        debug: false,
      },
    },

    scene: [GameScene],
  };
}
