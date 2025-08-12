export class ricardosLore extends Phaser.Scene {
  constructor() {
    super({ key: 'ricardosLore' });
    this.backgroundColor = 0xc8b889;
    this.title = "Ricardo's Lore";
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

  create() {
    // 1) background
    this.background = this.add.image(0, 0, 'brick-background')
      .setOrigin(0)
      .setDepth(this.cameras.main.depth - 1)
      .setDisplaySize(this.cameras.main.width, this.cameras.main.height);

    
    // 2) close button
    this.closeButton = this.add.text(0, 0, '✕', { color: '#000000' })
      .setInteractive({ useHandCursor: true })
      .setDepth(2)
      .on('pointerdown', () => this.scene.stop('ricardosLore'));

    this.closeButtonBackground = this.add.rectangle(0, 0, 0, 0, 0xc88889)
      .setOrigin(1, 0)
      .setDepth(this.closeButton.depth - 1);

    this.screenW  = this.scale.width;
    this.screenH  = this.scale.height;
    // 3) setup icon definitions

    this.icons = [
      {
        key: 'cv-sprite',
        label: 'CV',
        callback: () => window.open(
          '../../assets/professional-files/Ricardo\'s CV-Computer Science-Summer 2025.pdf',
          '_blank')
      },
      {
        key: 'projects-sprite',
        label: 'Projects',
        callback: () => {
          
          const currentKey = this.sys.settings.key; // "Game"
          this.scene.pause('Game');
          this.scene.stop();  // stops ricardosLore itself
          this.scene.start('RicardosProjects', { previousScene: currentKey });
          
        }

      },
      {
        key: 'education-sprite',
        label: 'Education',
        
        callback: () => window.open('https://www.linkedin.com/in/ricardorajichahine/')
      }
    ];

    // 4) create Phaser objects arrays
    this.iconImages = [];
    this.iconLabels = [];

    this.icons.forEach((data, idx) => {
        const img = this.add.image(0, 0, data.key)
          .setInteractive({ useHandCursor: true })
          .setDepth(this.background.depth + 1)
          .on('pointerdown', data.callback);

          // Title for each icon
        const txt = this.add.text(0, 0, data.label, {
          fontSize: `${Math.min(this.screenW*0.08,this.screenH*0.08)}px`, color: '#000000', align: 'center'
        }).setDepth(this.background.depth + 1).setOrigin(0.5, 0);

        this.iconImages.push(img);
        this.iconLabels.push(txt);
      });

    // 5) perform initial layout
    this.updateLayout();

    // 6) listen for resize
    this.resizeHandler = () => this.updateLayout();
    this.scale.on('resize', this.resizeHandler);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.resizeHandler);
    });
  }

  // This function deals with the styling and resizing of the scene
  updateLayout() {
  // live canvas size
  const screenW  = this.scale.width;
  const screenH  = this.scale.height;
  const isPortrait = screenH > screenW;

  // reference frame from the visible map (not raw screen)
  let refW = screenW, refH = screenH;
  const prev = this.scene.get?.(this.previousScene);
  if (prev) {
    const mapW  = prev.map?.widthInPixels  ?? screenW;
    const mapH  = prev.map?.heightInPixels ?? screenH;
    const zoom  = prev.cameras?.main?.zoom ?? 1;
    refW = Math.min(screenW,  mapW * zoom);
    refH = Math.min(screenH,  mapH * zoom);
  }

  // background bounded by the map frame
  const bgW = 0.7 * refW;
  const bgH = 0.6 * refH;
  const bgX = screenW * 0.5;
  const bgY = screenH * 0.5;

  this.background
    .setOrigin(0.5)
    .setPosition(bgX, bgY)
    .setDisplaySize(bgW, bgH)
    .setDepth(0);

  const borderPx = Math.max(1, Math.round(Math.min(refW, refH) * 0.004));
  if (!this.backgroundBorder || !this.backgroundBorder.scene) {
    this.backgroundBorder = this.add.rectangle(bgX, bgY, bgW, bgH, 0, 0)
      .setOrigin(0.5)
      .setScrollFactor(0);
  }
  this.backgroundBorder
    .setPosition(bgX, bgY)
    .setSize(bgW, bgH)
    .setStrokeStyle(borderPx, 0x000000)
    .setDepth(1);

  // chrome
  const pad = Math.min(bgW, bgH) * 0.05;

  const closeFont = bgH * (isPortrait ? 0.075 : 0.06);
  this.closeButton.setFontSize(closeFont);

  const closeX = bgX + bgW / 2 - pad;
  const closeY = bgY - bgH / 2 + pad;

  this.closeButton
    .setPosition(closeX, closeY)
    .setOrigin(1, 0)
    .setDepth(3);

  const closeStroke = Math.max(1, Math.min(refW, refH) * 0.003);
  this.closeButtonBackground
    .setPosition(closeX, closeY)
    .setOrigin(1, 0)
    .setSize(this.closeButton.width, this.closeButton.height * 0.9)
    .setStrokeStyle(closeStroke, 0x000000)
    .setDepth(2);

  // content area
  const contentLeft   = bgX - bgW / 2 + pad;
  const contentRight  = bgX + bgW / 2 - pad;
  const contentTop    = bgY - bgH / 2 + pad * 1.6;
  const contentBottom = bgY + bgH / 2 - pad;

  // one row, farther apart
  const n = this.iconImages.length;
  const spanW = contentRight - contentLeft;
  const spanH = contentBottom - contentTop;

  // push icons away from edges to increase intra-icon spacing
  const edgeFactor = isPortrait ? 0.18 : 0.16;            // bigger = farther from edges
  const leftEdge   = contentLeft  + spanW * edgeFactor;
  const rightEdge  = contentRight - spanW * edgeFactor;
  const laneW      = Math.max(0, rightEdge - leftEdge);

  // icon centers across the lane
  const centersX = (n === 1)
    ? [ (leftEdge + rightEdge) * 0.5 ]
    : Array.from({ length: n }, (_, i) => Phaser.Math.Linear(leftEdge, rightEdge, i / (n - 1)));
  const rowY = contentTop + spanH * 0.45;

  // icon & label sizing — simple and roomy
  let iconSide = Math.min(spanH * 0.40, (laneW / n) * 0.55); // icons take ~55% of their slot -> larger gaps
  let labelFont = iconSide * 0.34;
  const labelGap = iconSide * 0.30;
  const minLabelGap = pad * 0.25;

  // single quick pass to avoid label overlaps (kept simple)
  {
    // measure
    const widths = this.iconLabels.map((lbl) => { lbl.setFontSize(labelFont); return lbl.width; });
    let overlap = false;
    for (let i = 0; i < n - 1; i++) {
      const rightEdgeLbl = centersX[i]     + widths[i]     / 2;
      const leftEdgeLbl  = centersX[i + 1] - widths[i + 1] / 2;
      if ((leftEdgeLbl - rightEdgeLbl) < minLabelGap) { overlap = true; break; }
    }
    if (overlap) {
      labelFont *= 0.9;
      iconSide  *= 0.95;
    }
  }

  // apply
  this.iconImages.forEach((img, i) => {
    img
      .setDisplaySize(iconSide, iconSide)
      .setPosition(centersX[i], rowY)
      .setDepth(2);

    // remember base for hover (lightweight feedback)
    img._baseSize = iconSide;
    if (!img._wiredHover) {
      img.on('pointerover', () => img.setDisplaySize(img._baseSize * 1.12, img._baseSize * 1.12));
      img.on('pointerout',  () => img.setDisplaySize(img._baseSize,         img._baseSize));
      img.on('pointerdown', () => img.setDisplaySize(img._baseSize * 1.08, img._baseSize * 1.08));
      img.on('pointerup',   () => img.setDisplaySize(img._baseSize,         img._baseSize));
      img._wiredHover = true;
    }
  });

  this.iconLabels.forEach((lbl, i) => {
    lbl
      .setFontSize(labelFont)
      .setOrigin(0.5)
      .setStyle({ fontStyle: 'bold', color: '#000000', align: 'center' })
      .setPosition(centersX[i], rowY + iconSide / 2 + labelGap)
      .setDepth(2);
  });
}




}
