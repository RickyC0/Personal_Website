export class InteractableRect extends Phaser.GameObjects.Rectangle {
  constructor(scene, obj, x, y) {
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

    // these will hold the border & images
    this.displayedRectBackground = null;
    this.displayedRectText = null;
    this.displayedRect = null;
    this.displayedImgs = [];

    //Rectangle properties
    this.RECTANGLE_SCALE_FACTOR = 5;

    // pointer events
    this.on('pointerover',  this._checkHoverIn,  this);
    this.on('pointerout',   this._checkHoverOut, this);
    this.on('pointerdown',  () => this.interact());

    scene.events.on('update', this.update, this);
  }

  _checkHoverIn() {
    if (this.tileProps['display-rect']) {
      this._displayHoverRect();
    } else {
      this.hoverHighlight.setVisible(true);
    }
  }

  _checkHoverOut() {
    this.hoverHighlight.setVisible(false);
    this._clearDisplayRect();
  }

  _displayHoverRect() {
    if (this.displayedRect) return; // already shown

    // 1) draw the rectangle border
    this.displayedRect = this.scene.add.rectangle(
      this.x, this.y,
      this.obj.width * this.RECTANGLE_SCALE_FACTOR, this.obj.height * this.RECTANGLE_SCALE_FACTOR
    )
    .setStrokeStyle(2, 0xffffff)
    .setDepth(this.depth + 2)
    .setScrollFactor(1);

    //The rectangle will either contain:
    //a) AN IMAGE
    if (this.tileProps['img 1']) {
      //TODO: CLEAN UP THE WAY WE PRELOAD IMAGES
      const fullPath = this.tileProps['img 1']; 
      // "C:/…/level-1.png"

      // 1) grab only the filename
      const filename = fullPath.split(/[\\/]/).pop(); // "level-1.png"

      // 2) strip the extension to get the key
      const key = filename.replace(/\.\w+$/, '');     // "level-1"

      // 3) now add the image with that key
      // compute exactly how big you want it
      const displayW = this.obj.width  * this.RECTANGLE_SCALE_FACTOR;
      const displayH = this.obj.height * this.RECTANGLE_SCALE_FACTOR;

      const img = this.scene.add.image(this.x, this.y, key)
        .setOrigin(0.5)
        .setDepth(this.depth + 3)
        .setScrollFactor(1)
        .setDisplaySize(displayW, displayH);
        
      this.displayedImgs.push(img);
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
    const bgW = this.obj.width * this.RECTANGLE_SCALE_FACTOR;
    const bgH = this.obj.height * this.RECTANGLE_SCALE_FACTOR;
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

    this.displayedRectBackground = bg;
    this.displayedRectText = txt;
  }

  _clearDisplayRect() {
    if (this.displayedRect) {
      this.displayedRect.destroy();
      this.displayedRect = null;

      this.displayedRectText.destroy();
      this.displayedRectText = null;

      this.displayedRectBackground.destroy();
      this.displayedRectBackground = null;
    }
    this.displayedImgs.forEach(img => img.destroy());
    this.displayedImgs.length = 0;
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
    if (this.name === 'ricardosLore') {
      this.scene.scene.launch('ricardosLore');
    }
    //TODO: Click on displayed rect
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.scene.interactKey)) {
      this.interact();
    }
  }
}
