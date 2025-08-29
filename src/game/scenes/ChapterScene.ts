import {GameObjects, Geom, Input, Scene, Sound, Time, Types} from 'phaser';
import {Chapter, Panel, PointTuple, SoundEvent} from '../../app/types/all-types';
import {EventBus} from '../EventBus';

export class ChapterScene extends Scene {
  private chapterData!: Chapter;
  private cursors!: Types.Input.Keyboard.CursorKeys;
  private currentPanelIndex = -1;

  private maxPageWidth = 0;
  private totalPanelAmount = 0;

  private pageImages: GameObjects.Image[] = [];
  private pageOverlays: {
    graphics: GameObjects.Graphics,
    coordinates: PointTuple[];
    center: PointTuple;
  }[] = [];

  // Sound system
  private bgmMap: Map<string, Sound.BaseSound> = new Map();
  private sfxMap: Map<string, Sound.BaseSound> = new Map();
  private ttsMap: Map<string, Sound.BaseSound> = new Map();

  private activeBgmKeys: Set<string> = new Set();
  private activeSfxKeys: Set<string> = new Set();
  private activeTtsKeys: Set<string> = new Set();

  // Scene-level fade defaults
  // TODO move to a config file?!
  private fadeDefaults = {
    bgm: {fadeIn: 500, fadeOut: 500},
    sfx: {fadeIn: 200, fadeOut: 200},
    tts: {fadeIn: 100, fadeOut: 100}
  };

  // Add a property to track pending delayed calls
  private pendingDelayedCalls: Time.TimerEvent[] = [];

  private panelBgmMap: Map<number, SoundEvent[]> = new Map();

  constructor() {
    super('ChapterScene');
  }

  init() {
    this.chapterData = this.game.registry.get('chapterData');
    this.totalPanelAmount = this.chapterData.pages
      .reduce((acc, page) => acc + (page.panels?.length || 1), 0);

    EventBus.on('goto-first-panel', () => this.firstPanel());
    EventBus.on('goto-prev-panel', () => this.previousPanel());
    EventBus.on('goto-next-panel', () => this.nextPanel());
    EventBus.on('goto-last-panel', () => this.lastPanel());
    EventBus.on('focus-on-current-panel', () => {
      if (this.currentPanelIndex < 0) return;
      this.focusOnOverlay(this.currentPanelIndex, true)
    });
  }

  create() {
    const cam = this.cameras.main;

    // Keyboard input
    if (this.input.keyboard) this.cursors = this.input.keyboard.createCursorKeys();

    // Enable right-click
    if (this.input.mouse) this.input.mouse.disableContextMenu();

    // Create and save image objects
    this.chapterData.pages.forEach(page => this.pageImages.push(this.add.image(0, 0, page.imagePath)));

    // Compute widest page
    this.maxPageWidth = Math.max(...this.pageImages.map(img => img.displayWidth));

    // Stack pages vertically and center horizontally
    let verticalOffset = 0;
    let prevPageImage: GameObjects.Image | undefined;
    this.pageImages.forEach(img => {
      verticalOffset += img.displayHeight / 2;
      if (prevPageImage) {
        verticalOffset += prevPageImage.displayHeight / 2;
      }
      img
        .setOrigin(0.5, 0.5) // top-center origin
        .setPosition(this.maxPageWidth / 2, verticalOffset);
      prevPageImage = img;
    });

    // Add overlays (panel or panel level)
    this.chapterData.pages.forEach((page, index) => {
      const pageImage = this.pageImages[index];

      // Create overlays for each panel
      page.panels.forEach(panel => {
        this.makeOverlayFor(pageImage, panel);
      });
    })

    // Note: do not use camera boundaries (zooming and boundaries mess up everything)!
    cam.centerOnX(this.maxPageWidth / 2);

    // Click navigation
    this.input.on('pointerup', (pointer: Input.Pointer) => {
      if (pointer.leftButtonReleased()) this.nextPanel();
      else if (pointer.rightButtonReleased()) this.previousPanel();
    });

    EventBus.emit('chapter-loaded'); // Notify angular components that the chapter is loaded
  }

  makeOverlayFor(img: GameObjects.Image, panel: Panel) {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x000000); // Back overlay
    graphics.beginPath();

    // Coordinates are given relative to the image top-left
    const coords: PointTuple[] = panel.coordinates.map(([x, y]) => [
      x - img.displayWidth / 2,
      y - img.displayHeight / 2
    ]);

    // Draw the polygon
    graphics.moveTo(coords[0][0], coords[0][1]);
    coords.slice(1).forEach(([x, y]) => graphics.lineTo(x, y));
    graphics.closePath();
    graphics.fillPath();

