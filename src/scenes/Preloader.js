export class Preloader extends Phaser.Scene {
  constructor() {
    super({ key: 'Preloader' });
  }


  init(){

  }

  preload() {
    this.load.setPath('./assets/');

    // Actual Map
    this.load.tilemapTiledJSON('map', 'MapJSON.json');

    //Tileset used in the map
    this.load.image('tileset', '/tilesets/MainTilesetPNG.png');
    

    this.load.spritesheet('Snorlax-player',
        'Snorlax.png',
        { frameWidth: 84, frameHeight: 102 }
    )

    
  }

  create() {
    


    this.scene.start('Game');
    

  }
}
