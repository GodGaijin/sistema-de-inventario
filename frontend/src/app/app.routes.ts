import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { HomeComponent } from './components/home/home.component';
import { ProductsComponent } from './components/products/products.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { DistributorsComponent } from './components/distributors/distributors.component';
import { AuditsComponent } from './components/audits/audits.component';
import { CommerceDataComponent } from './components/commerce-data/commerce-data.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { SettingsComponent } from './components/settings/settings.component';

import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { SeniorAdminGuard } from './guards/senior-admin.guard';
import { RedirectGuard } from './guards/redirect.guard';
import { ResetPasswordGuard } from './guards/reset-password.guard';

export const routes: Routes = [
  // Ruta raíz - redirige inteligentemente basado en autenticación
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  
  // Rutas públicas con verificación de token
  { path: 'login', component: LoginComponent, canActivate: [RedirectGuard] },
  { path: 'reset-password', component: ResetPasswordComponent, canActivate: [ResetPasswordGuard] },
  
  // Rutas protegidas
  { path: 'dashboard', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'products', component: ProductsComponent, canActivate: [AuthGuard] },
  { path: 'categories', component: CategoriesComponent, canActivate: [AuthGuard] },
  { path: 'distributors', component: DistributorsComponent, canActivate: [AuthGuard] },
  { path: 'audits', component: AuditsComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'commerce-data', component: CommerceDataComponent, canActivate: [AuthGuard] },
  { path: 'user-management', component: UserManagementComponent, canActivate: [AuthGuard, SeniorAdminGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
  
  // Catch-all route - redirige inteligentemente (SIN pathMatch: 'full')
  { path: '**', redirectTo: '/dashboard' }
]; 