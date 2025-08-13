import { Component, inject } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule ,DatePipe } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { AvatarModule } from 'primeng/avatar'; 
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AutenticacionService } from '../../services/autenticacion.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator,
                AvatarModule, ButtonModule, DatePipe, TagModule 
    ],
    templateUrl: './app.topbar.html' 
})
export class AppTopbar {
    items!: MenuItem[];

    public layoutService = inject(LayoutService);
    private authService = inject(AutenticacionService);

     currentUser = this.authService.usuarioActual;

    //constructor(public layoutService: LayoutService) {}

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }

    getSeverityForRol(rol: string): 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast' {
        switch (rol) {
            case 'Administrador': return 'danger';
            case 'Certificador': return 'info';
            default: return 'secondary';
        }
    }

    logout() {
        this.authService.logout();
    }
}
