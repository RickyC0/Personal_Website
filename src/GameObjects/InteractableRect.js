export class InteractableRect extends Phaser.GameObjects.Rectangle {
  //array of interactable rects
  static instances = [];

  // state flags
  static isProjectOpen = false;

  constructor(scene, obj, x, y,previousScene) {
    // compute world‐coords
    x = x == null ? obj.x + obj.width/2 : x;
    y = y == null ? obj.y + obj.height/2 : y;

    super(scene, x, y, obj.width, obj.height, 0x000000, 0);
    this.obj = obj;
    this.scene = scene;
    this.name = obj.name || 'InteractableRect';
    this.previousScene=previousScene;

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setInteractive({ useHandCursor: true });

    this._drawHoverArea();

    // collect Tiled properties
    this.tileProps    = {};
    (obj.properties||[]).forEach(p => this.tileProps[p.name] = p.value);

    // hover-only graphics
    this.hoverRectBackground = null;
    this.hoverRectText = null;
    this.hoverRect = null;
    this.hoverImage = null;

    //project-page graphics
    this.projectImages = [];
    this.projectBackground = null;
    this.projectBorder = null;
    this.projectCloseButton = null;
    this.projectCloseButtonBackground = null;
    this.projectInfoText = null;
    this.projectInfoBorder = null;
    this.previousArrow = null;
    this.nextArrow = null;
    this.currentImage = null;
    this.currentImageIndex = 0;

    //Rectangle properties
    this.HOVER_RECTANGLE_SCALE_FACTOR = 5;

    // pointer events
    this.on('pointerover',  this._onPointerOver);
    this.on('pointerout',   this._onPointerOut);
    this.on('pointerdown',  () => this.interact(true));

    // 1) track every instance
    InteractableRect.instances.push(this);

    this.scene.input.keyboard.on('keydown-ESC',()=> this._closeProject());
    this.scene.input.keyboard.on('keydown-ENTER', ()=> this.interact());

    //VERY IMPORTANT!
    //This removes the InteractableRect objects of this scene from the static instances array
    //Therefore when we reopen this scene anew, it will create new objects for the rectangles, and so we need to remove the old ones here
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      InteractableRect.instances = InteractableRect.instances.filter(
        inst => inst.scene !== this.scene
      );
    });
    
  }

  preload() { 
    this.load.scenePlugin({
        key: 'rexuiplugin',
        url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
        sceneKey: 'rexUI'
    });      
  }

  _drawHoverArea(){
    // hover highlight
    const PADDING = 8;
    this.hoverHighlight = this.scene.add.rectangle(
      this.x, this.y,
      this.obj.width  + PADDING*2,
      this.obj.height + PADDING*2,
      0xffff00, 0.3
    )
    .setVisible(false)
    .setDepth(this.depth+1)
    .setScrollFactor(1);
  }

  static updateCoordinates(obj,x,y){
    obj.x=x;
    obj.y=y;

    obj.hoverHighlight=null;

    obj._drawHoverArea();

  }

  _checkClosestRect() {
    let closest     = null;
    let minDistance = Infinity;

    // pull the player off the scene
    const player = this.scene.player;
    if (!player) {
      console.warn('No player on scene');
      return null;
    }

    const px = player.x;
    const py = player.y + player.displayHeight/2;

    for (const inst of InteractableRect.instances) {
      if (!inst) continue;

      // use inst.x/inst.y instead of inst.body.center
      const zx = inst.x;
      const zy = inst.y;
      const d  = Phaser.Math.Distance.Between(px, py, zx, zy);

      if (d < minDistance) {
        minDistance = d;
        closest     = inst;
      }
    }

    return closest;
  }

  _warnClosestRect(){
    const temp = this._checkClosestRect();

    if(this._checkClosestRect()){
      temp.warnFarInteraction();
      temp.drawShortestPath();
    }
  }


  _onPointerOver() {
    // if a project is open, don’t show any hover
    if (InteractableRect.isProjectOpen) {
      return;
    }

    // otherwise do the normal hover
    if (this.tileProps['display-rect']) {
      this._displayHoverRect();
    } else {
      this.hoverHighlight.setVisible(true);
    }
  }

  _onPointerOut() {
    // if a project is open, don’t clear or hide anything
    if (InteractableRect.isProjectOpen) {
      return;
    }

    this.hoverHighlight.setVisible(false);
    this._clearDisplayRect();
  }

  _displayHoverRect() {
    if (this.hoverRect) return; // already shown
    if(InteractableRect.isProjectOpen) return;

    // 1) draw the rectangle border
    this.hoverRect = this.scene.add.rectangle(
      this.x, this.y,
      this.obj.width * this.HOVER_RECTANGLE_SCALE_FACTOR, this.obj.height * this.HOVER_RECTANGLE_SCALE_FACTOR
    )
    .setStrokeStyle(2, 0xffffff)
    .setDepth(this.depth + 2)
    .setScrollFactor(1);

    //The rectangle will either contain:
    //a) AN IMAGE
    if (this.tileProps['cover']) {
      //TODO: CLEAN UP THE WAY WE PRELOAD IMAGES
      const fullPath = this.tileProps['cover']; 
      // "C:/…/level-1.png"

      // 1) grab only the filename
      const filename = fullPath.split(/[\\/]/).pop(); // "level-1.png"

      // 2) strip the extension to get the key
      const key = filename.replace(/\.\w+$/, '');     // "level-1"

      // 3) now add the image with that key
      // compute exactly how big you want it
      const displayW = this.obj.width  * this.HOVER_RECTANGLE_SCALE_FACTOR;
      const displayH = this.obj.height * this.HOVER_RECTANGLE_SCALE_FACTOR;

      this.hoverImage = this.scene.add.image(this.x, this.y, key)
        .setOrigin(0.5)
        .setDepth(this.depth + 3)
        .setScrollFactor(1)
        .setDisplaySize(displayW, displayH);
        
    } 
    //b) TEXT
    else if (this.tileProps['text']) {
      this._displayPropertyText();
    }
  }

  _displayPropertyText(){
    const textValue = this.tileProps['text'];

    // a) create the text first to measure its size
    const txt = this.scene.add.text(
      this.x, this.y,
      textValue,
      {
        fontSize: '22px',
        color: '#ffffff',
        align: 'center'
      }
    )
    .setOrigin(0.5)
    .setScrollFactor(1);

    // b) compute a light‑brown background
    const bgW = this.obj.width * this.HOVER_RECTANGLE_SCALE_FACTOR;
    const bgH = this.obj.height * this.HOVER_RECTANGLE_SCALE_FACTOR;
    const bg = this.scene.add.rectangle(
      this.x, this.y,
      bgW, bgH,
      0xC8B889  // light‑brown
    )
    .setOrigin(0.5)
    .setDepth(this.depth + 3)
    .setScrollFactor(1);

    // c) bump the text above the brown rect
    txt.setDepth(bg.depth + 1);

    this.hoverRectBackground = bg;
    this.hoverRectText = txt;
  }


  //-------------- Projects Pages ---------------------------------------
  _clearDisplayRect() {
    [
      'hoverRect',
      'hoverImage',
      'hoverRectBackground',
      'hoverRectText',
      'projectBorder',
      'projectBackground',
      'projectCloseButton',
      'projectCloseButtonBackground',
      'projectInfoBorder',
      'projectInfoText',
      'previousArrow',
      'nextArrow',
      'currentImage',
      'projectImages'
    ].forEach(prop => {
      const obj = this[prop];
      if (obj != null) {
        if (Array.isArray(obj)) {
          obj.forEach(o => o.destroy && o.destroy());
        } else if (typeof obj.destroy === 'function') {
          obj.destroy();
        }
      }
      this[prop] = null;
    });

    this.currentImageIndex = 0;
  }

  _closeProject(){
    InteractableRect.isProjectOpen = false;
    this._clearDisplayRect();
  }

  _displayProjetInfo() {
    InteractableRect.isProjectOpen = true;

    const scene   = this.scene;
    const cam     = scene.cameras.main;
    const screenW = scene.scale.width;
    const screenH = scene.scale.height;

    // 80%×90% modal, centered
    const bgW = screenW * 0.8;
    const bgH = screenH * 0.9;
    const offsetX = (screenW - bgW) / 2;
    const offsetY = (screenH - bgH) / 2;

    // dynamic margins & proportions
    const margin = Math.min(bgW, bgH) * 0.02;
    const imgAreaPercentage = 0.8;   // 80% of modal width for image
    const infoAreaPercentage = 0.2;   // 20% of modal height for info
    const gap = bgH * 0.05; // 5% gap

    // 1) modal background
    this.projectBackground = scene.add.image(offsetX, offsetY, 'brick-background')
      .setOrigin(0, 0)
      .setDisplaySize(bgW, bgH)
      .setDepth(cam.depth - 1)
      .setScrollFactor(0);

    // 2) modal border
    this.projectBorder = scene.add.rectangle(offsetX, offsetY, bgW, bgH, 0, 0)
      .setStrokeStyle(4, 0x000000)
      .setOrigin(0, 0)
      .setDepth(cam.depth + 1)
      .setScrollFactor(0);

    // 3) close button top-right
    const closeX = offsetX + bgW - margin;
    const closeY = offsetY + margin;
    this.projectCloseButtonBackground = scene.add.rectangle(closeX, closeY, 0, 0, 0xc88889)
      .setOrigin(1, 0)
      .setStrokeStyle(2, 0x000000)
      .setDepth(cam.depth + 2)
      .setScrollFactor(0);

    this.projectCloseButton = scene.add.text(closeX, closeY, '✕', {
        fontSize: `${Math.round(bgH * 0.04)}px`,
        color:    '#000000'
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(cam.depth + 3)
      .setScrollFactor(0)
      .on('pointerdown', () => this._closeProject());

    this.projectCloseButtonBackground.setSize(
      this.projectCloseButton.width,
      this.projectCloseButton.height * 0.8
    );

    // 4) compute image box
    const imageAreaH = bgH * imgAreaPercentage - gap; // top 80% minus gap
    const imgX = offsetX + bgW / 2;
    const imgY = offsetY + gap + imageAreaH / 2;
    const imgW = bgW * imgAreaPercentage;
    const imgH = imageAreaH * imgAreaPercentage;
    const imgInfo    = { imgX, imgY, imgW, imgH };

    // harvest keys
    this.mediaProps = Object.entries(this.tileProps)
    .filter(([propKey, value]) => /\.(png|jpe?g|svg|gif|mp4)$/i.test(value))
    .map(([propKey]) => propKey);

    this.imageKeys = this.mediaProps.map(propKey => {
      const fn = this.tileProps[propKey].split(/[\\/]/).pop();
      return fn.replace(/\.\w+$/, '');
    });

    // ensure index
    if (this.currentImageIndex == null) {
      this.currentImageIndex = 0;
    }
    // initial draw
    this._drawMediaAt(imgInfo, this.currentImageIndex);

    // 5) arrows aligned to image center
    const arrowW = bgW * 0.1;
    const arrowH = bgH * 0.1;

    // compute a 5% offset of the image width
    const arrowOffset = imgInfo.imgW * 0.065;

    const imageCenterY = imgY;
    const arrowLeftX  = imgInfo.imgX - (imgInfo.imgW / 2) - arrowOffset;
    const arrowRightX = imgInfo.imgX + (imgInfo.imgW / 2) + arrowOffset;

    this.previousArrow = scene.add.image(arrowLeftX, imageCenterY, 'left-arrow')
      .setOrigin(0.5)
      .setDisplaySize(arrowW, arrowH)
      .setInteractive({ useHandCursor: true })
      .setDepth(cam.depth + 5)
      .setScrollFactor(0)
      .on('pointerdown', () => this._drawPreviousImage(imgInfo))
      .on('pointerover', () => {
        this.previousArrow.setScale(1.2);
      })
      .on('pointerout', () => {
        this.previousArrow.setScale(0.8);
      });


    this.nextArrow = scene.add.image(arrowRightX, imageCenterY, 'right-arrow')
      .setOrigin(0.5)
      .setDisplaySize(arrowW, arrowH)
      .setInteractive({ useHandCursor: true })
      .setDepth(cam.depth + 5)
      .setScrollFactor(0)
      .on('pointerdown', () => this._drawNextImage(imgInfo))
      .on('pointerover', () => {
      this.nextArrow.setScale(1.2);
      })
      .on('pointerout', () => {
        this.nextArrow.setScale(0.8);
      });

    // 6) info area at bottom 20%
    const infoH = bgH * infoAreaPercentage - gap;
    const infoY = offsetY + gap + imageAreaH + infoH/2;
    const infoW = bgW * 0.8;

    this.projectInfoBorder = scene.add.rectangle(
      offsetX + bgW/2, infoY, infoW, infoH, 0, 0
    )
      .setStrokeStyle(2, 0x000000)
      .setOrigin(0.5)
      .setDepth(cam.depth + 2)
      .setScrollFactor(0);

    this.projectInfoText = scene.add.text(
      offsetX + bgW/2, infoY,
      this.tileProps['Info'] || '',
      {
        fontSize: `${Math.round(bgH * 0.025)}px`,
        color:    '#000000',
        align:    'center',
        wordWrap:{ width: infoW - margin * 2 }
      }
    )
      .setOrigin(0.5)
      .setDepth(cam.depth + 3)
      .setScrollFactor(0);
  }

  _drawMediaAt(imgInfo, keyIndex) {
    const scene = this.scene;
    const cam   = scene.cameras.main;
    const propKey = this.mediaProps[keyIndex];
    const fullPath = this.tileProps[propKey];        // e.g. "myMovie.mov"
    const filename = fullPath.split(/[\\/]/).pop();  // "myMovie.mov"
    const key = filename.replace(/\.\w+$/, '');
    const url = 'assets/' + fullPath;  

    // destroy old
    if (this.currentImage) this.currentImage.destroy();

     if (/\.(mp4)$/i.test(fullPath)) {
      console.log('Playing video:', url);

      //This is necessary because of the 'realWidth' = null bug.
      //if i don't use a placeholder, phaser will not display the video for some reason
      const placeHolder = this.scene.add.image(imgInfo.imgX, imgInfo.imgY, 'brick-background')
      .setVisible(false);

      // 1) Create WITHOUT a key, at (x,y)
      const video = scene.add.video(
        imgInfo.imgX,
        imgInfo.imgY,
        key
      )
      .setOrigin(0.5)
      .setDepth(cam.depth + 4)
      .setScrollFactor(0)
      .setTexture(placeHolder)
      .setDisplaySize(imgInfo.imgW * 0.016 , imgInfo.imgH * 0.03);

      video.play(true);

      this.currentImage = video;
    }

    else {
      // image path…
      this.currentImage = scene.add.image(
        imgInfo.imgX,
        imgInfo.imgY,
        key
      )
      .setOrigin(0.5)
      .setDepth(cam.depth + 4)
      .setScrollFactor(0)
      .setDisplaySize(imgInfo.imgW, imgInfo.imgH);
    }
  }


  _drawNextImage(imgInfo) {
    if (this.currentImageIndex < this.imageKeys.length - 1) {
      this.currentImageIndex++;
      this._drawMediaAt(imgInfo, this.currentImageIndex);
    }
  }

  _drawPreviousImage(imgInfo) {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this._drawMediaAt(imgInfo, this.currentImageIndex);
    }
  }

  checkInteraction() {
    const p = this.scene.player;
    const px = p.x, py = p.y + p.displayHeight/2;
    const zx = this.body.center.x, zy = this.body.center.y;
    return Phaser.Math.Distance.Between(px,py,zx,zy) <
           Math.max(this.body.width,this.body.height);
  }

  drawShortestPath() {
    const currentScene = this.scene;
    const playerSprite = currentScene.player;
    const playerX = playerSprite.x;
    const playerY = playerSprite.y + playerSprite.displayHeight / 2;
    const targetX = this.body.center.x;
    const targetY = this.body.center.y;

    // Compute distance and angle
    const totalDistance      = Phaser.Math.Distance.Between(playerX, playerY, targetX, targetY);
    const angleBetweenPoints = Phaser.Math.Angle.Between(playerX, playerY, targetX, targetY);

    // 1) If there's an existing path graphic, destroy it
    if (this.shortestPath) {
      this.shortestPath.destroy();
      this.shortestPath = null;
    }

    // 2) Create a new Graphics object and store it
    this.shortestPath = currentScene.add.graphics()
      .setDepth(this.depth + 1)
      .fillStyle(0xffffff, 1);

    // 3) Dimensions for the little rectangles
    const rectangleSpacing = 16;
    const rectangleWidth   = currentScene.scale.width  * 0.005;
    const rectangleHeight  = currentScene.scale.height * 0.005;

    // 4) Draw the dotted line as a series of small rotated rectangles
    for (let d = 0; d <= totalDistance; d += rectangleSpacing) {
      const drawX = playerX + Math.cos(angleBetweenPoints) * d;
      const drawY = playerY + Math.sin(angleBetweenPoints) * d;

      this.shortestPath.save();
      this.shortestPath.translateCanvas(drawX, drawY);
      this.shortestPath.rotateCanvas(angleBetweenPoints);
      this.shortestPath.fillRect(
        -rectangleWidth  / 2,
        -rectangleHeight / 2,
        rectangleWidth,
        rectangleHeight
      );
      this.shortestPath.restore();
    }

    // 5) Automatically clear it after 1s
    currentScene.time.delayedCall(1000, () => {
      if (this.shortestPath) {
        this.shortestPath.destroy();
        this.shortestPath = null;
      }
    });
  }

  warnFarInteraction() {
    const scene = this.scene;
    const player = scene.player;
    const playerX = player.x;
    const playerYTop = player.y - player.displayHeight / 2;

    // 1) clear any existing bubble/text/circles
    if (this.thoughtBubble) {
      this.thoughtBubble.destroy();
      this.thoughtText.destroy();
      this.thoughtCircles.forEach(c => c.destroy());
    }
    this.thoughtBubble = null;
    this.thoughtText   = null;
    this.thoughtCircles = [];

    // dynamic sizing
    const h = scene.scale.height;
    const w = scene.scale.width;

    // 2) “thinking” dots
    const radii        = [0.004, 0.007, 0.01].map(f => Math.round(f * h));
    const verticalOffs = [0.005, 0.015, 0.03].map(f => f * h);

    this.thoughtCircles = radii.map((radius, i) => {
      return scene.add.circle(
        playerX,
        playerYTop - verticalOffs[i],
        radius,
        0xffffff
      )
      .setDepth(this.depth + 1)
      .setStrokeStyle(Math.max(1, Math.round(0.002 * w)), 0x000000)
      .setScrollFactor(1);
    });

    // 3) prepare text
    const fontSizePx = Math.round(0.015 * h);
    const message    = `Too far from: ${this.name}`;
    const text = scene.add.text(0, 0, message, {
      fontSize: `${fontSizePx}px`,
      color:    '#000000',
      align:    'center',
      wordWrap: { width: w * 0.25 }
    })
    .setDepth(this.depth + 2)
    .setScrollFactor(1);

    // 4) compute bubble dimensions and draw it
    const padding = Math.round(0.01 * w);
    const bubbleW = text.width  + padding * 2;
    const bubbleH = text.height + padding * 2;
    const topDotY = playerYTop - verticalOffs[verticalOffs.length - 1];
    const bubbleX = playerX;
    const bubbleY = topDotY - bubbleH / 2 - (0.01 * h);
    const cornerR = Math.round(0.1 * Math.min(bubbleW, bubbleH));

    const bubbleGraphics = scene.add.graphics()
      .setDepth(this.depth + 1)
      .setScrollFactor(1)
      .fillStyle(0xffffff, 1);

    bubbleGraphics.fillRoundedRect(
      bubbleX - bubbleW/2,
      bubbleY - bubbleH/2,
      bubbleW,
      bubbleH,
      cornerR
    );
    bubbleGraphics.lineStyle(Math.max(1, Math.round(0.002 * w)), 0x000000, 1);
    bubbleGraphics.strokeRoundedRect(
      bubbleX - bubbleW/2,
      bubbleY - bubbleH/2,
      bubbleW,
      bubbleH,
      cornerR
    );

    // position the text
    text.setPosition(
      bubbleX - text.width / 2,
      bubbleY - text.height / 2
    );

    // 5) save refs
    this.thoughtBubble = bubbleGraphics;
    this.thoughtText   = text;

    // 6) auto‐clear after 1.5s
    scene.time.delayedCall(1500, () => {
      if (this.thoughtBubble) {
        this.thoughtBubble.destroy();
        this.thoughtText.destroy();
        this.thoughtCircles.forEach(c => c.destroy());
        this.thoughtBubble = null;
        this.thoughtText   = null;
        this.thoughtCircles = [];
      }
    });
  }




  interact(click=false) {
    if(InteractableRect.isProjectOpen){
      return;
    }

    if (!this.checkInteraction()) {
      if(click){
        this.warnFarInteraction();
        this.drawShortestPath();
        return;
      }
      else{
        this._warnClosestRect();
        return;
      }
      
      
    }

    //From the 'Game' scene, open the 'ricardosLore' scene
    else if (this.name === 'ricardosLore') {
      //NB: Hardcoded
      const currentKey = 'Game';
      this.scene.scene.launch('ricardosLore',{previousScene: currentKey});
    }

    //TODO: Click on displayed rect
    else if(this.name === 'Exit'){
      // stop this entire scene
      this.scene.scene.stop(); 
      // resume the previous scene key that the scene stored
      // HERE I HARDCODED IT: It will skip ricardosLore
      this.scene.scene.resume('Game');
    }

    else if(this.name.startsWith('Project') && !this.tileProps['text']){
      this._displayProjetInfo();
    }
  }

  update() {
  
  }
}
