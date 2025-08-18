// src/app/pages/ejecucion/ejecucion.ts

import { Component, OnInit, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, Location  } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';
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
import { map, switchMap } from 'rxjs/operators';
import { catchError, forkJoin, of } from 'rxjs';
import { RutValidatorDirective } from '../../directives/rut-validator.directive';
import { CatalogoService } from '../../services/catalogo.service';
import { HistorialCaso } from '../../models/historial-caso';

@Component({
    standalone: true,
    imports: [
        CommonModule, RutValidatorDirective , VersionFormatDirective , TagModule, FieldsetModule,DividerModule , FormsModule, RouterModule, ButtonModule, ButtonGroupModule, CardModule, InputTextModule,
        TextareaModule, SelectModule, SelectButtonModule, FileUploadModule, ToastModule
    ],
    providers: [MessageService, DatePipe],
    templateUrl: './ejecucion.html'
})
export class EjecucionPage implements OnInit {
    caso = signal<Caso | null>(null);
    historial = signal<HistorialCaso | null>(null);
    nuevaEvidencia: Partial<Evidencia> = {};
    jiraInput: string | null = null;
    archivosParaSubir = signal<File[]>([]); 

    @ViewChild('rutInput') rutInputControl!: NgModel;


    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private casoService = inject(CasoService);
    private evidenciaService = inject(EvidenciaService);
    private messageService = inject(MessageService);
    private location = inject(Location);
    private authService = inject(AutenticacionService);
    private catalogoService = inject(CatalogoService);


    //private ultimaEvidencia: Evidencia;

    // Hacemos que los datos del catálogo sean accesibles para la vista
    listaEstadosEvidencia = this.catalogoService.estadosEvidencia;
    listaCriticidades = this.catalogoService.criticidades;
    // Señal para la lista de estados
    estadosModificacion = signal<EstadoModificacion[]>([]);

    // Se inyecta el nuevo servicio estado modificacion
    private estadoModificacionService = inject(EstadoModificacionService);

    mostrarCampoFormulario = signal<boolean>(false);
    private proyectoService = inject(ProyectoService);

     // Esta señal "calcula" cuál es el objeto de estado completo que el usuario ha seleccionado.
    estadoSeleccionado = computed(() => {
        const id = this.nuevaEvidencia.id_estado_evidencia;
        if (!id) return undefined;
        return this.listaEstadosEvidencia().find(e => e.id_estado_evidencia === id);
    });

    criticidadSeleccionada = computed(() => {
        const id = this.nuevaEvidencia.id_criticidad;
        if (!id) return undefined;
        return this.listaCriticidades().find(c => c.id_criticidad === id);
    });

    // Esta señal nos da el ID específico de 'NK' de forma reactiva.
    idEstadoNK = computed(() => {
        return this.listaEstadosEvidencia().find(e => e.nombre === 'NK')?.id_estado_evidencia;
    });

    //Obtiene la ultima version ejecutada desde el historial
    ultimaVersionEjecutada = computed(() => {
      const historialActual = this.historial();
        if (historialActual && historialActual.historial.length > 0) {
            // Se ordenan las evidencias por fecha
             const evidenciasOrdenadas = [...historialActual.historial].sort((a, b) => {
                 const dateA = a.fecha_evidencia ? new Date(a.fecha_evidencia).getTime() : 0;
                 const dateB = b.fecha_evidencia ? new Date(b.fecha_evidencia).getTime() : 0;
                 return dateB - dateA;
             });
             const ultima = evidenciasOrdenadas[0];
             return ultima.version_ejecucion;
         }
         return 'No hay ejecuciones previas';
     });

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
            
            //Obtiene el caso por el id
            this.casoService.getCasoById(+casoId).subscribe(data => {
                this.caso.set(data);
            });

