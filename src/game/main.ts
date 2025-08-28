import {PreloaderScene} from './scenes/PreloaderScene';
import {Game, Scale, Types} from "phaser";
import {ChapterScene} from './scenes/ChapterScene';
import {Chapter} from '../app/types/all-types';

const StartGame = (parent: string, chapterData: Chapter) => {
  const config: Types.Core.GameConfig = {
    type: Phaser.AUTO,
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
    scene: [new PreloaderScene(chapterData), ChapterScene]
  }
  return new Game(config);
}

export default StartGame;
