import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { authGuard } from './app/guards/auth.guard';
import { SimpleLayout } from './app/layout/component/simple-layout';
import { HomeComponent } from './app/pages/home/home.component'

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: 'dashboard', component: Dashboard },
            { path: '', component: HomeComponent },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') }
        ]
    },
    {
        path: 'cargavx',
        component: SimpleLayout,
        canActivate: [authGuard],
        // CORRECCIÓN AQUÍ: Asegúrate de que la ruta al archivo cargavx.routes sea correcta.
        // Si cargavx.routes.ts está en src/app/pages/cargavx/, entonces:
        loadChildren: () => import('./app/pages/cargavx/cargavx.routes').then(m => m.CARGAVX_ROUTES)
    },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/auth/login' }
];
