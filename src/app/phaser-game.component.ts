import {AfterViewInit, Component, Input, OnDestroy, ViewChild} from "@angular/core";
import {Game} from "phaser";
import StartGame from "../game/main";
import {EventBus} from '../game/EventBus';
import {MangaKunTypes} from './types/all-types';

@Component({
  selector: 'phaser-game',
  template: '<div #container id="game-container" class="h-100 w-100 flex-grow-1"></div>',
  standalone: true,
})
export class PhaserGame implements AfterViewInit, OnDestroy {
  game!: Game;

  @Input() chapterData!: MangaKunTypes.Chapter;
  @ViewChild('container') container!: HTMLElement;

  ngAfterViewInit() {
    this.initGame();

    // resize listener
    window.addEventListener('resize', this.onResize);
  }

  private initGame() {
    this.game = StartGame('game-container', this.chapterData);
  }

  private onResize = () => {
    if (this.game) {
      // Try to change the game (canvas) size
      this.game.scale.setGameSize(
        Math.floor(window.innerWidth),
        Math.floor(window.innerHeight)
      );
      // Refocus on the same overlay
      EventBus.emit('focus-on-current-overlay');
    }
  }

  ngOnDestroy() {
    if (this.game) {
      this.game.destroy(true);
    }
    window.removeEventListener('resize', this.onResize);
  }
}
