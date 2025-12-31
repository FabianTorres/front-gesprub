import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppTopbar } from './app.topbar';

@Component({
    selector: 'app-simple-layout',
    standalone: true,
    imports: [RouterOutlet, AppTopbar],
    template: `
        <div class="layout-wrapper">
            <app-topbar
                [showMenuButton]="false" 
                [pageTitle]="'Carga de Vectores'">
            </app-topbar>
            
            <div class="layout-main-container" style="margin-left: 0; padding-top: 5rem;">
                <div class="layout-main">
                    <router-outlet></router-outlet>
                </div>
            </div>
        </div>
    `
})
export class SimpleLayout { }