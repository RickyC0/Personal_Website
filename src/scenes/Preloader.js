export class Preloader extends Phaser.Scene {
  constructor() {
    super({ key: 'Preloader' });
  }

  preload() {
    // all paths are relative to ./assets/
    this.load.setPath('./assets/');

    // 1) Tilemap JSON
    this.load.tilemapTiledJSON('map', 'MapJSON.json');

    // 2) Tileset as a spritesheet 
    this.load.spritesheet(
      'tileset',                         // key to reference in Interactable
      'tilesets/MainTilesetPNG.png',     
      {
        frameWidth: 16,   // tile width in px
        frameHeight: 16   //  tile height in px
      }
    );

    // 3) player
    this.load.spritesheet('Snorlax-player',
      'Snorlax.png',
      { frameWidth: 84, frameHeight: 102 }
    );
  }

  create() {
    this.scene.start('Game');
  }
}
