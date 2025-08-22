export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'Snorlax-player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.4);
    this.setCollideWorldBounds(true);

    this.SPEED = 200;           // single source of truth
    this.lastDirection = 'down';

    this.initAnimations();
  }

  initAnimations() {
    this.anims.create({ key: 'left',
      frames: this.anims.generateFrameNumbers('Snorlax-player', { start: 3, end: 5 }),
      frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'right',
      frames: this.anims.generateFrameNumbers('Snorlax-player', { start: 6, end: 8 }),
      frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'up',
      frames: this.anims.generateFrameNumbers('Snorlax-player', { start: 9, end: 11 }),
      frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'down',
      frames: this.anims.generateFrameNumbers('Snorlax-player', { start: 0, end: 2 }),
      frameRate: 10, repeat: -1 });
  }

  // Unified movement for keyboard + D-pad
  setMove(ax, ay) {
    const speed = this.SPEED;

    // 1) set velocity from input (-1..1)
    this.body.setVelocity(ax * speed, ay * speed);

    // 2) keep diagonal speed consistent
    if (ax !== 0 && ay !== 0) this.body.velocity.normalize().scale(speed);

    // 3) animations + facing
    if (ax < 0) {
      this.anims.play('left', true);  this.lastDirection = 'left';
    } else if (ax > 0) {
      this.anims.play('right', true); this.lastDirection = 'right';
    } else if (ay < 0) {
      this.anims.play('up', true);    this.lastDirection = 'up';
    } else if (ay > 0) {
      this.anims.play('down', true);  this.lastDirection = 'down';
    } else {
      // 4) idle: stop anim and show a neutral frame for the last direction
      this.body.setVelocity(0, 0);
      this.anims.stop();
      const idleFrame = { down: 0, left: 3, right: 6, up: 9 }[this.lastDirection] ?? 0;
      this.setFrame(idleFrame);
    }
  }

  moveLeft()  { this.setMove(-1, 0); }
  moveRight() { this.setMove( 1, 0); }
  moveUp()    { this.setMove( 0,-1); }
  moveDown()  { this.setMove( 0, 1); }
  idle()      { this.setMove( 0, 0); }
}
