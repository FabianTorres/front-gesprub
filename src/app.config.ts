import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeng/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { registerLocaleData } from '@angular/common';
import { provideMarkdown } from 'ngx-markdown';
import localeEsCL from '@angular/common/locales/es-CL';

import { authInterceptor } from './app/interceptors/auth.interceptor';

registerLocaleData(localeEsCL);

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
        provideAnimationsAsync(),
        providePrimeNG({
            theme: {
                preset: Aura,
                options: { darkModeSelector: '.app-dark' }
            },
            translation: {
                startsWith: 'Comienza con',
                contains: 'Contiene',
                notContains: 'No contiene',
                endsWith: 'Termina con',
                equals: 'Igual a',
                notEquals: 'No igual a',
                noFilter: 'Sin filtro',
                lt: 'Menor que',
                lte: 'Menor o igual que',
                gt: 'Mayor que',
                gte: 'Mayor o igual que',
                is: 'Es',
                isNot: 'No es',
                before: 'Antes',
                after: 'Después',
                dateIs: 'Fecha es',
                dateIsNot: 'Fecha no es',
                dateBefore: 'Fecha es antes de',
                dateAfter: 'Fecha es después de',
                clear: 'Limpiar',
                apply: 'Aplicar',
                matchAll: 'Coincidir todo',
                matchAny: 'Coincidir cualquiera',
                addRule: 'Añadir regla',
                removeRule: 'Quitar regla',
                accept: 'Aceptar',
                reject: 'Rechazar',
                choose: 'Elegir',
                upload: 'Subir',
                cancel: 'Cancelar',
                dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
                dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
                dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
                monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
                monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                today: 'Hoy',
                weekHeader: 'Sem',
                emptyMessage: 'No se encontraron resultados',
                emptyFilterMessage: 'No se encontraron resultados',
                passwordPrompt: 'Ingrese una contraseña',
                weak: 'Débil',
                medium: 'Media',
                strong: 'Fuerte'

            }



        }),

        { provide: LOCALE_ID, useValue: 'es-CL' },
        provideMarkdown()
    ]
};
