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

    private route = inject(ActivatedRoute);
    private casoService = inject(CasoService);
    private location = inject(Location); 

    ngOnInit() {
        const casoId = this.route.snapshot.paramMap.get('id');
        if (casoId) {
            // Asumiremos que crearemos estos nuevos métodos en el servicio
            this.casoService.getCasoById(+casoId).subscribe(data => this.caso.set(data));
            this.casoService.getEvidenciasByCasoId(+casoId).subscribe(data => this.historial.set(data));
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
                return 'warning';
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