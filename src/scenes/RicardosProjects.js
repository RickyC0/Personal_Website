import VirtualJoystick from '../GameObjects/VirtualJoystick.js';
import { Player } from '../GameObjects/Player.js';
import { InteractableRect } from '../GameObjects/InteractableRect.js';


export class RicardosProjects extends Phaser.Scene{
    constructor(){
        super({key: 'RicardosProjects'});
        this.CLOUDMOVEMENTSPEED = 64; //pixels
    }
    
    init(data){
      this.previousScene = data.previousScene;
      this._hasSpawned = false;
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

      this.map = this.make.tilemap({ key: 'ricardosProjectsMap' });
      this.movingCloudsBackground = this.make.tilemap({ key: 'movingCloudsMap' });

      const cloudsTileset = this.map.addTilesetImage('clouds-sprites-smaller', 'clouds-spritesheet');
      const colorsTileset = this.map.addTilesetImage('Color Palette', 'colors-spritesheet');
      const mainTileset = this.map.addTilesetImage('MainTilesetPNG', 'tileset')


      //----------------------DISPLAYING THE BACKGROUND------------------------------------
      // Display the layers of the background map
      this.backgroundLayerMap = {};
      this.movingCloudsBackground.layers.forEach(layerData => {
          const layer = this.movingCloudsBackground.createLayer(
              layerData.name,
              [cloudsTileset, colorsTileset], //use both tilesets here
              0, //X-offset 
              0  //Y-offset
          );

        this.backgroundLayerMap[layerData.name] = layer;
      });
      // -----------------------------------------------------
      

      //----------------------DISPLAYING THE MAP------------------------------------

      // Display the layers of the main clouds map
      this.cloudsLayerMap = {};
      this.map.layers.forEach(layerData => {
          const layer = this.map.createLayer(
              layerData.name,
              [cloudsTileset, colorsTileset, mainTileset], // use both tilesets here
              0, //X-offset 
              0 //Y-offset
          );

          this.cloudsLayerMap[layerData.name] = layer;
      });
     
      //---------------------------------------------------------
      
      //Offset of the background layer TODO VERIFY
      this.cloudOffsetX = 0;

      this.collisionLayer = this.map.getObjectLayer('Collision')?.objects || [];
      this.interactableObjects = this.map.getObjectLayer('Interactables')?.objects || [];


      // ------------- PLAYER & CAMERA -----------------------------------------

      // place the player
      this.player = new Player(this, 0, 0);


      this.cameras.main
        .startFollow(
          this.player,
          false, // roundPixels
          0.1,   // lerpX
          0.1    // lerpY
        );
      
      //---------------------------------------------------------

      this.cursors = this.input.keyboard.createCursorKeys();

      this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
      //----------------------------------------------------

      //-------------------------------Collision and Interactable layers---------------------------
      this._createCollisionShapes();
      this._createInteractableZones();

      // -------------------------------------------------------
      // SCALE & CENTER THE CLOUD‐BACKGROUND (detached from camera)
      // -------------------------------------------------------
      this.scale.off('resize', this._onResize, this);  // remove if previously attached
      this.scale.on('resize', this._onResize, this);

      //Scale and center now at the start of the scene
      this._onResize();


      //-------------------------------TRANSITION INTO THE SCENE--------------------------------
      //Transition that opens the scene
      const transition = this.add.image(
        this.scale.width/2,
        this.scale.height/2,
        'transition-cloud'
      )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDisplaySize(this.scale.width * 2, this.scale.height * 2.5)
        .setDepth(1000)// on top of everything
        .setAlpha(1);// start fully opaque

      // 2) fade it out over 3 seconds, then destroy
      this.tweens.add({
        targets: transition,
        alpha: { from: 1, to: 0 },
        duration: 3000,
        ease: 'Quad.easeOut',
        onComplete: () => transition.destroy()
      });

    }

    _createCollisionShapes(){
      this.collisionShapes = [];
      this.collisionLayer.forEach(obj => {
        // “orig” coords
        const origX = obj.x + obj.width/2;
        const origY = obj.y + obj.height/2;

        // place in map coords
        const shape = this.add.rectangle(
          origX + this.worldOriginX_map,
          origY + this.worldOriginY_map,
          obj.width,
          obj.height,
          0, 0
        );
        this.physics.add.existing(shape, true);
        shape.origX = origX;
        shape.origY = origY;

        this.collisionShapes.push(shape);
      });
      this.physics.add.collider(this.player, this.collisionShapes);
    }

    // build InteractableRect instances exactly once
    _createInteractableZones(){
      this.interactableZones = [];
      this.interactableObjects.forEach(obj => {
        const origX = obj.x + obj.width/2;
        const origY = obj.y + obj.height/2;
        const zone = new InteractableRect(
          this,
          obj,
          origX + this.worldOriginX_map,
          origY + this.worldOriginY_map,
          this.previousScene
        );
        zone.origTileX = origX;
        zone.origTileY = origY;
        this.interactableZones.push(zone);
      });
    }

