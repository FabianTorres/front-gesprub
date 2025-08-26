import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Usuario } from '../../models/usuario';
import { UsuarioService } from '../../services/usuario.service';

@Component({
    standalone: true,
    imports: [
        CommonModule, FormsModule,AvatarModule , TableModule, ButtonModule, DialogModule,
        InputTextModule, InputSwitchModule, SelectModule, ToastModule, TagModule, TooltipModule
    ],
    providers: [MessageService],
    templateUrl: './usuarios.html'
})
export class UsuariosPage implements OnInit {
    usuarios = signal<Usuario[]>([]);
    usuario!: Partial<Usuario>;
    usuarioDialog: boolean = false;
    activoDialog: boolean = true;
    listaRoles: any[];
    
    // roles: any[] = [
    //     { label: 'Tester', value: 'Tester' },
    //     { label: 'Jefe de Proyecto', value: 'Jefe de Proyecto' },
    //     { label: 'Administrador', value: 'Administrador' }
    // ];

    private usuarioService = inject(UsuarioService);
    private messageService = inject(MessageService);


    constructor() {
        // ===== INICIO DE LA LÍNEA AÑADIDA =====
        // Inicializamos la lista de roles en el constructor.
        this.listaRoles = [
            { label: 'Certificador', value: 'Certificador' },
            { label: 'Administrador', value: 'Administrador' }
        ];
        // ===== FIN DE LA LÍNEA AÑADIDA =====
    }

    ngOnInit() {
        this.cargarUsuarios();
    }

    cargarUsuarios() {
        this.usuarioService.getUsuarios().subscribe(data => this.usuarios.set(data));
    }

    editarUsuario(usuario: Usuario) {
        this.usuario = { ...usuario };
        this.activoDialog = usuario.activo === 1;
        this.usuarioDialog = true;
    }

    cerrarDialogo() {
        this.usuarioDialog = false;
    }

    guardarUsuario() {
        // Se crea una copia completa del usuario que estamos editando.
        const usuarioParaEnviar = { ...this.usuario };

        // Se actualiza la propiedad 'activo' a partir del estado del switch.
        usuarioParaEnviar.activo = this.activoDialog ? 1 : 0;

        //  ID de usuario antes de enviar.
        if (!usuarioParaEnviar.idUsuario) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'ID de usuario no encontrado.'});
            return;
        }
        
        
        // Se envia el objeto COMPLETO al servicio de actualización.
        this.usuarioService.updateUsuario(usuarioParaEnviar.idUsuario, usuarioParaEnviar as Usuario)
            .subscribe({
                next: (usuarioActualizado) => {
                    this.messageService.add({severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado'});
                    // Actualiza la lista sin recargar todo.
                    this.actualizarUsuarioEnLista(usuarioActualizado);
                    this.cerrarDialogo();
                },
                error: (err) => {
                    this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el usuario'});
                    this.cerrarDialogo();
                }
            });
    }

    // método auxiliar para una actualización más fluida de la tabla
    actualizarUsuarioEnLista(usuarioActualizado: Usuario) {
        this.usuarios.update(lista => {
            const index = lista.findIndex(u => u.idUsuario === usuarioActualizado.idUsuario);
            if (index !== -1) {
                lista[index] = usuarioActualizado;
            }
            return [...lista];
        });
    }
    
    getSeverityForRol(rol: string): string {
        switch (rol) {
            case 'Administrador': return 'danger';
            case 'Certificador': return 'info';
            default: return 'secondary';
        }
    }
}