import {PreloaderScene} from './scenes/PreloaderScene';
import {AUTO, Game, Scale, Types} from "phaser";
import {ChapterScene} from './scenes/ChapterScene';
import {MangaKunTypes} from '../app/types/all-types';

const StartGame = (parent: string, chapterData: MangaKunTypes.Chapter) => {
  const config: Types.Core.GameConfig = {
    type: AUTO,
    title: 'MangaFlow',
    parent: parent,
    backgroundColor: '#000000',
    pixelArt: false, // TODO Check how this affects scaling
    width: Math.floor(window.innerWidth),
    height: Math.floor(window.innerHeight),
    scale: {
      mode: Scale.NONE,
      autoCenter: Scale.NO_CENTER,
    },
    scene: [
      new PreloaderScene(chapterData),
      ChapterScene
    ]
  }
  return new Game(config);
}

export default StartGame;
