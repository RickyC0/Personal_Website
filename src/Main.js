import { Boot } from './scenes/Boot.js';
import { Game } from './scenes/Game.js';
import { Preloader } from './scenes/Preloader.js';

const config = {
  type: Phaser.AUTO,
  width: '100 vw',
  height: '100vh',
  parent: 'game-container', // TODO Make sure there's a <div id="game-container"></div> in your HTML
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // No gravity for top-down movement
      debug: false
    }
  },
  scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
  scene: [
    Boot,
    Preloader,
    Game
  ]
};

const game = new Phaser.Game(config);
