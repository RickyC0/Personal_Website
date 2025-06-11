//main.js
//  This file is part of a Phaser 3 game that uses a tilemap created in Tiled.
import { Player } from '../GameObjects/Player.js';

export class Game extends Phaser.Scene {

  constructor() {
    super({ key: 'Game' });
  }

    create(){
      //Used to resize the map according to the window size, onload and dynamically
      const applyResponsiveZoom = (scene, map) => {
        const gameSize = scene.scale.gameSize;
        const zoomX = gameSize.width / map.widthInPixels;
        const zoomY = gameSize.height / map.heightInPixels;
        const zoom = Math.min(zoomX, zoomY);
        scene.cameras.main.setZoom(zoom);
        scene.cameras.main.centerOn(map.widthInPixels / 2, map.heightInPixels / 2);
      };

      this.cursors = this.input.keyboard.createCursorKeys();
      const map = this.make.tilemap({ key: 'map' });

      //Here the tileset name should be the name of the tileset in TILED and not the PNG
      const mainTileset = map.addTilesetImage('map_tileset', 'MainTileset');

      //Layer of the map
      map.layers.forEach(layer => {
        map.createLayer(layer.name, [mainTileset], 0, 0);
      });

      this.player = new Player(this, 100, 300);

      

      // Apply on load
      applyResponsiveZoom(this, map);

      // Re-apply on resize
      this.scale.on('resize', () => {
        applyResponsiveZoom(this, map);
      });
      
      
     
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

