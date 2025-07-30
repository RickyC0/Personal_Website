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

    //Projects world
    this.load.tilemapTiledJSON('ricardosProjectsMap', 'RicardosProjectsWorldJson.json');
    this.load.tilemapTiledJSON('movingCloudsMap', 'MovingCloudsJson.json')

    //Projects images themselves:
    //DND
    this.load.image('level-1', 'professional-files/DND-Game/level-1.png');
    this.load.image('turret-rc-car-2','professional-files/RC-Car/turret-rc-car-2.jpg');
    this.load.image('concordia-virtual-tour-cover','professional-files/Concordia-Virtual-tour/concordia-virtual-tour-cover.png');


    this.load.spritesheet('clouds-spritesheet', // key to reference in Phaser
      'custom-sprites/clouds-sprites-smaller.png',
      {
        frameWidth: 16,
        frameHeight: 16
      }
    );

    this.load.spritesheet('colors-spritesheet', // key to reference in Phaser
      'custom-sprites/Color Palette.png',
      {
        frameWidth: 16,
        frameHeight: 16
      }
    );


  }

  create() {
    this.scene.start('Game');
  }
}
