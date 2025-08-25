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
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
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
import { EstadoModificacion } from '../../models/estado-modificacion';
import { EstadoModificacionService } from '../../services/estado-modificacion.service';
import { CatalogoService } from '../../services/catalogo.service';
import { Fuente } from '../../models/fuente'; 
import { FuenteService } from '../../services/fuente.service';
import { switchMap } from 'rxjs';
import { SortFuentesPipe } from '../../pipes/sort-fuentes.pipe';


// Se define una interfaz local para la estructura de los Hitos.
interface Hito {
    id: number;
    nombre: string;
}

@Component({
    standalone: true,
    imports: [
        IconFieldModule, SortFuentesPipe, AutoCompleteModule,SplitButtonModule,  FieldsetModule, InputIconModule, TooltipModule, CommonModule, FormsModule, TableModule, ButtonModule, ToolbarModule, DialogModule,
        RouterModule, TruncatePipe , ChipsModule, TagModule, InputTextModule, TextareaModule, SelectModule, InputSwitchModule, ConfirmDialogModule, ToastModule, InputNumberModule, VersionFormatDirective
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

    private catalogoService = inject(CatalogoService);
    private estadosEvidencia = this.catalogoService.estadosEvidencia;

    private fuenteService = inject(FuenteService); 
    todasLasFuentes = signal<Fuente[]>([]);

    sugerenciasFuentes = signal<Fuente[]>([]); 


    estadosModificacion = signal<EstadoModificacion[]>([]);
    private estadoModificacionService = inject(EstadoModificacionService);

    todosLosFormularios = signal<number[]>([]);
    sugerenciasFormulario = signal<number[]>([]);

    


    // Almacena las opciones para el filtro de activo en la tabla.
    opcionesFiltroActivo: any[];
    //Propiedad para controlar el estado del panel
    detallesAvanzadosColapsados: boolean = true;

    opcionesFiltroModificacion: any[];

    // Señal para controlar la visibilidad del campo formulario
    mostrarCampoFormulario = signal<boolean>(false);

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


        // Se inicializan las opciones para el menú de filtro de la columna 'Estado'.
        // this.opcionesFiltroEstado = [
        //     { label: 'OK', value: 'OK' },
        //     { label: 'NK', value: 'NK' },
        //     { label: 'Sin Ejecutar', value: null }
        // ];

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
        const debeMostrar = null;
            if (proyectoActual) {
                // Se revisa si el nombre del proyecto está en la lista de configuración
                const debeMostrar = environment.proyectosDeDDJJ.includes(proyectoActual.nombre_proyecto);
                
            } else {
                // Si no hay proyecto, no se muestra
                
            }
        
            //validaciones a la entrada de datos
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
        //this.esFuenteExterna = !!caso.fuente; 
        const hitoId = this.componentes().find(c => c.id_componente === caso.id_componente)?.hito_componente || null;
        this.hitoSeleccionado.set(hitoId); 
        
        
        this.casoDialog = true;
    }

    

    // Gestiona el guardado de un caso, ya sea para crear uno nuevo o actualizar uno existente.
    guardarCaso() {

        // Se obtiene el usuario actual desde el servicio de autenticación
        const usuarioLogueado = this.authService.usuarioActual();

        //Validaciones
        // Se comprueba si hay un usuario logueado antes de continuar
        if (!usuarioLogueado || !usuarioLogueado.idUsuario) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo identificar al usuario. Por favor, inicie sesión de nuevo.'});
            return;
        }
        this.caso.activo = this.activoDialog ? 1 : 0;
        this.caso.id_usuario_creador = usuarioLogueado.idUsuario;
        this.caso.jp_responsable = usuarioLogueado.idUsuario;

        if (!this.caso.version) {
            this.messageService.add({severity: 'warn', summary: 'Atención', detail: 'Debe escribir la versión de ejecución de la prueba.'});
            return;
        }

        if (!this.caso.descripcion_caso) {
            this.messageService.add({severity: 'warn', summary: 'Atención', detail: 'Debe escribir una descripción para la prueba.'});
            return;
        }

        if (!this.caso.id_estado_modificacion) {
            this.messageService.add({severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar un estado de modificación para la prueba.'});
            return;
        }

        if (!this.caso.id_componente) {
            this.messageService.add({severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar un componente para la prueba.'});
            return;
        }
        const versionRegex = /^\d+\.\d+$/; 
        if (!versionRegex.test(this.caso.version)) {
            this.messageService.add({ 
                severity: 'warn', 
                summary: 'Formato Incorrecto', 
                detail: 'La versión debe tener el formato número.número (ej: 1.0).' 
            });
            return; // Detenemos el guardado
        }

        // Reemplaza el bloque antiguo por este:
        if (!this.caso.fuentes || this.caso.fuentes.length === 0) {
            this.messageService.add({
                severity: 'warn', 
                summary: 'Atención', 
                detail: 'Debe seleccionar al menos una fuente de información.'
            });
            return; // Detenemos el guardado
        }

        

        

        const peticion = this.editando
            ? this.casoService.updateCaso(this.caso.id_caso!, this.caso as Caso)
            : this.casoService.createCaso(this.caso as Caso);


        
        
        peticion.pipe(
            // switchMap nos permite ejecutar una segunda operación después de que la primera tenga éxito.
            // Recibimos el 'casoGuardado' de la primera operación.
            switchMap(casoGuardado => {
                
                const idCaso = casoGuardado.id_caso!;
                const fuentes = this.caso.fuentes || [];
                
                // Hacemos la segunda llamada para actualizar las fuentes.
                return this.casoService.updateFuentesDeCaso(idCaso, fuentes);
            })
        ).subscribe({
            next: () => {
                // Este bloque se ejecuta solo si AMBAS operaciones (guardar caso y guardar fuentes) tienen éxito.
                this.messageService.add({
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: 'Caso de prueba guardado correctamente.'
                });
                
                // Actualizamos la tabla
                this.onComponenteSeleccionado(); 
                this.cerrarDialogo();
            },
            error: (err) => {
                // Si cualquiera de las dos operaciones falla, se captura el error aquí.
                
                console.error('Error al guardar el caso o sus fuentes:', err, this.caso);
                this.messageService.add({
                    severity: 'error', 
                    summary: 'Error', 
                    detail: 'No se pudo guardar el caso'
                });
            }
        });
        
        //this.cerrarDialogo();
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
        // Lógica futura para la importación
        this.messageService.add({ severity: 'info', summary: 'Próximamente', detail: 'Esta funcionalidad de importación estará disponible en el futuro.' });
    }

     exportarCasos(formato: string) {
        if (this.casos().length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'No hay datos', detail: 'No hay casos para exportar.' });
            return;
        }

        // Mapeamos los datos a un formato más simple y legible para el Excel
        const datosParaExportar = this.casos().map(item => {
            // Unimos los nombres de las fuentes en un solo string
            const fuentes = item.caso.fuentes?.map(f => f.nombre_fuente).join(', ') || '';

            return {
                'ID Caso': item.caso.id_caso,
                'Nombre del Caso': item.caso.nombre_caso,
                'Descripción': item.caso.descripcion_caso,
                'Versión': item.caso.version,
                'Estado Modificación': this.findEstadoModificacionNombre(item.caso.id_estado_modificacion),
                'Último Estado Ejecución': this.findEstadoEvidenciaNombre((item as any).ultimoEstadoId),
                'Fuentes': fuentes,
                'Precondiciones': item.caso.precondiciones,
                'Pasos': item.caso.pasos,
                'Resultado Esperado': item.caso.resultado_esperado
            };
        });

        // Creamos la hoja de cálculo a partir de nuestros datos
        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datosParaExportar);

        // Creamos el libro de trabajo y le añadimos la hoja
        const workbook: XLSX.WorkBook = { Sheets: { 'Casos': worksheet }, SheetNames: ['Casos'] };

        // Generamos el buffer del archivo Excel
        const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        // Guardamos el archivo
        this.guardarArchivoExcel(excelBuffer, "CasosDePrueba");
    }

    // 3. AÑADE ESTE NUEVO MÉTODO AUXILIAR
    private guardarArchivoExcel(buffer: any, nombreArchivo: string): void {
        const data: Blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
        });
        saveAs(data, nombreArchivo + '_export_' + new Date().getTime() + '.xlsx');
    }

    exportarPlanDePruebas() {
        // Lógica futura para el informe
        this.messageService.add({ severity: 'info', summary: 'Próximamente', detail: 'La generación del Plan de Pruebas estará disponible en el futuro.' });
    }
}