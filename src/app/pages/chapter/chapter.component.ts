import {AfterViewInit, Component, inject, ViewChild, ViewContainerRef} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {switchMap} from 'rxjs/operators';
import {MangaService} from '../../services/manga.service';
import {PhaserGame} from '../../phaser-game.component';
import {EventBus} from '../../../game/EventBus';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'app-chapter',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink
  ],
  templateUrl: './chapter.component.html',
  styleUrl: './chapter.component.scss'
})
export class ChapterComponent implements AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly mangaService = inject(MangaService);

  panelNum = 1;
  chapterLoaded = false;

  @ViewChild('container', {read: ViewContainerRef}) container!: ViewContainerRef;

  chapter$ = this.route.paramMap.pipe(
    switchMap(params => {
      const mangaId = params.get('id') ?? '';
      const volumeNumber = parseInt(params.get('volume') ?? '0', 10);
      const chapterNumber = parseInt(params.get('chapter') ?? '0', 10);
      return this.mangaService.getChapterBy(mangaId, volumeNumber, chapterNumber);
    })
  );

  ngAfterViewInit(): void {
    this.chapter$.subscribe(chapterData => {
      // Create a child game component reference
      const componentRef = this.container.createComponent(PhaserGame);

      // Pass the chapter data to the game component
      componentRef.instance.chapterData = chapterData!;

      EventBus.on('chapter-loaded', () => this.chapterLoaded = true);
      EventBus.on('on-panel-changed', (currentPanelIndex: number) => this.panelNum = currentPanelIndex + 1);
    });
  }

  gotoFirstPanel() {
    EventBus.emit('goto-first-panel');
  }

  gotoPrevPanel() {
    EventBus.emit('goto-prev-panel');
  }

  gotoNextPanel() {
    EventBus.emit('goto-next-panel');
  }

  gotoLastPanel() {
    EventBus.emit('goto-last-panel');
  }
}
