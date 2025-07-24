import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  turnstileToken: string | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
      // Agrega aquí otros campos si tienes
    });
  }

  ngOnInit(): void {
    // Registrar callback global para Turnstile
    (window as any).onTurnstileSuccess = (token: string) => {
      this.turnstileToken = token;
    };
  }

  onSubmit(): void {
    if (!this.turnstileToken) {
      alert('Por favor completa el captcha de seguridad.');
      return;
    }
    if (this.registerForm.invalid) {
      return;
    }
    const registerData = {
      ...this.registerForm.value,
      turnstileToken: this.turnstileToken
    };
    this.apiService.register(registerData).subscribe(
      (response) => {
        // Maneja el éxito (puedes mostrar un mensaje o redirigir)
      },
      (error) => {
        // Maneja el error (puedes mostrar un mensaje de error)
      }
    );
  }
} 