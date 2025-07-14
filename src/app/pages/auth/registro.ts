import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AbstractControl,FormBuilder, ReactiveFormsModule, Validators, ValidatorFn, ValidationErrors } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';

// Importaciones de PrimeNG para el estilo
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { ToastModule } from 'primeng/toast'; 
import { MessageService } from 'primeng/api';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  // No devuelve error si los campos aún no existen o están vacíos.
  if (!password || !confirmPassword || !password.value || !confirmPassword.value) {
    return null;
  }

  // Devuelve un error 'passwordMismatch' si los valores no son iguales.
  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
};


@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    RippleModule,
    AppFloatingConfigurator,
    ToastModule
  ],
  providers: [MessageService],
  template: ` 
  <p-toast></p-toast>
  <app-floating-configurator />
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Crear una cuenta</div>
                            <span class="text-muted-color font-medium">Completa tus datos para registrarte</span>
                        </div>

                        <div>
                            <label for="nombreUsuario" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Nombre de Usuario</label>
                            <input pInputText id="nombreUsuario" type="text" placeholder="Tu nombre de usuario" class="w-full md:w-[30rem] mb-8" formControlName="nombreUsuario" />

                            <label for="correo" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Correo Electrónico</label>
                            <input pInputText id="correo" type="email" placeholder="tu@correo.com" class="w-full md:w-[30rem] mb-8" formControlName="correo" />

                            <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Contraseña</label>
                            <p-password id="password" placeholder="Contraseña (mín. 6 caracteres)" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false" formControlName="password"></p-password>

                            <label for="confirmPassword" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Confirmar Contraseña</label>
                            <p-password id="confirmPassword" placeholder="Repite la contraseña" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false" formControlName="confirmPassword"></p-password>

                            <div *ngIf="registerForm.errors?.['passwordMismatch'] && registerForm.get('confirmPassword')?.dirty" class="p-error text-center mb-4">
                                Las contraseñas no coinciden.
                            </div>

                            <p-button label="Registrarse" styleClass="w-full mt-4" type="submit" [disabled]="registerForm.invalid"></p-button>

                            <div class="text-center mt-6">
                                <span class="text-muted-color">¿Ya tienes una cuenta? </span>
                                <a routerLink="/auth/login" class="font-medium no-underline text-primary cursor-pointer">Inicia sesión aquí</a>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
  `
})
export class Registro {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  registerForm = this.fb.group({
    nombreUsuario: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { 
    validators: passwordMatchValidator // Se aplica el validador al formulario
  });

  

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }
    const { confirmPassword, ...datosUsuario } = this.registerForm.value;
    this.usuarioService.register(datosUsuario).subscribe({
      next: () => {
     
        this.messageService.add({ 
            severity: 'success', 
            summary: '¡Éxito!', 
            detail: 'Registro completado. Serás redirigido al login.' 
        });
        
        // Esperar 2 segundos para que el usuario vea el mensaje antes de redirigir
        setTimeout(() => {
            this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (err) => {
        this.messageService.add({ 
            severity: 'error', 
            summary: 'Error en el Registro', 
            detail: 'Ocurrió un error. Por favor, inténtalo de nuevo.' 
        });
      }
    });
  }
}