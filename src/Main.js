import { Boot } from './scenes/Boot.js';
import { Game } from './scenes/Game.js';
import { Preloader } from './scenes/Preloader.js';
import { ricardosLore } from './scenes/ricardosLore.js';
import { RicardosProjects } from './scenes/RicardosProjects.js'
import { HUD } from './scenes/HUD.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',

  // Explicit initial size
  width: window.innerWidth,
  height: window.innerHeight,

  backgroundColor: 0x000000,

  scale: {
    mode: Phaser.Scale.RESIZE,            // canvas resizes with window
    autoCenter: Phaser.Scale.CENTER_BOTH, // stays centered
  },

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // No gravity for top-down movement
      debug: false
    }
  },

  scene: [Boot, Preloader, Game, ricardosLore, RicardosProjects, HUD]
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
