export class InteractableRect extends Phaser.GameObjects.Rectangle {
  constructor(scene, obj, data = {}) {
    // compute bounds
    const x = obj.x + obj.width/2;
    const y = obj.y + obj.height/2;

    
    super(scene, x, y, obj.width, obj.height, 0x000000, 0);

    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    this.setInteractive({ useHandCursor: true });

    // store message
    this.setData('message', data.message);

  
    const PADDING = 8; // pixels beyond object bounds
    this.hoverHighlight = scene.add.rectangle(
      x, 
      y, 
      obj.width  + PADDING*2,
      obj.height + PADDING*2,
      0xffff00,
      0.3
    )
    .setVisible(false)          // start hidden
    .setDepth( this.depth + 1 );// above everything else

    // 3) pointer events on the Zone
    this.on('pointerover',  () => this.hoverHighlight.setVisible(true));
    this.on('pointerout',   () => this.hoverHighlight.setVisible(false));
    this.on('pointerdown',  () => this.checkInteraction());

    scene.events.on('update', this.update, this);
  }

  checkInteraction() {
    const p = this.scene.player;
    const px = p.x, py = p.y + p.displayHeight/2;
    const zx = this.body.center.x, zy = this.body.center.y;
    if (Phaser.Math.Distance.Between(px, py, zx, zy) < 40) {
      console.log('Interacted:', this.getData('message'));
    }
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.scene.interactKey)) {
      this.checkInteraction();
    }
  }
}
