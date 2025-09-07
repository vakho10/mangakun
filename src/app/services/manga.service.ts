import {Injectable} from '@angular/core';
import {map, Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {MangaKunTypes} from '../types/all-types';

@Injectable({providedIn: 'root'})
export class MangaService {

  // For now (for demo) we'll use a static JSON file
  private readonly dbPath = '/db.json';

  constructor(private http: HttpClient) {
  }

  getMangas(): Observable<MangaKunTypes.Manga[]> {
    return this.http.get<MangaKunTypes.Manga[]>(`${environment.apiUrl}${this.dbPath}`);
  }

  getMangaById(id: string): Observable<MangaKunTypes.Manga | undefined> {
    return this.getMangas().pipe(
      map((mangas) => mangas.find((m) => m.id === id))
    );
  }

  getChapterBy(
    mangaId: string,
    volumeNumber: number,
    chapterNumber: number
  ): Observable<MangaKunTypes.Chapter | undefined> {
    return this.getMangaById(mangaId).pipe(
      map((manga) => {
        const volume = manga?.volumes?.find(volume => volume.number === volumeNumber);
        return volume?.chapters?.find(ch => ch.number === chapterNumber);
      })
    );
  }
}
