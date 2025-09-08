import Phaser from 'phaser';
import {Overlay} from './Overlay';
import {environment} from '../../environments/environment';

export class PageContainer extends Phaser.GameObjects.Container {

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    page: Phaser.GameObjects.Image
  ) {
    super(scene, x, y, [page]);
    scene.add.existing(this);

    // Update container size dynamically
    const bounds = this.getBounds();
    this.setSize(bounds.width, bounds.height);

    if (environment.debugMode) {
      this.drawBorderAroundMe();
    }
  }

  get page(): Phaser.GameObjects.Image {
    return this.first as Phaser.GameObjects.Image;
  }

  get overlays(): Overlay[] {
    return this.list.slice(1) as Overlay[];
  }

  private drawBorderAroundMe() {
    const debugGraphics = this.scene.add.graphics();
    debugGraphics.lineStyle(2, 0xff0000, 1);

    debugGraphics.strokeRect(
      this.x - this.width * this.originX,
      this.y - this.height * this.originY,
      this.width,
      this.height
    );
  }
}
