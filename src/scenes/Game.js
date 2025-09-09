//main.js
//  This file is part of a Phaser 3 game that uses a tilemap created in Tiled.
import VirtualJoystick from '../GameObjects/VirtualJoystick.js';
import { Player } from '../GameObjects/Player.js';
import { InteractableRect } from '../GameObjects/InteractableRect.js';
import { HUD } from './HUD.js';

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
        if (!this.scene.isActive('HUD')) {
          this.scene.launch('HUD', { parentKey: this.scene.key });
        }
        const hud = this.scene.get('HUD');

        // If HUD already created, you can use its joystick immediately,
        // otherwise wait for the 'ready' event. Either way, wire axis -> player.
        const wire = () => {
          hud.events.on('axis', ({ x, y }) => {
            this.lastAxis = { x, y };      // cache joystick axis for use in update()
          }, this);

          this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            hud.events.off('axis', null, this);
          });
        };

        this.lastAxis = { x: 0, y: 0 };

        // If HUD isn’t fully ready yet, wait once; otherwise wire now
        if (hud.scene.isActive()) {
          if (hud.joystick) wire();
          else hud.events.once('ready', wire, this);
        } else {
          hud.events.once('create', wire, this); // safety net
        }

        // If this scene is resumed (after a pause), re-wire the joystick
        this.events.on(Phaser.Scenes.Events.RESUME, () => {
          hud.events.off('axis', null, this);
          this.lastAxis = { x: 0, y: 0 };

          if (hud.joystick) {
            wire();
          } else {
            hud.events.once('ready', wire, this);
          }
        }, this);

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

      //-------------DISCLAIMER TO ROTATE MOBILE PHONE -------------
      // This is a reminder to rotate your mobile phone for the best experience.
      this._rotateHintDismissed = false;   // remember if user closes it
      if (this.isTouch) this._initRotateHint();
    
      // Resize map on load
      applyResponsiveZoom(this, this.map);

      // Resize this.map dynamically
      this.scale.on('resize', () => {
        applyResponsiveZoom(this, this.map);
      });
     
    }

    _initRotateHint() {
      this.rotateHint = this.add.container(0, 0).setScrollFactor(0).setDepth(100000);
      this._rotateHintDismissed = false;

      const layout = () => {
        const w = this.scale.width;
        const h = this.scale.height;

        // RELATIVE SIZING (percentages of screen)
        const margin        = Math.min(w, h) * 0.025;   // 2.5% of smaller side
        const barH          = h * 0.09;                 // 9% of height
        const barW          = Math.max(w * 0.6, w - margin * 2); // at least 60% width or fit with margins
        const strokeW       = Math.max(0.001 * Math.min(w, h), 0.001); // thin, relative
        const padX          = barH * 0.35;              // left/right text padding
        const closeSize     = barH * 0.45;              // “×” size
        const closeHitSize  = barH * 0.8;               // larger tap target
        const fontSizePx    = Math.round(h * 0.018);    // ~1.8% of height
        const wrapWidth     = barW - padX * 2 - closeHitSize; // leave room for close button

        // clear previous children
        this.rotateHint.removeAll(true);

        // background bar
        const bg = this.add.rectangle(w * 0.5, h * 0.5, barW, barH, 0x000000, 0.75)
        .setStrokeStyle(strokeW, 0xffffff, 0.15)
        .setScrollFactor(0)
        .setDepth(100);

        // text
        const txt = this.add.text(
          bg.x - bg.width / 2 + padX,
          bg.y,
          'For a better experience, rotate your phone to landscape.',
          {
            fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
            fontSize: `${fontSizePx}px`,
            color: '#ffffff',
            wordWrap: { width: wrapWidth }
          }
        )
        .setOrigin(0, 0.5)
        .setScrollFactor(0);

        // close “×”
        const close = this.add.text(
          bg.x + bg.width / 2 - (padX * 0.6),
          bg.y,
          '×',
          { fontSize: `${Math.round(closeSize)}px`, color: '#ffffff' }
        ).setOrigin(0.5).setScrollFactor(0);

        // larger, invisible hit area for close (touch-friendly)
        const closeHit = this.add.zone(close.x, close.y, closeHitSize, closeHitSize)
          .setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });

        closeHit.on('pointerdown', () => {
          this._rotateHintDismissed = true;
          this.rotateHint.setVisible(false);
        });

        this.rotateHint.add([bg, txt, close, closeHit]);
      };

      const updateVisibility = () => {
        const isPortrait = this.scale.orientation === Phaser.Scale.PORTRAIT;
        this.rotateHint.setVisible(this.isTouch && !this._rotateHintDismissed && isPortrait);
      };

      layout();
      updateVisibility();

      this.scale.on('orientationchange', () => updateVisibility());
      this.scale.on('resize', () => { layout(); updateVisibility(); });
    }



    

  update(){
    // joystick axes (analog) -> -1..1
    const jx = this.lastAxis?.x || 0;
    const jy = this.lastAxis?.y || 0;

    // keyboard (digital)
    const kx = (this.cursors.left.isDown || this.keys.left.isDown ? -1 : 0) +
              (this.cursors.right.isDown || this.keys.right.isDown ?  1 : 0);
    const ky = (this.cursors.up.isDown || this.keys.up.isDown ? -1 : 0) +
              (this.cursors.down.isDown || this.keys.down.isDown ?  1 : 0);

    // prefer joystick when active (deadzone)
    const joyActive = (Math.abs(jx) > 0.001 || Math.abs(jy) > 0.001);
    const ax = joyActive ? jx : Phaser.Math.Clamp(kx, -1, 1);
    const ay = joyActive ? jy : Phaser.Math.Clamp(ky, -1, 1);

    this.player.setMove(ax, ay);
  }
  
}

