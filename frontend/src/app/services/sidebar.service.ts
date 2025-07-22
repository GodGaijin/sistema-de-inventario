import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private _isCollapsed = signal(false);
  private _isMobileMenuOpen = signal(false);

  public isCollapsed = this._isCollapsed.asReadonly();
  public isMobileMenuOpen = this._isMobileMenuOpen.asReadonly();

  toggleSidebar(): void {
    this._isCollapsed.update(current => !current);
  }

  collapseSidebar(): void {
    this._isCollapsed.set(true);
  }

  expandSidebar(): void {
    this._isCollapsed.set(false);
  }

  // Mobile menu methods
  openMobileMenu(): void {
    this._isMobileMenuOpen.set(true);
  }

  closeMobileMenu(): void {
    this._isMobileMenuOpen.set(false);
  }

  toggleMobileMenu(): void {
    this._isMobileMenuOpen.update(current => !current);
  }
} 