            //Obtiene el historial del caso 
            this.casoService.getHistorialPorCasoId(+casoId).subscribe(data=>{
                 this.historial.set(data);
             });

          
            this.nuevaEvidencia.id_caso = +casoId;
        }
        this.cargarEstadosModificacion();
    }

        getSeverityForCriticidad(nombreCriticidad: string): 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast' {
            switch (nombreCriticidad.toLowerCase()) {
                case 'leve': return 'info';
                case 'medio': return 'warn';
                case 'grave': return 'danger';
                case 'crítico': return 'contrast';
                default: return 'secondary';
            }
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

        // --- Lógica mejorada para obtener los objetos seleccionados ---
        const estadoSeleccionado = this.listaEstadosEvidencia().find(e => e.id_estado_evidencia === this.nuevaEvidencia.id_estado_evidencia);
        const usuarioLogueado = this.authService.usuarioActual();

        
        if (!estadoSeleccionado) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar un resultado para la prueba.' });
            return;
        }
        if (!usuarioLogueado || !usuarioLogueado.idUsuario) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo identificar al usuario. Por favor, inicie sesión de nuevo.'});
            return;
        }

        if ((estadoSeleccionado?.nombre === 'NK' || estadoSeleccionado?.nombre === 'N/A') && !this.nuevaEvidencia.descripcion_evidencia) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Si el resultado es NK o N/A, entonces la descripción es requerida.' });
            return;
        }
        if (estadoSeleccionado?.nombre === 'NK' && !this.nuevaEvidencia.id_criticidad) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Si el resultado es NK, la criticidad es requerida.' });
            return;
        }

        if (!this.nuevaEvidencia.version_ejecucion) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe escribir la versión de ejecución de la prueba.' });
            return;
        }
        const versionRegex = /^\d+\.\d+$/; 
        if (!versionRegex.test(this.nuevaEvidencia.version_ejecucion)) {
            this.messageService.add({ 
                severity: 'warn', 
                summary: 'Formato Incorrecto', 
                detail: 'La versión debe tener el formato número.número (ej: 1.0).' 
            });
            return; // Detenemos el guardado
        }

        if (estadoSeleccionado?.nombre !== 'NK') {
            this.nuevaEvidencia.id_criticidad = null;
        }

        // Comprobamos si el control del RUT existe y si es inválido.
        if (this.rutInputControl && this.rutInputControl.invalid) {
            this.messageService.add({ 
                severity: 'warn', 
                summary: 'Atención', 
                detail: 'El RUT ingresado no es válido. Por favor, corríjalo.' 
            });
            return; // Detenemos la ejecución aquí
        }

        // Validar que OK o NK tengan al menos un archivo.
        if ((estadoSeleccionado?.nombre === 'OK' || estadoSeleccionado?.nombre === 'NK') && this.archivosParaSubir().length === 0) {
            this.messageService.add({ 
                severity: 'warn', 
                summary: 'Atención', 
                detail: 'Debe adjuntar al menos un archivo de evidencia para los estados OK y NK.' 
            });
            return; // Detenemos el guardado
        }

        // Validar que NK tenga un Jira asociado.
        if (estadoSeleccionado?.nombre === 'NK' && (!this.jiraInput || this.jiraInput.trim() === '')) {
            this.messageService.add({ 
                severity: 'warn', 
                summary: 'Atención', 
                detail: 'El campo Jira es obligatorio cuando el resultado es NK.' 
            });
            return; // Detenemos el guardado
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
        
        this.nuevaEvidencia.usuarioEjecutante = usuarioLogueado; 
        

        // 1. Se crea la evidencia
        this.evidenciaService.createEvidencia(this.nuevaEvidencia as Evidencia).pipe(
            switchMap(evidenciaCreada => {
                const idEvidencia = evidenciaCreada.id_evidencia;

                // Si se creó la evidencia y hay archivos seleccionados
                if (idEvidencia && this.archivosParaSubir().length > 0) {
                    
                    // Creamos un array de observables, uno por cada archivo a registrar
                    const registroObservables = this.archivosParaSubir().map(file => {
                        // Creamos el objeto JSON que espera el backend
                        const archivoData = {
                            nombre_archivo: file.name,
                            // Usamos una URL temporal/en duro como solicitaste
                            url_archivo: `/uploads/temp/${file.name}`
                        };

                        // Llamamos al método actualizado del servicio
                        return this.evidenciaService.uploadArchivo(idEvidencia, archivoData).pipe(
                            catchError(err => {
                                console.error('Error registrando archivo:', file.name, err);
                                // Devolvemos `of(null)` para que forkJoin no se cancele si un archivo falla
                                return of(null);
                            })
                        );
                    });

                    // forkJoin espera a que todos los archivos se hayan registrado
                    return forkJoin(registroObservables).pipe(
                        // Mapeamos de vuelta a la evidencia creada para continuar el flujo
                        map(() => evidenciaCreada)
                    );
                }

                // Si no hay archivos, simplemente continuamos con la evidencia creada
                return of(evidenciaCreada);
            }),
            // Ahora actualizamos la versión del caso
            switchMap(evidenciaCreada => {
                const casoId = evidenciaCreada.id_caso;
                const nuevaVersion = evidenciaCreada.version_ejecucion;
                if (casoId && nuevaVersion) {
                    return this.casoService.updateCasoVersion(casoId, nuevaVersion);
                }
                return of(null);
            })
        ).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Evidencia y archivos guardados correctamente.' });
                setTimeout(() => this.router.navigate(['/pages/casos', this.nuevaEvidencia.id_caso]), 1500);
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la evidencia.' })
        });
    }

    volverAtras(): void {
        this.location.back();
    }

    onSelectFiles(event: { files: File[] }) {
        this.archivosParaSubir.set([...this.archivosParaSubir(), ...event.files]);
    }

    onRemoveFile(event: { file: File }) {
        this.archivosParaSubir.set(this.archivosParaSubir().filter(f => f !== event.file));
    }

    onClearFiles() {
        this.archivosParaSubir.set([]);
    }

    onRutInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        let valor = input.value;

        // 1. Limpiamos el valor de todo lo que no sea número o la letra 'k'
        let rutLimpio = valor.replace(/[^0-9kK]/gi, '');

        // Si no hay nada, no hacemos nada
        if (rutLimpio.length === 0) {
            this.nuevaEvidencia.rut = '';
            return;
        }

        // 2. Separamos el cuerpo del dígito verificador
        let cuerpo = rutLimpio.slice(0, -1);
        let dv = rutLimpio.slice(-1);

        // 3. Formateamos el RUT con el guion
        let rutFormateado = cuerpo + '-' + dv;
        
        // 4. Actualizamos el modelo y el valor del input
        // Es importante hacerlo de esta manera para evitar problemas con el cursor
        this.nuevaEvidencia.rut = rutFormateado;
        input.value = rutFormateado;
    }

    onVersionInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        let valor = input.value;
    
        // 1. Reemplazamos la coma por un punto.
        valor = valor.replace(/,/g, '.');
    
        // 2. Eliminamos cualquier caracter que no sea un dígito o un punto.
        valor = valor.replace(/[^0-9\.]/g, '');
    
        // 3. Nos aseguramos de que haya un solo punto como máximo.
        const partes = valor.split('.');
        if (partes.length > 2) {
            valor = partes[0] + '.' + partes.slice(1).join('');
        }
    
        // 4. Evitamos ceros a la izquierda en la parte principal (ej: 01.5 -> 1.5)
        if (partes[0] && partes[0].length > 1 && partes[0].startsWith('0')) {
            partes[0] = parseInt(partes[0], 10).toString();
            valor = partes.join('.');
        }

        // 5. Actualizamos el modelo y el valor del input.
        this.nuevaEvidencia.version_ejecucion = valor;
        input.value = valor;
    }
}