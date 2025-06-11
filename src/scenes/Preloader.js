export class Preloader extends Phaser.Scene {
  constructor() {
    super({ key: 'Preloader' });
  }


  init(){

  }

  preload() {
    this.load.setPath('./assets/');

    // Actual Map
    this.load.tilemapTiledJSON('map', 'MapJson.json');

    this.load.image('MainTileset', '/tilesets/MainTilesetPng.png');
    

    this.load.spritesheet('Snorlax-player',
        'Snorlax.png',
        { frameWidth: 84, frameHeight: 102 }
    )

    
  }

  create() {
    


    this.scene.start('Game');
    

  }
}
