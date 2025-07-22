import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css']
})
export class VerifyEmailComponent implements OnInit {
  token: string = '';
  loading: boolean = true;
  verified: boolean = false;
  error: string = '';
  message: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.token = params['token'];
      if (this.token) {
        this.verifyEmail();
      } else {
        this.error = 'Token de verificación no válido';
        this.loading = false;
      }
    });
  }

  async verifyEmail(): Promise<void> {
    try {
      this.loading = true;
      const response = await this.apiService.verifyEmail(this.token).toPromise();
      
      this.verified = true;
      this.message = response.message || 'Email verificado exitosamente';
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
      
    } catch (error: any) {
      this.error = error.error?.message || 'Error al verificar el email';
      this.verified = false;
    } finally {
      this.loading = false;
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
} 