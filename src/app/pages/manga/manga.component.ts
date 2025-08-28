import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {AsyncPipe, CommonModule} from '@angular/common';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {map, switchMap} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {MangaService} from '../../services/manga.service';
import {Manga} from '../../types/all-types';

@Component({
  selector: 'app-manga',
  standalone: true,
  imports: [CommonModule, RouterLink, AsyncPipe],
  templateUrl: './manga.component.html',
  styleUrl: './manga.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MangaComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly mangaService = inject(MangaService);

  manga$: Observable<Manga | undefined> = this.route.paramMap.pipe(
    map(params => params.get('id') ?? ''),
    switchMap(id => this.mangaService.getMangaById(id))
  );
}
