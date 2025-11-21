import { Component, OnInit, inject, signal, effect, ViewChild, ElementRef, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { ChipsModule } from 'primeng/chips';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { SplitButtonModule } from 'primeng/splitbutton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FieldsetModule } from 'primeng/fieldset';
import { Caso } from '../../models/caso';
import { CasoService } from '../../services/caso.service';
import { Componente } from '../../models/componente';
import { ComponenteService } from '../../services/componente.service';
import { VersionFormatDirective } from '../../directives/version-format.directive';
import { CasoConEvidencia } from '../../models/casoevidencia';
import { TruncatePipe } from '../../pipes/truncate.pipe';
import { environment } from '../../../environment/environment';
import { ProyectoService } from '../../services/proyecto.service';
import { AutenticacionService } from '../../services/autenticacion.service';
import { leerYValidarExcel, descargarPlantillaCasos, exportarAExcel } from '../../utils/excel.utils';
import * as XLSX from 'xlsx';
import XLSXStyle from 'xlsx-js-style';
import { EstadoModificacion } from '../../models/estado-modificacion';
import { EstadoModificacionService } from '../../services/estado-modificacion.service';
import { CatalogoService } from '../../services/catalogo.service';
import { Fuente } from '../../models/fuente';
import { FuenteService } from '../../services/fuente.service';
import { switchMap } from 'rxjs';
import { SortFuentesPipe } from '../../pipes/sort-fuentes.pipe';
import { FileUpload } from "primeng/fileupload";
import * as similarity from 'string-similarity';
import { Usuario } from '../../models/usuario';
import { UsuarioService } from '../../services/usuario.service';


// Define la estructura de un cambio detectado para la previsualización.
interface CambioDetectado {
    campo: string;
    valorAnterior: any;
    valorNuevo: any;
}

// Se define una interfaz local para la estructura de los Hitos.
interface Hito {
    id: number;
    nombre: string;
}

@Component({
    standalone: true,
    imports: [
        IconFieldModule, FileUpload, SortFuentesPipe, AutoCompleteModule, SplitButtonModule, FieldsetModule, InputIconModule, TooltipModule, CommonModule, FormsModule, TableModule, ButtonModule, ToolbarModule, DialogModule,
        RouterModule, TruncatePipe, ChipsModule, TagModule, InputTextModule, TextareaModule, SelectModule, InputSwitchModule, ConfirmDialogModule, ToastModule, InputNumberModule, VersionFormatDirective,
        FileUpload, SelectButtonModule
    ],
    providers: [MessageService, ConfirmationService, DatePipe],
    templateUrl: './casos.html'
})
export class CasosPage implements OnInit {
    // Señal (Signal) que almacena la lista de casos a mostrar en la tabla.
    //casos = signal<CasoConEvidencia[]>([]);
    //Modificacion preliminar
    casos = computed(() => {
        const todos = this.todosLosCasosMaestros();
        const filtroActivo = this.filtroMisCasosActivo();
        const filtroActivos = this.filtroSoloActivos();
        const miId = this.usuarioActualId();

        if (filtroActivo && miId) {
            // Ahora filtramos verificando AMBAS propiedades para el ID de usuario asignado.
            return todos.filter(c =>
                c.caso.id_usuario_asignado === miId || c.caso.idUsuarioAsignado === miId
            );

        }

        // 3. Aplicar filtro de "Solo Activos" si está activo
        if (filtroActivos) {
            return todos.filter(
                c => c.caso.activo === 1
            );
        }

        // Por defecto, o si el filtro está inactivo, se devuelven todos los casos.
        return todos;
    });

    opcionesImportar: MenuItem[];


    // Señal que almacena la lista completa de componentes para los desplegables.
    componentes = signal<Componente[]>([]);

    // Señal guarda TODOS los casos del componente, sin filtrar.
    private todosLosCasosMaestros = signal<CasoConEvidencia[]>([]);
    filtroMisCasosActivo = signal<boolean>(false);
    filtroSoloActivos = signal<boolean>(false);
    // Objeto que representa el caso que se está creando o editando en el diálogo.
    caso!: Partial<Caso>;
    // Controla la visibilidad del diálogo emergente.
    casoDialog: boolean = false;
    // Indica si el diálogo está en modo 'Editar' o 'Nuevo'.
    editando: boolean = false;
    // Modela el estado del interruptor 'Activo' en el diálogo.
    activoDialog: boolean = true;
    // Señal que almacena los hitos únicos para el desplegable de filtro.
    hitos = signal<Hito[]>([]);
    // Señal que almacena los componentes filtrados por el hito seleccionado.
    componentesFiltrados = signal<Componente[]>([]);
    // Modela el ID del componente seleccionado en el filtro principal.
    componenteSeleccionadoId: number | null = null;
    // Señal que controla el estado de carga de la tabla de casos.
    cargandoCasos = signal<boolean>(false);
    // Señal que modela el hito seleccionado en el diálogo de edición/creación.
    hitoSeleccionado = signal<number | null>(null);
    // Almacena las opciones para el filtro de estado en la tabla.
    //opcionesFiltroEstado: any[];

    // Propiedades para el flujo de importación
    resumenImportacionDialog: boolean = false;
    loteParaProcesar = {
        casosParaCrear: [] as any[],
        casosParaActualizar: [] as any[]
    };

    /**
     * Señal que almacena la clave única para guardar/restaurar el estado de la tabla.
     * Cambia dinámicamente según el componente seleccionado.
     */
    tableStateKey = signal<string>('estado-tabla-casos-sin-seleccion');

    // Señal para las opciones del filtro de versión
    opcionesFiltroVersion = signal<any[]>([]);
    // Propiedad para controlar el switch de la fuente
    //esFuenteExterna: boolean = false;

    // Propiedad para los items del botón de exportar
    opcionesExportar: MenuItem[];

    // Propiedades para el diálogo de importación
    importDialog: boolean = false;
    archivoParaImportar: File | null = null;

    private todosLosUsuarios = signal<Usuario[]>([]);

    private catalogoService = inject(CatalogoService);
    private estadosEvidencia = this.catalogoService.estadosEvidencia;

    private fuenteService = inject(FuenteService);
    todasLasFuentes = signal<Fuente[]>([]);
    private usuarioService = inject(UsuarioService);

    sugerenciasFuentes = signal<Fuente[]>([]);

    // Diálogos y datos para el nuevo flujo de modificación
    importModificarDialog: boolean = false;
    previsualizacionDialog: boolean = false;
    casosConCambios: { casoOriginal: CasoConEvidencia, cambios: CambioDetectado[], datosParaEnviar: any }[] = [];
    casosParaCrearDetectados: any[] = []; // Para los nuevos casos en el mismo archivo de modificación


    estadosModificacion = signal<EstadoModificacion[]>([]);
    private estadoModificacionService = inject(EstadoModificacionService);

    todosLosFormularios = signal<number[]>([]);
    sugerenciasFormulario = signal<number[]>([]);

    // Señal nos da el ID del usuario logueado de forma reactiva.
    usuarioActualId = computed(() => this.authService.usuarioActual()?.idUsuario ?? null);

    // Propiedades para el diálogo de advertencia
    advertenciaDialog: boolean = false;
    casosConAdvertencia: any[] = [];
    casosValidadosTemporalmente: any[] = [];

    private accionConfirmada: 'importar' | 'guardarManual' = 'importar';

    // Controla el estado/paso actual del proceso de importación
    importStep: 'selection' | 'mapping' | 'preview' = 'selection';

    // Propiedades para el Asistente de Importación
    nuestrosCampos: any[] = [
        { campo: 'Nombre del Caso', obligatorio: true },
        { campo: 'Descripción', obligatorio: true },
        { campo: 'Versión', obligatorio: true },
        { campo: 'Estado Modificación', obligatorio: true },
        { campo: 'Fuentes', obligatorio: false },
        { campo: 'Precondiciones', obligatorio: false },
        { campo: 'Pasos', obligatorio: false },
        { campo: 'Resultado Esperado', obligatorio: false }
    ];
    excelHojas: string[] = [];
    excelHojaSeleccionada: string = '';
    excelEncabezados: string[] = [];
    mapeoColumnas: { [key: string]: string | null } = {};


    //Propiedades para la Previsualización
    datosPrevisualizacion: any[] = [];
    columnasPrevisualizacion: { field: string, header: string }[] = [];
    private todasLasFilasDelExcel: any[] = [];

    // Almacena las opciones para el filtro de activo en la tabla.
    opcionesFiltroActivo: any[];
    //Propiedad para controlar el estado del panel
    detallesAvanzadosColapsados: boolean = true;

    opcionesFiltroModificacion: any[];

    // Señal para controlar la visibilidad del campo formulario
    //mostrarCampoFormulario = signal<boolean>(false);

    private proyectoService = inject(ProyectoService);

    // Referencia a la tabla de PrimeNG en el HTML para poder controlarla.
    @ViewChild('dt') dt!: Table;
    // Referencia al campo de texto del filtro global.
    @ViewChild('filterInput') filterInput!: ElementRef<HTMLInputElement>;

    // Inyección de dependencias de los servicios necesarios.
    private casoService = inject(CasoService);
    private componenteService = inject(ComponenteService);
    private messageService = inject(MessageService);
    private datePipe = inject(DatePipe);
    private authService = inject(AutenticacionService);

    // Opciones y estado para el nuevo filtro de asignación.
    opcionesFiltroAsignacion = [
        { label: 'Todos los Casos', value: 'todos' },
        { label: 'Mis Casos Asignados', value: 'misCasos' }
    ];
    filtroAsignacion = signal<'todos' | 'misCasos'>('todos');


    constructor() {
        // Se crea un 'effect' que reacciona a los cambios en la señal 'hitoSeleccionado'.
        effect(() => {
            const todosComponentes = this.componentes();
            const hitoId = this.hitoSeleccionado();
            let componentesDelHito: Componente[] = [];

            if (hitoId) {
                componentesDelHito = todosComponentes.filter(c => c.hito_componente === hitoId);
            }

            this.componentesFiltrados.set(componentesDelHito);

            // Se resetea la selección de componente si ya no es válida para el nuevo hito.
            if (this.caso && this.caso.id_componente) {
                const componenteSigueSiendoValido = componentesDelHito.some(c => c.id_componente === this.caso.id_componente);
                if (!componenteSigueSiendoValido) {
                    this.caso.id_componente = undefined;
                }
            }
        });

        // Se reemplaza el .subscribe() por un effect que reacciona al cambio de proyecto
        effect(() => {
            const proyectoActual = this.proyectoService.proyectoSeleccionado();
            // Cada vez que el proyecto global cambia, se limpian las selecciones
            this.componenteSeleccionadoId = null;
            //this.casos.set([]);
            //Modificacion preliminar
            this.todosLosCasosMaestros.set([]);
            if (proyectoActual) {
                this.cargarComponentes(proyectoActual.id_proyecto);
            } else {
                // Si no hay proyecto, se vacía la lista de componentes
                this.componentes.set([]);
            }
        });

        // Effect que extrae las versiones únicas de los casos cargados
        effect(() => {
            const casosActuales = this.casos();
            const versionesUnicas = [...new Set(casosActuales.map(item => item.caso.version).filter(Boolean))];
            this.opcionesFiltroVersion.set(
                versionesUnicas.map(version => ({ label: version, value: version }))
            );
        });

        //Se inicializan las nuevas opciones
        this.opcionesFiltroActivo = [
            { label: 'Activo', value: 1 },
            { label: 'Inactivo', value: 0 }
        ];

        this.opcionesFiltroModificacion = [
            { label: 'Nuevo', value: 1 },
            { label: 'Modificado', value: 2 },
            { label: 'Sin cambios', value: 3 },
            { label: 'Eliminado', value: 6 }

        ];



        // Definimos las opciones que aparecerán en el menú del botón de exportación
        this.opcionesExportar = [
            {
                label: 'Exportar a Excel',
                icon: 'pi pi-file-excel',
                command: () => {
                    this.exportarCasos('excel');
                }
            },
            {
                label: 'Exportar a CSV',
                icon: 'pi pi-file',
                command: () => {
                    this.exportarCasos('csv');
                }
            },
            {
                label: 'Exportar Plan de Pruebas',
                icon: 'pi pi-file-pdf',
                command: () => {
                    this.exportarPlanDePruebas();
                }
            }
        ];

        // Definimos las opciones para el nuevo botón desplegable de importación.
        this.opcionesImportar = [
            {
                label: 'Casos Nuevos',
                icon: 'pi pi-plus',
                command: () => {
                    this.abrirDialogoImportarNuevos();
                }
            },
            {
                label: 'Modificar Casos',
                icon: 'pi pi-pencil',
                command: () => {
                    this.abrirDialogoImportarModificar();
                }
            }
        ];
    }


    opcionesFiltroEstado = computed(() => {
        // Permitimos que el valor sea number, string o null
        const estados: { label: string, value: number | string | null }[] =
            this.estadosEvidencia().map(e => ({ label: e.nombre, value: e.id_estado_evidencia }));

        // Para "Sin Ejecutar", el valor a filtrar ahora es nuestro identificador de texto.
        estados.push({ label: 'Sin Ejecutar', value: 'SIN_EJECUTAR' });

        // "Cualquiera" sigue usando 'null' para limpiar el filtro.
        estados.unshift({ label: 'Cualquiera', value: null });

        return estados;
    });

    // Método del ciclo de vida de Angular que se ejecuta al iniciar el componente.
    ngOnInit() {

        this.cargarTodosLosUsuarios();
        this.cargarFormularios();
        this.cargarEstadosModificacion();
        this.cargarTodasLasFuentes();
    }

    findEstadoEvidenciaNombre(id: number | undefined | string): string {
        // Si el ID es nuestro identificador especial, ya sabemos qué es.
        if (id === 'SIN_EJECUTAR') {
            return 'Sin Ejecutar';
        }

        if (id === undefined || id === null) {
            return 'Sin Ejecutar';
        }

        const estado = this.estadosEvidencia().find(e => e.id_estado_evidencia === id);

        return estado ? estado.nombre : 'Sin Ejecutar';
    }

    cargarEstadosModificacion() {
        this.estadoModificacionService.getEstados().subscribe(data => {
            this.estadosModificacion.set(data);
        });


    }

    cargarTodasLasFuentes() {
        this.fuenteService.getFuentes().subscribe(data => {
            this.todasLasFuentes.set(data);
        });
    }

    filtrarFuentes(event: AutoCompleteCompleteEvent) {
        // 1. Normalizamos lo que el usuario escribe.
        const queryNormalizada = this.normalizarTexto(event.query);

        // 2. Filtramos la lista de fuentes...
        const filtradas = this.todasLasFuentes().filter(fuente => {
            // 3. ...normalizando también el nombre de cada fuente antes de comparar.
            const nombreNormalizado = this.normalizarTexto(fuente.nombre_fuente);
            return nombreNormalizado.includes(queryNormalizada);
        });

        this.sugerenciasFuentes.set(filtradas);
    }

    // Añade esta función para encontrar el nombre del estado por su ID
    findEstadoModificacionNombre(id: number): string {
        const estado = this.estadosModificacion().find(e => e.id_estado_modificacion === id);
        return estado ? estado.nombre : 'N/A';
    }

    cargarFormularios() {
        this.casoService.getFormularios().subscribe(data => this.todosLosFormularios.set(data));
    }

    filtrarFormulario(event: AutoCompleteCompleteEvent) {
        const query = event.query;
        const filtrados = this.todosLosFormularios().filter(num => num.toString().includes(query));
        this.sugerenciasFormulario.set(filtrados);
    }

    // Se activa al seleccionar un componente, cargando los casos correspondientes.
    onComponenteSeleccionado() {
        if (this.dt) {
            this.dt.clear();
        }

        const proyectoActual = this.proyectoService.proyectoSeleccionado();

        if (this.componenteSeleccionadoId && proyectoActual) {
            const key = `ultimoComponente_${proyectoActual.id_proyecto}`;
            localStorage.setItem(key, this.componenteSeleccionadoId.toString());

            this.tableStateKey.set(`estado-tabla-casos-componente-${this.componenteSeleccionadoId}`);
        } else {
            this.tableStateKey.set('estado-tabla-casos-sin-seleccion');
        }


        //this.casos.set([]);
        //Modificacion preliminar
        this.todosLosCasosMaestros.set([]);
        if (this.componenteSeleccionadoId) {
            this.cargandoCasos.set(true);
            this.casoService.getCasosPorComponente(this.componenteSeleccionadoId)
                .subscribe(data => {

                    const casosEnriquecidos = data.map(item => {
                        // Se busca el nombre del estado usando la función que ya tenemos.
                        const nombreEstado = this.findEstadoModificacionNombre(item.caso.id_estado_modificacion);
                        // Se unen los nombres de las fuentes en un solo string, separados por un espacio.
                        const nombresFuentes = item.caso.fuentes?.map(f => f.nombre_fuente).join(' ') || '';


                        // --- INICIO MODIFICACIÓN: LÓGICA DE VERSIÓN OBSOLETA ---
                        let ultimoEstadoId = item.ultimaEvidencia?.id_estado_evidencia ?? 'SIN_EJECUTAR';

                        // Si existe evidencia y el caso tiene versión definida
                        if (item.ultimaEvidencia && item.caso.version) {
                            // Convertimos a flotante para asegurar comparación numérica correcta (1.10 > 1.9)
                            const vCaso = parseFloat(item.caso.version);
                            // Aseguramos que la evidencia tenga versión, si no asumimos 0
                            const vEvidencia = item.ultimaEvidencia.version_ejecucion ? parseFloat(item.ultimaEvidencia.version_ejecucion) : 0;

                            // Si la versión exigida por el caso es MAYOR a la ejecutada,
                            // forzamos el estado visual a 'SIN_EJECUTAR'.
                            if (vCaso > vEvidencia) {
                                ultimoEstadoId = 'SIN_EJECUTAR';
                            }
                        }

                        //const ultimoEstadoId = item.ultimaEvidencia?.id_estado_evidencia ?? 'SIN_EJECUTAR';



                        const rutsParaBuscar = item.rutsUnicos?.join(' ') || '';

                        const jiraIdParaFiltro = item.ultimaEvidencia?.id_jira ?? '';

                        const ultimoEstadoNombre = this.findEstadoEvidenciaNombre(item.ultimaEvidencia?.id_estado_evidencia)


                        // Se crea una nueva versión del objeto 'caso' que incluye el nombre.
                        const casoActualizado = {
                            ...item.caso,
                            nombre_estado_modificacion: nombreEstado,
                            version: item.caso.version || '',
                            fuentes_nombres: nombresFuentes,
                            ruts_concatenados: rutsParaBuscar,
                            jira_id_filter: jiraIdParaFiltro,
                            ultimoEstadoNombreFilter: ultimoEstadoNombre

                        };



                        // Se devuelve el objeto completo con el 'caso' ya actualizado.
                        return { ...item, caso: casoActualizado, ultimoEstadoId: ultimoEstadoId };
                    });
                    //this.casos.set(casosEnriquecidos as any);
                    //Modificacion preliminar
                    this.todosLosCasosMaestros.set(casosEnriquecidos as any);
                    this.cargandoCasos.set(false);
                });
        }
    }

    // Carga la lista completa de componentes desde el servicio.
    cargarComponentes(proyectoId: number) {
        this.componenteService.getComponentesPorProyecto(proyectoId).subscribe(data => {
            this.componentes.set(data);
            this.cargarHitos(data);

            // CAMBIO: Se intenta restaurar el último componente guardado para ESTE proyecto.
            const key = `ultimoComponente_${proyectoId}`;
            const ultimoComponenteId = localStorage.getItem(key);
            if (ultimoComponenteId) {
                this.componenteSeleccionadoId = +ultimoComponenteId;
                this.onComponenteSeleccionado(); // Se cargan los casos automáticamente.
            }
        });
    }

    // Busca el nombre de un componente a partir de su ID.
    findComponentName(id: number): string {
        return this.componentes().find(c => c.id_componente === id)?.nombre_componente || 'No encontrado';
    }

    // Prepara las variables para abrir el diálogo en modo 'Nuevo'.
    abrirDialogoNuevo() {
        const componenteActual = this.componentes().find(c => c.id_componente === this.componenteSeleccionadoId);
        this.caso = {
            anio: environment.anioTributario,
            id_componente: componenteActual?.id_componente
        };
        this.editando = false;
        this.activoDialog = true;
        this.hitoSeleccionado.set(componenteActual?.hito_componente || null);
        //this.esFuenteExterna = false;
        this.detallesAvanzadosColapsados = true;
        this.casoDialog = true;


    }

    // Prepara las variables para abrir el diálogo en modo 'Editar' con los datos del caso seleccionado.
    editarCaso(casoConEvidencia: CasoConEvidencia) {


        const proyectoActual = this.proyectoService.proyectoSeleccionado();
        const caso = casoConEvidencia.caso;
        if (!caso) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos del caso.' });
            return;
        }

        if (!caso.version) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe escribir la versión de ejecución de la prueba.' });
            return;
        }

        if (!caso.descripcion_caso) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe escribir una descripción para la prueba.' });
            return;
        }
        if (!caso.id_estado_modificacion) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar un estado de modificación para la prueba.' });
            return;
        }

        if (!caso.id_componente) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar un componente para la prueba.' });
            return;
        }

        this.caso = { ...caso };
        this.editando = true;
        this.activoDialog = caso.activo === 1;
        const hitoId = this.componentes().find(c => c.id_componente === caso.id_componente)?.hito_componente || null;
        this.hitoSeleccionado.set(hitoId);


        this.casoDialog = true;
    }



    // Gestiona el guardado de un caso, ya sea para crear uno nuevo o actualizar uno existente.
    guardarCaso() {
        // 1. Validaciones básicas de campos
        if (!this.validarCamposBasicos()) {
            return;
        }

        const nombreCasoNuevo = this.caso.nombre_caso!;
        const nombreNormalizadoNuevo = this.normalizarNombreCaso(nombreCasoNuevo);



        // Si estamos editando, excluimos el caso actual de la lista de comparación
        const otrosCasos = this.editando
            ? this.casos().filter(c => c.caso.id_caso !== this.caso.id_caso)
            : this.casos();

        const nombresExistentes = otrosCasos
            .map(c => c.caso.nombre_caso)
            .filter((nombre): nombre is string => typeof nombre === 'string' && nombre.trim() !== '');

        //const nombresExistentes = otrosCasos.map(c => c.caso.nombre_caso);

        // 2. Validación de duplicados exactos
        if (nombresExistentes.length > 0 && nombresExistentes.some(nombre => this.normalizarNombreCaso(nombre) === nombreNormalizadoNuevo)) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ya existe un caso con un nombre idéntico en este componente.' });
            return;
        }

        // 3. Validación de duplicados similares
        if (nombresExistentes.length > 0) {
            const umbralSimilitud = 0.5; // 50%
            const coincidencias = similarity.findBestMatch(nombreNormalizadoNuevo, nombresExistentes.map(n => this.normalizarNombreCaso(n)));

            if (coincidencias.ratings.length > 0 && coincidencias.bestMatch.rating > umbralSimilitud) {
                this.casosConAdvertencia = [{
                    nombreNuevo: nombreCasoNuevo,
                    nombreExistente: nombresExistentes[coincidencias.bestMatchIndex],
                    similitud: Math.round(coincidencias.bestMatch.rating * 100)
                }];
                this.accionConfirmada = 'guardarManual'; // Configuramos la acción para la confirmación
                this.advertenciaDialog = true; // Mostramos la advertencia
            } else {
                // Si no hay duplicados ni advertencias, guardamos directamente
                this.procederConGuardadoManual();
            }
        } else {
            this.procederConGuardadoManual();
        }
    }

    private validarCamposBasicos(): boolean {
        const usuarioLogueado = this.authService.usuarioActual();

        if (!usuarioLogueado || !usuarioLogueado.idUsuario) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo identificar al usuario. Por favor, inicie sesión de nuevo.' });
            return false;
        }
        if (!this.caso.version) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe escribir la versión de ejecución de la prueba.' });
            return false;
        }
        if (!this.caso.descripcion_caso) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe escribir una descripción para la prueba.' });
            return false;
        }
        if (!this.caso.id_estado_modificacion) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar un estado de modificación para la prueba.' });
            return false;
        }
        if (!this.caso.id_componente) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar un componente para la prueba.' });
            return false;
        }
        const versionRegex = /^\d+\.\d+$/;
        if (!versionRegex.test(this.caso.version)) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Formato Incorrecto',
                detail: 'La versión debe tener el formato número.número (ej: 1.0).'
            });
            return false;
        }
        if (!this.caso.fuentes || this.caso.fuentes.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Atención',
                detail: 'Debe seleccionar al menos una fuente de información.'
            });
            return false;
        }
        return true;
    }

    private normalizarTexto(texto: string): string {
        if (!texto) return '';
        return texto
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    // Cierra el diálogo emergente.
    cerrarDialogo() {
        this.casoDialog = false;
    }

    // Determina el color del tag de estado basado en su valor.
    getSeverityForEstado(estado: string | null | undefined): string {
        switch (estado) {
            case 'OK':
                return 'success';
            case 'NK':
                return 'danger';
            case 'N/A':
                return 'secondary';
            default:
                return 'secondary';
        }
    }

    getSeverityForModificacion(estado: string | null | undefined): string {
        switch (estado) {
            case 'Modificado':
                return 'warn'; // Naranja
            case 'Nuevo':
                return 'info';    // Azul
            case 'Sin cambios':
                return 'secondary'; // Verde
            case 'Eliminado':
                return 'danger'; // Rojo
            default:
                return 'secondary';
        }
    }

    getFuentesRestantesTooltip(fuentes: Fuente[], visibles: number = 1): string {
        if (!fuentes || fuentes.length <= visibles) {
            return '';
        }
        // Tomamos las fuentes restantes, extraemos sus nombres y las unimos con un salto de línea.
        return fuentes.slice(visibles).map(f => f.nombre_fuente).join('\n');
    }

    // Aplica el filtro de texto global a la tabla.
    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    // Limpia todos los filtros aplicados en la tabla.
    clear(table: Table) {
        localStorage.removeItem(this.tableStateKey());
        table.reset();
        if (this.filterInput) {
            this.filterInput.nativeElement.value = '';
        }
    }


    cargarHitos(componentes: Componente[]) {
        const hitosUnicos = [...new Map(componentes.map(c => [c.hito_componente, c.hito_componente])).values()];
        this.hitos.set(hitosUnicos.map(h => ({ id: h, nombre: `Hito ${h}` })));
    }


    importarCasos() {
        this.importStep = 'selection'; // Reinicia a la vista de selección
        this.archivoParaImportar = null; // Reseteamos el archivo seleccionado
        this.importDialog = true; // Abrimos el diálogo de importación
    }

    cerrarDialogoImportar() {
        this.importDialog = false;
        this.onClearFiles();
    }

    cerrarDialogoAdvertencia() {
        this.advertenciaDialog = false;
        this.casosConAdvertencia = [];
        this.casosValidadosTemporalmente = [];
    }

    onArchivoSeleccionado(event: any) {
        const file = event.files[0];
        if (file) {
            this.archivoParaImportar = file;
            this.messageService.add({
                severity: 'info',
                summary: 'Archivo seleccionado',
                detail: `Listo para procesar: ${file.name}`
            });
        }
    }

    onArchivoAsistenteSeleccionado(event: any) {
        const file = event.files[0];
        if (!file) return;

        this.archivoParaImportar = file;
        const reader = new FileReader();

        reader.onload = (e: any) => {
            try {
                const bstr: ArrayBuffer = e.target.result;
                const workbook: XLSX.WorkBook = XLSX.read(bstr, { type: 'array' });

                // 1. Obtenemos los nombres de todas las hojas del archivo
                this.excelHojas = workbook.SheetNames;

                if (this.excelHojas.length > 0) {
                    // 2. Por defecto, seleccionamos la primera hoja
                    this.seleccionarHoja(this.excelHojas[0]);
                    // 3. Cambiamos al paso de mapeo
                    this.importStep = 'mapping';
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'El archivo Excel no contiene hojas.' });
                }
            } catch (error) {
                this.messageService.add({ severity: 'error', summary: 'Error al leer archivo', detail: 'El formato del archivo es inválido.' });
                console.error("Error al procesar el archivo del asistente:", error);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    seleccionarHoja(nombreHoja: string) {
        if (!this.archivoParaImportar) return;

        this.excelHojaSeleccionada = nombreHoja;
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const bstr: ArrayBuffer = e.target.result;
            const workbook: XLSX.WorkBook = XLSX.read(bstr, { type: 'array' });
            const worksheet: XLSX.WorkSheet = workbook.Sheets[nombreHoja];

            // Leemos solo la primera fila para obtener los encabezados
            const datosParaEncabezados = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });

            if (datosParaEncabezados && datosParaEncabezados.length > 0) {
                this.excelEncabezados = (datosParaEncabezados[0] as string[]).map(h => String(h).trim());
                // Inicializamos el objeto de mapeo
                this.mapeoColumnas = {};
                this.nuestrosCampos.forEach(c => this.mapeoColumnas[c.campo] = null);
            } else {
                this.excelEncabezados = [];
            }
        };
        reader.readAsArrayBuffer(this.archivoParaImportar);
    }

    previsualizarDatos() {
        // La validación de campos obligatorios se mantiene igual
        const camposMapeados = Object.keys(this.mapeoColumnas).filter(key => this.mapeoColumnas[key] !== null);
        const camposObligatoriosFaltantes = this.nuestrosCampos
            .filter(nc => nc.obligatorio && !camposMapeados.includes(nc.campo));

        if (camposObligatoriosFaltantes.length > 0) {
            const nombresCampos = camposObligatoriosFaltantes.map(c => c.campo).join(', ');
            this.messageService.add({
                severity: 'warn',
                summary: 'Campos Requeridos Faltantes',
                detail: `Por favor, asigna una columna para los campos: ${nombresCampos}`
            });
            return;
        }

        if (!this.archivoParaImportar) return;

        const reader = new FileReader();
        reader.onload = (e: any) => {
            const bstr: ArrayBuffer = e.target.result;
            const workbook: XLSX.WorkBook = XLSX.read(bstr, { type: 'array' });
            const worksheet: XLSX.WorkSheet = workbook.Sheets[this.excelHojaSeleccionada];

            const todasLasFilasOriginales = XLSX.utils.sheet_to_json(worksheet, { raw: false, blankrows: false });

            // Limpiamos las claves (nombres de columnas) de cada objeto leído del Excel
            this.todasLasFilasDelExcel = todasLasFilasOriginales.map((fila: any) => {
                const filaConClavesLimpias: { [key: string]: any } = {};
                for (const key in fila) {
                    if (Object.prototype.hasOwnProperty.call(fila, key)) {
                        filaConClavesLimpias[key.trim()] = fila[key];
                    }
                }
                return filaConClavesLimpias;
            });

            // Transformamos las primeras 5 filas para la previsualización
            this.datosPrevisualizacion = this.todasLasFilasDelExcel.slice(0, 5).map((filaOriginal: any) => {
                const filaTransformada: { [key: string]: any } = {};

                this.nuestrosCampos.forEach(nuestroCampoInfo => {
                    const nuestroCampo = nuestroCampoInfo.campo;
                    const columnaUsuario = this.mapeoColumnas[nuestroCampo];

                    if (columnaUsuario) {
                        // Ahora la búsqueda SÍ funcionará porque ambas claves estarán limpias
                        filaTransformada[nuestroCampo] = filaOriginal[columnaUsuario] || '';
                    }
                });

                return filaTransformada;
            });

            this.columnasPrevisualizacion = this.nuestrosCampos
                .map(nc => nc.campo)
                .filter(campo => this.mapeoColumnas[campo] !== null)
                .map(campo => ({ field: campo, header: campo }));

            this.importStep = 'preview';
        };
        reader.readAsArrayBuffer(this.archivoParaImportar);
    }

    descargarConFormato() {
        // Transformamos TODOS los datos usando el mapeo del usuario
        const datosTransformados = this.todasLasFilasDelExcel.map((filaOriginal: any) => {
            const filaTransformada: { [key: string]: any } = {};
            for (const nuestroCampo of this.nuestrosCampos.map(c => c.campo)) {
                const columnaUsuario = this.mapeoColumnas[nuestroCampo];
                if (columnaUsuario) {
                    // Usamos los nombres de nuestros campos como encabezados
                    filaTransformada[nuestroCampo] = filaOriginal[columnaUsuario];
                }
            }
            return filaTransformada;
        });

        exportarAExcel(datosTransformados, "Casos_Importados_Con_Formato");
        this.messageService.add({ severity: 'success', summary: 'Descarga Completa', detail: 'El archivo con el nuevo formato se ha descargado.' });
    }

    importarDirectamente() {
        // Reutilizamos la lógica del método 'procederConImportacion' que ya teníamos para la importación rápida
        // Primero, transformamos TODOS los datos del Excel al formato que espera el backend
        const casosParaValidar = this.todasLasFilasDelExcel.map((filaOriginal: any) => {
            const filaTransformada: { [key: string]: any } = {};
            for (const nuestroCampo in this.mapeoColumnas) {
                const columnaUsuario = this.mapeoColumnas[nuestroCampo];
                filaTransformada[nuestroCampo] = columnaUsuario ? filaOriginal[columnaUsuario] : undefined;
            }
            return filaTransformada;
        });

        // Ahora, ejecutamos la misma lógica de validación de duplicados que en la importación manual
        this.casosValidadosTemporalmente = casosParaValidar;
        this.accionConfirmada = 'importar'; // Aseguramos que la acción sea la correcta

        // Llamamos a la lógica de validación de duplicados y envío que ya existe
        this.procederConImportacion();
    }

    async procesarArchivo() {
        if (!this.archivoParaImportar || !this.componenteSeleccionadoId) {
            this.messageService.add({ severity: 'warn', summary: 'Error', detail: 'Asegúrese de seleccionar un archivo y un componente.' });
            return;
        }

        try {
            // Llama a la utilidad para leer y validar la estructura básica del archivo
            const casosLeidos = await leerYValidarExcel(this.archivoParaImportar, this.messageService);
            if (!casosLeidos) return; // Si la validación básica falla, nos detenemos

            // Inicia la validación de duplicados
            this.casosConAdvertencia = [];
            const errores: string[] = [];
            const nombresCasosExistentes = this.casos().map(c => c.caso.nombre_caso);
            const nombresEnArchivo = new Set<string>();
            const umbralSimilitud = 0.5; // 50% de similitud

            casosLeidos.forEach((fila: any, index: number) => {
                const numeroFila = index + 2;
                const nombreCasoActual = fila['Nombre del Caso'];

                if (nombreCasoActual) {
                    const nombreNormalizado = this.normalizarNombreCaso(nombreCasoActual);

                    // 1. Revisar duplicados exactos dentro del mismo archivo
                    if (nombresEnArchivo.has(nombreNormalizado)) {
                        errores.push(`Fila ${numeroFila}: El caso "${nombreCasoActual}" está duplicado en el archivo.`);
                    } else {
                        nombresEnArchivo.add(nombreNormalizado);
                    }

                    // 2. Revisar duplicados exactos y similares contra los casos ya existentes en el componente
                    const coincidencias = similarity.findBestMatch(nombreNormalizado, nombresCasosExistentes.map(n => this.normalizarNombreCaso(n)));

                    if (coincidencias.bestMatch.rating === 1) { // Duplicado 100% idéntico
                        errores.push(`Fila ${numeroFila}: El caso "${nombreCasoActual}" ya existe en este componente.`);
                    } else if (coincidencias.bestMatch.rating > umbralSimilitud) { // Similitud alta
                        this.casosConAdvertencia.push({
                            nombreNuevo: nombreCasoActual,
                            nombreExistente: nombresCasosExistentes[coincidencias.bestMatchIndex],
                            similitud: Math.round(coincidencias.bestMatch.rating * 100)
                        });
                    }
                }
            });

            // Si hay errores críticos (duplicados exactos), nos detenemos
            if (errores.length > 0) {
                this.messageService.add({ severity: 'error', summary: 'Errores de Importación', detail: 'Se encontraron errores que impiden la importación.', sticky: true });
                errores.slice(0, 5).forEach(error => this.messageService.add({ severity: 'warn', summary: error, sticky: true, life: 10000 }));
                return;
            }

            // Guardamos los casos que pasaron la validación para usarlos después
            this.casosValidadosTemporalmente = casosLeidos;

            // Si hay advertencias por similitud, mostramos el diálogo de confirmación
            if (this.casosConAdvertencia.length > 0) {
                this.advertenciaDialog = true;
            } else {
                // Si no hay errores ni advertencias, procedemos directamente a la importación
                this.procederConImportacion();
            }

        } catch (error) {
            console.error("Fallo la validación del archivo:", error);
            // El mensaje de error al usuario ya se mostró dentro de la función de utilidad leerYValidarExcel
        }
    }

    /**
     * Lógica para el flujo de Modificación: lee el Excel, separa los casos y muestra el resumen.
     */
    async procesarArchivoModificacion() {
        if (!this.archivoParaImportar) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Por favor, seleccione un archivo.' });
            return;
        }

        try {
            const casosLeidosDelExcel = await leerYValidarExcel(this.archivoParaImportar, this.messageService);
            if (!casosLeidosDelExcel) return;

            this.casosConCambios = [];
            this.casosParaCrearDetectados = [];
            const erroresDeValidacion: string[] = [];
            const casosActuales = this.todosLosCasosMaestros();

            const normalizarEstado = (texto: string): string => {
                const t = String(texto || '').toLowerCase().trim();
                if (['modificado', 'mod.', 'mod', 'modificada', 'modificados'].includes(t)) return 'Modificado';
                if (['sin cambios', 'sin cambio', 's/ cambios', 's cambios'].includes(t)) return 'Sin cambios';
                if (['eliminado', 'eliminada'].includes(t)) return 'Eliminado';
                if (['nuevo', 'nueva', 'nuevos', 'nuevas'].includes(t)) return 'Nuevo';
                return String(texto || '').trim(); // Devolver original si no coincide
            };

            casosLeidosDelExcel.forEach((filaExcel: any, index: number) => {
                const idCasoExcel = filaExcel['ID Caso'];

                if (idCasoExcel && !isNaN(Number(idCasoExcel)) && Number(idCasoExcel) > 0) {
                    const casoOriginal = casosActuales.find(c => c.caso.id_caso === Number(idCasoExcel));
                    if (!casoOriginal) return;

                    const cambiosDetectados: CambioDetectado[] = [];
                    const datosParaEnviar: any = { id_caso: Number(idCasoExcel) };

                    const camposAComparar = [
                        { excel: 'Nombre del Caso', modelo: 'nombre_caso', ui: 'Nombre' },
                        { excel: 'Descripción', modelo: 'descripcion_caso', ui: 'Descripción' },
                        { excel: 'Precondiciones', modelo: 'precondiciones', ui: 'Precondiciones' },
                        { excel: 'Pasos', modelo: 'pasos', ui: 'Pasos' },
                        { excel: 'Resultado Esperado', modelo: 'resultado_esperado', ui: 'Resultado Esperado' }
                    ];

                    camposAComparar.forEach(campo => {
                        if (filaExcel.hasOwnProperty(campo.excel)) {
                            const valorExcel = this.normalizarValor(filaExcel[campo.excel]);
                            const valorActual = this.normalizarValor((casoOriginal.caso as any)[campo.modelo]);
                            if (valorExcel !== valorActual) {
                                cambiosDetectados.push({ campo: campo.ui, valorAnterior: valorActual, valorNuevo: valorExcel });
                                datosParaEnviar[campo.modelo] = filaExcel[campo.excel];
                            }
                        }
                    });

                    // --- NUEVA LÓGICA DE VALIDACIÓN Y COMPARACIÓN PARA CAMPOS ESPECIALES ---

                    // 1. Validación para Versión
                    if (filaExcel.hasOwnProperty('Versión')) {
                        const valorVersionExcel = this.normalizarValor(filaExcel['Versión']);
                        const valorVersionActual = this.normalizarValor(casoOriginal.caso.version);
                        if (valorVersionExcel !== valorVersionActual) {
                            const versionRegex = /^\d+\.\d+$/;
                            if (!versionRegex.test(valorVersionExcel)) {
                                erroresDeValidacion.push(`Fila ${index + 2} (ID: ${idCasoExcel}): El formato de la nueva versión '${valorVersionExcel}' no es válido (ej: 1.0).`);
                            } else {
                                cambiosDetectados.push({ campo: 'Versión', valorAnterior: valorVersionActual, valorNuevo: valorVersionExcel });
                                datosParaEnviar.version = filaExcel['Versión'];
                            }
                        }
                    }

                    // 2. Comparación para Fuentes
                    if (filaExcel.hasOwnProperty('Fuentes')) {
                        const valorFuentesExcel = (filaExcel['Fuentes'] || '').split(';').map((f: string) => f.trim()).filter(Boolean).sort().join(';');
                        const valorFuentesActual = (casoOriginal.caso.fuentes || []).map(f => f.nombre_fuente.trim()).sort().join(';');
                        if (valorFuentesExcel !== valorFuentesActual) {
                            cambiosDetectados.push({ campo: 'Fuentes', valorAnterior: valorFuentesActual.replace(/;/g, '; '), valorNuevo: valorFuentesExcel.replace(/;/g, '; ') });
                            datosParaEnviar.nombres_fuentes = filaExcel['Fuentes'];
                        }
                    }

                    // 3. Comparación para Activo
                    if (filaExcel.hasOwnProperty('Activo')) {
                        const valorActivoExcel = ['si', 'sí'].includes(String(filaExcel['Activo'] || '').toLowerCase().trim());
                        const valorActivoActual = casoOriginal.caso.activo === 1;
                        if (valorActivoExcel !== valorActivoActual) {
                            cambiosDetectados.push({ campo: 'Activo', valorAnterior: valorActivoActual ? 'Sí' : 'No', valorNuevo: valorActivoExcel ? 'Sí' : 'No' });
                            datosParaEnviar.activo = valorActivoExcel ? 1 : 0;
                        }
                    }

                    // 4. Comparación para Estado Modificación
                    if (filaExcel.hasOwnProperty('Estado Modificación')) {
                        const valorEstadoExcel = this.normalizarValor(filaExcel['Estado Modificación']);
                        if (valorEstadoExcel) { // Solo comparar si no está en blanco
                            const valorEstadoActual = this.normalizarValor(this.findEstadoModificacionNombre(casoOriginal.caso.id_estado_modificacion));
                            if (normalizarEstado(valorEstadoExcel) !== normalizarEstado(valorEstadoActual)) {
                                cambiosDetectados.push({ campo: 'Estado Modificación', valorAnterior: valorEstadoActual, valorNuevo: valorEstadoExcel });
                                datosParaEnviar.nombre_estado_modificacion = filaExcel['Estado Modificación'];
                            }
                        }
                    }

                    if (cambiosDetectados.length > 0) {
                        this.casosConCambios.push({ casoOriginal, cambios: cambiosDetectados, datosParaEnviar });
                    }
                } else {
                    this.casosParaCrearDetectados.push(filaExcel);
                }
            });

            // Si encontramos errores de validación, los mostramos y detenemos el proceso.
            if (erroresDeValidacion.length > 0) {
                this.messageService.add({ severity: 'error', summary: 'Errores de Validación en el Archivo', detail: 'Por favor, corrija los siguientes errores antes de continuar.', sticky: true });
                erroresDeValidacion.forEach(error => {
                    this.messageService.add({ severity: 'warn', summary: error, sticky: true, life: 10000 });
                });
                return;
            }

            if (this.casosConCambios.length > 0 || this.casosParaCrearDetectados.length > 0) {
                this.previsualizacionDialog = true;
            } else {
                this.messageService.add({ severity: 'info', summary: 'Sin Cambios', detail: 'No se detectaron modificaciones en el archivo.' });
            }
        } catch (error) {
            console.error("Fallo al procesar el archivo de modificación:", error);
        }
    }

    confirmarCambios() {
        const usuarioLogueado = this.authService.usuarioActual();
        if (!usuarioLogueado) {
            this.messageService.add({ severity: 'error', summary: 'Error de Sesión', detail: 'No se pudo identificar al usuario.' });
            return;
        }

        const loteFinal = {
            casosParaCrear: this.casosParaCrearDetectados.map(fila => ({
                nombre_caso: String(fila['Nombre del Caso'] || ''),
                descripcion_caso: String(fila['Descripción'] || ''),
                version: String(fila['Versión'] || '').replace(',', '.'),
                id_componente: this.componenteSeleccionadoId!,
                id_usuario_creador: usuarioLogueado.idUsuario,
                jp_responsable: usuarioLogueado.idUsuario,
                nombre_estado_modificacion: String(fila['Estado Modificación'] || 'Nuevo'),
                precondiciones: String(fila['Precondiciones'] || ''),
                pasos: String(fila['Pasos'] || ''),
                resultado_esperado: String(fila['Resultado Esperado'] || ''),
            })),
            casosParaActualizar: this.casosConCambios.map(c => c.datosParaEnviar)
        };

        this.casoService.procesarLoteCasos(loteFinal).subscribe({
            next: (res) => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: res.mensaje || 'Lote procesado correctamente.' });
                this.previsualizacionDialog = false;
                this.cerrarDialogoImportarModificar();
                this.onComponenteSeleccionado();
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error al procesar', detail: err.error?.mensaje || 'No se pudo procesar el lote.' });
            }
        });
    }

    validarSimilitudYProceder(casosACrear: any[]) {
        this.casosConAdvertencia = [];
        const errores: string[] = [];
        const nombresCasosExistentes = this.casos().map(c => c.caso.nombre_caso).filter(Boolean) as string[];
        const nombresEnArchivo = new Set<string>();
        const umbralSimilitud = 0.5;

        casosACrear.forEach((fila: any, index: number) => {
            const nombreCasoActual = fila['Nombre del Caso'];
            if (nombreCasoActual) {
                const nombreNormalizado = this.normalizarNombreCaso(nombreCasoActual);
                if (nombresEnArchivo.has(nombreNormalizado)) {
                    errores.push(`Fila ${index + 2}: El caso "${nombreCasoActual}" está duplicado en el archivo.`);
                } else {
                    nombresEnArchivo.add(nombreNormalizado);
                }
                if (nombresCasosExistentes.length > 0) {
                    const coincidencias = similarity.findBestMatch(nombreNormalizado, nombresCasosExistentes.map(n => this.normalizarNombreCaso(n)));
                    if (coincidencias.bestMatch.rating === 1) {
                        errores.push(`Fila ${index + 2}: El caso "${nombreCasoActual}" ya existe en este componente.`);
                    } else if (coincidencias.bestMatch.rating > umbralSimilitud) {
                        this.casosConAdvertencia.push({
                            nombreNuevo: nombreCasoActual,
                            nombreExistente: nombresCasosExistentes[coincidencias.bestMatchIndex],
                            similitud: Math.round(coincidencias.bestMatch.rating * 100)
                        });
                    }
                }
            }
        });

        if (errores.length > 0) {
            this.messageService.add({ severity: 'error', summary: 'Errores de Importación', detail: 'Se encontraron errores que impiden la importación.', sticky: true });
            errores.slice(0, 5).forEach(error => this.messageService.add({ severity: 'warn', summary: error, sticky: true, life: 10000 }));
            return;
        }

        this.accionConfirmada = 'importar';
        if (this.casosConAdvertencia.length > 0) {
            this.advertenciaDialog = true;
        } else {
            this.procederConImportacion();
        }
    }



    procederConImportacion() {
        const usuarioLogueado = this.authService.usuarioActual();
        if (!usuarioLogueado) {
            this.messageService.add({ severity: 'error', summary: 'Error de Sesión', detail: 'No se pudo identificar al usuario.' });
            this.cerrarDialogoAdvertencia();
            return;
        }

        // Usamos los casos que habíamos guardado temporalmente en this.casosValidadosTemporalmente
        const casosParaEnviar = this.casosValidadosTemporalmente.map((fila: any) => ({
            nombre_caso: String(fila['Nombre del Caso'] || ''),
            descripcion_caso: String(fila['Descripción'] || ''),
            version: String(fila['Versión']).replace(',', '.'),
            nombre_estado_modificacion: String(fila['Estado Modificación'] || ''),
            nombres_fuentes: String(fila['Fuentes'] || '').replace(/;/g, ','),
            precondiciones: String(fila['Precondiciones'] || ''),
            pasos: String(fila['Pasos'] || ''),
            resultado_esperado: String(fila['Resultado Esperado'] || ''),
            id_usuario_creador: usuarioLogueado.idUsuario,
            jp_responsable: usuarioLogueado.idUsuario
        }));

        console.log('Datos finales a enviar al backend:', casosParaEnviar);

        if (casosParaEnviar.length === 0) {
            this.messageService.add({ severity: 'info', summary: 'Nada que importar', detail: 'No hay casos válidos para importar.' });
            this.cerrarDialogoAdvertencia();
            return;
        }

        this.casoService.importarCasos(casosParaEnviar, this.componenteSeleccionadoId!).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Importación Completada', detail: `Se importaron ${casosParaEnviar.length} casos.` });
                this.onComponenteSeleccionado();
                this.cerrarDialogoImportar();
                this.cerrarDialogoAdvertencia();
            },
            error: (err) => {
                if (err.error && err.error.errores && Array.isArray(err.error.errores)) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error de Validación en el Servidor',
                        detail: err.error.mensaje || 'Se encontraron errores en el archivo.',
                        sticky: true
                    });
                    err.error.errores.slice(0, 5).forEach((errorDetallado: any) => {
                        const mensaje = `Fila ${errorDetallado.fila}: ${errorDetallado.mensaje}`;
                        this.messageService.add({
                            severity: 'warn',
                            summary: mensaje,
                            sticky: true,
                            life: 15000
                        });
                    });
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error Inesperado',
                        detail: 'Ocurrió un error al procesar el archivo en el servidor.'
                    });
                }
                console.error('Error de importación desde el backend:', err);
            }
        });
    }

    confirmarAdvertencia() {
        if (this.accionConfirmada === 'importar') {
            this.procederConImportacion();
        } else {
            this.procederConGuardadoManual();
        }
    }

    procederConGuardadoManual() {
        const usuarioLogueado = this.authService.usuarioActual();
        if (!usuarioLogueado) {
            this.messageService.add({ severity: 'error', summary: 'Error de Sesión', detail: 'No se pudo identificar al usuario.' });
            this.cerrarDialogoAdvertencia();
            return;
        }

        this.caso.activo = this.activoDialog ? 1 : 0;
        this.caso.id_usuario_creador = usuarioLogueado.idUsuario;
        this.caso.jp_responsable = usuarioLogueado.idUsuario;

        const peticion = this.editando
            ? this.casoService.updateCaso(this.caso.id_caso!, this.caso as Caso)
            : this.casoService.createCaso(this.caso as Caso);

        peticion.pipe(
            switchMap(casoGuardado => {
                const idCaso = casoGuardado.id_caso!;
                const fuentes = this.caso.fuentes || [];
                return this.casoService.updateFuentesDeCaso(idCaso, fuentes);
            })
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Caso de prueba guardado correctamente.'
                });
                this.onComponenteSeleccionado();
                this.cerrarDialogo();
                this.cerrarDialogoAdvertencia(); // Cerramos también el diálogo de advertencia por si estaba abierto
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo guardar el caso'
                });
            }
        });
    }

    cargarTodosLosUsuarios() {
        this.usuarioService.getUsuarios().subscribe(usuarios => {
            this.todosLosUsuarios.set(usuarios);
        });
    }

    findUserNameById(id: number): string {
        const usuario = this.todosLosUsuarios().find(u => u.idUsuario === id);
        return usuario ? usuario.nombreUsuario : 'ID no encontrado';
    }

    exportarCasos(formato: string) {
        if (this.casos().length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'No hay datos', detail: 'No hay casos para exportar.' });
            return;
        }

        if (formato === 'excel') {
            const datosParaExportar = this.casos().map((item: CasoConEvidencia) => (console.log(''),
            {
                'ID Caso': item.caso.id_caso,
                'Nombre del Caso': item.caso.nombre_caso,
                'Descripción': item.caso.descripcion_caso,
                'Versión': item.caso.version,
                'Estado Modificación': this.findEstadoModificacionNombre(item.caso.id_estado_modificacion),
                'Precondiciones': item.caso.precondiciones,
                'Pasos': item.caso.pasos,
                'Resultado Esperado': item.caso.resultado_esperado,
                'Fuentes': item.caso.fuentes?.map(f => f.nombre_fuente).join(';\n'),
                'Activo': item.caso.activo === 1 ? 'Sí' : 'No',
                'Jira ID': item.ultimaEvidencia?.id_jira || '',
                'Último Estado Ejecución': item.ultimaEvidencia ? this.findEstadoEvidenciaNombre(item.ultimaEvidencia.id_estado_evidencia) : 'Sin Ejecutar',
                'Tester Asignado': item.ultimaEvidencia ? this.findUserNameById(item.ultimaEvidencia.id_usuario_ejecutante) : 'No asignado',
                'Fecha Última Ejecución': this.datePipe.transform(item.ultimaEvidencia?.fecha_evidencia, 'yyyy-MM-dd HH:mm') || 'N/A',
                'Descripción Última Evidencia': item.ultimaEvidencia?.descripcion_evidencia || 'N/A',
                'Último RUT de Prueba': item.ultimaEvidencia?.rut || 'N/A'

            }));

            exportarAExcel(datosParaExportar, "CasosDePrueba");
        } else if (formato === 'csv') {
            // Se mantiene la versión simple para el formato CSV
            const datosParaExportar = this.casos().map((item: any) => ({
                'ID Caso': item.caso.id_caso,
                'Nombre del Caso': item.caso.nombre_caso,
                'Descripción': item.caso.descripcion_caso,
                'Versión': item.caso.version,
                'Estado Modificación': item.caso.nombre_estado_modificacion,
                'Último Estado Ejecución': item.nombre_ultimo_estado,
                'Fuentes': item.caso.fuentes_nombres,
                'Precondiciones': item.caso.precondiciones,
                'Pasos': item.caso.pasos,
                'Resultado Esperado': item.caso.resultado_esperado,
                'RUTs': item.caso.ruts_concatenados,
                'Activo': item.caso.activo === 1 ? 'Sí' : 'No',
                'Jira ID': item.ultimaEvidencia?.id_jira || '',
                'Tester Asignado': item.ultimaEvidencia ? this.findUserNameById(item.ultimaEvidencia.id_usuario_ejecutante) : 'No asignado',
                'Fecha Última Ejecución': this.datePipe.transform(item.ultimaEvidencia?.fecha_evidencia, 'yyyy-MM-dd HH:mm') || 'N/A',
                'Descripción Última Evidencia': item.ultimaEvidencia?.descripcion_evidencia || 'N/A',
                'Último RUT de Prueba': item.ultimaEvidencia?.rut || 'N/A'
            }));
            exportarAExcel(datosParaExportar, "CasosDePrueba");
        }

    }

    descargarPlantilla() {
        descargarPlantillaCasos();
    }

    private normalizarNombreCaso(nombre: string): string {
        if (!nombre) {
            return '';
        }
        return nombre
            .toLowerCase() // 1. Convertir a minúsculas
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // 2. Quitar tildes y acentos
            .replace(/[^a-z0-9]/g, ''); // 3. Quitar espacios y todos los caracteres no alfanuméricos
    }

    exportarPlanDePruebas() {
        // 1. Determinar la fuente de datos correcta
        // Si la tabla tiene un filtro aplicado (filteredValue no es null), usamos eso.
        // Si no, usamos la señal completa (this.casos()).
        let casosVisibles: any[] = [];

        if (this.dt && this.dt.filteredValue) {
            casosVisibles = this.dt.filteredValue;
        } else {
            casosVisibles = this.casos();
        }

        if (casosVisibles.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'No hay datos', detail: 'No hay casos en la lista para exportar.' });
            return;
        }

        // 2. Filtrar SOLO los activos (Requerimiento del Negocio) y extraer sus IDs
        // Esto se aplica tanto si viene de la tabla filtrada como si viene de la lista completa.
        const idsParaExportar = casosVisibles
            .filter(item => item.caso.activo === 1)
            .map(item => item.caso.id_caso!);

        if (idsParaExportar.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Sin casos activos', detail: 'La lista actual no contiene casos activos para el Plan de Pruebas.' });
            return;
        }

        this.messageService.add({ severity: 'info', summary: 'Generando Reporte', detail: `Exportando ${idsParaExportar.length} casos...` });

        // 3. Llamar al backend
        this.casoService.getDetallesPlanPruebas(idsParaExportar).subscribe({
            next: (datosBackend) => {
                this.generarExcelConEstilos(datosBackend);
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Plan de Pruebas descargado.' });
            },
            error: (err) => {
                console.error('Error al obtener detalles del plan:', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el reporte. Intente nuevamente.' });
            }
        });
    }

    // Método auxiliar privado para manejar la lógica de estilos y Excel
    private generarExcelConEstilos(datos: any[]) {
        // A. Definición de Estilos (Rojo y Verde Claro según tu foto)
        const styleRojo = {
            fill: { fgColor: { rgb: "FF2500" } }, // Fondo Rojo Fuerte
            font: { color: { rgb: "080808" }, bold: true, sz: 14 }, // Texto Negro
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
        };

        const styleVerde = {
            fill: { fgColor: { rgb: "DDE8CC" } }, // Fondo Verde Claro
            font: { color: { rgb: "080808" }, bold: true, sz: 14 }, // Texto Negro
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
        };

        // B. Definición de Columnas y su Estilo (Orden exacto solicitado)
        const headers = [
            { title: "Identificación del Requerimiento", style: styleRojo, key: "nombre_componente" },
            { title: "Casos de Uso", style: styleVerde, key: "nombre_caso" },
            { title: "Pasos", style: styleVerde, key: "pasos" },
            { title: "Resultados Esperados", style: styleRojo, key: "resultado_esperado" },
            { title: "Versión", style: styleVerde, key: "version_evidencia" },
            { title: "Rut", style: styleVerde, key: "rut_evidencia" },
            { title: "JP Responsable", style: styleRojo, staticValue: "Fabian Torres" }, // Valor fijo
            { title: "Analista responsable", style: styleVerde, key: "nombre_analista" },
            { title: "Resultado de la prueba (OK/NOK)", style: styleRojo, key: "resultado_evidencia" },
            { title: "Comentarios Adicionales", style: styleRojo, staticValue: "" }, // Columna vacía
            { title: "Archivo", style: styleVerde, key: "nombres_archivos" }
        ];

        // C. Construcción de la Hoja de Datos
        // Fila 1: Encabezados
        const wsData = [
            headers.map(h => ({ v: h.title, s: h.style }))
        ];

        // Fila 2 en adelante: Datos
        datos.forEach(item => {
            const row: any[] = [];
            headers.forEach(col => {
                let valor = col.staticValue !== undefined ? col.staticValue : (item[col.key] || '');

                // Ajuste específico para NOK
                if (col.key === 'resultado_evidencia' && valor === 'NK') {
                    valor = 'NOK';
                }

                // Estilo simple para las celdas de datos (bordes y ajuste de texto)
                const cellStyle = {
                    alignment: { wrapText: true, vertical: "center" },
                    border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
                };

                row.push({ v: valor, s: cellStyle });
            });
            wsData.push(row);
        });

        // D. Crear Libro y Hoja
        const wb = XLSXStyle.utils.book_new();
        const ws = XLSXStyle.utils.aoa_to_sheet(wsData);

        // E. Ajustar Ancho de Columnas (Opcional pero recomendado para legibilidad)
        ws['!cols'] = [
            { wch: 30 }, // Requerimiento
            { wch: 30 }, // Caso
            { wch: 40 }, // Pasos
            { wch: 40 }, // Resultados
            { wch: 10 }, // Versión
            { wch: 15 }, // Rut
            { wch: 20 }, // JP
            { wch: 20 }, // Analista
            { wch: 15 }, // Resultado
            { wch: 30 }, // Comentarios
            { wch: 30 }  // Archivo
        ];

        XLSXStyle.utils.book_append_sheet(wb, ws, "Plan de Pruebas");

        // F. Descargar
        const fecha = new Date().toISOString().slice(0, 10);
        XLSXStyle.writeFile(wb, `Plan_de_Pruebas_Gesprub_${fecha}.xlsx`);
    }

    toggleFiltroMisCasos() {
        this.filtroMisCasosActivo.update(value => !value);
    }

    toggleFiltroSoloActivos() {
        this.filtroSoloActivos.update(value => !value);
    }


    validarSimilitudYNuevoFlujo(casosACrear: any[]) {
        this.casosConAdvertencia = [];
        // Filtramos para evitar errores con casos que no tienen nombre
        const nombresCasosExistentes = this.casos()
            .map(c => c.caso.nombre_caso)
            .filter((nombre): nombre is string => typeof nombre === 'string' && nombre.trim() !== '');

        const umbralSimilitud = 0.5;

        casosACrear.forEach((fila: any) => {
            const nombreCasoActual = fila['Nombre del Caso'];
            if (nombreCasoActual && nombresCasosExistentes.length > 0) {
                const nombreNormalizado = this.normalizarNombreCaso(nombreCasoActual);
                const coincidencias = similarity.findBestMatch(nombreNormalizado, nombresCasosExistentes.map(n => this.normalizarNombreCaso(n)));
                if (coincidencias.bestMatch.rating > umbralSimilitud) {
                    this.casosConAdvertencia.push({
                        nombreNuevo: nombreCasoActual,
                        nombreExistente: nombresCasosExistentes[coincidencias.bestMatchIndex],
                        similitud: Math.round(coincidencias.bestMatch.rating * 100)
                    });
                }
            }
        });

        if (this.casosConAdvertencia.length > 0) {
            this.advertenciaDialog = true;
        } else {
            this.procederConImportacion(); // Llama al método de importación original
        }
    }

    confirmarProcesarLote() {
        const usuarioLogueado = this.authService.usuarioActual();
        if (!usuarioLogueado) {
            this.messageService.add({ severity: 'error', summary: 'Error de Sesión', detail: 'No se pudo identificar al usuario.' });
            return;
        }

        const loteFinal = {
            casosParaCrear: this.loteParaProcesar.casosParaCrear.map(fila => ({
                nombre_caso: String(fila['Nombre del Caso'] || ''),
                descripcion_caso: String(fila['Descripción'] || ''),
                version: String(fila['Versión'] || '').replace(',', '.'),
                id_componente: this.componenteSeleccionadoId!,
                id_usuario_creador: usuarioLogueado.idUsuario,
                jp_responsable: usuarioLogueado.idUsuario,
                nombre_estado_modificacion: String(fila['Estado Modificación'] || ''),
                nombres_fuentes: String(fila['Fuentes'] || '').replace(/;/g, ','),
                precondiciones: String(fila['Precondiciones'] || ''),
                pasos: String(fila['Pasos'] || ''),
                resultado_esperado: String(fila['Resultado Esperado'] || ''),
            })),
            casosParaActualizar: this.loteParaProcesar.casosParaActualizar.map(fila => {
                const casoActualizado: any = { id_caso: Number(fila['ID Caso']) };
                if (fila['Nombre del Caso']) casoActualizado.nombre_caso = String(fila['Nombre del Caso']);
                if (fila['Descripción']) casoActualizado.descripcion_caso = String(fila['Descripción']);
                if (fila['Versión']) casoActualizado.version = String(fila['Versión']).replace(',', '.');
                if (fila['Estado Modificación']) casoActualizado.nombre_estado_modificacion = String(fila['Estado Modificación']);
                if (fila['Fuentes']) casoActualizado.nombres_fuentes = String(fila['Fuentes']).replace(/;/g, ',');
                if (fila['Precondiciones']) casoActualizado.precondiciones = String(fila['Precondiciones']);
                if (fila['Pasos']) casoActualizado.pasos = String(fila['Pasos']);
                if (fila['Resultado Esperado']) casoActualizado.resultado_esperado = String(fila['Resultado Esperado']);
                return casoActualizado;
            })
        };

        this.casoService.procesarLoteCasos(loteFinal).subscribe({
            next: (res) => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: res.mensaje || 'Lote procesado correctamente.' });
                this.resumenImportacionDialog = false;
                this.cerrarDialogoImportar();
                this.onComponenteSeleccionado();
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error al procesar', detail: err.error?.mensaje || 'No se pudo procesar el lote.' });
                this.resumenImportacionDialog = false;
            }
        });
    }

    onClearFiles() {
        this.archivoParaImportar = null;
    }


    /**
     * Abre el diálogo para la importación de SÓLO casos nuevos.
     */
    abrirDialogoImportarNuevos() {
        this.importDialog = true;
        this.archivoParaImportar = null;
    }

    /**
     * Abre el diálogo para la modificación masiva de casos.
     */
    abrirDialogoImportarModificar() {
        this.importModificarDialog = true;
        this.archivoParaImportar = null; // Usaremos la misma variable de archivo
    }

    /**
     * Cierra el diálogo de modificación y limpia la selección de archivo.
     */
    cerrarDialogoImportarModificar() {
        this.importModificarDialog = false;
        this.onClearFiles();
    }

    normalizarValor(valor: any): string {
        return String(valor || '').trim();
    }


    /**
     * Se ejecuta cuando la tabla restaura su estado desde localStorage.
     * Sincroniza el valor del filtro global con el campo de búsqueda de texto.
     * @param state El objeto de estado restaurado por la tabla.
     */
    onStateRestore(state: any) {
        // Hacemos un check para asegurarnos de que la referencia al input (#filterInput) exista
        if (this.filterInput && this.filterInput.nativeElement) {

            // Verificamos si en el estado guardado existe un filtro global con un valor
            if (state && state.filters && state.filters.global) {
                // Asignamos el valor del filtro guardado al input de búsqueda
                this.filterInput.nativeElement.value = state.filters.global.value || '';
            } else {
                // Si no hay filtro global guardado, nos aseguramos de que el input esté vacío
                this.filterInput.nativeElement.value = '';
            }
        }
    }
}