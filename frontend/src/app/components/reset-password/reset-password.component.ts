import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent {
  resetPasswordForm: FormGroup;
  token: string = '';
  message = '';
  messageType = '';
  isLoading = false;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  constructor() {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.showMessage('Token de recuperación no válido.', 'error');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid && this.token) {
      this.isLoading = true;
      const { newPassword } = this.resetPasswordForm.value;
      
      // Validate password
      if (!this.authService.validatePassword(newPassword)) {
        this.showMessage('La contraseña debe contener al menos una letra, un número y un caracter especial.', 'error');
        this.isLoading = false;
        return;
      }

      this.authService.resetPassword(this.token, newPassword).subscribe({
        next: () => {
          this.showMessage('Contraseña actualizada exitosamente. Redirigiendo al login...', 'success');
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          this.showMessage(error.error?.message || 'Error al restablecer la contraseña', 'error');
          this.isLoading = false;
        }
      });
    }
  }

  private showMessage(message: string, type: string): void {
    this.message = message;
    this.messageType = type;
  }
} 
