export class ricardosLore extends Phaser.Scene {
  constructor() {
    super({ key: 'ricardosLore' });
    this.backgroundColor = 0xc8b889;
    this.title = "Ricardo's Lore";
  }

  create() {
    // 1) background
    this.background = this.add.image(0, 0, 'brick-background')
      .setOrigin(0)
      .setDepth(this.cameras.main.depth - 1)
      
      .setDisplaySize(this.cameras.main.width, this.cameras.main.height);

    
    // 2) close button
    this.closeButton = this.add.text(0, 0, '✕', {
      fontSize: '32px', color: '#000000'
    })
    .setInteractive({ useHandCursor: true })
    .setDepth(2)
    .on('pointerdown', () => this.scene.stop('ricardosLore'));

    this.closeButtonBackground = this.add.rectangle(0, 0, 0, 0, 0xc88889)
      .setOrigin(1, 0)
      .setDepth(this.closeButton.depth - 1)
      .setStrokeStyle(2, 0x000000);
      
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
        //TODO: replace with actual callback
        callback: () => console.log('Projects clicked')
      },
      {
        key: 'education-sprite',
        label: 'Education',
        //TODO: replace with actual callback
        callback: () => console.log('Education clicked')
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
        fontSize: '32px', color: '#000000', align: 'center'
      }).setDepth(this.background.depth + 1).setOrigin(0.5, 0);

      this.iconImages.push(img);
      this.iconLabels.push(txt);
    });

    // 5) perform initial layout
    this.updateLayout();

    // 6) listen for resize
    this.scale.on('resize', () => this.updateLayout());
  }

  updateLayout() {
    // 1) grab the real live canvas size
    const width  = this.scale.width;
    const height = this.scale.height;

    // 2) take 60% for background size
    const backgroundWidth  = width  * 0.6;
    const backgroundHeight = height * 0.6;

    // 3) center point
    const backgroundCenterX = width  / 2;
    const backgroundCenterY = height / 2;

    // 4) position & size the background
    this.background
      .setOrigin(0.5, 0.5)
      .setPosition(backgroundCenterX, backgroundCenterY)
      .setDisplaySize(backgroundWidth, backgroundHeight)
      .setDepth(this.cameras.main.depth - 1);

    // Draw the border of the background
    this.backgroundBorder = this.add.rectangle(
      backgroundCenterX,
      backgroundCenterY,
      backgroundWidth,
      backgroundHeight,
      0x000000,
      0 //fillAlpha 0 to not overlap with the background
    )
      .setOrigin(0.5, 0.5)
      .setStrokeStyle(4, 0x000000) // 4px black outline
      .setDepth(this.background.depth + 1);


    // 5) close-button sits in the top-right of that background
    this.closeButton
      .setPosition(backgroundCenterX + backgroundWidth/2 - 10, backgroundCenterY - backgroundHeight/2 + 10)
      .setOrigin(1, 0);

    this.closeButtonBackground
      .setPosition(this.closeButton.x, this.closeButton.y)
      .setOrigin(1, 0)
      .setSize(this.closeButton.width, this.closeButton.height - 5);

    // 6) icon sizing & spacing exactly as before
    const ICONSIZE     = Math.min(backgroundWidth, backgroundHeight) * 0.25;
    const TEXTOFFSET = 0.5;
    const HOVERSCALING = 2;
    const SPANW = backgroundWidth * 0.6;
    const SPANH = backgroundHeight *0.6;
    const startX = backgroundCenterX - SPANW/2;
    const startY = backgroundCenterY - SPANH/5;
    const spacing = SPANW / (this.iconImages.length - 1);

    // position each icon + label
    this.iconImages.forEach((img, i) => {
      const x = startX + spacing * i; 
      const y = startY ;

      img
        .setPosition(x, y)
        .setDisplaySize(ICONSIZE, ICONSIZE)
        .on('pointerover', () => img.setDisplaySize(ICONSIZE * HOVERSCALING, ICONSIZE * HOVERSCALING))
        .on('pointerout', () => img.setDisplaySize(ICONSIZE, ICONSIZE));

      this.iconLabels[i]
        .setPosition(x, y + ICONSIZE/2 + ICONSIZE * TEXTOFFSET)
        .setStyle({ fontStyle: 'bold' }); 
    });
  }
}
