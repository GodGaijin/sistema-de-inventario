import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

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
  message = '';
  messageType = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
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

  onLogin(): void {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;
      
      this.authService.login(username, password).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.showMessage(error.error?.message || 'Error al iniciar sesión', 'error');
        }
      });
    }
  }

  onRegister(): void {
    if (this.registerForm.valid) {
      const { username, email, password } = this.registerForm.value;
      
      // Validate password
      if (!this.authService.validatePassword(password)) {
        this.showMessage('La contraseña debe contener al menos una letra, un número y un caracter especial.', 'error');
        return;
      }

      this.authService.register(username, email, password).subscribe({
        next: () => {
          this.showMessage('¡Registro exitoso! Por favor inicia sesión.', 'success');
          this.showRegister = false;
          this.registerForm.reset();
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

  toggleRegister(): void {
    this.showRegister = !this.showRegister;
    this.showForgotPassword = false;
    this.message = '';
  }

  toggleForgotPassword(): void {
    this.showForgotPassword = !this.showForgotPassword;
    this.showRegister = false;
    this.message = '';
  }

  private showMessage(message: string, type: string): void {
    this.message = message;
    this.messageType = type;
  }
} 
