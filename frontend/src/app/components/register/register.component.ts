import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  message = '';
  messageType = '';
  turnstileToken: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Registrar callback global para Turnstile
    (window as any).onTurnstileSuccess = (token: string) => {
      console.log('Token recibido en registro:', token);
      this.turnstileToken = token;
    };

    // Renderizar widget de Turnstile cuando el DOM esté listo
    setTimeout(() => {
      this.renderTurnstileWidget();
    }, 1000);
  }

  private renderTurnstileWidget(): void {
    // Esperar a que Turnstile esté disponible
    if (typeof (window as any).turnstile !== 'undefined') {
      this.renderWidget();
    } else {
      // Si Turnstile no está disponible, esperar y reintentar
      setTimeout(() => {
        this.renderTurnstileWidget();
      }, 1000);
    }
  }

  private renderWidget(): void {
    if (typeof (window as any).turnstile !== 'undefined') {
      const registerContainer = document.getElementById('turnstile-register');
      if (registerContainer) {
        (window as any).turnstile.render('#turnstile-register', {
          sitekey: '0x4AAAAAABmYB-iNDrW2Yw0I',
          callback: (token: string) => {
            console.log('Callback ejecutado en registro con token:', token);
            this.turnstileToken = token;
          },
          theme: 'light'
        });
      }
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
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (error) => {
          this.showMessage(error.error?.message || 'Error al registrarse', 'error');
        }
      });
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  private showMessage(message: string, type: string): void {
    this.message = message;
    this.messageType = type;
  }
} 