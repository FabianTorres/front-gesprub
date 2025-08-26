import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; 
import { FormsModule } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar'; 
import { TagModule } from 'primeng/tag';       
import { ButtonModule } from 'primeng/button'; 
import { DialogModule } from 'primeng/dialog'; 
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

import { Usuario } from '../../models/usuario';
import { AutenticacionService } from '../../services/autenticacion.service';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  standalone: true,
  imports: [
    CommonModule, FormsModule, CardModule, ToastModule, 
    AvatarModule, TagModule, ButtonModule,
    DialogModule, InputTextModule, PasswordModule 
  ],
  providers: [MessageService, DatePipe], 
  templateUrl: './perfil.html'
})
export class PerfilPage implements OnInit {
  
  private authService = inject(AutenticacionService);
  private usuarioService = inject(UsuarioService);
  private messageService = inject(MessageService);

  // Propiedades para controlar el diálogo y los datos del formulario
  perfilDialog: boolean = false;
  usuarioEditado!: Partial<Usuario>;

  usuarioActual = signal<Usuario | null>(null);

  // Propiedades para controlar el diálogo de cambio de contraseña
  passwordDialog: boolean = false;
  // Objeto para almacenar los datos del formulario de contraseña
  datosPassword = {
    passwordActual: '',
    nuevaPassword: '',
    confirmacionPassword: ''
  };

  ngOnInit() {
    this.cargarDatosUsuario();
  }

  cargarDatosUsuario() {
    const currentUserId = this.authService.usuarioActual()?.idUsuario;
    
    if (currentUserId) {
      this.usuarioService.getUsuarioById(currentUserId).subscribe({
        next: (user) => this.usuarioActual.set(user),
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos.' })
      });
    }
  }

  
  // Función para darle un color al tag del rol, similar a la de la página de usuarios.
  getSeverityForRol(rol: string): 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast' {
    if (!rol) {
        return 'secondary';
    }
    
    switch (rol.toLowerCase()) {
        case 'administrador': return 'danger';
        case 'jefe de proyecto': return 'warn';
        case 'tester': return 'info';
        default: return 'secondary';
    }
  }

  abrirDialogoEditar() {
    // Cuando el usuario hace clic en editar, hacemos una copia de los datos actuales
    // para no modificar el perfil real hasta que se guarden los cambios.
    if (this.usuarioActual()) {
        this.usuarioEditado = { ...this.usuarioActual() };
        this.perfilDialog = true;
    }
  }

  cerrarDialogo() {
    this.perfilDialog = false;
  }

  guardarCambios() {

    // Expresión regular para validar el formato de correo electrónico
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    //Validaciones
    if (!this.usuarioEditado.correo || !emailRegex.test(this.usuarioEditado.correo)) {
        this.messageService.add({ 
            severity: 'warn', 
            summary: 'Correo inválido', 
            detail: 'Por favor, ingrese un formato de correo electrónico válido.' 
        });
        return; // Detenemos la ejecución
    }
   
    if (!this.usuarioEditado.nombreUsuario || !this.usuarioEditado.correo) {
        this.messageService.add({ 
            severity: 'warn', 
            summary: 'Campos requeridos', 
            detail: 'El nombre de usuario y el correo no pueden estar vacíos.' 
        });
        return; // Detenemos la ejecución
    }

    // --- 2. Preparar los datos para el Backend ---
    // El objeto 'this.usuarioEditado' ya tiene el formato correcto (Partial<Usuario>)
    // y el ID del usuario.

    // --- 3. Llamar al servicio y manejar la respuesta ---
    this.usuarioService.updateUsuario(this.usuarioEditado.idUsuario!, this.usuarioEditado).subscribe({
        next: (usuarioActualizado) => {
            // Éxito: El backend devolvió el usuario con los datos actualizados
            this.messageService.add({ 
                severity: 'success', 
                summary: 'Éxito', 
                detail: 'Perfil actualizado correctamente.' 
            });

            // Actualizamos la señal principal con los nuevos datos para que la vista se refresque
            this.usuarioActual.set(usuarioActualizado);

            this.authService.actualizarUsuarioLocal(usuarioActualizado);
            
            this.cerrarDialogo(); // Cerramos el diálogo
        },
        error: (err) => {
            // Error: El backend devolvió un error
            this.messageService.add({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se pudo actualizar el perfil. Inténtelo más tarde.' 
            });
        }
    });
  }

  abrirDialogoPassword() {
    // Reseteamos el objeto de contraseñas cada vez que se abre el diálogo
    this.datosPassword = {
      passwordActual: '',
      nuevaPassword: '',
      confirmacionPassword: ''
    };
    this.passwordDialog = true;
  }

  cerrarDialogoPassword() {
    this.passwordDialog = false;
  }

  guardarNuevaPassword() {
    // --- 1. Validaciones del Frontend ---

    // Validar que todos los campos estén llenos
    if (!this.datosPassword.passwordActual || !this.datosPassword.nuevaPassword || !this.datosPassword.confirmacionPassword) {
        this.messageService.add({ 
            severity: 'warn', 
            summary: 'Campos incompletos', 
            detail: 'Por favor, rellene todos los campos.' 
        });
        return; // Detenemos la ejecución
    }

    // Validar que la nueva contraseña y su confirmación coincidan
    if (this.datosPassword.nuevaPassword !== this.datosPassword.confirmacionPassword) {
        this.messageService.add({ 
            severity: 'warn', 
            summary: 'Error de confirmación', 
            detail: 'La nueva contraseña y su confirmación no coinciden.' 
        });
        return;
    }

    // (Opcional pero recomendado) Validar una longitud mínima
    if (this.datosPassword.nuevaPassword.length < 6) {
        this.messageService.add({ 
            severity: 'warn', 
            summary: 'Contraseña débil', 
            detail: 'La nueva contraseña debe tener al menos 6 caracteres.' 
        });
        return;
    }


    // --- 2. Preparar los datos para el Backend ---
    const payload = {
        passwordActual: this.datosPassword.passwordActual,
        nuevaPassword: this.datosPassword.nuevaPassword
    };


    // --- 3. Llamar al servicio y manejar la respuesta ---
    this.usuarioService.cambiarPassword(payload).subscribe({
        next: () => {
            // Éxito: El backend devolvió una respuesta 200 OK
            this.messageService.add({ 
                severity: 'success', 
                summary: 'Éxito', 
                detail: 'Contraseña actualizada. Por favor, inicie sesión de nuevo.' 
            });

            // Cerramos el diálogo y, después de un breve momento, desconectamos al usuario.
            this.cerrarDialogoPassword();
            setTimeout(() => {
                this.authService.logout();
            }, 1500);
            this.cerrarDialogoPassword(); // Cerramos el diálogo
        },
        error: (err) => {
            // Error: El backend devolvió un error (ej. 400)
            if (err.status === 400) {
                // Mensaje específico para contraseña incorrecta
                this.messageService.add({ 
                    severity: 'error', 
                    summary: 'Error de validación', 
                    detail: 'La contraseña actual es incorrecta.' 
                });
            } else {
                // Mensaje genérico para otros errores
                this.messageService.add({ 
                    severity: 'error', 
                    summary: 'Error', 
                    detail: 'No se pudo cambiar la contraseña. Inténtelo más tarde.' 
                });
            }
        }
    });
  }
  
}