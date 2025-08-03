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
    this.load.json('mediaManifest', 'media-manifest.json');


    //---------------------- Handle Load Errors ----------------------------------------------
    this.load.on('loaderror', (file) => {
      console.error(`Failed to load: key=${file.key} url=${file.src}`);
    });



  }

  create() {
    // re-apply the same base path so your dynamic loads know where to look
    this.load.setPath('./assets/');

    const manifest = this.cache.json.get('mediaManifest');
    if (!Array.isArray(manifest)) {
      console.error('mediaManifest didn’t load!', manifest);
      return;
    }

    manifest.forEach(relPath => {
      const ext      = relPath.split('.').pop().toLowerCase();
      const key      = relPath.split('/').pop().replace(/\.\w+$/, '');

      if (['png','jpg','jpeg','svg','gif'].includes(ext)) {
        this.load.image(key, relPath);
      } else if (['mp4','webm'].includes(ext)) {
        this.load.video(key, relPath);

      } else {
        console.warn('Skipping unknown type', relPath);
      }
    });

    this.load.once('complete', () => this.scene.start('Game'));
    this.load.start();
  }

}
