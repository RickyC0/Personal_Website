import { Player } from '../GameObjects/Player.js';

export class RicardosProjects extends Phaser.Scene{
    constructor(){
        super({key: 'RicardosProjects'});
        this.cloudOffsetX = 0;
        this.CLOUDMOVEMENTSPEED = 32; //pixels
        this.CLOUDRESETLIMIT = 320; //TODO TO VERIFY

        this.MAPOFFSETX= 650;
        this.MAPOFFSETY= -350;
    }

    create(){
        this.map = this.make.tilemap({ key: 'ricardosProjectsMap' });
        this.movingCloudsBackground = this.make.tilemap({ key: 'movingCloudsMap' });

        const cloudsTileset = this.map.addTilesetImage('clouds-sprites-smaller', 'clouds-spritesheet');
        const colorsTileset = this.map.addTilesetImage('Color Palette', 'colors-spritesheet');

        // Display the layers of the background map
        this.backgroundLayerMap = {};
        this.movingCloudsBackground.layers.forEach(layerData => {
            this.backgroundLayerMap[layerData.name] = this.movingCloudsBackground.createLayer(
                layerData.name,
                [cloudsTileset, colorsTileset], //use both tilesets here
                0, //X-offset 
                0  //Y-offset
            );
        });

        // Display the layers of the main clouds map
        this.cloudsLayerMap = {};
        this.map.layers.forEach(layerData => {
            this.cloudsLayerMap[layerData.name] = this.map.createLayer(
                layerData.name,
                [cloudsTileset, colorsTileset], // use both tilesets here
                this.MAPOFFSETX, //X-offset 
                this.MAPOFFSETY  //Y-offset
            );
        });

        //Setting bounds to the map

        this.physics.world.setBounds(
          this.MAPOFFSETX, 
          this.MAPOFFSETY,
          this.map.widthInPixels,
          this.map.heightInPixels
        );

        
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

        //Set up the repeating timer to move the cloud background every second
        this.time.addEvent({
            delay: 1000, // 1 second
            callback: this.moveCloudsRight,
            callbackScope: this,
            loop: true
        });

        //Player and their spawn location
      //----------------------------------------------------      
      this.player = new Player(this, 60*16, 50*16);

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


    }

    applyResize(scene, tilemap) {
        const gameSize = scene.scale.gameSize;
        const zoom = gameSize.width  / tilemap.heightInPixels;

        scene.cameras.main.setZoom(zoom);

        const centerX = tilemap.widthInPixels  / 2;
        const centerY = tilemap.heightInPixels / 2;
        scene.cameras.main.centerOn(centerX, centerY);
    }

    moveCloudsRight(){
        this.cloudOffsetX +=this.CLOUDMOVEMENTSPEED;

        if(this.cloudOffsetX >= this.CLOUDRESETLIMIT){
            this.cloudOffsetX=0;
        }

        for(const layerName in this.backgroundLayerMap){
            const layer = this.backgroundLayerMap[layerName];
            layer.setPosition(this.cloudOffsetX,0);
        }
    }

    update(){
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
    }
}   