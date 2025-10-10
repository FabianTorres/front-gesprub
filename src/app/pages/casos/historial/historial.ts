import { Component, OnInit, effect, inject, signal, computed, ViewChild  } from '@angular/core';
import { CommonModule, DatePipe, Location  } from '@angular/common';
import { ActivatedRoute,Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TimelineModule } from 'primeng/timeline';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog'; 
import { SelectModule } from 'primeng/select'; 
import { FormsModule, NgModel } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { RutValidatorDirective } from '../../../directives/rut-validator.directive'; 

import { Caso } from '../../../models/caso';
import { Evidencia } from '../../../models/evidencia';
import { CasoService } from '../../../services/caso.service';
import { HistorialCaso } from '../../../models/historial-caso';
import { EstadoModificacion } from '../../../models/estado-modificacion';
import { EstadoModificacionService } from '../../../services/estado-modificacion.service';
import { ProyectoService } from '../../../services/proyecto.service';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { EvidenciaService } from '../../../services/evidencia.service';
import { CatalogoService } from '../../../services/catalogo.service';
import { ComponenteService } from '../../../services/componente.service';
import { Proyecto } from '../../../models/proyecto';
import { Componente } from '../../../models/componente';
import { CasoConEvidencia } from '../../../models/casoevidencia';
import { SortFuentesPipe } from '../../../pipes/sort-fuentes.pipe';
import { AutenticacionService } from '../../../services/autenticacion.service';
import { ArchivoService } from '../../../services/archivo.service'; 
import { ArchivoEvidencia } from '../../../models/archivo-evidencia';
import { environment } from '../../../../environment/environment';


// Se define la interfaz local para Hito
interface Hito {
    id: number;
    nombre: string;
}

@Component({
    standalone: true,
    imports: [
        CommonModule, InputTextModule, TextareaModule, RutValidatorDirective, 
        RouterModule,
        ButtonModule,
        CardModule,
        TimelineModule,
        TagModule, SortFuentesPipe, 
        ToastModule, DialogModule, SelectModule, FormsModule, ConfirmDialogModule, TooltipModule
    ],
    providers: [MessageService, DatePipe, ConfirmationService],
    templateUrl: './historial.html'
})
export class HistorialPage implements OnInit {

    
    caso = signal<Caso | null>(null);
    historial = signal<Evidencia[]>([]);
    datosHistorial = signal<HistorialCaso | null>(null);
    usuarioActualId = computed(() => this.authService.usuarioActual()?.idUsuario ?? null);
    private evidenciaService = inject(EvidenciaService);
    private catalogoService = inject(CatalogoService); 
    private estadosEvidencia = this.catalogoService.estadosEvidencia;
    private criticidades = this.catalogoService.criticidades;
    private archivoService = inject(ArchivoService);

    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private componenteService = inject(ComponenteService);
    private authService = inject(AutenticacionService);

    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private casoService = inject(CasoService);
    private location = inject(Location); 
    // Señal para la lista de estados
    estadosModificacion = signal<EstadoModificacion[]>([]);

    mostrarCampoFormulario = signal<boolean>(false);
    private proyectoService = inject(ProyectoService);

    proyectoSeleccionadoId: number | null = null;
    componenteSeleccionadoId: number | null = null;
    casoDestinoId: number | null = null;

    moverDialog: boolean = false;
    evidenciaParaMover: Evidencia | null = null;

    proyectos = signal<Proyecto[]>([]);
    componentes = signal<Componente[]>([]);
    casos = signal<Caso[]>([]);

    todosLosComponentes = signal<Componente[]>([]);
    hitos = signal<Hito[]>([]);
    componentesFiltrados = signal<Componente[]>([]);
    hitoSeleccionadoId: number | null = null;

    //Propiedades para el cuadro de edicion
    editarDialogVisible = signal<boolean>(false);
    evidenciaParaEditar = signal<Evidencia | null>(null);
    evidenciaEditada: Partial<Evidencia> = {};
    motivoCorreccion: string = '';
    @ViewChild('rutInput') rutInputControl!: NgModel;


    // Se inyecta el nuevo servicio estado modificacion
    private estadoModificacionService = inject(EstadoModificacionService);


