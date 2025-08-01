import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
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
        CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
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
    
    roles: any[] = [
        { label: 'Tester', value: 'Tester' },
        { label: 'Jefe de Proyecto', value: 'Jefe de Proyecto' },
        { label: 'Administrador', value: 'Administrador' }
    ];

    private usuarioService = inject(UsuarioService);
    private messageService = inject(MessageService);

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
        const datosActualizados: Partial<Usuario> = {
            rolUsuario: this.usuario.rolUsuario,
            activo: this.activoDialog ? 1 : 0
        };

        this.usuarioService.updateUsuario(this.usuario.idUsuario!, datosActualizados)
            .subscribe({
                next: () => {
                    this.messageService.add({severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado'});
                    this.cargarUsuarios();
                },
                error: (err) => this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el usuario'})
            });
        
        this.cerrarDialogo();
    }
    
    getSeverityForRol(rol: string): string {
        switch (rol) {
            case 'Administrador': return 'danger';
            case 'Jefe de Proyecto': return 'warning';
            case 'Tester': return 'info';
            default: return 'secondary';
        }
    }
}