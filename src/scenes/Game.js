//main.js
//  This file is part of a Phaser 3 game that uses a tilemap created in Tiled.
import { Player } from '../GameObjects/Player.js';

export class Game extends Phaser.Scene {

  constructor() {
    super({ key: 'Game' });
  }

    create(){
      
      this.cursors = this.input.keyboard.createCursorKeys();
      const map = this.make.tilemap({ key: 'map' });

      //Here the tileset name should be the name of the tileset in TILED and not the PNG
      const mainTileset = map.addTilesetImage('map_tileset', 'MainTileset');

      //Layer of the map
      map.layers.forEach(layer => {
        map.createLayer(layer.name, [mainTileset], 0, 0);
      });

      this.player = new Player(this, 100, 300);


      
     
    }

    

  update(){
      
    //   const speed = 100;
    // player.setVelocity(0);

    // if (cursors.left.isDown) {
    //   player.setVelocityX(-speed);
    // } else if (cursors.right.isDown) {
    //   player.setVelocityX(speed);
    // }

    // if (cursors.up.isDown) {
    //   player.setVelocityY(-speed);
    // } else if (cursors.down.isDown) {
    //   player.setVelocityY(speed);
    // }
  }
}

