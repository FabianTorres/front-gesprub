// src/app/layout/component/app.menu.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
        </ng-container>
    </ul> `
})
export class AppMenu implements OnInit {
    
    model: MenuItem[] = [];

    ngOnInit() {
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
                        // routerLink: ['/pages/admin/usuarios'] // Lo dejaremos comentado por ahora
                    }
                ]
            }
        ];
    }
}