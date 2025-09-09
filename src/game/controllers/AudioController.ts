import {MangaKunTypes} from '../../app/types/all-types';
import Phaser from 'phaser';

export class AudioController {

  private scene: Phaser.Scene;

  // Scene-level fade defaults
  // TODO move to a config file?!
  private fadeDefaults = {
    bgm: {fadeIn: 500, fadeOut: 500},
    sfx: {fadeIn: 200, fadeOut: 200},
    tts: {fadeIn: 100, fadeOut: 100}
  };

  private bgmMap: Map<string, Phaser.Sound.BaseSound> = new Map();
  private sfxMap: Map<string, Phaser.Sound.BaseSound> = new Map();
  private ttsMap: Map<string, Phaser.Sound.BaseSound> = new Map();

  private activeBgmKeys: Set<string> = new Set();
  private activeSfxKeys: Set<string> = new Set();
  private activeTtsKeys: Set<string> = new Set();

  // Add a property to track pending delayed calls
  private pendingDelayedCalls: Phaser.Time.TimerEvent[] = [];

  private overlayBgmMap: Map<number, MangaKunTypes.SoundEvent[]> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  playOverlaySounds(chapter: MangaKunTypes.Chapter, overlayIndex: number) {
    let overlay: MangaKunTypes.Overlay | undefined;

    let count = 0;
    for (const page of chapter.pages) {
      const overlays = page.overlays?.length ? page.overlays
        : [
          {
            coordinates: [
              [0, 0], [page.imagePath.length, 0],
              [page.imagePath.length, page.imagePath.length], [0, page.imagePath.length]
            ]
          } as MangaKunTypes.Overlay
        ];
      for (const p of overlays) {
        if (count === overlayIndex) {
          overlay = p;
          break;
        }
        count++;
      }
      if (overlay) break;
    }

    // (1) Cancel any pending delayed calls
    this.pendingDelayedCalls.forEach(call => call.destroy());
    this.pendingDelayedCalls = [];

    // (2) Save overlay's BGM for restoration when navigating back
    if (overlay?.events?.bgm?.length) {
      this.overlayBgmMap.set(overlayIndex, overlay.events.bgm);
    }

    // (3) Determine which BGM events to play
    // If the overlay has no BGM, check if we have saved BGM for this overlay (for backward navigation)
    const bgmEvents = overlay?.events?.bgm ?? this.overlayBgmMap.get(overlayIndex) ?? [];

    // (4) Stop layers that are no longer active
    this.stopMissingLayers("bgm", new Set(bgmEvents.map(ev => `bgm-${ev.src}`)), bgmEvents);
    this.stopMissingLayers("sfx", new Set(overlay?.events?.sfx?.map(ev => `sfx-${ev.src}`) ?? []), overlay?.events?.sfx ?? []);
    this.stopMissingLayers("tts", new Set(overlay?.events?.tts?.map(ev => `tts-${ev.src}`) ?? []), overlay?.events?.tts ?? []);

    // (5) Play overlay sounds
    this.playLayeredSounds("bgm", bgmEvents);
    this.playLayeredSounds("sfx", overlay?.events?.sfx ?? []);
    this.playLayeredSounds("tts", overlay?.events?.tts ?? []);
  }

  private getFadeDurations(ev: MangaKunTypes.SoundEvent, type: "bgm" | "sfx" | "tts") {
    return {
      fadeIn: ev.fadeIn ?? this.fadeDefaults[type].fadeIn,
      fadeOut: ev.fadeOut ?? this.fadeDefaults[type].fadeOut
    };
  }

  private fadeOutAndStop(sound: Phaser.Sound.BaseSound, duration: number) {
    this.scene.tweens.add({
      targets: sound,
      volume: 0,
      duration,
      ease: 'Linear',
      onComplete: () => sound.stop()
    });
  }

  private stopMissingLayers(type: "bgm" | "sfx" | "tts", keepKeys: Set<string>, events: MangaKunTypes.SoundEvent[] = []) {
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

  private playLayeredSounds(type: 'bgm' | 'sfx' | 'tts', events: MangaKunTypes.SoundEvent[]) {
    const map = type === "bgm" ? this.bgmMap : type === "sfx" ? this.sfxMap : this.ttsMap;
    const activeKeys = type === "bgm" ? this.activeBgmKeys : type === "sfx" ? this.activeSfxKeys : this.activeTtsKeys;

    const newKeys = new Set<string>();

    events.forEach((ev) => {
      const {fadeIn, fadeOut} = this.getFadeDurations(ev, type);
      const key = `${type}-${ev.src}`;
      newKeys.add(key);

      const alreadyActive = activeKeys.has(key);
      const targetVolume = ev.volume ?? 1;

      if (alreadyActive) {
        const existing = map.get(key);
        if (existing) {
          const webSound = existing as Phaser.Sound.WebAudioSound;
          const currentVolume = webSound.volume ?? 1;

          // Smoothly transition to a new volume level if it changed
          if (currentVolume !== targetVolume) {
            this.scene.tweens.add({
              targets: webSound,
              volume: targetVolume,
              duration: fadeIn,
              ease: 'Linear'
            });
          }
        }

        // BGM should keep playing if already active
        if (type === "bgm") return;

        // SFX/TTS: restart if requested
        if ((type === "sfx" || type === "tts") && !ev.restart) return;
        if (ev.restart) {
          this.fadeOutAndStop(existing!, fadeOut);
          map.delete(key);
        }
      }

      // Create new sound if not active or forced restart
      const sound = this.scene.sound.add(key, {
        loop: ev.loop ?? (type === "bgm"),
        volume: 0
      });
      map.set(key, sound);

      const delayedCall = this.scene.time.delayedCall(ev.delay ?? 0, () => {
        sound.play();
        this.scene.tweens.add({targets: sound, volume: targetVolume, duration: fadeIn, ease: 'Linear'});

        if (ev.duration) {
          const stopCall = this.scene.time.delayedCall(ev.duration, () => {
            this.fadeOutAndStop(sound, fadeOut);
            map.delete(key);
          });
          this.pendingDelayedCalls.push(stopCall);
        }
      });

      this.pendingDelayedCalls.push(delayedCall);
    });

    // Stop layers missing in the new overlay
    this.stopMissingLayers(type, newKeys, events);

    if (type === 'bgm') this.activeBgmKeys = newKeys;
    if (type === 'sfx') this.activeSfxKeys = newKeys;
    if (type === 'tts') this.activeTtsKeys = newKeys;
  }
}
