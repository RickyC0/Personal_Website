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
      InteractableRect.currentProjectRect = null;
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
        if (this.scene && this.scene.scale && this._onResizeHandler) {
          this.scene.scale.off('resize', this._onResizeHandler);
          this._onResizeHandler = null;
        }

        InteractableRect.instances = InteractableRect.instances.filter(
          inst => inst.scene !== this.scene
        );

      });

      this._onResizeHandler = this._onResize.bind(this);

      // listen for real Phaser resize events on this scene:
      this.scene.scale.on('resize', this._onResizeHandler);
    }

    preload() { 
      this.load.scenePlugin({
          key: 'rexuiplugin',
          url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
          sceneKey: 'rexUI'
      });      
    }

    // This is called when the scene is resized
    // e.g. when the browser window is resized
    _onResize () {
      // redraw hover highlight for this rect
      if (this.hoverHighlight) {
        this.hoverHighlight.destroy();
      }

      // if the project modal is currently open, clear & redisplay it
      // **only** the rect that actually opened the modal should clear/redraw
      if (InteractableRect.isProjectOpen && InteractableRect.currentProjectRect === this) {
        this._clearDisplayRect();
        this._displayProjectInfo();
      }
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
        'projectInfoTextMask',
        'previousArrow',
        'nextArrow',
        'currentImage',
        'projectImages',
        'projectInfoScrollTrack',
        'projectInfoScrollThumb',
        'projectScrimEffect'
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
      InteractableRect.currentProjectRect = null;
      this._clearDisplayRect();
    }

    // Responsive modal: portrait = stacked; landscape = side-by-side
    // --- Responsive modal: portrait (stacked) vs landscape (side-by-side) ---
    _displayProjectInfo() {
      InteractableRect.isProjectOpen = true;

      const scene = this.scene;
      const sceneWidth = scene.scale.width;
      const sceneHeight = scene.scale.height;
      const isPortraitOrientation = sceneHeight > sceneWidth;

      // UI container
      if (this.modal) this.modal.destroy();
      this.modal = scene.add.container(0, 0).setScrollFactor(0).setDepth(10000);
      const addToModal = (go) => { this.modal.add(go); return go; };

      // Scrim
      this.projectScrimEffect = addToModal(
        scene.add.rectangle(0, 0, sceneWidth, sceneHeight, 0x000000, 0.45)
          .setOrigin(0)
          .setScrollFactor(0)
          .setInteractive()
      );

      // Modal geometry
      const modalWidth  = (isPortraitOrientation ? 0.92 : 0.90) * sceneWidth;
      const modalHeight = (isPortraitOrientation ? 0.88 : 0.84) * sceneHeight;
      const modalLeft   = (sceneWidth  - modalWidth)  / 2;
      const modalTop    = (sceneHeight - modalHeight) / 2;

      const borderThickness = Math.max((Math.min(sceneWidth, sceneHeight) * 0.002), 0.5);
      const modalPadding    = Math.min(modalWidth, modalHeight) * 0.03;

      // Background & border (names preserved)
      this.projectBackground = addToModal(
        scene.add.image(modalLeft, modalTop, 'brick-background')
          .setOrigin(0)
          .setDisplaySize(modalWidth, modalHeight)
          .setScrollFactor(0)
      );

      this.projectBorder = addToModal(
        scene.add.rectangle(modalLeft, modalTop, modalWidth, modalHeight, 0, 0)
          .setOrigin(0)
          .setScrollFactor(0)
          .setStrokeStyle(borderThickness, 0x000000)
      );

      // Close button (names preserved)
      const closeFontPx  = Math.round(modalHeight * 0.05);
      const closeBtnX    = modalLeft + modalWidth - modalPadding;
      const closeBtnY    = modalTop  + modalPadding;

      this.projectCloseButtonBackground = addToModal(
        scene.add.rectangle(closeBtnX, closeBtnY, 0, 0, 0xc88889)
          .setOrigin(1, 0)
          .setScrollFactor(0)
      );

      this.projectCloseButton = addToModal(
        scene.add.text(closeBtnX, closeBtnY, '✕', {
          fontSize: `${closeFontPx}px`,
          color: '#000000'
        })
        .setOrigin(1, 0)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this._closeProject())
      );

      this.projectCloseButtonBackground.setSize(
        this.projectCloseButton.width,
        this.projectCloseButton.height * 0.8
      );

      // Inner content area
      const innerWidth  = modalWidth  - modalPadding * 2;
      const innerHeight = modalHeight - modalPadding * 2;

      // Arrow metrics (use these later; defined once)
      const navArrowSize  = Math.min(modalWidth, modalHeight) * 0.08;
      const navArrowInset = innerWidth * 0.02;  // relative offset from image edge
      const arrowGutter   = navArrowSize / 2 + navArrowInset; // reserved lane for arrows

      // Compute media + info frames (keeps layout logic)
      let mediaFrame, infoFrame;
      if (isPortraitOrientation) {
        const verticalGap         = modalHeight * 0.05;
        const imageHeight         = modalHeight * 0.55;
        const imageWidth          = modalWidth  * 0.85;
        const imageCenterX        = modalLeft + modalWidth / 2;
        const imageCenterY        = modalTop  + modalPadding * 2 + imageHeight / 2;

        mediaFrame = { imgX: imageCenterX, imgY: imageCenterY, imgW: imageWidth, imgH: imageHeight };

        const infoHeight          = modalHeight - imageHeight - verticalGap - modalPadding * 2;
        const infoWidth           = imageWidth;
        const infoLeft            = modalLeft + (modalWidth - infoWidth) / 2;
        const infoTop             = modalTop + modalPadding + imageHeight + verticalGap;

        infoFrame = { x: infoLeft, y: infoTop, w: infoWidth, h: infoHeight };

      } 
      else {
        const horizontalGap   = modalWidth * 0.04;

        // Reserve a gutter (arrow lane) on the left *and* right of the image
        // Available width for [image + gap + info] after keeping arrow gutters inside the modal padding
        const availableRow = innerWidth - (arrowGutter * 2) - horizontalGap;

        // Pick a comfortable image width within that row, leaving room for the right arrow + info
        const imageWidth   = Math.min(availableRow * 0.60, modalWidth * 0.58);
        const imageHeight  = Math.min(modalHeight * 0.90, innerHeight * 0.90);

        // Position image so the left arrow fits fully between padding and image
        const imageLeft    = modalLeft + modalPadding + arrowGutter;
        const imageCenterX = imageLeft + imageWidth / 2;
        const imageCenterY = modalTop + modalHeight / 2;

        mediaFrame = { imgX: imageCenterX, imgY: imageCenterY, imgW: imageWidth, imgH: imageHeight };

        // Info sits to the right; we already reserved (arrowGutter) before it
        const infoWidth = availableRow - imageWidth;   // the rest of the lane
        const infoLeft  = imageLeft + imageWidth + horizontalGap;
        const infoTop   = modalTop + (modalHeight - imageHeight) / 2; // vertically match image
        const infoHeight = imageHeight;

        infoFrame = { x: infoLeft, y: infoTop, w: infoWidth, h: infoHeight };
      }

      const navArrowCenterY = mediaFrame.imgY;

      // Media keys & initial media
      this.mediaProps = Object.entries(this.tileProps)
        .filter(([, value]) => /\.(png|jpe?g|svg|gif|mp4)$/i.test(value))
        .map(([prop]) => prop);

      this.imageKeys = this.mediaProps.map(prop =>
        this.tileProps[prop].split(/[\\/]/).pop().replace(/\.\w+$/, '')
      );

      this.currentImageIndex = 0;

      this._drawMediaAt(mediaFrame, this.currentImageIndex);

      // Ensure media is inside the modal container (so arrows added after are on top)
      if (this.currentImage && this.currentImage.parentContainer !== this.modal) {
        addToModal(this.currentImage);
      }

      // Background inner bounds (respect modal padding and arrow size)
      const innerLeftBound   = modalLeft + modalPadding + navArrowSize / 2;
      const innerRightBound  = modalLeft + modalWidth - modalPadding - navArrowSize / 2;
      const innerTopBound    = modalTop + modalPadding + navArrowSize / 2;
      const innerBottomBound = modalTop + modalHeight - modalPadding - navArrowSize / 2;

      // Desired arrow positions (from original logic)
      const desiredLeftX  = mediaFrame.imgX - (mediaFrame.imgW / 2) - navArrowInset;
      const desiredRightX = mediaFrame.imgX + (mediaFrame.imgW / 2) + navArrowInset;

      // Clamp into the background box
      const leftX  = Phaser.Math.Clamp(desiredLeftX,  innerLeftBound, innerRightBound);
      const rightX = Phaser.Math.Clamp(desiredRightX, innerLeftBound, innerRightBound);
      const arrowY = Phaser.Math.Clamp(navArrowCenterY, innerTopBound, innerBottomBound);

      this.previousArrow = addToModal(
        scene.add.image(leftX, arrowY, 'left-arrow')
          .setOrigin(0.5)
          .setDisplaySize(navArrowSize, navArrowSize)
          .setScrollFactor(0)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this._drawPreviousImage(mediaFrame))
          .on('pointerover', () => this.previousArrow.setDisplaySize(navArrowSize * 1.5, navArrowSize * 1.5))
          .on('pointerout', () => this.previousArrow.setDisplaySize(navArrowSize, navArrowSize))
      );

      this.nextArrow = addToModal(
        scene.add.image(rightX, arrowY, 'right-arrow')
          .setOrigin(0.5)
          .setDisplaySize(navArrowSize, navArrowSize)
          .setScrollFactor(0)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this._drawNextImage(mediaFrame))
          .on('pointerover', () => this.nextArrow.setDisplaySize(navArrowSize * 1.5, navArrowSize * 1.5))
          .on('pointerout', () => this.nextArrow.setDisplaySize(navArrowSize, navArrowSize)),
      );

      // Scrollable text (names preserved)
      this._createScrollableText_intoContainer(
        this.modal,
        infoFrame.x, infoFrame.y, infoFrame.w, infoFrame.h,
        this.tileProps['Info'] || 'No description available.',
        modalPadding
      );

      // Keep close button above everything
      this.modal.bringToTop(this.previousArrow);
      this.modal.bringToTop(this.nextArrow);
      this.modal.bringToTop(this.projectCloseButtonBackground);
      this.modal.bringToTop(this.projectCloseButton);
    }




    /**
     * Builds a Phaser.Text inside a Container,
     * masks it to (x,w,h), and wires up wheel + drag scrolling.
     */
    _createScrollableText_intoContainer(container, x, y, w, h, textValue, margin) {
      const scene = this.scene;
      const SCROLL_SPEED = 0.3;

      const bg = scene.add.rectangle(x, y, w, h, 0x000000, 0.85)
        .setOrigin(0, 0).setScrollFactor(0).setInteractive();
      const infoText = scene.add.text(x + margin, y + margin, textValue, {
          fontSize: `${Math.min(h*0.08,w*0.08)}px`,
          color: '#ffffff',
          wordWrap: { width: w - margin * 2 }
        }).setOrigin(0, 0).setScrollFactor(0);

      const mask = bg.createGeometryMask();
      infoText.setMask(mask);

      const viewH     = h - margin * 2;
      const contentH  = infoText.height;
      const maxScroll = Math.max(0, contentH - viewH);
      let scrollY     = 0;

      const barWidth = Math.max(4, margin * 0.5);
      const barX     = x + w - margin - barWidth;
      const track = scene.add.rectangle(barX, y + margin, barWidth, viewH, 0xffffff, 0.2)
        .setOrigin(0, 0).setScrollFactor(0);
      const thumbH0 = contentH > 0 ? Phaser.Math.Clamp(viewH * (viewH / contentH), 20, viewH) : viewH;
      const thumb = scene.add.rectangle(barX, y + margin, barWidth, thumbH0, 0xffffff, 0.6)
        .setOrigin(0, 0).setScrollFactor(0).setInteractive({ draggable: true });

      const updateThumb = () => {
        const range = viewH - thumb.height;
        const t     = maxScroll > 0 ? scrollY / maxScroll : 0;
        thumb.y     = y + margin + t * range;
      };

      bg.on('wheel', p => {
        scrollY = Phaser.Math.Clamp(scrollY + p.deltaY * SCROLL_SPEED, 0, maxScroll);
        infoText.y = y + margin - scrollY; updateThumb();
      });
      bg.on('pointerdown', p => {
        this._dragging = true; this._startY = p.y; this._startScroll = scrollY;
      });
      bg.on('pointerup',   () => this._dragging = false);
      bg.on('pointerout',  () => this._dragging = false);
      bg.on('pointermove', p => {
        if (!this._dragging) return;
        const dy = p.y - this._startY;
        scrollY = Phaser.Math.Clamp(this._startScroll - dy, 0, maxScroll);
        infoText.y = y + margin - scrollY; updateThumb();
      });
      thumb.on('drag', (pointer, dragX, dragY) => {
        const localY = Phaser.Math.Clamp(dragY - (y + margin), 0, viewH - thumb.height);
        const t = (viewH - thumb.height) > 0 ? localY / (viewH - thumb.height) : 0;
        scrollY = t * maxScroll; infoText.y = y + margin - scrollY; updateThumb();
      });

      container.add([bg, infoText, track, thumb]);
      this.projectInfoText        = infoText;
      this.projectInfoTextMask    = bg;
      this.projectInfoScrollTrack = track;
      this.projectInfoScrollThumb = thumb;
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
      if (!this.imageKeys || this.imageKeys.length <= 1) return;
      if (this.currentImageIndex >= this.imageKeys.length - 1) return;

      this.currentImageIndex++;
      this._drawMediaAt(imgInfo, this.currentImageIndex);

      // ensure media is in modal & arrows are above
      if (this.currentImage && this.modal && this.currentImage.parentContainer !== this.modal) {
        this.modal.add(this.currentImage);
      }
      this.modal.bringToTop(this.previousArrow);
      this.modal.bringToTop(this.nextArrow);
      this.modal.bringToTop(this.projectCloseButtonBackground);
      this.modal.bringToTop(this.projectCloseButton);
    }

    _drawPreviousImage(imgInfo) {
      if (!this.imageKeys || this.imageKeys.length <= 1) return;
      if (this.currentImageIndex <= 0) return;

      this.currentImageIndex--;
      this._drawMediaAt(imgInfo, this.currentImageIndex);

      // ensure media is in modal & arrows are above
      if (this.currentImage && this.modal && this.currentImage.parentContainer !== this.modal) {
        this.modal.add(this.currentImage);
      }
      this.modal.bringToTop(this.previousArrow);
      this.modal.bringToTop(this.nextArrow);
      this.modal.bringToTop(this.projectCloseButtonBackground);
      this.modal.bringToTop(this.projectCloseButton);
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

      else if (this.name.startsWith('Project') && !this.tileProps['text']) {
        InteractableRect.isProjectOpen = true;
        InteractableRect.currentProjectRect = this;       // remember me
        this._displayProjectInfo();
      }
    }

    update() {
    
    }
  }
