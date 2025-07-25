import { Component, OnInit, inject, signal, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
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
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { Caso } from '../../models/caso';
import { CasoService } from '../../services/caso.service';
import { Componente } from '../../models/componente';
import { ComponenteService } from '../../services/componente.service';
import { VersionFormatDirective } from '../../directives/version-format.directive';
import { CasoConEvidencia } from '../../models/casoevidencia';

// Se define una interfaz local para la estructura de los Hitos.
interface Hito {
    id: number;
    nombre: string;
}

@Component({
    standalone: true,
    imports: [
        IconFieldModule, InputIconModule, TooltipModule, CommonModule, FormsModule, TableModule, ButtonModule, ToolbarModule, DialogModule,
        RouterModule, TagModule, InputTextModule, TextareaModule, SelectModule, InputSwitchModule, ConfirmDialogModule, ToastModule, InputNumberModule, VersionFormatDirective
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
    opcionesFiltroEstado: any[];

    // Referencia a la tabla de PrimeNG en el HTML para poder controlarla.
    @ViewChild('dt') dt!: Table;
    // Referencia al campo de texto del filtro global.
    @ViewChild('filterInput') filterInput!: ElementRef<HTMLInputElement>;

    // Inyección de dependencias de los servicios necesarios.
    private casoService = inject(CasoService);
    private componenteService = inject(ComponenteService);
    private messageService = inject(MessageService);
    private datePipe = inject(DatePipe);

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

        // Se inicializan las opciones para el menú de filtro de la columna 'Estado'.
        this.opcionesFiltroEstado = [
            { label: 'OK', value: 'OK' },
            { label: 'NK', value: 'NK' },
            { label: 'Sin Ejecutar', value: null }
        ];
    }
    
    // Método del ciclo de vida de Angular que se ejecuta al iniciar el componente.
    ngOnInit() {
        this.cargarComponentes();
    }

    // Se activa al seleccionar un componente, cargando los casos correspondientes.
    onComponenteSeleccionado() {
        if (this.dt) {
            this.dt.clear();
        }
        this.casos.set([]);
        if (this.componenteSeleccionadoId) {
            this.cargandoCasos.set(true);
            this.casoService.getCasosPorComponente(this.componenteSeleccionadoId)
                .subscribe(data => {
                    const casosLimpios = data.map(item => ({
                        ...item,
                        caso: { ...item.caso, version: item.caso.version || '' }
                    }));
                    this.casos.set(casosLimpios);
                    this.cargandoCasos.set(false);
                });
        }
    }

    // Carga la lista completa de componentes desde el servicio.
    cargarComponentes() {
        this.componenteService.getComponentes().subscribe(data => {
            this.componentes.set(data);
            const hitosUnicos = [...new Map(data.map(c => [c.hito_componente, c.hito_componente])).values()];
            this.hitos.set(hitosUnicos.map(h => ({ id: h, nombre: `Hito ${h}` })));
        });
    }
    
    // Busca el nombre de un componente a partir de su ID.
    findComponentName(id: number): string {
        return this.componentes().find(c => c.id_componente === id)?.nombre_componente || 'No encontrado';
    }

    // Prepara las variables para abrir el diálogo en modo 'Nuevo'.
    abrirDialogoNuevo() {
        this.caso = {};
        this.editando = false;
        this.activoDialog = true;
        this.hitoSeleccionado.set(null);
        this.casoDialog = true;
    }

    // Prepara las variables para abrir el diálogo en modo 'Editar' con los datos del caso seleccionado.
    editarCaso(casoConEvidencia: CasoConEvidencia) {
        const caso = casoConEvidencia.caso;
        if (!caso) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos del caso.'});
            return;
        }
        this.caso = { ...caso };
        this.editando = true;
        this.activoDialog = caso.activo === 1;
        const hitoId = this.componentes().find(c => c.id_componente === caso.id_componente)?.hito_componente || null;
        this.hitoSeleccionado.set(hitoId); 
        this.casoDialog = true;
    }
    
    // Cierra el diálogo emergente.
    cerrarDialogo() {
        this.casoDialog = false;
    }

    // Gestiona el guardado de un caso, ya sea para crear uno nuevo o actualizar uno existente.
    guardarCaso() {
        this.caso.activo = this.activoDialog ? 1 : 0;
        this.caso.id_usuario_creador = 1;
        this.caso.jp_responsable = 1;

        const peticion = this.editando
            ? this.casoService.updateCaso(this.caso.id_caso!, this.caso as Caso)
            : this.casoService.createCaso(this.caso as Caso);
        
        peticion.subscribe({
            next: () => {
                this.messageService.add({severity: 'success', summary: 'Éxito', detail: 'Caso de prueba guardado'});
                this.onComponenteSeleccionado(); 
            },
            error: (err) => this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo guardar el caso'})
        });
        
        this.cerrarDialogo();
    }

    // Determina el color del tag de estado basado en su valor.
    getSeverityForEstado(estado: string | null | undefined): string {
        switch (estado) {
            case 'OK':
                return 'success';
            case 'NK':
                return 'danger';
            default:
                return 'secondary';
        }
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
}