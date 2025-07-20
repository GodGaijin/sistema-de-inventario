import { Component, inject, OnInit } from '@angular/core';
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
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  message = '';
  messageType = '';
  isLoading = false;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  constructor() {
    this.resetPasswordForm = this.fb.group({
      verificationCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Leer el código desde query params si existe
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      console.log('🔍 Reset Password - Query Params:', params);
      console.log('📝 Code from params:', code);
      
      if (code) {
        console.log('✅ Setting verification code:', code);
        this.resetPasswordForm.patchValue({
          verificationCode: code
        });
      } else {
        console.log('⚠️ No code found in query params');
      }
    });

    // También verificar si hay parámetros en la URL actual
    const urlParams = new URLSearchParams(window.location.search);
    const urlCode = urlParams.get('code');
    if (urlCode && !this.resetPasswordForm.get('verificationCode')?.value) {
      console.log('🔍 Found code in URL params:', urlCode);
      this.resetPasswordForm.patchValue({
        verificationCode: urlCode
      });
    }
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
    if (this.resetPasswordForm.valid) {
      this.isLoading = true;
      const { verificationCode, newPassword } = this.resetPasswordForm.value;
      
      // Validate password
      if (!this.authService.validatePassword(newPassword)) {
        this.showMessage('La contraseña debe contener al menos una letra, un número y un caracter especial.', 'error');
        this.isLoading = false;
        return;
      }

      this.authService.resetPassword(verificationCode, newPassword).subscribe({
        next: () => {
          this.showMessage('Contraseña actualizada exitosamente. Redirigiendo al login...', 'success');
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          console.log('🔍 Reset Password Error:', error);
          
          let errorMessage = 'Error al restablecer la contraseña';
          
          // Manejar diferentes tipos de errores
          if (error.status === 400) {
            if (error.error?.message) {
              errorMessage = error.error.message;
            } else {
              errorMessage = 'Código de verificación inválido o expirado';
            }
          } else if (error.status === 500) {
            errorMessage = 'Error interno del servidor. Inténtalo de nuevo.';
          } else if (error.status === 0) {
            errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
          }
          
          this.showMessage(errorMessage, 'error');
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
