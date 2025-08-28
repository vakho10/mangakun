import {Routes} from '@angular/router';
import {NotFoundComponent} from './pages/not-found/not-found.component';
import {HomeComponent} from './pages/home/home.component';
import {AboutUsComponent} from './pages/about-us/about-us.component';
import {ContactUsComponent} from './pages/contact-us/contact-us.component';
import {MainLayoutComponent} from './layout/main-layout/main-layout.component';
import {ChapterLayoutComponent} from './layout/chapter-layout/chapter-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        component: HomeComponent,
        pathMatch: 'full'
      },
      {
        path: 'manga/:id',
        title: 'Manga',
        loadComponent: () => import('./pages/manga/manga.component').then(m => m.MangaComponent)
      },
      {
        path: 'about-us',
        title: 'About Us',
        component: AboutUsComponent
      },
      {
        path: 'contact-us',
        title: 'Contact Us',
        component: ContactUsComponent
      }
    ]
  },
  {
    path: 'manga/:id/volume/:volume/chapter/:chapter',
    component: ChapterLayoutComponent,
    children: [
      {
        path: '',
        title: 'Chapter',
        pathMatch: 'full',
        loadComponent: () => import('./pages/chapter/chapter.component').then(c => c.ChapterComponent)
      }
    ]
  },
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Not Found'
  },
];
