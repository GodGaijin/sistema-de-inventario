import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { StateService } from '../../services/state.service';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private stateService = inject(StateService);

  // Signals reactivos
  currentUser = this.stateService.currentUser;
  isAdmin = this.stateService.isAdmin;
  isSeniorAdmin = this.stateService.isSeniorAdmin;

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
} 
