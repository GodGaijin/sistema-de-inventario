import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  registerForm: FormGroup;
  forgotPasswordForm: FormGroup;
  showRegister = false;
  showForgotPassword = false;
  showEmailVerification = false;
  message = '';
  messageType = '';
  pendingEmail = '';
  resendTimer = 0;
  canResend = true;
  turnstileToken: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
    // Registrar callback global para Turnstile
    (window as any).onTurnstileSuccess = (token: string) => {
      this.turnstileToken = token;
    };

    // Renderizar widgets de Turnstile cuando el DOM esté listo
    this.renderTurnstileWidgets();
  }

  private renderTurnstileWidgets(): void {
    // Esperar a que Turnstile esté disponible
    if (typeof (window as any).turnstile !== 'undefined') {
      this.renderWidgets();
    } else {
      // Si Turnstile no está disponible, esperar y reintentar
      setTimeout(() => {
        this.renderTurnstileWidgets();
      }, 1000);
    }
  }

  private renderWidgets(): void {
    if (typeof (window as any).turnstile !== 'undefined') {
      // Renderizar widget de login
      (window as any).turnstile.render('#turnstile-login', {
        sitekey: '0x4AAAAAABmYB-iNDrW2Yw0I',
        callback: 'onTurnstileSuccess',
        theme: 'light'
      });

      // Renderizar widget de registro
      (window as any).turnstile.render('#turnstile-register', {
        sitekey: '0x4AAAAAABmYB-iNDrW2Yw0I',
        callback: 'onTurnstileSuccess',
        theme: 'light'
      });
    }
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;
      
      if (!this.turnstileToken) {
        this.showMessage('Por favor completa el captcha de seguridad.', 'error');
        return;
      }

      const loginData = {
        username,
        password,
        turnstileToken: this.turnstileToken
      };

      this.authService.login(username, password, this.turnstileToken).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          if (error.error?.emailNotVerified) {
            this.pendingEmail = error.error.email;
            this.showEmailVerification = true;
            this.showRegister = false;
            this.showForgotPassword = false;
            this.checkResendStatus();
          } else {
            this.showMessage(error.error?.message || 'Error al iniciar sesión', 'error');
          }
        }
      });
    }
  }

  onRegister(): void {
    if (this.registerForm.valid) {
      const { username, email, password } = this.registerForm.value;
      
      if (!this.turnstileToken) {
        this.showMessage('Por favor completa el captcha de seguridad.', 'error');
        return;
      }

      // Validate password
      if (!this.authService.validatePassword(password)) {
        this.showMessage('La contraseña debe contener al menos una letra, un número y un caracter especial.', 'error');
        return;
      }

      const registerData = {
        username,
        email,
        password,
        turnstileToken: this.turnstileToken
      };

      this.apiService.register(registerData).subscribe({
        next: () => {
          this.showMessage('¡Registro exitoso! Por favor verifica tu email para completar el registro.', 'success');
          this.showRegister = false;
          this.registerForm.reset();
          this.turnstileToken = null;
        },
        error: (error) => {
          this.showMessage(error.error?.message || 'Error al registrarse', 'error');
        }
      });
    }
  }

  onForgotPassword(): void {
    if (this.forgotPasswordForm.valid) {
      const { email } = this.forgotPasswordForm.value;
      
      this.authService.forgotPassword(email).subscribe({
        next: () => {
          this.showMessage('Si el email está registrado, recibirás un enlace de recuperación en tu correo.', 'success');
          this.showForgotPassword = false;
          this.forgotPasswordForm.reset();
        },
        error: (error) => {
          this.showMessage(error.error?.message || 'Error al enviar el email de recuperación', 'error');
        }
      });
    }
  }

  onResendVerification(): void {
    if (this.pendingEmail && this.canResend) {
      this.apiService.resendVerificationEmail(this.pendingEmail).subscribe({
        next: () => {
          this.showMessage('Email de verificación enviado exitosamente. Revisa tu bandeja de entrada.', 'success');
          this.startResendTimer();
        },
        error: (error) => {
          if (error.status === 429) {
            this.resendTimer = error.error.timeRemaining || 90;
            this.canResend = false;
            this.startResendTimer();
          } else {
            this.showMessage(error.error?.message || 'Error al reenviar el email de verificación', 'error');
          }
        }
      });
    }
  }

  checkResendStatus(): void {
    if (this.pendingEmail) {
      this.apiService.checkResendVerificationStatus(this.pendingEmail).subscribe({
        next: (response) => {
          this.canResend = response.canResend;
          if (!response.canResend) {
            this.resendTimer = response.timeRemaining;
            this.startResendTimer();
          }
        },
        error: () => {
          // Si hay error, asumir que puede reenviar
          this.canResend = true;
        }
      });
    }
  }

  startResendTimer(): void {
    if (this.resendTimer > 0) {
      this.canResend = false;
      const interval = setInterval(() => {
        this.resendTimer--;
        if (this.resendTimer <= 0) {
          this.canResend = true;
          clearInterval(interval);
        }
      }, 1000);
    }
  }

  closeEmailVerification(): void {
    this.showEmailVerification = false;
    this.pendingEmail = '';
    this.resendTimer = 0;
    this.canResend = true;
  }

  toggleRegister(): void {
    this.showRegister = !this.showRegister;
    this.showForgotPassword = false;
    this.showEmailVerification = false;
    this.message = '';
    this.turnstileToken = null; // Reset token when switching forms
    
    // Re-renderizar widgets después del cambio
    setTimeout(() => {
      this.renderWidgets();
    }, 200);
  }

  toggleForgotPassword(): void {
    this.showForgotPassword = !this.showForgotPassword;
    this.showRegister = false;
    this.showEmailVerification = false;
    this.message = '';
    this.turnstileToken = null; // Reset token when switching forms
    
    // Re-renderizar widgets después del cambio
    setTimeout(() => {
      this.renderWidgets();
    }, 200);
  }

  private showMessage(message: string, type: string): void {
    this.message = message;
    this.messageType = type;
  }
} 
