import {AfterViewInit, Component, Input, OnDestroy, ViewChild} from "@angular/core";
import {Game} from "phaser";
import StartGame from "../game/main";
import {Chapter} from './types/all-types';
import {EventBus} from '../game/EventBus';

@Component({
  selector: 'phaser-game',
  template: '<div #container id="game-container" class="h-100 w-100 flex-grow-1"></div>',
  standalone: true,
})
export class PhaserGame implements AfterViewInit, OnDestroy {
  game!: Game;

  @Input() chapterData!: Chapter;
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
      // Try to change game (canvas) size
      this.game.scale.setGameSize(
        Math.floor(window.innerWidth),
        Math.floor(window.innerHeight)
      );
      // Refocus on the same panel
      EventBus.emit('focus-on-current-panel');
    }
  }

  ngOnDestroy() {
    if (this.game) {
      this.game.destroy(true);
    }
    window.removeEventListener('resize', this.onResize);
  }
}
