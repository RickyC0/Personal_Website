//main.js
//  This file is part of a Phaser 3 game that uses a tilemap created in Tiled.
import { Player } from '../GameObjects/Player.js';

export class Main extends Phaser.Scene {

  constructor() {
    super({ key: 'Game' });

    this.player = new Player(this, 100, 100);
    this.cursors = null;
    this.map = null;
  }

    create(){

    }

  update(){

  }
}


function create() {
  // Create the tilemap
  map = this.make.tilemap({ key: 'map' });

  // Add the tileset image to the map
  const tileset = map.addTilesetImage('tiles', 'tiles');

  // Create layers from the tilemap
  const groundLayer = map.createLayer('Ground', tileset, 0, 0);
  const objectLayer = map.createLayer('Objects', tileset, 0, 0);

  // Enable collisions if you marked collision tiles in Tiled
  groundLayer.setCollisionByProperty({ collides: true });

  // Add the player to the map (placed at coordinate 100,100 as an example)
  player = this.physics.add.sprite(100, 100, 'player');

  // Constrain the player within the map boundaries
  this.physics.world.bounds.width = map.widthInPixels;
  this.physics.world.bounds.height = map.heightInPixels;
  player.setCollideWorldBounds(true);

  // Collide player with ground layer
  this.physics.add.collider(player, groundLayer);

  // Keyboard input
  cursors = this.input.keyboard.createCursorKeys();
}

/**
 * Update loop: runs every frame
 */
function update(time) {
  const speed = 100;
  player.setVelocity(0);

  if (cursors.left.isDown) {
    player.setVelocityX(-speed);
  } else if (cursors.right.isDown) {
    player.setVelocityX(speed);
  }

  if (cursors.up.isDown) {
    player.setVelocityY(-speed);
  } else if (cursors.down.isDown) {
    player.setVelocityY(speed);
  }
}
