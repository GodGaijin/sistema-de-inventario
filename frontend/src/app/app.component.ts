import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { SessionConfirmationComponent } from './components/session-confirmation/session-confirmation.component';
import { SessionService } from './services/session.service';
import { StateService } from './services/state.service';
import { SidebarService } from './services/sidebar.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NotificationsComponent, SidebarComponent, SessionConfirmationComponent],
  template: `
    <div class="app-container" [class.authenticated]="isAuthenticated()" [class.sidebar-collapsed]="sidebarService.isCollapsed()">
      <app-sidebar *ngIf="isAuthenticated()"></app-sidebar>
      <main class="main-content" [class.with-sidebar]="isAuthenticated()">
        <router-outlet></router-outlet>
      </main>
    </div>
    <app-notifications></app-notifications>
    <app-session-confirmation></app-session-confirmation>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Sistema de Inventario';
  public stateService = inject(StateService);
  public sidebarService = inject(SidebarService);

  constructor(
    private router: Router,
    private sessionService: SessionService
  ) {}

  isAuthenticated() {
    return this.stateService.isAuthenticated();
  }

  ngOnInit() {
    // El SessionService se inicializa automáticamente en su constructor
  }
} 