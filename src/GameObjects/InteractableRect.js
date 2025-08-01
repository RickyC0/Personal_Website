export class InteractableRect extends Phaser.GameObjects.Rectangle {
  constructor(scene, obj, x, y,previousScene) {
    // compute world‐coords
    x = x == null ? obj.x + obj.width/2 : x;
    y = y == null ? obj.y + obj.height/2 : y;

    super(scene, x, y, obj.width, obj.height, 0x000000, 0);
    this.obj    = obj;
    this.scene  = scene;
    this.name   = obj.name || 'InteractableRect';

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setInteractive({ useHandCursor: true });

    // hover highlight
    const PADDING = 8;
    this.hoverHighlight = scene.add.rectangle(
      x, y,
      obj.width  + PADDING*2,
      obj.height + PADDING*2,
      0xffff00, 0.3
    )
    .setVisible(false)
    .setDepth(this.depth+1)
    .setScrollFactor(1);

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

    // state flags
    globalThis.isProjectOpen = false;

    //Rectangle properties
    this.HOVER_RECTANGLE_SCALE_FACTOR = 5;

    // pointer events
    this.on('pointerover',  this._onPointerOver);
    this.on('pointerout',   this._onPointerOut);
    this.on('pointerdown',  () => this.interact());

    // subscribe to the scene’s update
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off('update', this.update, this);
    });

    scene.events.on('update', this.update, this);
  }

   _onPointerOver() {
    // if a project is open, don’t show any hover
    if (globalThis.isProjectOpen) {
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
    if (globalThis.isProjectOpen) {
      return;
    }

    this.hoverHighlight.setVisible(false);
    this._clearDisplayRect();
  }

  _displayHoverRect() {
    if (this.hoverRect) return; // already shown
    if(globalThis.isProjectOpen) return;

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
    // 1) Hover graphics
    ['hoverRect', 'hoverImage', 'hoverRectBackground', 'hoverRectText']
      .forEach(prop => {
        if (this[prop]) {
          this[prop].destroy();
          this[prop] = null;
        }
      });

    // 2) Project images
    if (this.projectImages) {
      this.projectImages.forEach(img => img.destroy());
    }
    this.projectImages = [];

    // 3) Project graphics
    ['projectBorder',
    'projectBackground',
    'projectCloseButton',
    'projectCloseButtonBackground',
    'projectInfoBorder',
    'projectInfoText',
    'previousArrow',
    'nextArrow']
      .forEach(prop => {
        if (this[prop]) {
          this[prop].destroy();
          this[prop] = null;
        }
      });
  }

  _closeProject(){
    globalThis.isProjectOpen = false;
    this._clearDisplayRect();
  }

  _displayProjetInfo() {
    globalThis.isProjectOpen = true;

    const scene   = this.scene;
    const cam     = scene.cameras.main;
    const screenW = scene.scale.width;
    const screenH = scene.scale.height;

    // 80%×90% modal
    const bgW = screenW * 0.8;
    const bgH = screenH * 0.9;
    // centered on screen
    const offsetX = (screenW - bgW) / 2;
    const offsetY = (screenH - bgH) / 2;

    // dynamic margins
    const margin   = Math.min(bgW, bgH) * 0.02;
    const imagePct = 0.8;  // 80% of height for image
    const infoPct  = 0.2;  // 20% for info
    const gap      = bgH * 0.05; // 5% gap

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

    // 3) close button in top‐right
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

    // size its background
    this.projectCloseButtonBackground.setSize(
      this.projectCloseButton.width,
      this.projectCloseButton.height * 0.8
    );

    // 4) image area (top 70% of modal minus gap)
    const imageAreaH = bgH * imagePct - gap;
    const imageY     = offsetY + gap + imageAreaH / 2;
    this.projectImages = [];
    Object.keys(this.tileProps)
      .filter(k => /^img\s*\d+$/i.test(k))
      .forEach(propKey => {
        const fn  = this.tileProps[propKey].split(/[\\/]/).pop();
        const key = fn.replace(/\.\w+$/, '');
        const img = scene.add.image(offsetX + bgW/2, imageY, key)
          .setOrigin(0.5)
          .setDepth(cam.depth + 4)
          .setScrollFactor(0)
          .setDisplaySize(bgW * 0.8, imageAreaH * 0.9);
        this.projectImages.push(img);
      });

    // 4.5) arrows at 5% and 95% of modal width, vertically aligned to the image
    const arrowSizeW = bgW * 0.1;
    const arrowSizeH = bgH * 0.1;
    const imageCenterY = offsetY + (bgH * imagePct / 2) + gap; // same as imageY

    this.previousArrow = scene.add.image(
      offsetX + bgW * 0.05,   // 5% in from left
      imageCenterY,
      'left-arrow'
    )
    .setOrigin(0.5)
    .setDepth(cam.depth + 5)
    .setScrollFactor(0)
    .setDisplaySize(arrowSizeW, arrowSizeH);

    this.nextArrow = scene.add.image(
      offsetX + bgW * 0.95,   // 5% in from right
      imageCenterY,
      'right-arrow'
    )
    .setOrigin(0.5)
    .setDepth(cam.depth + 5)
    .setScrollFactor(0)
    .setDisplaySize(arrowSizeW, arrowSizeH);

    // 5) info area (next 20% of modal minus gap)
    const infoH = bgH * infoPct - gap;
    const infoY = offsetY + gap + imageAreaH + infoH/2;
    const infoW = bgW * 0.8;

    // border for info
    this.projectInfoBorder = scene.add.rectangle(
      offsetX + bgW/2, infoY, infoW, infoH, 0, 0
    )
      .setStrokeStyle(2, 0x000000)
      .setOrigin(0.5)
      .setDepth(cam.depth + 2)
      .setScrollFactor(0);

    // text inside
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


  checkInteraction() {
    const p = this.scene.player;
    const px = p.x, py = p.y + p.displayHeight/2;
    const zx = this.body.center.x, zy = this.body.center.y;
    return Phaser.Math.Distance.Between(px,py,zx,zy) <
           Math.max(this.body.width,this.body.height);
  }

  interact() {
    if (!this.checkInteraction()) {
      console.warn('Too far from:', this.name);
      return;
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

    else if(this.name.startsWith('Project')){
      this._displayProjetInfo();
    }
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.scene.interactKey)) {
      this.interact();
    }
  }
}
