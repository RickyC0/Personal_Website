// HUD.js
import VirtualJoystick from "../GameObjects/VirtualJoystick.js";

export class HUD extends Phaser.Scene {
  static instance = null;

  constructor() { super('HUD'); }

  create() {
    // Singleton pattern: only one HUD instance
    HUD.instance = this;  

    // Array of all HUD components for easy hide/show
    this.hudComponents = [];

    if (this.sys.game.device.input.touch) this.input.addPointer(2);

    this.joystick = new VirtualJoystick(this, { fixed: true })
      .setDepth(1000);
      
    this.hudComponents.push(this.joystick);

    this.events.emit('ready', { joystick: this.joystick });

    this.events.on('update', () => {
      const { x, y } = this.joystick.getAxis();
      this.events.emit('axis', { x, y });
    });

    // clear the singleton when this scene shuts down/restarts
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => { if (HUD.instance === this) HUD.instance = null; });
  }

  // Hide/show all HUD components
  static hideHUD() {
    const inst = HUD.instance;
    if (!inst?.hudComponents) return;
    for (const c of inst.hudComponents) c.setVisible(false);
  }

  // Show all HUD components
  static showHUD() {
    const inst = HUD.instance;
    if (!inst?.hudComponents) return;
    for (const c of inst.hudComponents) c.setVisible(true);
  }
}
