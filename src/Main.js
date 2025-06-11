import { Boot } from './scenes/Boot.js';
import { Game } from './scenes/Game.js';
import { Preloader } from './scenes/Preloader.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',

  scale: {
    mode: Phaser.Scale.RESIZE,            // Make canvas fit full window
    autoCenter: Phaser.Scale.CENTER_BOTH, // Center if there's any extra space
  },

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // No gravity for top-down movement
      debug: false
    }
  },

  scene: [Boot, Preloader, Game]
};

const game = new Phaser.Game(config);
