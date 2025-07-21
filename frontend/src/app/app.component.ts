import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { SessionService } from './services/session.service';
import { StateService } from './services/state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationsComponent, SidebarComponent],
  template: `
    <div class="app-container">
      <app-sidebar *ngIf="isAuthenticated()"></app-sidebar>
      <main class="main-content" [class.with-sidebar]="isAuthenticated()">
        <router-outlet></router-outlet>
      </main>
    </div>
    <app-notifications></app-notifications>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Sistema de Inventario';
  private stateService = inject(StateService);

  constructor(
    private router: Router,
    private sessionService: SessionService
  ) {}

  isAuthenticated() {
    const authenticated = this.stateService.isAuthenticated();
    console.log('🔍 AppComponent - isAuthenticated:', authenticated);
    console.log('🔍 AppComponent - currentUser:', this.stateService.currentUser());
    return authenticated;
  }

  ngOnInit() {
    // Log para debugging - Angular manejará las rutas directamente
    console.log('🚀 App initialized - Angular Router will handle all routes');
    // El SessionService se inicializa automáticamente en su constructor
  }
} 