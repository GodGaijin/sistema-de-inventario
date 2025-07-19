import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationsComponent } from './components/notifications/notifications.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationsComponent],
  template: `
    <router-outlet></router-outlet>
    <app-notifications></app-notifications>
  `
})
export class AppComponent {
  title = 'Sistema de Inventario';
} 