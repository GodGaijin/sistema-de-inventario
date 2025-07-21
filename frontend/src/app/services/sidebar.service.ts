import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private _isCollapsed = signal(false);

  public isCollapsed = this._isCollapsed.asReadonly();

  toggleSidebar(): void {
    this._isCollapsed.update(current => !current);
  }

  collapseSidebar(): void {
    this._isCollapsed.set(true);
  }

  expandSidebar(): void {
    this._isCollapsed.set(false);
  }
} 