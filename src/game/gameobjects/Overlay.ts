import Phaser from 'phaser';
import {forkJoin, Observable} from 'rxjs';

export class Overlay extends Phaser.GameObjects.Polygon {

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    points: any,
    fillColor: number = 0xff0000,
    fillAlpha: number = .5
  ) {
    super(scene, x, y, points, fillColor, fillAlpha);
    this.scene.add.existing(this);
    this.setOrigin(0, 0);
  }

  private getWorldPoints(): Phaser.Math.Vector2[] {
    const matrix = this.getWorldTransformMatrix();
    return this.geom.points.map((p: Phaser.Math.Vector2) => matrix.transformPoint(p.x, p.y));
  }

  getWorldBounds(): Phaser.Geom.Rectangle {
    const pts = this.getWorldPoints();
    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);

    return new Phaser.Geom.Rectangle(
      Math.min(...xs),
      Math.min(...ys),
      Math.max(...xs) - Math.min(...xs),
      Math.max(...ys) - Math.min(...ys)
    );
  }

  getWorldCenter(): Phaser.Math.Vector2 {
    const bounds = this.getWorldBounds();
    return new Phaser.Math.Vector2(bounds.centerX, bounds.centerY);
  }

  focusOn(animate = true, hideAfter = true, onComplete?: () => void) {
    const camera = this.scene.cameras.main;
    const bounds = this.getWorldBounds();
    const center = this.getWorldCenter();

    const zoomX = camera.width / bounds.width;
    const zoomY = camera.height / bounds.height;
    const zoom = Math.min(zoomX, zoomY); // fit to bounds

    if (animate) {
      forkJoin([
        this.pan$(camera, center.x, center.y, 250),
        this.zoom$(camera, zoom, 250)
      ]).subscribe(() => {
        if (this.visible && hideAfter) {
          this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 250,
            ease: 'Power2',
            onComplete: () => {
              this.setVisible(false);
              onComplete?.();
            }
          });
        } else {
          onComplete?.();
        }
      });
    } else {
      camera.centerOn(center.x, center.y);
      camera.setZoom(zoom);
      if (hideAfter) {
        this.setVisible(false);
      }
      onComplete?.();
    }
  }

  private pan$(camera: Phaser.Cameras.Scene2D.Camera, x: number, y: number, duration: number): Observable<void> {
    return new Observable<void>((observer) => {
      camera.pan(x, y, duration, 'Power2', false, (_cam, progress) => {
        if (progress === 1) {
          observer.next();
          observer.complete();
        }
      });
    });
  }

  private zoom$(camera: Phaser.Cameras.Scene2D.Camera, zoom: number, duration: number): Observable<void> {
    return new Observable<void>((observer) => {
      camera.zoomTo(zoom, duration, 'Power2', false, (_cam, progress) => {
        if (progress === 1) {
          observer.next();
          observer.complete();
        }
      });
    });
  }
}
