export class ricardosLore extends Phaser.Scene {
  constructor() {
    super({ key: 'ricardosLore' });
    this.backgroundColor = 0xc8b889;
    this.title = "Ricardo's Lore";
  }

  create() {
    // 1) background
    this.background = this.add.rectangle(0, 0, 0, 0, this.backgroundColor)
      .setDepth(0)
      .setStrokeStyle(2, 0x000000);
    
    // 2) close button
    this.closeButton = this.add.text(0, 0, '✕', {
      fontSize: '32px', color: '#FFFFFF'
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
        label: 'Curriculum Vitae',
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
        fontSize: '18px', color: '#FFFFFF', align: 'center'
      }).setDepth(this.background.depth + 1).setOrigin(0.5, 0);

      this.iconImages.push(img);
      this.iconLabels.push(txt);
    });

    // 5) perform initial layout
    this.updateLayout({ 
      width: this.scale.width, 
      height: this.scale.height 
    });

    // 6) listen for resize
    this.scale.on('resize', (gameSize) => this.updateLayout(gameSize));
  }

  updateLayout({ width, height }) {
    const backgroundWidth = width * 0.8;
    const backgroundHeight = height * 0.8;
    const cx = width / 2, cy = height / 2;

    // background
    this.background.setPosition(cx, cy).setSize(backgroundWidth, backgroundHeight);

    // close button in top-right of bg
    
    this.closeButton
      .setPosition(cx + backgroundWidth/2 - 10, cy - backgroundHeight/2 + 10)
      .setOrigin(1, 0);

    this.closeButtonBackground
      .setPosition(this.closeButton.x, this.closeButton.y)
      .setOrigin(1, 0)
      .setSize(this.closeButton.width, this.closeButton.height-5);

    // icon spacing
    const ICONSIZE = Math.min(backgroundWidth, backgroundHeight) * 0.25; // 15% of smaller dim
    const HOVERSCALING = 2;
    const SPAN = backgroundWidth * 0.6; // total horizontal span
    const startX = cx - SPAN/2;                   
    const spacing = SPAN / (this.iconImages.length - 1);

    // position each icon + label
    this.iconImages.forEach((img, i) => {
      const x = startX + spacing * i;
      const y = cy; 

      img
        .setPosition(x, y)
        .setDisplaySize(ICONSIZE, ICONSIZE)
        .on('pointerover', () => img.setDisplaySize(ICONSIZE * HOVERSCALING, ICONSIZE * HOVERSCALING))
        .on('pointerout', () => img.setDisplaySize(ICONSIZE, ICONSIZE));

      this.iconLabels[i]
        .setPosition(x, y + ICONSIZE/2 + 8); // label 8px below icon
    });
  }
}
