//main.js
//  This file is part of a Phaser 3 game that uses a tilemap created in Tiled.
import VirtualJoystick from '../GameObjects/VirtualJoystick.js';
import { Player } from '../GameObjects/Player.js';
import { InteractableRect } from '../GameObjects/InteractableRect.js';

export class Game extends Phaser.Scene {

  constructor() {
    super({ key: 'Game' });
  }

  preload() { 
    this.load.scenePlugin({
        key: 'rexuiplugin',
        url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
        sceneKey: 'rexUI'
    });      
  }

  create(){
    this.isTouch = this.sys.game.device.input.touch;
    if (this.isTouch) {
      this.input.addPointer(3);
      this.joy = new VirtualJoystick(this);
    }

    //Used to resize the this.map according to the window size, onload and dynamically
    const applyResponsiveZoom = (scene, map) => {
      const gameSize = scene.scale.gameSize;
      const zoomX = gameSize.width / map.widthInPixels;
        const zoomY = gameSize.height / map.heightInPixels;
        const zoom = Math.min(zoomX, zoomY);
        scene.cameras.main.setZoom(zoom);
        scene.cameras.main.centerOn(map.widthInPixels / 2, map.heightInPixels / 2);
      };

      

      this.map = this.make.tilemap({ key: 'map' });

      //Here the tileset name should be the name of the tileset in TILED and not the PNG
      const tileset = this.map.addTilesetImage('MainTileset', 'tileset');
      
      //All the layers of the map
      const layerMap = {};

      this.map.layers.forEach(layerData => {
        layerMap[layerData.name] = this.map.createLayer(layerData.name, tileset, 0, 0);

      });

      //Layers to turn on and off
      //MOVE is for all layers that move
      //WIND for wind layers ex: trees
      //WAVES self explanatory
      
      const moveLayers=[];
      const waveLayers=[];
      const windLayers=[];
      const staticLayers=[];

      for (const key in layerMap) {
        const layer = layerMap[key]; // Get the actual layer object

        //NB: CAN OPTIONALLY USE CUSTOM PROPERTIES INSTEAD OF SEARCHING THE NAME FOR A KEYWORD
        if (key.includes('MOVE')) {
          moveLayers.push(layer);
        } if (key.includes('WIND')) {
          windLayers.push(layer);
        } if(key.includes('WAVE')){
          waveLayers.push(layer);
        } if(key.includes ('STATIC')){
          staticLayers.push(layer);
        }

      }

      //Layers which should be displayed above the player sprite, i.e. player should pass behind these layers
      staticLayers.forEach(layer =>{
          layer.setDepth(100);
        }
      );

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
        delay: 1500, // 1.5 seconds
        loop: true,
        callback: () => {
          waveLayers.forEach(layer => {
            layer.visible = !layer.visible;
          });
        }
      });

      //Player and their spawn location
      //----------------------------------------------------      
      this.player = new Player(this, 585, 475);

      this.cursors = this.input.keyboard.createCursorKeys();

      this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
      //----------------------------------------------------

      //Collision with object and limit to the map
      //----------------------------------------------------
      
      //Read the objects from Tiled
      const collisionLayer = this.map.getObjectLayer('Collision');

      this.collision = this.physics.add.staticGroup(); // Create group for collision

      if (collisionLayer) {
        collisionLayer.objects.forEach(obj => {
          let shape;
      
          shape = this.add.rectangle(
            obj.x + obj.width / 2,
            obj.y + obj.height / 2,
            obj.width,
            obj.height
          );
 
          this.physics.add.existing(shape, true); // Make it static
          this.collision.add(shape);              // Add to group
        });
      }
      

      this.physics.add.collider(this.player, this.collision);

      //Interactables settings
      // 1) set up “press Enter” key once
      this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

      // 2) group to keep references
      this.interactables = this.add.group();

      // 3) pull the ractangles to interact with from the Interactables object layer
      const interactableObjects = this.map.getObjectLayer('Interactables')?.objects || [];

      interactableObjects.forEach(obj => {
        const zone = new InteractableRect(this, obj);
        this.interactables.add(zone);
      });



      // Resize map on load
      applyResponsiveZoom(this, this.map);

      // Resize this.map dynamically
      this.scale.on('resize', () => {
        applyResponsiveZoom(this, this.map);
      });
     
    }

    

  update(){
    // joystick axes (analog) -> -1..1
    let jx = 0, jy = 0;
    if (this.joy) {
      const v = this.joy.getAxis();
      jx = v.x; jy = v.y;
    }

    // keyboard (digital)
    const kx = (this.cursors.left.isDown || this.keys.left.isDown ? -1 : 0) +
              (this.cursors.right.isDown || this.keys.right.isDown ?  1 : 0);
    const ky = (this.cursors.up.isDown || this.keys.up.isDown ? -1 : 0) +
              (this.cursors.down.isDown || this.keys.down.isDown ?  1 : 0);

    // prefer joystick when active
    const useJoy = (jx !== 0 || jy !== 0);
    const ax = useJoy ? jx : Phaser.Math.Clamp(kx, -1, 1);
    const ay = useJoy ? jy : Phaser.Math.Clamp(ky, -1, 1);

    this.player.setMove(ax, ay);
  }
  
}

