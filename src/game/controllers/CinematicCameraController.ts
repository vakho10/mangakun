import Phaser from 'phaser';
import {Overlay} from '../gameobjects/Overlay';
import {SimpleNoise} from '../gameobjects/SimpleNoise';
import {forkJoin} from 'rxjs';

export class CinematicCameraController {
  private scene: Phaser.Scene;
  private cam: Phaser.Cameras.Scene2D.Camera;

  private driftHandler?: (time: number, delta: number) => void;
  private isAnimating = false;

  private driftXNoise = new SimpleNoise();
  private driftYNoise = new SimpleNoise();

  constructor(scene: Phaser.Scene, cam?: Phaser.Cameras.Scene2D.Camera) {
    this.scene = scene;
    this.cam = cam || scene.cameras.main;
  }

  stopDrift() {
    if (this.driftHandler) {
      this.scene.events.off('update', this.driftHandler);
      this.driftHandler = undefined;
    }
  }

  focusOnOverlay(
    overlay: Overlay,
    animate: boolean = true,
    hideAfter: boolean = true,
    shakeCamera: boolean = true,
    onComplete?: () => void
  ) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.stopDrift();

    const camera = this.scene.cameras.main;
    const bounds = overlay.getWorldBounds();
    const center = overlay.getWorldCenter();

    const zoomX = camera.width / bounds.width;
    const zoomY = camera.height / bounds.height;
    const zoom = Math.min(zoomX, zoomY); // fit to bounds

    const finish = () => {
      if (shakeCamera) {
        this.startDrift(center.x - this.cam.width / 2, center.y - this.cam.height / 2, zoom);
      }
      this.isAnimating = false;
      onComplete?.();
    };

    if (animate) {
      forkJoin([
        overlay.pan$(camera, center.x, center.y, 250),
        overlay.zoom$(camera, zoom, 250)
      ]).subscribe(() => {
        if (overlay.visible && hideAfter) {
          this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 250,
            ease: 'Sine.easeInOut',
            onComplete: () => {
              overlay.setVisible(false);
              finish();
            }
          });
        } else {
          finish();
        }
      });
    } else {
      camera.centerOn(center.x, center.y);
      camera.setZoom(zoom);
      if (hideAfter) {
        overlay.setVisible(false);
      }
      finish();
    }
  }

  private startDrift(baseX: number, baseY: number, baseZoom: number) {
    let t = 0;

    this.driftHandler = (time: number, delta: number) => {
      t += delta * 0.00001; // slower drift
      const driftX = (this.driftXNoise.get(t) - 0.5) * 3.25; // was 30
      const driftY = (this.driftYNoise.get(t) - 0.5) * 2.5; // was 20
      const zoomOsc = (this.driftXNoise.get(t + 1000) - 0.5) * 0.001; // was 0.1

      this.cam.setScroll(baseX + driftX, baseY + driftY);
      this.cam.setZoom(baseZoom + zoomOsc);
    };

    this.scene.events.on('update', this.driftHandler);
  }
}
