# MangaKun

An interactive online manga viewer built with [Angular](https://angular.dev/) and [PhaserJS](https://phaser.io/). Features overlay-guided navigation and ambient audio for an immersive reading experience.

Demo website available at https://vakho10.github.io/mangakun

![Demo GIF](demo.gif)

---

## Further Reading (For Developers)

### 🔹 Core Concepts

* **Chapters** are defined by a JSON file containing:

  * Metadata (`id`, `title`, `author`, `description`, `tags`, `rating`, etc.)
  * Volumes → Chapters → Pages → Panels
  * Each **Page** has an image and panel definitions.
  * Each **Panel** can define:

    * `coordinates` → polygonal region of the panel
    * `center` → focus point for camera zoom
    * `events` → background music (BGM), sound effects (SFX), and text-to-speech/narration (TTS)

* **Assets** (images, audio) are preloaded in a `PreloaderScene`.

---

### 🎮 Navigation Behavior

#### ▶️ Forward (Next Panel)

When moving **forward** into a new panel:

**1. Camera Transition** - Smooth pan & zoom into the panel’s `center` and fit its polygon area.

**2. Audio Handling**

* **BGM**: Replaces previous background music unless it’s the same track.
* **SFX**: New sound effects trigger with optional looping and fade-in.
* **TTS**: Narration/voice line plays with optional delays and fade-in.

**3. Overlay Reveal** - Black overlay fades out for a cinematic reveal.

#### ◀️ Backward (Previous Panel)

When moving **backward** into an earlier panel:

1. Camera pans & zooms back to the previous `center`.
2. Previous **BGM**, **SFX**, and **TTS** are restored.
3. Overlay fade animation ensures smooth navigation.

#### 🔄 Panel Revisit

* Same **BGM** across panels = continues seamlessly.
* **SFX/TTS** always restart on entry.
* Allows back-and-forth reading without breaking immersion.

---

### 📦 Asset Loading & Caching

* Uses **Phaser Loader** with a `PreloaderScene`.
* Dynamically loads:

  * Page images
  * Audio tracks (BGM/SFX/TTS)
* Prevents duplicate loads with Phaser’s asset cache.
* Shows progress bar + text while loading.

---

### 🎨 Panel System

* **Panels are polygons** defined by coordinates.
* **Center point** = precomputed target for camera focus.
* **Events system** = binds BGM, SFX, and TTS to each panel.
* Designed for **non-rectangular manga panels**.

---

### 📑 Example JSON Structure

Here’s a simplified example of how chapters and panels are defined:

```json
[
  {
    "available": true,
    "id": "all-you-need-is-kill",
    "title": "All You Need Is Kill",
    "author": "Hiroshi Sakurazaka, Ryosuke Takeuchi",
    "coverUrl": "assets/mangas/all-you-need-is-kill/cover.jpg",
    "description": "A soldier relives the same deadly battle against alien invaders, learning and improving with each loop.",
    "lastUpdated": "2025-08-26T17:54:00Z",
    "tags": ["Sci-Fi", "Seinen", "Time Loop"],
    "rating": 4.6,
    "volumes": [
      {
        "number": 1,
        "title": "Volume 1",
        "coverUrl": "assets/mangas/all-you-need-is-kill/volume-1/cover.jpg",
        "chapters": [
          {
            "number": 1,
            "title": "Chapter 1",
            "pages": [
              {
                "pageNumber": 1,
                "imagePath": "assets/mangas/all-you-need-is-kill/volume-1/chapter-1/page-1.jpg",
                "panels": [
                  {
                    "coordinates": [
                      [0, 0], [784, 0], [784, 482],
                      [679, 482], [679, 552],
                      [82, 552], [82, 482], [0, 482]
                    ],
                    "center": [392, 274],
                    "events": {
                      "bgm": [
                        {
                          "src": "assets/audios/Modern_Battlefield.mp3",
                          "volume": 0.4,
                          "loop": true
                        }
                      ],
                      "sfx": [
                        {
                          "src": "assets/audios/Slow_Breathing.mp3",
                          "loop": true,
                          "volume": 0.35,
                          "fadeIn": 500
                        }
                      ],
                      "tts": [
                        {
                          "src": "assets/audios/1.mp3",
                          "restart": true,
                          "delay": 750,
                          "fadeIn": 500
                        }
                      ]
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
]
```

---

### 🚀 Planned Features

* Visual **editor** (drag & drop panel segmentation, audio assignment)
* More **transition effects** (swipes, dissolves)
* Save/load reading progress
* Touch & mobile gesture support

### 📦 Other Useful Links & Stuff

* https://polygonzone.roboflow.com - Helpful to get coordinates of polygons for panels.
* https://docs.phaser.io - PhaserJS documentation.
* https://finevoice.fineshare.com/ai-voice-changer - AI voice changer. For example, I used AI bots for "All You Need is Kill" manga characters: Keiji (Daniel), Rita (Emily), Radio Voice (Henry Young), Jin (James).
