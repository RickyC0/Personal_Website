export class Player extends Phaser.Physics.Arcade.Sprite{
    

    constructor(scene, x, y) {
        
        super(scene, x, y, 'Snorlax-player'); // 'Snorlax-player' is the key for the player sprite

        scene.add.existing(this);
        scene.physics.add.existing(this);

        //Reduce the size of the player 
        this.setScale(0.4);

        this.setCollideWorldBounds(true); // Prevents the player from going out of bounds
        
        this.initAnimations();

    }

    initAnimations() {
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('Snorlax-player', { start: 3, end: 5 }),
            frameRate: 10,
            repeat:-1});

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('Snorlax-player', { start: 6, end: 8 }),
            frameRate: 10,
            repeat:-1});

        this.anims.create({
            key: 'up',
            frames: this.anims.generateFrameNumbers('Snorlax-player', { start: 9, end: 11 }),
            frameRate: 10,
            repeat:-1});

        this.anims.create({
            key: 'down',
            frames: this.anims.generateFrameNumbers('Snorlax-player', { start: 0, end: 2 }),
            frameRate: 10,
            repeat:-1});
    }

    moveLeft() {
    this.setVelocityX(-200);
    this.setVelocityY(0); // Reset Y not to move up or down
    this.anims.play('left', true);
    this.lastDirection = 'left';
    }

    moveRight() {
        this.setVelocityX(200);
        this.setVelocityY(0); // Reset Y not to move up or down
        this.anims.play('right', true);
        this.lastDirection = 'right';
    }

    moveUp() {
        this.setVelocityY(-200);
        this.setVelocityX(0); // Reset X not to move left or right
        this.anims.play('up', true);
        this.lastDirection = 'up';
    }

    moveDown() {
        this.setVelocityY(200);
        this.setVelocityX(0); // Reset X not to move left or right
        this.anims.play('down', true);
        this.lastDirection = 'down';
    }

    idle() {
        this.setVelocity(0);
        this.anims.stop();

        
    }


}