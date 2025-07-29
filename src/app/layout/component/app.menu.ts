// src/app/layout/component/app.menu.ts

import { Component, OnInit , effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { Proyecto } from '../../models/proyecto';
import { ProyectoService } from '../../services/proyecto.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, 
              AppMenuitem, 
              RouterModule,
              SelectModule,
              FormsModule
            ],
    template: `
        <div class="project-selector px-4 py-3">
            <label class="block font-bold text-sm mb-2 text-surface-600 dark:text-surface-300">Proyecto Activo</label>
            <p-select [options]="proyectos()" 
                      [(ngModel)]="proyectoActivo"
                      (onChange)="onProjectChange($event.value)"
                      optionLabel="nombre_proyecto"
                      placeholder="Seleccionar Proyecto"
                      [showClear]="true"
                      styleClass="w-full">
            </p-select>
        </div>
        <ul class="layout-menu">
            <ng-container *ngFor="let item of model; let i = index">
                <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            </ng-container>
        </ul>
    `
})
export class AppMenu implements OnInit {
    
    model: MenuItem[] = [];

    proyectos = signal<Proyecto[]>([]);
    proyectoActivo: Proyecto | null = null;
    
    proyectoService = inject(ProyectoService);

    constructor() {
        // Se crea un 'effect' para reaccionar a los cambios del servicio.
        effect(() => {
            this.proyectoActivo = this.proyectoService.proyectoSeleccionado();
        });
    }

    ngOnInit() {

        this.cargarProyectos();
        this.proyectoService.cargarProyectoGuardado();


        this.model = [
            {
                label: 'Inicio',
                items: [
                    {
                        label: 'Dashboard',
                        icon: 'pi pi-fw pi-home',
                        routerLink: ['/']
                    }
                ]
            },
            {
                label: 'Gestión de Pruebas',
                items: [
                    {
                        label: 'Componentes',
                        icon: 'pi pi-fw pi-server',
                        routerLink: ['/pages/gestion/componentes'] 
                    },
                    {
                        label: 'Casos de Prueba',
                        icon: 'pi pi-fw pi-file-edit',
                        routerLink: ['/pages/gestion/casos'] 
                    },
                    {
                        label: 'Ciclos de Prueba',
                        icon: 'pi pi-fw pi-sync',
                        // routerLink: ['/pages/gestion/ciclos'] // Lo dejaremos comentado por ahora
                    }
                ]
            },
            {
                label: 'Administración',
                items: [
                    {
                        label: 'Usuarios',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/pages/admin/usuarios'] 
                    }
                ]
            }

            
        ];
    }

    cargarProyectos() {
        this.proyectoService.getProyectos().subscribe(data => this.proyectos.set(data));
    }

    // Se añade el tipo 'Proyecto' para corregir el error.
    onProjectChange(proyecto: Proyecto | null) {
        this.proyectoService.seleccionarProyecto(proyecto);
    }
}