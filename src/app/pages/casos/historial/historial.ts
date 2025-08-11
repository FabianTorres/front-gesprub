import { Component, OnInit, effect, inject, signal } from '@angular/core';
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
import { EstadoModificacion } from '../../../models/estado-modificacion';
import { EstadoModificacionService } from '../../../services/estado-modificacion.service';
import { environment } from '../../../../environment/environment';
import { ProyectoService } from '../../../services/proyecto.service';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { EvidenciaService } from '../../../services/evidencia.service';

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
    private evidenciaService = inject(EvidenciaService);

    private route = inject(ActivatedRoute);
    private casoService = inject(CasoService);
    private location = inject(Location); 
    // Señal para la lista de estados
    estadosModificacion = signal<EstadoModificacion[]>([]);

    mostrarCampoFormulario = signal<boolean>(false);
    private proyectoService = inject(ProyectoService);

    // Se inyecta el nuevo servicio estado modificacion
    private estadoModificacionService = inject(EstadoModificacionService);


    constructor() {
        effect(() => {
            const proyectoActual = this.proyectoService.proyectoSeleccionado();
            if (proyectoActual) {
                const debeMostrar = environment.proyectosDeDDJJ.includes(proyectoActual.nombre_proyecto);
                this.mostrarCampoFormulario.set(debeMostrar);
            } else {
                this.mostrarCampoFormulario.set(false);
            }
        });
    }
    ngOnInit() {
        const casoId = this.route.snapshot.paramMap.get('id');
            if (casoId) {
                this.casoService.getHistorialPorCasoId(+casoId).pipe(
                switchMap(data => {
                    if (data && data.historial && data.historial.length > 0) {
                        // Para cada evidencia, creamos un observable que busca sus archivos
                        const observables = data.historial.map(evidencia =>
                            this.evidenciaService.getArchivosPorEvidencia(evidencia.id_evidencia!).pipe(
                                map(archivos => ({ ...evidencia, archivos })) // Combinamos la evidencia con sus archivos
                            )
                        );
                        // Usamos forkJoin para esperar todas las respuestas
                        return forkJoin(observables).pipe(
                            map(historialConArchivos => ({ ...data, historial: historialConArchivos }))
                        );
                    }
                    return of(data); // Si no hay historial, devolvemos los datos como están
                })
            ).subscribe(data => {
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

                });
            }

            this.cargarEstadosModificacion();
    }

    // Método para cargar los estados
    cargarEstadosModificacion() {
        this.estadoModificacionService.getEstados().subscribe(data => this.estadosModificacion.set(data));
    }
    
    // Método para encontrar el nombre del estado por su ID
    findEstadoModificacionNombre(id: number | undefined): string {
        if (id === undefined) return 'N/A';
        const estado = this.estadosModificacion().find(e => e.id_estado_modificacion === id);
        return estado ? estado.nombre : 'N/A';
    }

    // Método para obtener el color del tag de estado
    getSeverityForModificacion(estado: string | null | undefined): string {
        switch (estado) {
            case 'Modificado': return 'warn';
            case 'Nuevo': return 'info';
            case 'Sin cambios': return 'secondary';
            default: return 'secondary';
        }
    }

    getSeverityForEstado(estado: string | null | undefined): string {
        switch (estado) {
            case 'OK':
                return 'success';
            case 'NK':
                return 'danger';
            case 'N/A':
                return 'secondary';
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