import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Observable} from 'rxjs';
import {MangaService} from '../../services/manga.service';
import {RouterLink} from '@angular/router';
import {Manga} from '../../types/all-types';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  private readonly mangaService = inject(MangaService);
  mangas$: Observable<Manga[]> = this.mangaService.getMangas();
}
