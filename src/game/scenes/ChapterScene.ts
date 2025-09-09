import Phaser from 'phaser';
import {EventBus} from '../EventBus';
import {MangaKunTypes} from '../../app/types/all-types';
import {MainController} from '../controllers/MainController';

export class ChapterScene extends Phaser.Scene {
  private chapter!: MangaKunTypes.Chapter;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  private mainController = new MainController();

  constructor() {
    super('ChapterScene');
  }

  init() {
    this.chapter = this.game.registry.get('chapterData');

    EventBus.on('goto-first-overlay', () => this.mainController.gotoFirstOverlay());
    EventBus.on('goto-prev-overlay', () => this.mainController.gotoPreviousOverlay());
    EventBus.on('goto-next-overlay', () => this.mainController.gotoNextOverlay());
    EventBus.on('goto-last-overlay', () => this.mainController.gotoLastOverlay());
    EventBus.on('focus-on-current-overlay', () => {
      // Just focus on the current overlay without no extra actions
      this.mainController.gotoOverlay(this.mainController.currentOverlayIndex == -1 ? 0
        : this.mainController.currentOverlayIndex, false, false, false, false);
    });
  }

  create() {
    // Keyboard input
    if (this.input.keyboard) this.cursors = this.input.keyboard.createCursorKeys();

    // Enable right-click
    if (this.input.mouse) this.input.mouse.disableContextMenu();

    // Listen to the mouse wheel (zoom-in-out)
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: any, deltaY: number, deltaZ: any) => {
      const zoomSpeed = 0.001; // adjust sensitivity
      this.cameras.main.zoom -= deltaY * zoomSpeed;

      // Clamp zoom so the camera doesn't flip or zoom too far
      this.cameras.main.zoom = Phaser.Math.Clamp(this.cameras.main.zoom, 0.5, 3);
    });

    this.mainController.loadChapterData(this, this.chapter);

    // Center the camera horizontally on the page
    // Note: do not use camera boundaries (zooming and boundaries mess up everything)!
    this.cameras.main.centerOnX(this.mainController.maxPageWidth / 2);

    // Click navigation
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonReleased()) this.mainController.gotoNextOverlay();
      else if (pointer.rightButtonReleased()) this.mainController.gotoPreviousOverlay();
    });

    this.mainController.init(this); // Focus camera on the first overlay
    EventBus.emit('chapter-loaded'); // Notify angular components that the chapter is loaded
  }

  override update() {
    if (!this.cursors) return;
    const cam = this.cameras.main;
    const scrollSpeed = 10 * (1 / cam.zoom);

    if (this.cursors.up.isDown) cam.scrollY -= scrollSpeed;
    if (this.cursors.down.isDown) cam.scrollY += scrollSpeed;
    if (this.cursors.left.isDown) cam.scrollX -= scrollSpeed;
    if (this.cursors.right.isDown) cam.scrollX += scrollSpeed;
  }
}
