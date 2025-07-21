import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { ErrorInterceptor } from './app/interceptors/error.interceptor';
import { TokenInterceptor } from './app/interceptors/token.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([TokenInterceptor, ErrorInterceptor])),
    provideAnimations()
  ]
}).catch(err => console.error(err)); 