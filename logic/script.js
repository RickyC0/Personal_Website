// script.js

let player;
let cursors;

const config = {
  type: Phaser.AUTO,
  width: '100 vw',
  height: '100vh',
  parent: 'game-container', // Make sure there's a <div id="game-container"></div> in your HTML
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // No gravity for top-down movement
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

// Create the Phaser game
const game = new Phaser.Game(config);

/** 
 * Preload assets 
 * Adjust file paths to match your project structure
 */
function preload() {
  // Load a background image
  this.load.image('background', 'assets/texture/Pokemon RP/img/battlebacks1/exampleBackground.png');
  
  // Load a single-character image (Snorlax) 
  // If you have a sprite sheet, replace .image with .spritesheet and define frameWidth/height
  this.load.image('character', 'assets/texture/Pokemon RPGM MV Ultimate Resource Pack V1.0/img/characters/!!FRLG Snorlax.png');
}

/**
 * Create game objects
 */
function create() {
  // Display background image in the center
  // (400, 300) is the midpoint for an 800×600 canvas
  this.add.image(400, 300, 'background');

  // Create a player sprite with physics enabled
  player = this.physics.add.sprite(100, 100, 'character');

  // Optional: scale the character if it's too large or too small
  // player.setScale(0.8);

  // Set up keyboard inputs
  cursors = this.input.keyboard.createCursorKeys();
}

/**
 * Update loop: runs every frame
 */
function update() {
  if (!player) return;

  // Reset velocity so the sprite doesn't keep moving
  player.setVelocity(0);

  // Horizontal movement
  if (cursors.left.isDown) {
    player.setVelocityX(-150);
  } else if (cursors.right.isDown) {
    player.setVelocityX(150);
  }

  // Vertical movement
  if (cursors.up.isDown) {
    player.setVelocityY(-150);
  } else if (cursors.down.isDown) {
    player.setVelocityY(150);
  }
}
