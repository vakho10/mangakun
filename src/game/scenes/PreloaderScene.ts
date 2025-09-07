import {GameObjects, Loader, Scene} from 'phaser';
import {MangaKunTypes} from '../../app/types/all-types';

export class PreloaderScene extends Scene {
  private loadingText?: GameObjects.Text;
  private fileText?: GameObjects.Text;

  private chapter: MangaKunTypes.Chapter;

  constructor(chapter: MangaKunTypes.Chapter) {
    super('Preloader');
    this.chapter = chapter;
  }

  preload() {
    const {width, height} = this.cameras.main;

    // Store chapter data in the registry for later use
    this.game.registry.set('chapterData', this.chapter);

    // Loading UI
    this.loadingText = this.add
      .text(width / 2, height / 2 - 40, 'Loading...', {
        font: '20px Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.fileText = this.add
      .text(width / 2, height / 2, '', {
        font: '16px Arial',
        color: '#aaaaaa',
        wordWrap: {width: 320}
      })
      .setOrigin(0.5);

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 + 30, 320, 50);

    // Update progress bar
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 + 40, 300 * value, 30);
    });

    // Show which file is being processed
    this.load.on('fileprogress', (file: Loader.File) => {
      if (this.fileText) {
        this.fileText.setText(`Loading: ${file.key}`);
      }
    });

    // Completed loading
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      if (this.loadingText) {
        this.loadingText.setText(`Loaded Chapter: ${this.chapter.number}`);
      }

      // Everything is loaded, start the game
      this.scene.start('ChapterScene');
    });

    // Load assets dynamically
    this.loadChapterAssets(this.chapter);
  }

  private loadChapterAssets(chapter: MangaKunTypes.Chapter) {
    // Pages and panels
    chapter.pages.forEach((page) => {

      // Save id for image as its path
      this.load.image(page.imagePath, page.imagePath);

      // Load panel data (if available)
      if (page.overlays) {
        page.overlays.forEach((panel) => {

          // Load sound
          if (panel.events) {

            // Load bgm
            if (panel.events.bgm) {
              panel.events.bgm.forEach((bgm) => this.saveLoadAudio("bgm", bgm.src));
            }

            // Load sfx
            if (panel.events.sfx) {
              panel.events.sfx.forEach((sfx) => this.saveLoadAudio("sfx", sfx.src));
            }

            // Load tts
            if (panel.events.tts) {
              panel.events.tts.forEach((tts) => this.saveLoadAudio("tts", tts.src));
            }
          }
        });
      }
    });
  }

  saveLoadAudio(type: "bgm" | "sfx" | "tts", src: string) {
    if (!this.cache.audio.exists(src)) {
      this.load.audio(`${type}-${src}`, src);
    }
  }
}
