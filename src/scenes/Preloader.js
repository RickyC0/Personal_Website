export class Preloader extends Phaser.Scene {
  constructor() {
    super({ key: 'Preloader' });
  }

  
  init(){

  }

  preload() {
    this.load.setPath('assets/');
    this.load.tilemapTiledJSON('map', 'assets/Map.tmx');
  }

  create() {

    this.map = this.make.tilemap({ key: 'map' });


    this.scene.start('Main');
    
  }
}
