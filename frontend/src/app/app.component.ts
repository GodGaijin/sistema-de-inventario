import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { SessionService } from './services/session.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationsComponent],
  template: `
    <router-outlet></router-outlet>
    <app-notifications></app-notifications>
  `
})
export class AppComponent implements OnInit {
  title = 'Sistema de Inventario';

  constructor(
    private router: Router,
    private sessionService: SessionService
  ) {}

  ngOnInit() {
    // Log para debugging - Angular manejará las rutas directamente
    console.log('🚀 App initialized - Angular Router will handle all routes');
    // El SessionService se inicializa automáticamente en su constructor
  }
} 