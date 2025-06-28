export class Preloader extends Phaser.Scene {
  constructor() {
    super({ key: 'Preloader' });
  }

  preload() {
    // all paths are relative to ./assets/
    this.load.setPath('./assets/');

    // 1) Tilemap JSON
    this.load.tilemapTiledJSON('map', 'MapJson.json');

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

    // 4) Assets to load later
    this.load.image('brick-background','custom-sprites/light-brown-background.png');
    this.load.image('cv-sprite', 'custom-sprites/cv-sprite.png');
    this.load.image('projects-sprite', 'custom-sprites/light-bulb.png');
    this.load.image('education-sprite', 'custom-sprites/graduation-hat.png');

  }

  create() {
    this.scene.start('Game');
  }
}
