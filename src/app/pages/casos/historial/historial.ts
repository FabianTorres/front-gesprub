import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, Location  } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TimelineModule } from 'primeng/timeline';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

import { Caso } from '../../../models/caso';
import { Evidencia } from '../../../models/evidencia';
import { CasoService } from '../../../services/caso.service';
import { HistorialCaso } from '../../../models/historial-caso';

@Component({
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ButtonModule,
        CardModule,
        TimelineModule,
        TagModule,
        ToastModule
    ],
    providers: [MessageService, DatePipe],
    templateUrl: './historial.html'
})
export class HistorialPage implements OnInit {
    caso = signal<Caso | null>(null);
    historial = signal<Evidencia[]>([]);
    datosHistorial = signal<HistorialCaso | null>(null);

    private route = inject(ActivatedRoute);
    private casoService = inject(CasoService);
    private location = inject(Location); 

    ngOnInit() {
        const casoId = this.route.snapshot.paramMap.get('id');
            if (casoId) {
                this.casoService.getHistorialPorCasoId(+casoId).subscribe(data => {

                    // --- INICIO DE LA MODIFICACIÓN ---

                    // 1. Verificamos que los datos y el array 'historial' existan
                    if (data && data.historial) {

                        // 2. Usamos .map() para crear un nuevo array con la propiedad 'posicion'
                        const historialModificado = data.historial.map((evento, index) => {
                            return {
                                ...evento, // Copia todas las propiedades originales del evento
                                posicion: index % 2 !== 0 ? 'left' : 'right' // Añade la propiedad 'posicion'
                            };
                        });

                        // 3. Actualizamos la signal 'datosHistorial' con los datos ya transformados
                        this.datosHistorial.set({
                            ...data,
                            historial: historialModificado
                        });
                        
                    } else {
                        // Si no hay datos, simplemente los establecemos como están
                        this.datosHistorial.set(data);
                    }
                    // --- FIN DE LA MODIFICACIÓN ---

                    console.log(this.datosHistorial()); // Ahora el log mostrará la nueva propiedad
                });
            }
    }

    getSeverityForEstado(estado: string | null | undefined): string {
        switch (estado) {
            case 'OK':
                return 'success';
            case 'NK':
                return 'danger';
            default:
                return 'info';
        }
    }

    getSeverityForCriticidad(criticidad: string | null | undefined): string {
        switch (criticidad) {
            case 'Leve':
                return 'info';
            case 'Medio':
                return 'warn';
            case 'Grave':
                return 'danger';
            case 'Crítico':
                return 'contrast';
            default:
                return 'secondary';
        }
    }

    volverAtras(): void {
        this.location.back();
    }

   
}