    constructor() {

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
            case 'Eliminado': return 'danger';
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

    findEstadoEvidenciaNombre(id: number | undefined): string {
        if (id === undefined) return 'Desconocido';
        const estado = this.estadosEvidencia().find(e => e.id_estado_evidencia === id);
        return estado ? estado.nombre : 'Desconocido';
    }

    // Busca el nombre de la criticidad a partir de su ID
    findCriticidadNombre(id: number | undefined): string | undefined {
        if (id === undefined || id === null) {
            return undefined;
        }
        const criticidad = this.criticidades().find(c => c.id_criticidad === id);
        return criticidad ? criticidad.nombre_criticidad : undefined;
    }

    volverAtras(): void {
        this.location.back();
    }




     abrirDialogoMover(evidencia: Evidencia) {
        this.evidenciaParaMover = evidencia;
        const proyectoActual = this.proyectoService.proyectoSeleccionado();

        if (proyectoActual) {
            // Cargamos todos los componentes del proyecto actual para poder derivar los hitos
            this.componenteService.getComponentesPorProyecto(proyectoActual.id_proyecto).subscribe(data => {
                this.todosLosComponentes.set(data);
                this.cargarHitos(data);
            });
        }
        this.moverDialog = true;
    }

    cargarHitos(componentes: Componente[]) {
        const hitosUnicos = [...new Map(componentes.map(c => [c.hito_componente, c.hito_componente])).values()];
        this.hitos.set(hitosUnicos.map(h => ({ id: h, nombre: `Hito ${h}` })));
    }

    onHitoChange() {
        this.componentesFiltrados.set([]);
        this.casos.set([]);
        this.componenteSeleccionadoId = null;
        this.casoDestinoId = null;
        if (this.hitoSeleccionadoId) {
            const componentesDelHito = this.todosLosComponentes().filter(c => c.hito_componente === this.hitoSeleccionadoId);
            this.componentesFiltrados.set(componentesDelHito);
        }
    }


    onComponenteChange() {
        this.casos.set([]);
        this.casoDestinoId = null;
        if (this.componenteSeleccionadoId) {
            this.casoService.getCasosPorComponente(this.componenteSeleccionadoId).subscribe((data: CasoConEvidencia[]) => {
                const idCasoActual = this.datosHistorial()?.id_caso;
                const casosFiltrados = data
                    .map(item => item.caso) // Extraemos solo el objeto 'caso'
                    .filter(c => c.id_caso !== idCasoActual); // Filtramos el caso actual
                this.casos.set(casosFiltrados);
            });
        }
    }

    cerrarDialogoMover() {
        this.moverDialog = false;
        this.evidenciaParaMover = null;
        this.hitoSeleccionadoId = null;
        this.componenteSeleccionadoId = null;
        this.casoDestinoId = null;
        this.todosLosComponentes.set([]);
        this.hitos.set([]);
        this.componentesFiltrados.set([]);
        this.casos.set([]);
    }

    confirmarMovimiento() {
        
        if (!this.casoDestinoId || !this.evidenciaParaMover?.id_evidencia) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar un caso de destino.' });
            return;
        }

        this.confirmationService.confirm({
            message: `¿Está seguro de que desea mover esta evidencia al caso seleccionado? Esta acción no se puede deshacer.`,
            header: 'Confirmar Movimiento',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, mover',
            rejectLabel: 'Cancelar',
            accept: () => {
               
                this.moverEvidencia();
            }
        });
    }

    toggleEstadoEvidencia(evidencia: Evidencia) {
        const nuevoEstado = evidencia.activo === 1 ? 0 : 1;
        const accion = nuevoEstado === 0 ? 'desactivar' : 'reactivar';
        const accionGerundio = nuevoEstado === 0 ? 'Desactivando' : 'Reactivando';


        // Si la evidencia ya está inactiva (0), no hacemos nada.
        if (evidencia.activo === 0) {
            this.messageService.add({ 
                severity: 'info', 
                summary: 'Información', 
                detail: 'Esta evidencia ya está desactivada y la acción no se puede revertir.' 
            });
            return; 
        }

        this.confirmationService.confirm({
            message: `¿Está seguro de que desea ${accion} esta ejecución? Esta acción no se puede revertir`,
            header: `Confirmar Acción`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: `Sí, ${accion}`,
            rejectLabel: 'Cancelar',
            accept: () => {
                const idEvidencia = evidencia.id_evidencia!;
                const idCaso = this.datosHistorial()!.id_caso;

                
                    this.evidenciaService.updateEstadoActivo(idEvidencia, 0).pipe(
                        // 1. Después de anular, pedimos el historial actualizado del caso.
                        switchMap(() => {
                            return this.casoService.getHistorialPorCasoId(idCaso);
                        }),
                        // 2. Con el historial actualizado, calculamos la nueva versión y la guardamos.
                        switchMap(historialActualizado => {
                            let nuevaVersion = '1.0'; // Versión por defecto si no quedan evidencias activas.

                            // Filtramos solo las evidencias activas
                            const evidenciasActivas = historialActualizado.historial?.filter(e => e.activo !== 0) || [];

                            if (evidenciasActivas.length > 0) {
                                // Asumimos que el historial viene ordenado del más nuevo al más viejo
                                nuevaVersion = evidenciasActivas[0].version_ejecucion;
                            }
                            
                            // Actualizamos la versión del caso principal en la base de datos
                            return this.casoService.updateCasoVersion(idCaso, nuevaVersion);
                        })
                    ).subscribe({
                        next: () => {
                            // Actualizamos el estado localmente para que se refleje en la vista
                            this.datosHistorial.update(historialActual => {
                                if (historialActual) {
                                    const index = historialActual.historial.findIndex(e => e.id_evidencia === idEvidencia);
                                    if (index !== -1) {
                                        historialActual.historial[index].activo = 0;
                                    }
                                }
                                return historialActual ? { ...historialActual } : null;
                            });

                            this.messageService.add({ 
                                severity: 'success', 
                                summary: 'Éxito', 
                                detail: 'La ejecución ha sido desactivada.' 
                            });
                        },
                        error: (err) => {
                            this.messageService.add({ 
                                severity: 'error', 
                                summary: 'Error', 
                                detail: `No se pudo desactivar la ejecución.`
                            });
                            console.error(`Anulando ejecución falló`, err);
                        }
                    });
            }
        });
    }

