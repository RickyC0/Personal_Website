// src/GameObjects/VirtualJoystick.js
export default class VirtualJoystick extends Phaser.GameObjects.Container {
  constructor(scene, opts = {}) {
    super(scene);
    scene.add.existing(this);

    this.radius   = opts.radius   || scene.scale.width * 0.1;
    this.margin   = opts.margin   || scene.scale.width * 0.05;
    this.fixed    = opts.fixed ?? true;
    this.deadzone = opts.deadzone ?? 0.2;
    this.pointerId = null;
    this.value = new Phaser.Math.Vector2(0, 0);

    this.setScrollFactor(0).setDepth(10000);

    // --- Base + knob centered inside the container ---
    this.base = scene.add.circle(this.radius, this.radius, this.radius, 0x000000, 0.25)
      .setStrokeStyle(2, 0xffffff, 0.8)
      .setScrollFactor(0)
      .setOrigin(0.5);

    this.knob = scene.add.circle(this.radius, this.radius, this.radius * 0.45, 0xffffff, 0.35)
      .setStrokeStyle(2, 0xffffff, 0.9)
      .setScrollFactor(0)
      .setOrigin(0.5);

    this.add([this.base, this.knob]);

    // --- Layout: place the CONTAINER by its top-left, so its center lands where we want ---
    const layout = () => {
      const { height: h } = scene.scale;
      this.setSize(this.radius * 2, this.radius * 2);

      if (this.fixed) {
        // top-left = (margin, bottom - (margin + diameter))
        this.setPosition(this.margin, h - (this.margin + this.radius * 2));
        this.setVisible(true);
      }
    };
    layout();
    scene.scale.on('resize', layout, this);

    // --- Hit area centered at (radius, radius) ---
    this.setInteractive(
      new Phaser.Geom.Circle(2 * this.radius, 2 * this.radius, this.radius),
      Phaser.Geom.Circle.Contains
    );

    if (!this.fixed) {
      this.tapZone = scene.add.zone(0, 0, scene.scale.width, scene.scale.height)
        .setOrigin(0).setScrollFactor(0).setInteractive();
      this.tapZone.on('pointerdown', this._onPointerDown, this);
      scene.scale.on('resize', ({ width, height }) => this.tapZone.setSize(width, height));
      this.setVisible(false);
    } else {
      this.on('pointerdown', this._onPointerDown, this);
    }

    scene.input.on('pointermove', this._onPointerMove, this);
    scene.input.on('pointerup',   this._onPointerUp,   this);
    scene.input.on('gameout',     () => this._reset(), this);

    scene.input.addPointer(2);
  }

  _onPointerDown(pointer) {
    if (this.pointerId !== null) return;
    if (!this.fixed) {
      // For floating: position the CONTAINER so its center is at the touch
      this.setPosition(pointer.x - this.radius, pointer.y - this.radius);
      this.setVisible(true);
    }
    this.pointerId = pointer.id;
    this._updateKnob(pointer.x, pointer.y);
    pointer.event?.preventDefault?.();
  }

  _onPointerMove(pointer) {
    if (this.pointerId !== pointer.id) return;
    this._updateKnob(pointer.x, pointer.y);
  }

  _onPointerUp(pointer) {
    if (this.pointerId !== pointer.id) return;
    this._reset();
  }

  _updateKnob(worldX, worldY) {
    // World center of the stick = container top-left + (radius, radius)
    const center = new Phaser.Math.Vector2(this.x + this.radius, this.y + this.radius);
    const v = new Phaser.Math.Vector2(worldX, worldY).subtract(center);
    const max = this.radius;

    if (v.length() > max) v.setLength(max);
    this.knob.setPosition(this.radius + v.x, this.radius + v.y); // knob is centered at (radius,radius)

    this.value.set(v.x / max, v.y / max); // -1..1 each axis
  }

  _reset() {
    this.pointerId = null;
    this.knob.setPosition(this.radius, this.radius);
    this.value.set(0, 0);
    if (!this.fixed) this.setVisible(false);
  }

  getAxis() {
    const { x, y } = this.value;
    const mag = Math.hypot(x, y);
    if (mag < this.deadzone) return { x: 0, y: 0 };
    return { x, y };
  }
}
