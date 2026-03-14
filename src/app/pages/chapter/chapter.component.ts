import {AfterViewInit, Component, inject, OnDestroy, ViewChild, ViewContainerRef} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {Subscription} from 'rxjs';
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
export class ChapterComponent implements AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly mangaService = inject(MangaService);
  private chapterSub?: Subscription;

  overlayNumber = 1;
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
    this.onChapterLoaded = this.onChapterLoaded.bind(this);
    this.onOverlayChanged = this.onOverlayChanged.bind(this);

    EventBus.on('chapter-loaded', this.onChapterLoaded);
    EventBus.on('on-overlay-changed', this.onOverlayChanged);

    this.chapterSub = this.chapter$.subscribe(chapterData => {
      // Clear previous game instance if route params changed
      this.container.clear();

      // Create a child game component reference
      const componentRef = this.container.createComponent(PhaserGame);

      // Pass the chapter data to the game component
      componentRef.instance.chapterData = chapterData!;
    });
  }

  ngOnDestroy(): void {
    this.chapterSub?.unsubscribe();
    EventBus.off('chapter-loaded', this.onChapterLoaded);
    EventBus.off('on-overlay-changed', this.onOverlayChanged);
  }

  private onChapterLoaded() {
    this.chapterLoaded = true;
  }

  private onOverlayChanged(currentOverlayIndex: number) {
    this.overlayNumber = currentOverlayIndex + 1;
  }

  gotoFirstOverlay() {
    EventBus.emit('goto-first-overlay');
  }

  gotoPrevOverlay() {
    EventBus.emit('goto-prev-overlay');
  }

  gotoNextOverlay() {
    EventBus.emit('goto-next-overlay');
  }

  gotoLastOverlay() {
    EventBus.emit('goto-last-overlay');
  }
}