    moverEvidencia() {
        const idEvidencia = this.evidenciaParaMover!.id_evidencia!;
        const idCasoDestino = this.casoDestinoId!;
        const versionMovida = this.evidenciaParaMover!.version_ejecucion;
        const idCasoOrigen = this.datosHistorial()!.id_caso;

        // Usamos .pipe() para encadenar las llamadas a la API
        this.evidenciaService.moverEvidencia(idEvidencia, idCasoDestino).pipe(
            // 1. Mover fue exitoso. Ahora actualizamos la versión del CASO DE DESTINO.
            switchMap(() => {
                //console.log(`Paso 1: Actualizando versión del caso destino (${idCasoDestino}) a ${versionMovida}`);
                return this.casoService.updateCasoVersion(idCasoDestino, versionMovida);
            }),
            // 2. La versión de destino fue actualizada. Ahora buscamos el historial actualizado del CASO DE ORIGEN.
            switchMap(() => {
                //console.log(`Paso 2: Obteniendo nuevo historial para el caso de origen (${idCasoOrigen})`);
                return this.casoService.getHistorialPorCasoId(idCasoOrigen);
            }),
            // 3. Tenemos el nuevo historial. Calculamos la nueva versión del CASO DE ORIGEN y la actualizamos.
            switchMap(historialActualizado => {
                let nuevaVersionOrigen = '1.0'; // Versión por defecto si no quedan evidencias
                
                if (historialActualizado.historial && historialActualizado.historial.length > 0) {
                    // Asumimos que el historial viene ordenado del más nuevo al más viejo
                    nuevaVersionOrigen = historialActualizado.historial[0].version_ejecucion;
                }
                
                //console.log(`Paso 3: Actualizando versión del caso de origen (${idCasoOrigen}) a ${nuevaVersionOrigen}`);
                return this.casoService.updateCasoVersion(idCasoOrigen, nuevaVersionOrigen);
            })
        ).subscribe({
        next: () => {
            this.messageService.add({ 
                severity: 'success', 
                summary: 'Éxito', 
                detail: 'La evidencia se movió exitosamente.' 
            });
            
            // Refrescamos la vista para que la evidencia movida desaparezca
            this.datosHistorial.update(historial => {
                if (historial) {
                    historial.historial = historial.historial.filter(e => e.id_evidencia !== idEvidencia);
                }
                return historial ? { ...historial } : null;
            });
            this.cerrarDialogoMover();
        },
        error: (err) => {
            console.error('Error durante el proceso de mover evidencia:', err);
            this.messageService.add({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'Ocurrió un error al mover la evidencia. La operación fue cancelada.' 
            });
        }
        });
    }


    descargarArchivoSeguro(archivo: ArchivoEvidencia) {
        this.messageService.add({ 
            severity: 'info', 
            summary: 'Preparando Descarga', 
            detail: `Solicitando acceso para "${archivo.nombre_archivo}"...`,
            life: 2000 // El mensaje dura 2 segundos
        });

        this.archivoService.getSecureDownloadUrl(archivo.id_archivo).subscribe({
            next: (response) => {
                // 2. Al recibir la URL segura, la abrimos en una nueva pestaña.
                window.open(response.url, '_blank');
            },
            error: (err) => {
                console.error('Error al obtener la URL segura:', err);
                this.messageService.add({ 
                    severity: 'error', 
                    summary: 'Error de Descarga', 
                    detail: 'No se pudo obtener el permiso para descargar el archivo.' 
                });
            }
        });
    }

