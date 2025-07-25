// src/app/pages/pages.routes.ts

import { Routes } from '@angular/router';
import { Documentation } from './documentation/documentation';
import { Crud } from './crud/crud';
import { Empty } from './empty/empty';

export default [
    { path: 'documentation', component: Documentation },
    { path: 'crud', component: Crud },
    { path: 'empty', component: Empty },
    
    { path: 'gestion/componentes', loadComponent: () => import('./gestion/componentes').then(m => m.ComponentesPage) },
     { path: 'gestion/casos', loadComponent: () => import('./gestion/casos').then(m => m.CasosPage) },
     { path: 'ejecucion/:id', loadComponent: () => import('./ejecucion/ejecucion').then(m => m.EjecucionPage) },
     { path: 'casos/:id', loadComponent: () => import('./casos/historial/historial').then(m => m.HistorialPage) },


    { path: '**', redirectTo: '/notfound' }
] as Routes;