import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProductsComponent } from './components/products/products.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { DistributorsComponent } from './components/distributors/distributors.component';
import { AuditsComponent } from './components/audits/audits.component';
import { CommerceDataComponent } from './components/commerce-data/commerce-data.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { DatabaseManagementComponent } from './components/database-management/database-management.component';

import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { SeniorAdminGuard } from './guards/senior-admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'products', component: ProductsComponent, canActivate: [AuthGuard] },
  { path: 'categories', component: CategoriesComponent, canActivate: [AuthGuard] },
  { path: 'distributors', component: DistributorsComponent, canActivate: [AuthGuard] },
  { path: 'audits', component: AuditsComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'commerce-data', component: CommerceDataComponent, canActivate: [AuthGuard] },
  { path: 'user-management', component: UserManagementComponent, canActivate: [AuthGuard, SeniorAdminGuard] },
  { path: 'database-management', component: DatabaseManagementComponent, canActivate: [AuthGuard, SeniorAdminGuard] },
  { path: '**', redirectTo: '/login' }
]; 