    /**
     * Construye la URL completa para una incidencia de Jira.
     * @param jiraId El ID numérico de la incidencia.
     * @returns La URL completa y funcional.
     */
    getJiraUrl(jiraId: number | null | undefined): string {
        if (!jiraId) {
            return '#'; // Devuelve un enlace no funcional si no hay ID
        }
        // Concatena la URL base del entorno con el ID de la incidencia
        return `${environment.jiraBaseUrl}${jiraId}`;
    }


    /**
     * Abre el diálogo de edición y clona la evidencia seleccionada.
     * @param evidencia La evidencia original que se va a corregir.
     */
    abrirDialogoEditar(evidencia: Evidencia) {
        this.evidenciaParaEditar.set(evidencia);
        // Creamos una copia para editar, para no modificar la original en la vista.
        this.evidenciaEditada = { ...evidencia }; 
        this.motivoCorreccion = ''; // Limpiamos el motivo
        this.editarDialogVisible.set(true);
    }

    /**
     * Cierra el diálogo de edición y resetea las variables.
     */
    cerrarDialogoEditar() {
        this.editarDialogVisible.set(false);
        this.evidenciaParaEditar.set(null);
        this.evidenciaEditada = {};
    }

    /**
     * Procesa y guarda la corrección como una nueva evidencia.
     */
    guardarCorreccion() {
        const original = this.evidenciaParaEditar();
        const usuario = this.authService.usuarioActual();
        const datosDelHistorial = this.datosHistorial();

        if (!original || !usuario || !datosDelHistorial) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se puede procesar la solicitud.' });
            return;
        }

        if (this.evidenciaEditada.rut && this.rutInputControl && this.rutInputControl.invalid) {
            this.messageService.add({ 
                severity: 'warn', 
                summary: 'Atención', 
                detail: 'El RUT ingresado no es válido. Por favor, corríjalo.' 
            });
            return; // Detenemos la ejecución
        }

        // 1. Preparamos el objeto para la nueva evidencia (la réplica).
        const nuevaEvidenciaReplica: Partial<Evidencia> = {
            ...original, // Copiamos todos los datos originales
            id_evidencia: undefined,

            id_caso: datosDelHistorial?.id_caso,
            
            // 2. Sobrescribimos con los datos modificados del diálogo
            rut: this.evidenciaEditada.rut || undefined, // Si está vacío, lo dejamos como undefined
            id_jira: this.parseJiraInput(this.evidenciaEditada.id_jira),

            // 3. Actualizamos los metadatos de la nueva ejecución
            id_usuario_ejecutante: undefined!,
            usuarioEjecutante: usuario,
            fecha_evidencia: new Date().toISOString(), // La fecha y hora actual
            
            // 4. Creamos una descripción que refleje la corrección
            descripcion_evidencia: this.generarDescripcionCorreccion(original)
        };

        console.log('Nuevos datos que se enviarán al backend:', nuevaEvidenciaReplica);
        
        // 5. Llamamos al servicio para crear la nueva evidencia
        this.evidenciaService.createEvidencia(nuevaEvidenciaReplica as Evidencia).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'La corrección se ha guardado como una nueva ejecución.' });
                this.cerrarDialogoEditar();
                this.ngOnInit(); // Recargamos el historial para ver el nuevo registro
            },
            error: (err) => {
                console.error("Error al guardar la corrección:", err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la corrección.' });
            }
        });
    }

    /**
     * Genera un texto descriptivo para la nueva evidencia de corrección.
     */
    private generarDescripcionCorreccion(original: Evidencia): string {
        const fechaOriginal = new Date(original.fecha_evidencia!).toLocaleString('es-CL');
        let descripcion = `[CORRECCIÓN] `;
        
        if (this.motivoCorreccion) {
            descripcion += `\nMotivo: ${this.motivoCorreccion}`;
        }
        
        // Añadimos la descripción original si existía
        if (original.descripcion_evidencia) {
            descripcion += `\n\nOriginal:\n${original.descripcion_evidencia}`;
        }

        return descripcion;
    }

    /**
     * Extrae solo el número de un ID de Jira (ej. "CERTRTA26-99" -> 99).
     */
    private parseJiraInput(jiraInput: any): number | undefined {
        if (!jiraInput) return undefined;
        
        const jiraString = String(jiraInput);
        const parts = jiraString.split('-');
        const lastPart = parts[parts.length - 1];
        
        const numero = parseInt(lastPart, 10);
        return isNaN(numero) ? undefined : numero;
    }

   
}