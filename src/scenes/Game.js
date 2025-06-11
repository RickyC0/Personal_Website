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
      const mainTileset = map.addTilesetImage('MainTileset', 'MainTileset');
      
      //All the layers of the map
      const layerMap = {};

      map.layers.forEach(layerData => {
        layerMap[layerData.name] = map.createLayer(layerData.name, mainTileset, 0, 0);
      });

      //Layers to turn on and off
      //MOVE is for all layers that move
      //WIND for wind layers ex: trees
      //WAVES self explanatory
      //Made them class objects to access them in update()
      const moveLayers=[]
      const waveLayers=[]
      const windLayers=[]

      for (const key in layerMap) {
        const layer = layerMap[key]; // Get the actual layer object

        if (key.includes('MOVE')) {
          moveLayers.push(layer);
        } if (key.includes('WIND')) {
          windLayers.push(layer);
        } if(key.includes('WAVE')){
          waveLayers.push(layer);
        }
      }

      //This creates an event every 1 second to simulate the wind by turning visible on and off the wind layers
      this.time.addEvent({
        delay: 1000, // 1 second
        loop: true,
        callback: () => {
          windLayers.forEach(layer => {
            layer.visible = !layer.visible;
          });
        }
      });

      //This creates an event every 1.5 seconds to simulate the waves by turning visible on and off the wave layers
      this.time.addEvent({
        delay: 1500, // 1 second
        loop: true,
        callback: () => {
          waveLayers.forEach(layer => {
            layer.visible = !layer.visible;
          });
        }
      });

      this.player = new Player(this, 100, 300);

      // Resize map on load
      applyResponsiveZoom(this, map);

      // Resize map dynamically
      this.scale.on('resize', () => {
        applyResponsiveZoom(this, map);
      });
     
    }

    

  update(){
      
  }
}