    // called on startup & whenever the canvas resizes
    _onResize() {
      // 0) remember previous origin BEFORE recomputing (for player shift)
      const prevOriginX = this.worldOriginX_map ?? 0;
      const prevOriginY = this.worldOriginY_map ?? 0;

      // 1) sizes & new origins
      this.screenWidth      = this.scale.width;
      this.screenHeight     = this.scale.height;
      this.mapWidth         = this.map?.widthInPixels  ?? 0;
      this.mapHeight        = this.map?.heightInPixels ?? 0;
      this.backgroundWidth  = this.movingCloudsBackground?.widthInPixels  ?? 0;
      this.backgroundHeight = this.movingCloudsBackground?.heightInPixels ?? 0;

      this.worldOriginX_map = (this.screenWidth  - this.mapWidth)  / 2;
      this.worldOriginY_map = (this.screenHeight - this.mapHeight) / 2;
      this.worldOriginX_bg  = (this.screenWidth  - this.backgroundWidth)  / 2;
      this.worldOriginY_bg  = (this.screenHeight - this.backgroundHeight) / 2;

      // 2) reposition static background
      if (this.backgroundLayerMap) {
        for (const layer of Object.values(this.backgroundLayerMap)) {
          layer.setPosition(this.worldOriginX_bg, this.worldOriginY_bg).setScrollFactor(0);
        }
      }

      // 3) reposition main tilemap
      if (this.cloudsLayerMap) {
        for (const layer of Object.values(this.cloudsLayerMap)) {
          layer.setPosition(this.worldOriginX_map, this.worldOriginY_map).setScrollFactor(1);
        }
      }

      // 4) reposition & refresh collisions  ✅ null-safe + body-type safe
      if (this.collisionShapes) {
        this.collisionShapes.forEach(shape => {
          if (!shape) return;                // shape missing
          // if you stored origX/origY on creation:
          const ox = shape.origX ?? shape.x; // fallback if not set
          const oy = shape.origY ?? shape.y;

          shape.x = ox + this.worldOriginX_map;
          shape.y = oy + this.worldOriginY_map;

          const body = shape.body;
          if (!body) return;                 // body not ready yet (first refresh, etc.)

          if (body.isStatic) {
            // StaticBody has updateFromGameObject()
            body.updateFromGameObject();
          } else if (typeof body.reset === 'function') {
            // Dynamic body (rare for collisions, but be safe)
            body.reset(shape.x, shape.y);
          }
        });
      }

      // 5) reposition & reset interactable zones  ✅ same guards
      if (this.interactableZones) {
        this.interactableZones.forEach(zone => {
          if (!zone || !zone.scene) return;

          const newX = (zone.origTileX ?? zone.x) + this.worldOriginX_map;
          const newY = (zone.origTileY ?? zone.y) + this.worldOriginY_map;

          zone.setPosition(newX, newY);

          // If you keep the static helper, ensure it operates on the instance (not `this`)
          // and doesn't assume a body exists yet.
          InteractableRect.updateCoordinates?.(zone, newX, newY);

          const body = zone.body;
          if (!body) return;

          if (body.isStatic) {
            body.updateFromGameObject();
          } else if (typeof body.reset === 'function') {
            body.reset(zone.x, zone.y);
          }
        });
      }


      // 6) player: spawn once, else shift by origin delta
      const dx = this.worldOriginX_map - prevOriginX;
      const dy = this.worldOriginY_map - prevOriginY;

      if (!this._hasSpawned) {
        const spawnX = this.worldOriginX_map + this.mapWidth / 2;
        const spawnY = this.worldOriginY_map + this.mapHeight - 10 * (this.map?.tileHeight ?? 0) / 2;
        this.player.setPosition(spawnX, spawnY);
        this.player.body?.reset?.(spawnX, spawnY);
        this._hasSpawned = true;
      } else {
        // keep player over the same tiles when origins shift
        this.player.setPosition(this.player.x + dx, this.player.y + dy);
        this.player.body?.reset?.(this.player.x, this.player.y);
      }

      // 7) camera & physics bounds — use same origin as map
      if (this.cameras?.main) {
        const cam =  this.cameras.main;
        const isPortrait = this.scale.height > this.scale.width;

        if(isPortrait){
            cam.setSize(this.screenWidth, this.screenHeight);

            cam.setZoom(2);
        }

        else{
          cam.setSize(this.screenWidth, this.screenHeight);
          cam.setZoom(1);
        }


        if (!this.cameras.main._following) {
          this.cameras.main.startFollow(this.player, false, 0.1, 0.1);
        }
      }

      if (this.physics?.world) {
        this.physics.world.setBounds(
          this.worldOriginX_map,
          this.worldOriginY_map,
          this.mapWidth,
          this.mapHeight
        );
      }
    }


  

    moveCloudsRight(delta){
      // 1) advance the offset (px per second)
      this.cloudOffsetX += this.CLOUDMOVEMENTSPEED * (delta / 1000);

      // 3) how much extra map we have beyond one screen
      const wrapDistance =  this.backgroundWidth - this.screenWidth;

      // 4) wrap that extra bit only
      //    (ensure positive remainder even if cloudOffsetX overshoots)
      this.cloudOffsetX = ((this.cloudOffsetX % wrapDistance) + wrapDistance) % wrapDistance;

      // 5) baseX = flush‑right on screen when offset = 0
      const baseX = this.screenWidth - this.backgroundWidth;

      // 6) final x = baseX + your animated offset
      const targetX = baseX + this.cloudOffsetX;

      //TODO: CHANGE THIS TO MAKE IT NOT HARDCODED
      const targetY = 0;

      // 7) apply to every cloud layer
      for (const layer of Object.values(this.backgroundLayerMap)) {
        layer.setPosition(targetX, targetY);
      }
    }

    update(time, delta){
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


      //Background movement
      this.moveCloudsRight(delta);
      
    }
}   