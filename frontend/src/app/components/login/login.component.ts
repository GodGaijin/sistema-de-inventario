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
      console.log('Turnstile token recibido:', token);
      this.turnstileToken = token;
    };

    // Verificar si Turnstile se está cargando
    this.checkTurnstileLoading();
  }

  private checkTurnstileLoading(): void {
    // Verificar si el script de Turnstile se cargó
    setTimeout(() => {
      if (typeof (window as any).turnstile !== 'undefined') {
        console.log('✅ Turnstile script cargado correctamente');
      } else {
        console.error('❌ Turnstile script no se cargó');
        // Intentar cargar el script manualmente
        this.loadTurnstileScript();
      }
    }, 2000);
  }

  private loadTurnstileScript(): void {
    console.log('🔄 Intentando cargar Turnstile manualmente...');
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('✅ Turnstile script cargado manualmente');
      // Renderizar los widgets después de cargar el script
      setTimeout(() => {
        this.renderTurnstileWidgets();
      }, 500);
    };
    script.onerror = () => {
      console.error('❌ Error al cargar Turnstile script');
    };
    document.head.appendChild(script);
  }

  private renderTurnstileWidgets(): void {
    if (typeof (window as any).turnstile !== 'undefined') {
      console.log('🎨 Renderizando widgets de Turnstile...');
      // Renderizar widgets en todos los contenedores
      const containers = document.querySelectorAll('.cf-turnstile');
      containers.forEach((container, index) => {
        (window as any).turnstile.render(container, {
          sitekey: '0x4AAAAAABmYB-iNDrW2Yw0I',
          callback: 'onTurnstileSuccess'
        });
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
    
    // Renderizar widgets de Turnstile después del cambio
    setTimeout(() => {
      this.renderTurnstileWidgets();
    }, 100);
  }

  toggleForgotPassword(): void {
    this.showForgotPassword = !this.showForgotPassword;
    this.showRegister = false;
    this.showEmailVerification = false;
    this.message = '';
    this.turnstileToken = null; // Reset token when switching forms
    
    // Renderizar widgets de Turnstile después del cambio
    setTimeout(() => {
      this.renderTurnstileWidgets();
    }, 100);
  }

  private showMessage(message: string, type: string): void {
    this.message = message;
    this.messageType = type;
  }
} 
