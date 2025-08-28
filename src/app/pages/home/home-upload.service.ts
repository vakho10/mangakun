import { Injectable } from '@angular/core';
import { Observable, Subject, interval, map, scan, startWith, switchMap, takeUntil, takeWhile, catchError, of } from 'rxjs';

export interface UploadResult {
  name: string;
  size: number;
  type: string;
}

export interface UploadState {
  progress: number; // 0..100
  status: 'idle' | 'uploading' | 'completed' | 'error';
  results?: UploadResult[];
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class HomeUploadService {
  // In a real app, inject HttpClient and call backend with reportProgress
  // constructor(private http: HttpClient) {}

  upload(files: File[]): Observable<UploadState> {
    if (!files || files.length === 0) {
      return of<UploadState>({ progress: 0, status: 'error', error: 'No files to upload' });
    }

    const cancel$ = new Subject<void>();

    const results: UploadResult[] = files.map((f) => ({ name: f.name, size: f.size, type: f.type }));

    // Simulate upload progress using interval
    const totalMs = Math.min(4000 + files.length * 500, 12000); // cap at 12s
    const ticks = Math.ceil(totalMs / 100);

    const progress$ = interval(100).pipe(
      startWith(-1),
      map((i) => Math.min(Math.round(((i + 1) / ticks) * 100), 100)),
      takeUntil(cancel$),
      takeWhile((p) => p < 100, true)
    );

    return progress$.pipe(
      scan< number, UploadState >(
        (state, p) => ({ progress: p, status: p >= 100 ? 'completed' : 'uploading' }),
        { progress: 0, status: 'idle' }
      ),
      map((s) => (s.status === 'completed' ? { ...s, results } : s)),
      catchError((err) => of<UploadState>({ progress: 0, status: 'error', error: String(err) }))
    );
  }
}
