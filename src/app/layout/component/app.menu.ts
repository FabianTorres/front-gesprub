// src/app/layout/component/app.menu.ts

import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { Proyecto } from '../../models/proyecto';
import { ProyectoService } from '../../services/proyecto.service';
import { AutenticacionService } from '../../services/autenticacion.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule,
        AppMenuitem,
        RouterModule,
        SelectModule,
        FormsModule
    ],
    templateUrl: './app.menu.html'
})
export class AppMenu implements OnInit {

    model = signal<MenuItem[]>([]);

    proyectos = signal<Proyecto[]>([]);
    proyectoActivo: Proyecto | null = null;

    proyectoService = inject(ProyectoService);

    private authService = inject(AutenticacionService);

    constructor() {
        // Se crea un 'effect' para reaccionar a los cambios del servicio.
        effect(() => {
            this.proyectoActivo = this.proyectoService.proyectoSeleccionado();
        });

        effect(() => {
            const usuario = this.authService.usuarioActual();
            this.buildMenu(usuario?.rolUsuario); // Construimos el menú basado en el rol del usuario
        });
    }

    ngOnInit() {

        this.cargarProyectos();
        this.proyectoService.cargarProyectoGuardado();

    }

    // ===== 4. CREAMOS UNA FUNCIÓN PARA CONSTRUIR EL MENÚ DINÁMICAMENTE =====
    buildMenu(rol?: string) {
        const menuItems: MenuItem[] = [
            {
                label: 'Inicio',
                items: [
                    {
                        label: 'Home',
                        icon: 'pi pi-fw pi-home',
                        routerLink: ['/'],
                        visible: true // Mantenemos el dashboard oculto como querías
                    },
                    // {
                    //     label: 'Tablero',
                    //     icon: 'pi pi-fw pi-chart-bar',
                    //     routerLink: ['dashboard'],
                    //     visible: true // Mantenemos el dashboard oculto como querías
                    // },
                    {
                        label: 'Reportes y Análisis',
                        icon: 'pi pi-fw pi-chart-bar',
                        items: [
                            { label: 'General', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/pages/dashboard'] },
                            { label: 'Avance por Componente', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/pages/dashboard/avance-componente'] },
                            { label: 'Productividad y Carga', icon: 'pi pi-fw pi-users', routerLink: ['/pages/dashboard/productividad'] },
                        ]
                    },
                ]

            },

            {
                label: 'Gestión de Pruebas',
                items: [
                    { label: 'Componentes', icon: 'pi pi-fw pi-server', routerLink: ['/pages/gestion/componentes'] },
                    { label: 'Casos de Prueba', icon: 'pi pi-fw pi-file-edit', routerLink: ['/pages/gestion/casos'] },
                    { label: 'Ciclos de Prueba', icon: 'pi pi-fw pi-sync', disabled: true } // Deshabilitado en lugar de comentado
                ]
            },
            {
                label: 'Gestión de asignaciones',
                items: [
                    { label: 'Muro tareas', icon: 'pi pi-fw pi-user', routerLink: ['/pages/gestion/muro-tareas'] },
                    { label: 'Tablero Kanban', icon: 'pi pi-fw pi-table', routerLink: ['/pages/gestion/tablero-kanban'] }
                ]
            },
            {
                label: 'Personal',
                items: [
                    { label: 'Mi Perfil', icon: 'pi pi-fw pi-user', routerLink: ['/pages/perfil'] }
                ]
            },
            {
                label: 'Configuración',
                items: [
                    { label: 'Proyectos', icon: 'pi pi-fw pi-briefcase', routerLink: ['/pages/config/proyectos'] },
                    { label: 'Estados de Evidencia', icon: 'pi pi-fw pi-tags', routerLink: ['/pages/config/estados-evidencia'] },
                    { label: 'Estados de Modificación', icon: 'pi pi-fw pi-tags', routerLink: ['/pages/config/estados-modificacion'] },
                    { label: 'Criticidades', icon: 'pi pi-fw pi-tags', routerLink: ['/pages/config/criticidades'] },
                    { label: 'Ámbitos', icon: 'pi pi-fw pi-tags', routerLink: ['/pages/config/ambitos'] },
                    { label: 'Fuentes de Información', icon: 'pi pi-fw pi-tags', routerLink: ['/pages/config/fuentes'] }
                ]
            }
            // La sección de Administración se añade condicionalmente más abajo
        ];

        // ===== 5. LÓGICA CONDICIONAL PARA AÑADIR EL MENÚ DE ADMINISTRACIÓN =====
        // Si el rol del usuario es 'Administrador'...
        if (rol === 'Administrador') {
            // ...añadimos la sección completa al array del menú.

            menuItems.push({
                label: 'Administración',
                items: [
                    { label: 'Usuarios', icon: 'pi pi-fw pi-users', routerLink: ['/pages/admin/usuarios'] },
                    {
                        label: 'Descarga Masiva',
                        icon: 'pi pi-fw pi-cloud-download',
                        routerLink: ['/pages/admin/descargas']
                    }
                ]
            });
        }

        // Finalmente, actualizamos la señal del modelo con el menú construido.
        this.model.set(menuItems);
    }

    cargarProyectos() {
        this.proyectoService.getProyectos().subscribe(data => this.proyectos.set(data));
    }

    // Se añade el tipo 'Proyecto' para corregir el error.
    onProjectChange(proyecto: Proyecto | null) {
        this.proyectoService.seleccionarProyecto(proyecto);
    }
}