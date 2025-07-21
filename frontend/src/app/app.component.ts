import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { SessionService } from './services/session.service';
import { StateService } from './services/state.service';
import { SidebarService } from './services/sidebar.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationsComponent, SidebarComponent],
  template: `
    <div class="app-container" [class.authenticated]="isAuthenticated()" [class.sidebar-collapsed]="sidebarService.isCollapsed()">
      <!-- Debug info -->
      <div style="position: fixed; top: 10px; right: 10px; background: red; color: white; padding: 10px; z-index: 10000;">
        Auth: {{ isAuthenticated() }} | User: {{ stateService.currentUser()?.username }}
      </div>
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
  public sidebarService = inject(SidebarService);

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
    // El SessionService se inicializa automáticamente en su constructor
  }
} 