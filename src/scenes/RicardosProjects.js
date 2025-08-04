import { Player } from '../GameObjects/Player.js';
import { InteractableRect } from '../GameObjects/InteractableRect.js';


export class RicardosProjects extends Phaser.Scene{
    constructor(){
        super({key: 'RicardosProjects'});
        this.CLOUDMOVEMENTSPEED = 64; //pixels

        this.MAPOFFSETX= 650;
        this.MAPOFFSETY= -350;
    }
    
    init(data){
      this.previousScene = data.previousScene;
    }

    create(){
      //Transition that opens the scene
      const transition = this.add.image(
        this.scale.width/2,
        this.scale.height/2,
        'transition-cloud'
      )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDisplaySize(this.scale.width * 2.5, this.scale.height * 2.5)
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

      this.map = this.make.tilemap({ key: 'ricardosProjectsMap' });
      this.movingCloudsBackground = this.make.tilemap({ key: 'movingCloudsMap' });

      const cloudsTileset = this.map.addTilesetImage('clouds-sprites-smaller', 'clouds-spritesheet');
      const colorsTileset = this.map.addTilesetImage('Color Palette', 'colors-spritesheet');
      const mainTileset = this.map.addTilesetImage('MainTilesetPNG', 'tileset')

      // Display the layers of the background map
      this.backgroundLayerMap = {};
      this.movingCloudsBackground.layers.forEach(layerData => {
          const layer = this.movingCloudsBackground.createLayer(
              layerData.name,
              [cloudsTileset, colorsTileset], //use both tilesets here
              0, //X-offset 
              0  //Y-offset
          );
        // detach from camera movement
        layer.setScrollFactor(0);

        this.backgroundLayerMap[layerData.name] = layer;
      });
      // -----------------------------------------------------

      //CENTERING THE MAP
      // --------------------------------------------------------
      //TODO
      

      //----------------------------------------------------------

      // Display the layers of the main clouds map
      this.cloudsLayerMap = {};
      this.map.layers.forEach(layerData => {
          const layer = this.map.createLayer(
              layerData.name,
              [cloudsTileset, colorsTileset, mainTileset], // use both tilesets here
              this.MAPOFFSETX, //X-offset 
              this.MAPOFFSETY  //Y-offset
          );

          this.cloudsLayerMap[layerData.name] = layer;
      });

      
    

      //Offset of the background layer TODO VERIFY
      this.cloudOffsetX = 0;


      //TODO: SOME RESIZING FUNCTION THAT SCALES BOTH THE BACKGROUND AND THE MAP, BUT SEPARATLY, SINCE THEY HAVE DIFFERENT SIZES
      this.applyResize(this, this.map);
      this.applyResize(this, this.movingCloudsBackground);

      this.resizeHandler = () => {
          this.applyResize(this, this.map);
          this.applyResize(this, this.movingCloudsBackground);
      }
      this.scale.on('resize', this.resizeHandler);

      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
          this.scale.off('resize', this.resizeHandler);
      });

      //Camera Movements lIMIT
      this.cameras.main.setBounds(
        this.MAPOFFSETX/2,
        this.MAPOFFSETY/2,
        this.map.widthInPixels,
        this.map.heightInPixels
      );

      //Setting bounds to the map
      
      this.physics.world.setBounds(
        this.MAPOFFSETX, 
        this.MAPOFFSETY,
        this.map.widthInPixels,
        this.map.heightInPixels
      );

      //TODO: CHANGE PLAYER SPAWN COORDINATES TO MAKE THEM NOT HARDCODED
      this.player = new Player(this, 60*16, 50*16);

      this.cursors = this.input.keyboard.createCursorKeys();

      this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
      //----------------------------------------------------

      //Camera MOvements to follow the player
      //--------------------------------------------
      this.cameras.main.startFollow(
        this.player,    
        false, // roundPixels
        0.1, // lerpX (0 = no follow in X, 1 = lock perfectly)
        0.1  // lerpY (0 = no follow in Y, 1 = lock perfectly)
      );

      //Collision with object and limit to the map
      //----------------------------------------------------
      const collisionLayer = this.map.getObjectLayer('Collision');

      this.collision = this.physics.add.staticGroup(); // Create group for collision

      if (collisionLayer) {
        collisionLayer.objects.forEach(obj => {

        let shape;
    
        shape = this.add.rectangle(
        obj.x + obj.width / 2 + this.MAPOFFSETX,
        obj.y + obj.height / 2 +this.MAPOFFSETY,
        obj.width,
        obj.height,
        0, //color of the borders
        0 //opacity
        );

        this.physics.add.existing(shape, true); // Make it static
        this.collision.add(shape); // Add to group
        });
      }
      

      this.physics.add.collider(this.player, this.collision);

      //Adding interactable objects' logic
      // 1) set up “press Enter” key once
      this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

      // 2) group to keep references
      this.interactables = this.add.group();

      // 3) pull the ractangles to interact with from the Interactables object layer
      const interactableObjects = this.map.getObjectLayer('Interactables')?.objects || [];

      interactableObjects.forEach(obj => {
        // compute world‐space x/y exactly as your map layers use it
        const worldX = obj.width/2 + obj.x + this.MAPOFFSETX;
        const worldY = obj.height/2 + obj.y + this.MAPOFFSETY;
        const zone   = new InteractableRect(this, obj, worldX, worldY,this.previousScene);
        this.interactables.add(zone);
      });


    }

    //TODO: CHANGE THIS FUNCTION BECAUSE THIS IS INCORRECT
    applyResize(scene, tilemap) {
        const gameSize = scene.scale.gameSize;
        const zoom = gameSize.width  / tilemap.heightInPixels;

        scene.cameras.main.setZoom(zoom);

        const centerX = tilemap.widthInPixels  / 2;
        const centerY = tilemap.heightInPixels / 2;
        scene.cameras.main.centerOn(centerX, centerY);
    }

    moveCloudsRight(delta){
      // 1) advance the offset (px per second)
      this.cloudOffsetX += this.CLOUDMOVEMENTSPEED * (delta / 1000);

      // 2) grab screen width
      const screenWidth   = this.scale.gameSize.width;
      const cloudMapWidth = this.movingCloudsBackground.widthInPixels;

      // 3) how much extra map we have beyond one screen
      const wrapDistance = cloudMapWidth - screenWidth;

      // 4) wrap that extra bit only
      //    (ensure positive remainder even if cloudOffsetX overshoots)
      this.cloudOffsetX = ((this.cloudOffsetX % wrapDistance) + wrapDistance) % wrapDistance;

      // 5) baseX = flush‑right on screen when offset = 0
      const baseX   = screenWidth - cloudMapWidth;

      // 6) final x = baseX + your animated offset
      const targetX = baseX + this.cloudOffsetX;

      //TODO: CHANGE THIS TO MAKE IT NOT HARDCODED
      const targetY = -50;

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