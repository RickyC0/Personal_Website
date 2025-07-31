export class Preloader extends Phaser.Scene {
  constructor() {
    super({ key: 'Preloader' });
  }

  preload() {
    // all paths are relative to ./assets/
    this.load.setPath('./assets/');

    // 1) Tilemap JSON
    this.load.tilemapTiledJSON('map', 'MapJson.json');
      //Projects world
    this.load.tilemapTiledJSON('ricardosProjectsMap', 'RicardosProjectsWorldJson.json');
    this.load.tilemapTiledJSON('movingCloudsMap', 'MovingCloudsJson.json')

    // 2) Tileset as a spritesheet 
    this.load.spritesheet(
      'tileset',                         // key to reference in Interactable
      'tilesets/MainTilesetPNG.png',     
      {
        frameWidth: 16,   // tile width in px
        frameHeight: 16   //  tile height in px
      }
    );

      //pROJECTS World
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

    // 3) player
    this.load.spritesheet('Snorlax-player',
      'Snorlax.png',
      { frameWidth: 84, frameHeight: 102 }
    );    

    //---------------------- Loading images ----------------------------------------------

    //Images from folders:
    //-Professional files
    //-Custom sprites

    // grab the manifest
    //NB: WHEN USING THE IMAGES THAT ARE LOADED THIS WAY, MAKE SURE TO USE THE KEY I.E. THEIR FILENAME WITHOUT THE EXTENSION
    this.load.json('imageManifest', 'image-manifest.json');


    //---------------------- Handle Load Errors ----------------------------------------------
    this.load.on('loaderror', (file) => {
      console.error(`Failed to load: key=${file.key} url=${file.src}`);
    });



  }

  create() {
     const manifest = this.cache.json.get('imageManifest');
      // now manifest is a real array of strings
      manifest.forEach(path => {
        const filename = path.split('/').pop();           // "level-1.png"
        const key      = filename.replace(/\.\w+$/, '');  // "level-1"
        this.load.image(key, path);
      });

      this.load.once('complete', () => this.scene.start('Game'));
      this.load.start();
  }
}
