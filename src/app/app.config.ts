import {ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection} from '@angular/core';
import {provideRouter, TitleStrategy} from '@angular/router';

import {routes} from './app.routes';
import {CustomTitleStrategy} from './strategies/CustomTitleStrategy';
import {provideHttpClient} from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    {provide: TitleStrategy, useClass: CustomTitleStrategy},
    provideHttpClient()
  ]
};
