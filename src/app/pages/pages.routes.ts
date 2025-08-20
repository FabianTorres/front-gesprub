// src/app/pages/pages.routes.ts

import { Routes } from '@angular/router';
import { Documentation } from './documentation/documentation';
import { Crud } from './crud/crud';
import { Empty } from './empty/empty';
import { authGuard } from '../guards/auth.guard';

export default [
    //{ path: 'documentation', component: Documentation },
    //{ path: 'crud', component: Crud },
    //{ path: 'empty', component: Empty },
    
    { path: 'gestion/componentes', loadComponent: () => import('./gestion/componentes').then(m => m.ComponentesPage) },
     { path: 'gestion/casos', loadComponent: () => import('./gestion/casos').then(m => m.CasosPage) },
     { path: 'ejecucion/:id', loadComponent: () => import('./ejecucion/ejecucion').then(m => m.EjecucionPage) },
     { path: 'casos/:id', loadComponent: () => import('./casos/historial/historial').then(m => m.HistorialPage) },
     { path: 'admin/usuarios', 
        loadComponent: () => import('./admin/usuarios').then(m => m.UsuariosPage) },
        //canActivate: [authGuard],        // 3. Activamos el guardián en esta ruta
        //data: { rol: 'Administrador' }, // 4. Le decimos al guardián que el rol requerido es 'Administrador'
     {
        path: 'perfil',
        loadComponent: () => import('./perfil/perfil').then(m => m.PerfilPage)
    },
    {
        path: 'config/proyectos',
        loadComponent: () => import('./config/proyectos/proyectos.component').then(m => m.ProyectosComponent),
    },
    {
        path: 'config/estados-evidencia',
        loadComponent: () => import('./config/estados-evidencia/estados-evidencia.component').then(m => m.EstadosEvidenciaComponent),
        
    },
    {
        path: 'config/estados-modificacion',
        loadComponent: () => import('./config/estados-modificacion/estados-modificacion.component').then(m => m.EstadosModificacionComponent),
        
    },
     {
        path: 'config/criticidades',
        loadComponent: () => import('./config/criticidades/criticidades.component').then(m => m.CriticidadesComponent),
    },
    {
        path: 'config/ambitos',
        loadComponent: () => import('./config/ambito/ambitos.component').then(m => m.AmbitosComponent),
    },
    {
        path: 'config/fuentes',
        loadComponent: () => import('./config/fuentes/fuentes.component').then(m => m.FuentesComponent),
    },


    { path: '**', redirectTo: '/notfound' }
] as Routes;