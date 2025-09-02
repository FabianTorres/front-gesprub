import { Component, OnInit, inject, signal, effect, ViewChild, ElementRef, computed  } from '@angular/core';
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
import { saveAs } from 'file-saver';
import { EstadoModificacion } from '../../models/estado-modificacion';
import { EstadoModificacionService } from '../../services/estado-modificacion.service';
import { CatalogoService } from '../../services/catalogo.service';
import { Fuente } from '../../models/fuente'; 
import { FuenteService } from '../../services/fuente.service';
import { switchMap } from 'rxjs';
import { SortFuentesPipe } from '../../pipes/sort-fuentes.pipe';
import { FileUpload } from "primeng/fileupload";
import * as similarity from 'string-similarity';


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
    FileUpload
],
    providers: [MessageService, ConfirmationService, DatePipe],
    templateUrl: './casos.html'
})
export class CasosPage implements OnInit {
    // Señal (Signal) que almacena la lista de casos a mostrar en la tabla.
    casos = signal<CasoConEvidencia[]>([]);
    // Señal que almacena la lista completa de componentes para los desplegables.
    componentes = signal<Componente[]>([]);
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

    // Señal para las opciones del filtro de versión
    opcionesFiltroVersion = signal<any[]>([]);
    // Propiedad para controlar el switch de la fuente
    //esFuenteExterna: boolean = false;

    // Propiedad para los items del botón de exportar
    opcionesExportar: MenuItem[];

    // Propiedades para el diálogo de importación
    importDialog: boolean = false;
    archivoParaImportar: File | null = null;

    private catalogoService = inject(CatalogoService);
    private estadosEvidencia = this.catalogoService.estadosEvidencia;

    private fuenteService = inject(FuenteService); 
    todasLasFuentes = signal<Fuente[]>([]);

    sugerenciasFuentes = signal<Fuente[]>([]); 


    estadosModificacion = signal<EstadoModificacion[]>([]);
    private estadoModificacionService = inject(EstadoModificacionService);

    todosLosFormularios = signal<number[]>([]);
    sugerenciasFormulario = signal<number[]>([]);

    // Propiedades para el diálogo de advertencia
    advertenciaDialog: boolean = false;
    casosConAdvertencia: any[] = [];
    casosValidadosTemporalmente: any[] = [];

    private accionConfirmada: 'importar' | 'guardarManual' = 'importar'; 

    


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
            this.casos.set([]);
            
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
        }


        this.casos.set([]);
        if (this.componenteSeleccionadoId) {
            this.cargandoCasos.set(true);
            this.casoService.getCasosPorComponente(this.componenteSeleccionadoId)
                .subscribe(data => {

                    const casosEnriquecidos = data.map(item => {
                    // Se busca el nombre del estado usando la función que ya tenemos.
                    const nombreEstado = this.findEstadoModificacionNombre(item.caso.id_estado_modificacion);
                    // Se unen los nombres de las fuentes en un solo string, separados por un espacio.
                    const nombresFuentes = item.caso.fuentes?.map(f => f.nombre_fuente).join(' ') || '';

                    const ultimoEstadoId = item.ultimaEvidencia?.id_estado_evidencia ?? 'SIN_EJECUTAR';

                    const rutsParaBuscar = item.rutsUnicos?.join(' ') || '';

                   
                    // Se crea una nueva versión del objeto 'caso' que incluye el nombre.
                    const casoActualizado = { 
                        ...item.caso, 
                        nombre_estado_modificacion: nombreEstado,
                        version: item.caso.version || '',
                        fuentes_nombres: nombresFuentes,
                        ruts_concatenados: rutsParaBuscar
                         
                    };

                    

                    // Se devuelve el objeto completo con el 'caso' ya actualizado.
                        return { ...item, caso: casoActualizado, ultimoEstadoId: ultimoEstadoId };
                    });
                    this.casos.set(casosEnriquecidos as any);
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
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos del caso.'});
            return;
        }

        if (!caso.version) {
            this.messageService.add({severity: 'warn', summary: 'Atención', detail: 'Debe escribir la versión de ejecución de la prueba.'});
            return;
        }

        if (!caso.descripcion_caso) {
            this.messageService.add({severity: 'warn', summary: 'Atención', detail: 'Debe escribir una descripción para la prueba.'});
            return;
        }
        if (!caso.id_estado_modificacion) {
            this.messageService.add({severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar un estado de modificación para la prueba.'});
            return;
        }

        if (!caso.id_componente) {
            this.messageService.add({severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar un componente para la prueba.'});
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

        const nombresExistentes = otrosCasos.map(c => c.caso.nombre_caso);

        // 2. Validación de duplicados exactos
        if (nombresExistentes.some(nombre => this.normalizarNombreCaso(nombre) === nombreNormalizadoNuevo)) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ya existe un caso con un nombre idéntico en este componente.' });
            return;
        }

        // 3. Validación de duplicados similares
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
    }

    private validarCamposBasicos(): boolean {
        const usuarioLogueado = this.authService.usuarioActual();

        if (!usuarioLogueado || !usuarioLogueado.idUsuario) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo identificar al usuario. Por favor, inicie sesión de nuevo.'});
            return false;
        }
        if (!this.caso.version) {
            this.messageService.add({severity: 'warn', summary: 'Atención', detail: 'Debe escribir la versión de ejecución de la prueba.'});
            return false;
        }
        if (!this.caso.descripcion_caso) {
            this.messageService.add({severity: 'warn', summary: 'Atención', detail: 'Debe escribir una descripción para la prueba.'});
            return false;
        }
        if (!this.caso.id_estado_modificacion) {
            this.messageService.add({severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar un estado de modificación para la prueba.'});
            return false;
        }
        if (!this.caso.id_componente) {
            this.messageService.add({severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar un componente para la prueba.'});
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
        table.clear();
        if (this.filterInput) {
            this.filterInput.nativeElement.value = '';
        }
    }


    cargarHitos(componentes: Componente[]) {
        const hitosUnicos = [...new Map(componentes.map(c => [c.hito_componente, c.hito_componente])).values()];
        this.hitos.set(hitosUnicos.map(h => ({ id: h, nombre: `Hito ${h}` })));
    }


    importarCasos() {
        this.archivoParaImportar = null; // Reseteamos el archivo seleccionado
        this.importDialog = true; // Abrimos el diálogo de importación
    }

    cerrarDialogoImportar() {
        this.importDialog = false;
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
            return; }
        
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

     exportarCasos(formato: string) {
        if (this.casos().length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'No hay datos', detail: 'No hay casos para exportar.' });
            return;
        }

        const datosParaExportar = this.casos().map((item: any) => ({
            'ID Caso': item.caso.id_caso,
            'Nombre del Caso': item.caso.nombre_caso,
            'Descripción': item.caso.descripcion_caso,
            'Versión': item.caso.version,
            'Estado Modificación': item.caso.nombre_estado_modificacion,
            'Último Estado Ejecución': item.nombre_ultimo_estado,
            'Fuentes': item.caso.fuentes_nombres,
            'RUTs': item.caso.ruts_concatenados,
        }));
        
        exportarAExcel(datosParaExportar, "CasosDePrueba");
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
        // Lógica futura para el informe
        this.messageService.add({ severity: 'info', summary: 'Próximamente', detail: 'La generación del Plan de Pruebas estará disponible en el futuro.' });
    }
}