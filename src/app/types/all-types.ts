export namespace MangaKunTypes {

  export type PointTuple = [number, number];

  export interface Manga {
    available: boolean;
    id: string;
    title: string;
    author: string;
    coverUrl: string;
    description: string;
    lastUpdated: Date;
    tags?: string[];
    rating?: number; // 0..5
    volumes: Volume[];
  }

  export interface Volume {
    number: number;
    title?: string;
    coverUrl: string;
    chapters?: Chapter[];
  }

  export interface Chapter {
    number: number;
    title?: string;
    coverImage?: string;
    pages: Page[];
  }

  export interface Page {
    pageNumber: number;
    imagePath: string;
    overlays?: Overlay[];
  }

  export interface Overlay {
    coordinates?: PointTuple[];
    events?: {
      bgm?: SoundEvent[];
      sfx?: SoundEvent[];
      tts?: SoundEvent[];
    }
  }

  export interface SoundEvent {
    src: string;
    volume?: number;
    delay?: number;
    duration?: number;
    loop?: boolean;
    restart?: boolean;
    fadeIn?: number;
    fadeOut?: number;
  }
}
