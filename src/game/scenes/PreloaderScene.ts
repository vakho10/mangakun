import {GameObjects, Loader, Scene} from 'phaser';
import {MangaKunTypes} from '../../app/types/all-types';

export class PreloaderScene extends Scene {
  private loadingText?: GameObjects.Text;
  private fileText?: GameObjects.Text;
  private progressBar?: GameObjects.Graphics;
  private progressBox?: GameObjects.Graphics;
  private lastProgress = 0; // track progress (0..1)

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
    this.loadingText = this.add.text(width / 2, height / 2 - 40, 'Loading...', {
      font: '20px Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.fileText = this.add.text(width / 2, height / 2, '', {
      font: '16px Arial',
      color: '#aaaaaa',
      wordWrap: {width: 320}
    }).setOrigin(0.5);

    this.progressBox = this.add.graphics();
    this.progressBar = this.add.graphics();

    // Initial draw
    this.drawProgressBox(width, height);
    this.drawProgressBar(width, height, 0);

    // Update progress bar
    this.load.on('progress', (value: number) => {
      this.lastProgress = value;
      this.drawProgressBar(this.cameras.main.width, this.cameras.main.height, value);
    });

    // Show which file is being processed
    this.load.on('fileprogress', (file: Loader.File) => {
      if (this.fileText) {
        this.fileText.setText(`Loading: ${file.key}`);
      }
    });

    // Completed loading
    this.load.on('complete', () => {
      this.progressBar?.destroy();
      this.progressBox?.destroy();
      if (this.loadingText) {
        this.loadingText.setText(`Loaded Chapter: ${this.chapter.number}`);
      }

      // Everything is loaded, start the game
      this.scene.start('ChapterScene');
    });

    // Responsive handling
    this.scale.on('resize', this.onResize, this);

    // Load assets dynamically
    this.loadChapterAssets(this.chapter);
  }

  private loadChapterAssets(chapter: MangaKunTypes.Chapter) {
    chapter.pages.forEach((page) => {
      // Save id for image as its path
      this.load.image(page.imagePath, page.imagePath);

      // Load panel data (if available)
      if (page.overlays) {
        page.overlays.forEach((panel) => {
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

  // -------------------------
  // Helpers for UI
  // -------------------------
  private drawProgressBox(width: number, height: number) {
    if (!this.progressBox) return;
    this.progressBox.clear();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(width / 2 - 160, height / 2 + 30, 320, 50);
  }

  private drawProgressBar(width: number, height: number, value: number) {
    if (!this.progressBar) return;
    this.progressBar.clear();
    this.progressBar.fillStyle(0xffffff, 1);
    this.progressBar.fillRect(width / 2 - 150, height / 2 + 40, 300 * value, 30);
  }

  private onResize(gameSize: Phaser.Structs.Size) {
    const width = gameSize.width;
    const height = gameSize.height;

    if (this.loadingText) this.loadingText.setPosition(width / 2, height / 2 - 40);
    if (this.fileText) this.fileText.setPosition(width / 2, height / 2);

    this.drawProgressBox(width, height);
    this.drawProgressBar(width, height, this.lastProgress);
  }
}
