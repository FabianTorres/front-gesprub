// src/app/pages/ejecucion/ejecucion.ts

import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, Location  } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { FieldsetModule } from 'primeng/fieldset';
import { Caso } from '../../models/caso';
import { CasoService } from '../../services/caso.service';
import { Evidencia } from '../../models/evidencia';
import { EvidenciaService } from '../../services/evidencia.service';
import { AutenticacionService } from '../../services/autenticacion.service';
import { EstadoModificacion } from '../../models/estado-modificacion';
import { EstadoModificacionService } from '../../services/estado-modificacion.service';
import { TagModule } from 'primeng/tag';
import { environment } from '../../../environment/environment';
import { ProyectoService } from '../../services/proyecto.service';
import { VersionFormatDirective } from '../../directives/version-format.directive';
import { switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
    standalone: true,
    imports: [
        CommonModule, VersionFormatDirective , TagModule, FieldsetModule,DividerModule , FormsModule, RouterModule, ButtonModule, ButtonGroupModule, CardModule, InputTextModule,
        TextareaModule, SelectModule, SelectButtonModule, FileUploadModule, ToastModule
    ],
    providers: [MessageService, DatePipe],
    templateUrl: './ejecucion.html'
})
export class EjecucionPage implements OnInit {
    caso = signal<Caso | null>(null);
    nuevaEvidencia: Partial<Evidencia> = {};
    jiraInput: string | null = null;


    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private casoService = inject(CasoService);
    private evidenciaService = inject(EvidenciaService);
    private messageService = inject(MessageService);
    private location = inject(Location);
    private authService = inject(AutenticacionService);
    // Señal para la lista de estados
    estadosModificacion = signal<EstadoModificacion[]>([]);

    // Se inyecta el nuevo servicio estado modificacion
    private estadoModificacionService = inject(EstadoModificacionService);

    mostrarCampoFormulario = signal<boolean>(false);
    private proyectoService = inject(ProyectoService);

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
           
            this.casoService.getCasoById(+casoId).subscribe(data => {
                this.caso.set(data);
            });
            this.nuevaEvidencia.id_caso = +casoId;
        }
        this.cargarEstadosModificacion();
    }

    cargarEstadosModificacion() {
        this.estadoModificacionService.getEstados().subscribe(data => this.estadosModificacion.set(data));
    }

    findEstadoModificacionNombre(id: number | undefined): string {
        if (id === undefined) return 'N/A';
        const estado = this.estadosModificacion().find(e => e.id_estado_modificacion === id);
        return estado ? estado.nombre : 'N/A';
    }

    getSeverityForModificacion(estado: string | null | undefined): string {
        switch (estado) {
            case 'Modificado': return 'warn';
            case 'Nuevo': return 'info';
            case 'Sin cambios': return 'secondary';
            default: return 'secondary';
        }
    }

    guardarEvidencia() {
        const usuarioLogueado = this.authService.usuarioActual();

       
        if (!usuarioLogueado || !usuarioLogueado.idUsuario) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo identificar al usuario. Por favor, inicie sesión de nuevo.'});
            return;
        }

        if ((this.nuevaEvidencia.estado_evidencia === 'NK' || this.nuevaEvidencia.estado_evidencia === 'N/A') && !this.nuevaEvidencia.descripcion_evidencia) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Si el resultado es NK o N/A, entonces la descripción es requerida.' });
            return;
        }
        if (this.nuevaEvidencia.estado_evidencia === 'NK' && !this.nuevaEvidencia.criticidad) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Si el resultado es NK, la criticidad es requerida.' });
            return;
        }

        if (!this.nuevaEvidencia.version_ejecucion) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe escribir la versión de ejecución de la prueba.' });
            return;
        }

        if (this.nuevaEvidencia.estado_evidencia !== 'NK') {
            this.nuevaEvidencia.criticidad = null;
        }

        

        if (this.jiraInput) {
            const parts = this.jiraInput.split('-');
            const numeroJira = parts.length > 1 ? parseInt(parts[parts.length - 1], 10) : null;
            this.nuevaEvidencia.id_jira = isNaN(numeroJira!) ? null : numeroJira;
        } else {
            this.nuevaEvidencia.id_jira = null;
        }
        const evidenciaParaEnviar: Partial<Evidencia> = { ...this.nuevaEvidencia };
        evidenciaParaEnviar.usuarioEjecutante = usuarioLogueado;
        
        //this.nuevaEvidencia.usuarioEjecutante = usuarioLogueado; //RESTAURAR SI FALLA
        
        //RESTAURAR SI FALLA
        // this.evidenciaService.createEvidencia(this.nuevaEvidencia as Evidencia).subscribe({
        //     next: () => {
        //         this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Evidencia guardada correctamente.' });
                 
        //         setTimeout(() => this.router.navigate(['/pages/casos', this.nuevaEvidencia.id_caso]), 1500);
        //     },
        //     error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la evidencia.' })
        // });

        // 1. Se crea la evidencia
        this.evidenciaService.createEvidencia(evidenciaParaEnviar as Evidencia).pipe(
            // 2. Si la creación es exitosa, se encadena la actualización del caso
            switchMap(evidenciaCreada => {
                const casoId = evidenciaCreada.id_caso;
                const nuevaVersion = evidenciaCreada.version_ejecucion;
                
                // Solo se actualiza si hay una nueva versión para registrar
                if (casoId && nuevaVersion) {
                    
                
                    return this.casoService.updateCasoVersion(casoId, nuevaVersion);
                } else {
                    // Si no hay versión, se continúa el flujo sin actualizar
                    return new Observable(observer => observer.next(null)); 
                }
                
            })
        ).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Evidencia y versión del caso guardadas correctamente.' });
                setTimeout(() => this.router.navigate(['/pages/casos', this.nuevaEvidencia.id_caso]), 1500);
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la evidencia o actualizar el caso.' })
        });
    }

    onUpload(event: any) {
        // Aquí manejarías la subida del archivo. Por ahora, solo mostraremos un mensaje.
        // En una implementación real, aquí se llamaría a un servicio que sube el archivo y devuelve la URL.
        const file = event.files[0];
        this.nuevaEvidencia.url_evidencia = `path/to/uploaded/${file.name}`; // URL simulada
        this.messageService.add({ severity: 'info', summary: 'Archivo Subido', detail: file.name });
    }
    volverAtras(): void {
        this.location.back();
    }
}