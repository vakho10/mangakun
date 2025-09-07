import Phaser from 'phaser';
import {MangaKunTypes} from '../../app/types/all-types';
import {PageContainer} from './PageContainer';
import {Overlay} from './Overlay';
import {EventBus} from '../EventBus';
import {AudioController} from './AudioController';
import PointTuple = MangaKunTypes.PointTuple;

export class MainController {

  private scene!: Phaser.Scene;
  private chapter!: MangaKunTypes.Chapter;
  private audioController: AudioController = new AudioController();

  pageContainers: Phaser.GameObjects.Container[] = [];
  overlays: Overlay[] = [];

  maxPageWidth = 0;
  currentOverlayIndex = -1;

  isAnimationInProgress = false;

  init() {
    this.gotoOverlay(0, false, false, false);
    this.currentOverlayIndex = -1;
  }

  loadChapterData(scene: Phaser.Scene, chapter: MangaKunTypes.Chapter) {
    this.scene = scene;
    this.chapter = chapter;

    const pageImages: Phaser.GameObjects.Image[] = [];
    chapter.pages.forEach(page => {
      const pageImage = this.scene.add.image(0, 0, page.imagePath);
      pageImage.setOrigin(0.5, 0.5);
      pageImages.push(pageImage);
    });

    // Compute the widest page width
    this.maxPageWidth = Math.max(...pageImages.map(page => page.displayWidth));

    // Stack pages vertically and center horizontally
    let verticalOffset = 0;
    chapter.pages.forEach((chapterPage, index) => {
        const pageImage = pageImages[index];
        const pageContainer = new PageContainer(
          this.scene,
          0,
          verticalOffset + pageImage.displayHeight / 2,
          pageImage
        );

        const wholePageCoords: PointTuple[] = [
          [0, 0], [pageImage.displayWidth, 0],
          [pageImage.displayWidth, pageImage.displayHeight], [0, pageImage.displayHeight]
        ];

        // If no page overlay exists, create one (containing the whole page)
        if (!chapterPage.overlays || chapterPage.overlays.length === 0) {
          chapterPage.overlays = [{
            coordinates: wholePageCoords
          }];
        } else {
          // If a page overlay exists, but no coordinates are specified, use the whole page coordinates
          chapterPage.overlays.filter(co => !co.coordinates).forEach(co => {
            co.coordinates = wholePageCoords;
          })
        }

        // Add overlays for each page
        chapterPage.overlays.forEach(chapterOverlay => {
          // Container's local space is always at center! We need to adjust the coordinates accordingly
          const overlayPoints = chapterOverlay.coordinates!.map(([px, py]) => [
            px - pageImage.displayWidth / 2,
            py - pageImage.displayHeight / 2
          ]);
          const overlay = new Overlay(this.scene, 0, 0, overlayPoints, this.randomColor(), .8);
          pageContainer.add(overlay);
        });

        this.pageContainers.push(pageContainer);
        verticalOffset += pageImage.displayHeight;
      }
    );

    // Store overlay here for easy access
    this.overlays = this.pageContainers.flatMap(pc => (pc as PageContainer).overlays);

    console.log('Overlays: ', this.overlays);
  }

  gotoOverlay(overlayIndex: number, animate: boolean, hideAfter: boolean, playAudio: boolean = true) {
    const newOverlayIndex = overlayIndex;
    if (this.overlays.length <= newOverlayIndex || newOverlayIndex < 0) {
      return;
    }
    if (this.isAnimationInProgress) return;
    this.isAnimationInProgress = true;
    console.log('Goto overlay: ', overlayIndex);
    this.overlays[newOverlayIndex].focusOn(animate, hideAfter, () => {
      if (playAudio) {
        this.audioController.playOverlaySounds(this.scene, this.chapter, newOverlayIndex);
      }
      this.currentOverlayIndex = newOverlayIndex; // Update the current overlay index
      EventBus.emit('on-overlay-changed', newOverlayIndex);
      this.isAnimationInProgress = false;
    });
  }

  gotoFirstOverlay(animate = true, hideAfter = true, playAudio = true) {
    this.gotoOverlay(0, animate, hideAfter, playAudio);
  }

  gotoPreviousOverlay(animate = true, hideAfter = true) {
    this.gotoOverlay(this.currentOverlayIndex - 1, animate, hideAfter);
  }

  gotoNextOverlay(animate = true, hideAfter = true) {
    this.gotoOverlay(this.currentOverlayIndex + 1, animate, hideAfter);
  }

  gotoLastOverlay(animate = true, hideAfter = true) {
    this.gotoOverlay(this.overlays.length - 1, animate, hideAfter);
  }

  randomColor() {
    return Math.floor(Math.random() * 0xFFFFFF);
  }
}