    // Set position and visibility
    graphics.setPosition(img.x, img.y);

    // Relativize center coordinates to image
    if (panel.center) {
      panel.center = [img.x + panel.center[0] - img.width / 2, img.y + panel.center[1] - img.height / 2];
    } else {
      // Compute center using formula
      const centroid = Geom.Point.GetCentroid(coords.map(([x, y]) => ({x, y})));
      panel.center = [img.x + centroid.x, img.y + centroid.y];
    }

    this.pageOverlays.push({
      graphics,
      coordinates: coords,
      center: panel.center,
    });
    return graphics;
  }

  focusOnOverlay(index: number, animated: boolean = false) {
    const overlayInfo = this.pageOverlays[index];
    const overlay = overlayInfo.graphics;
    const camera = this.cameras.main;

    // Convert relative coordinates to world coordinates
    const worldCoords = overlayInfo.coordinates.map(([x, y]) => [
      x + overlayInfo.graphics.x,
      y + overlayInfo.graphics.y
    ]);

    // Compute bounding box
    const xs = worldCoords.map(c => c[0]);
    const ys = worldCoords.map(c => c[1]);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);

    // calculate width and height ratios
    const zoomX = camera.width / width;
    const zoomY = camera.height / height;

    // choose the zoom based on which dimension is dominant
    const zoom = (width / height > camera.width / camera.height) ? zoomX : zoomY;

    // Camera target position: use center of polygon
    const center = overlayInfo.center;

    if (animated) {
      // animate camera to center rectangle with proper zoom
      this.tweens.add({
        targets: camera,
        scrollX: center[0] - camera.width / 2,
        scrollY: center[1] - camera.height / 2,
        zoom: zoom,
        duration: 500,
        ease: 'Power2',
        onComplete: () => {
          // Animate hiding of overlay
          if (overlay) {
            this.tweens.add({
              targets: overlay,
              alpha: 0,
              duration: 400,
              ease: 'Power2',
              onComplete: () => overlay.setVisible(false)
            });
          }
        }
      });
    } else {
      camera.setScroll(center[0] - camera.width / 2, center[1] - camera.height / 2);
      camera.setZoom(zoom);
      overlay.setVisible(false);
    }
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

  private firstPanel() {
    this.currentPanelIndex = 0;
    this.focusOnOverlay(this.currentPanelIndex, true);
    this.playPanelSounds(this.currentPanelIndex);
    EventBus.emit('on-panel-changed', this.currentPanelIndex);
  }

  private previousPanel() {
    if (this.currentPanelIndex > 0) {
      this.currentPanelIndex--;
      this.focusOnOverlay(this.currentPanelIndex, true);
      this.playPanelSounds(this.currentPanelIndex);
      EventBus.emit('on-panel-changed', this.currentPanelIndex);
    }
  }

  private nextPanel() {
    if (this.currentPanelIndex < this.totalPanelAmount - 1) {
      this.currentPanelIndex++;
      this.focusOnOverlay(this.currentPanelIndex, true);
      this.playPanelSounds(this.currentPanelIndex);
      EventBus.emit('on-panel-changed', this.currentPanelIndex);
    }
  }

  private lastPanel() {
    this.currentPanelIndex = this.totalPanelAmount - 1;
    this.focusOnOverlay(this.currentPanelIndex, true);
    this.playPanelSounds(this.currentPanelIndex);
    EventBus.emit('on-panel-changed', this.currentPanelIndex);
  }

  private getFadeDurations(ev: SoundEvent, type: "bgm" | "sfx" | "tts") {
    return {
      fadeIn: ev.fadeIn ?? this.fadeDefaults[type].fadeIn,
      fadeOut: ev.fadeOut ?? this.fadeDefaults[type].fadeOut
    };
  }

  private fadeOutAndStop(sound: Sound.BaseSound, duration: number) {
    this.tweens.add({
      targets: sound,
      volume: 0,
      duration,
      ease: 'Linear',
      onComplete: () => sound.stop()
    });
  }

  private stopMissingLayers(type: "bgm" | "sfx" | "tts", keepKeys: Set<string>, events: SoundEvent[] = []) {
    const map = type === "bgm" ? this.bgmMap : type === "sfx" ? this.sfxMap : this.ttsMap;
    const activeKeys = type === "bgm" ? this.activeBgmKeys : type === "sfx" ? this.activeSfxKeys : this.activeTtsKeys;

    const fadeLookup: Record<string, number> = {};
    events.forEach(ev => {
      const {fadeOut} = this.getFadeDurations(ev, type);
      fadeLookup[`${type}-${ev.src}`] = fadeOut;
    });

    activeKeys.forEach(prevKey => {
      if (!keepKeys.has(prevKey)) {
        const prev = map.get(prevKey);
        if (prev) {
          const fadeDur = fadeLookup[prevKey] ?? this.fadeDefaults[type].fadeOut;
          this.fadeOutAndStop(prev, fadeDur);
          map.delete(prevKey);
        }
      }
    });
  }

  private playPanelSounds(index: number) {
    const chapter = this.chapterData;
    let panel: Panel | undefined;

    let count = 0;
    for (const page of chapter.pages) {
      const panels = page.panels?.length ? page.panels : [{coordinates: [[0, 0], [page.imagePath.length, 0], [page.imagePath.length, page.imagePath.length], [0, page.imagePath.length]]} as Panel];
      for (const p of panels) {
        if (count === index) {
          panel = p;
          break;
        }
        count++;
      }
      if (panel) break;
    }

    // (1) Cancel any pending delayed calls
    this.pendingDelayedCalls.forEach(call => call.destroy());
    this.pendingDelayedCalls = [];

    // (2) Save panel's BGM for restoration when navigating back
    if (panel?.events?.bgm?.length) {
      this.panelBgmMap.set(index, panel.events.bgm);
    }

    // (3) Determine which BGM events to play
    // If the panel has no BGM, check if we have saved BGM for this panel (for backward navigation)
    const bgmEvents = panel?.events?.bgm ?? this.panelBgmMap.get(index) ?? [];

    // (4) Stop layers that are no longer active
    this.stopMissingLayers("bgm", new Set(bgmEvents.map(ev => `bgm-${ev.src}`)), bgmEvents);
    this.stopMissingLayers("sfx", new Set(panel?.events?.sfx?.map(ev => `sfx-${ev.src}`) ?? []), panel?.events?.sfx ?? []);
    this.stopMissingLayers("tts", new Set(panel?.events?.tts?.map(ev => `tts-${ev.src}`) ?? []), panel?.events?.tts ?? []);

    // (5) Play panel sounds
    this.playLayeredSounds("bgm", bgmEvents);
    this.playLayeredSounds("sfx", panel?.events?.sfx ?? []);
    this.playLayeredSounds("tts", panel?.events?.tts ?? []);
  }

  private playLayeredSounds(type: 'bgm' | 'sfx' | 'tts', events: SoundEvent[]) {
    const map = type === "bgm" ? this.bgmMap : type === "sfx" ? this.sfxMap : this.ttsMap;
    const activeKeys = type === "bgm" ? this.activeBgmKeys : type === "sfx" ? this.activeSfxKeys : this.activeTtsKeys;

    const newKeys = new Set<string>();

    events.forEach((ev) => {
      const {fadeIn, fadeOut} = this.getFadeDurations(ev, type);
      const key = `${type}-${ev.src}`;
      newKeys.add(key);

      const alreadyActive = activeKeys.has(key);

      // BGM should continue if already playing and same track
      if (type === "bgm" && alreadyActive) return;

      // SFX/TTs: restart only if specified
      if ((type === "sfx" || type === "tts") && alreadyActive && !ev.restart) return;

      if (alreadyActive && ev.restart) {
        const prev = map.get(key);
        if (prev) {
          this.fadeOutAndStop(prev, fadeOut);
          map.delete(key);
        }
      }

      const sound = this.sound.add(key, {
        loop: ev.loop ?? (type === "bgm"),
        volume: 0
      });
      map.set(key, sound);

      // Play after a delay if specified, otherwise immediately
      const delayedCall = this.time.delayedCall(ev.delay ?? 0, () => {
        sound.play();
        this.tweens.add({targets: sound, volume: ev.volume ?? 1, duration: fadeIn, ease: 'Linear'});

        // Stop after duration if specified
        if (ev.duration) {
          const stopCall = this.time.delayedCall(ev.duration, () => {
            this.fadeOutAndStop(sound, fadeOut);
            map.delete(key);
          });
          this.pendingDelayedCalls.push(stopCall);
        }
      });

      // Keep track of delayed calls for cancellation on skip
      this.pendingDelayedCalls.push(delayedCall);
    });

    // Stop layers that are not present in a new panel
    this.stopMissingLayers(type, newKeys, events);

    if (type === 'bgm') this.activeBgmKeys = newKeys;
    if (type === 'sfx') this.activeSfxKeys = newKeys;
    if (type === 'tts') this.activeTtsKeys = newKeys;
  }
}
