import { Player } from '../GameObjects/Player.js';
import { InteractableRect } from '../GameObjects/InteractableRect.js';


export class RicardosProjects extends Phaser.Scene{
    constructor(){
        super({key: 'RicardosProjects'});
        this.CLOUDMOVEMENTSPEED = 64; //pixels
    }
    
    init(data){
      this.previousScene = data.previousScene;
    }
    preload() { 
    this.load.scenePlugin({
        key: 'rexuiplugin',
        url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
        sceneKey: 'rexUI'
    });      
  }

    create(){
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
      // 1) sizes & origins
      this.screenWidth      = this.scale.width;
      this.screenHeight     = this.scale.height;
      this.mapWidth         = this.map.widthInPixels;
      this.mapHeight        = this.map.heightInPixels;
      this.backgroundWidth  = this.movingCloudsBackground.widthInPixels;
      this.backgroundHeight = this.movingCloudsBackground.heightInPixels;

      this.worldOriginX_map = (this.screenWidth  - this.mapWidth)  / 2;
      this.worldOriginY_map = (this.screenHeight - this.mapHeight) / 2;
      this.worldOriginX_bg  = (this.screenWidth  - this.backgroundWidth)  / 2;
      this.worldOriginY_bg  = (this.screenHeight - this.backgroundHeight) / 2;

      // 2) reposition static background
      for (const layer of Object.values(this.backgroundLayerMap)) {
        layer.setPosition(this.worldOriginX_bg, this.worldOriginY_bg)
            .setScrollFactor(0);
      }

      // 3) reposition main tilemap
      for (const layer of Object.values(this.cloudsLayerMap)) {
        layer.setPosition(this.worldOriginX_map, this.worldOriginY_map)
            .setScrollFactor(1);
      }

      
      //--------------------- COLLISION AND MAP LIMIT-------------------------------------------------------
      // 4) reposition & refresh collisions
      if (this.collisionShapes) {
        this.collisionShapes.forEach(shape => {
          shape.x = shape.origX + this.worldOriginX_map;
          shape.y = shape.origY + this.worldOriginY_map;
          shape.body.updateFromGameObject();
        });
      }

      // 5) reposition & reset interactable zones
      if (this.interactableZones) {
        this.interactableZones.forEach(zone => {
          const newX = zone.origTileX + this.worldOriginX_map;
          const newY = zone.origTileY + this.worldOriginY_map;
          zone.setPosition(
            newX,
            newY
          );
          InteractableRect.updateCoordinates(zone,newX,newY);
          zone.body.reset(zone.x, zone.y);
        });
      }

      // 6) move the player to bottom‐middle again
      const spawnX = this.worldOriginX_map + this.mapWidth/2;
      const spawnY = this.worldOriginY_map + this.mapHeight - 10 * (this.map.tileHeight/2);
      this.player.setPosition(spawnX, spawnY);

      // 7) camera & physics bounds
      this.cameras.main
        .setBounds(
          0,
          0,
          this.mapWidth,
          this.mapHeight
        )
        .setSize(this.screenWidth, this.screenHeight)
        .startFollow(this.player, false, 0.1, 0.1);

      this.physics.world.setBounds(
        this.worldOriginX_map,
        this.worldOriginY_map,
        this.mapWidth,
        this.mapHeight
      );
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
      const cursors = this.cursors;
      const keys = this.keys;

      if (cursors.left.isDown || keys.left.isDown) {
        this.player.moveLeft();
      } else if (cursors.right.isDown || keys.right.isDown) {
        this.player.moveRight();
      } else if (cursors.up.isDown || keys.up.isDown) {
        this.player.moveUp();
      } else if (cursors.down.isDown || keys.down.isDown) {
        this.player.moveDown();
      } else {
        this.player.idle();
      }


      //Background movement
      this.moveCloudsRight(delta);
      
    }
}   