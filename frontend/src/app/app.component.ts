import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { SessionService } from './services/session.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationsComponent, SidebarComponent],
  template: `
    <div class="app-container">
      <app-sidebar></app-sidebar>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
    <app-notifications></app-notifications>
  `,
  styleUrls: ['./app.component.css']
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