import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AutenticacionService } from '../../services/autenticacion.service';
import { LoginCredentials } from '../../models/autenticacion';
import { CommonModule } from '@angular/common'; 
import { ToastModule } from 'primeng/toast'; 
import { MessageService } from 'primeng/api'; 
import { version } from '../../../environment/version';  


@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule, 
        RouterModule,
        ButtonModule,
        CheckboxModule,
        InputTextModule,
        PasswordModule,
        RippleModule,
        AppFloatingConfigurator,
        ToastModule
    ],
    providers: [MessageService],
    
    template: `
        <app-floating-configurator />
        <p-toast></p-toast>
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
                        <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                            <div class="text-center mb-8">
                                <svg viewBox="0 0 54 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="mb-8 w-16 shrink-0 mx-auto">
                                    </svg>
                                <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Bienvenido a Gesprub</div>
                                <span class="text-muted-color font-medium">Debe loguearse para continuar</span>
                            </div>

                            <div>
                                <label for="username" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Usuario</label>
                                <input pInputText id="username" type="text" placeholder="Usuario" class="w-full md:w-[30rem] mb-8" formControlName="username" />

                                <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                                <p-password id="password" placeholder="Password" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false" formControlName="password"></p-password>

                                <!-- <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                                    <div class="flex items-center">
                                         <p-checkbox id="rememberme1" binary class="mr-2"></p-checkbox>
                                        <label for="rememberme1">Recuérdame</label>
                                    </div>
                                    <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">¿Olvidó su contraseña?</span>
                                </div> -->


                                <p-button label="Entrar" styleClass="w-full" type="submit" [disabled]="loginForm.invalid"></p-button>

               
                                <div class="text-center mt-6">
                                    <span class="text-muted-color">¿No tienes una cuenta? </span>
                                    <a routerLink="/auth/registro" class="font-medium no-underline text-primary cursor-pointer">Regístrate aquí</a>
                                </div>
                                <div class="text-center mt-6">
                                    <span class="text-muted-color font-normal">Gesprub v{{ appVersion }}</span>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `
})
export class Login {
    // Inyectamos los servicios
    private fb = inject(FormBuilder);
    private authService = inject(AutenticacionService);
    private messageService = inject(MessageService);

    appVersion = version;
    
    
    private router = inject(Router);

    // Definimos el formulario reactivo
    loginForm = this.fb.group({
        username: ['', [Validators.required]],
        password: ['', [Validators.required]]
    });

    
    onSubmit(): void {
        if (this.loginForm.invalid) {
            console.log('Formulario inválido');
            return;
        }

        this.authService.login(this.loginForm.value as LoginCredentials).subscribe({
            next: () => {
                this.messageService.add({ 
                    severity: 'success', 
                    summary: '¡Felicidades!', 
                    detail: 'Login completado correctamente.' 
                });
                
                // Esperar 2 segundos para que el usuario vea el mensaje antes de redirigir
                setTimeout(() => {
                    
                }, 2000);
            },
            error: (err) => {
                this.messageService.add({ 
                    severity: 'error', 
                    summary: 'Error de Autenticación', 
                    detail: 'Nombre de usuario o contraseña incorrectos.' 
                });
            }
        });
    }
}