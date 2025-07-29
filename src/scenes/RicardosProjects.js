
export class RicardosProjects extends Phaser.Scene{
    constructor(){
        super({key: 'RicardosProjects'});
        this.cloudOffsetX = 0;
        this.CLOUDMOVEMENTSPEED = 32; //pixels
        this.CLOUDRESETLIMIT = 320; //TODO
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
                650, //X-offset 
                -350  //Y-offset
            );
        });

        
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
        
    }
}   