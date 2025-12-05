import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { TruncatePipe } from '../../../pipes/truncate.pipe';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { SortFuentesPipe } from '../../../pipes/sort-fuentes.pipe';
import { EstadoModificacionService } from '../../../services/estado-modificacion.service';
import { EstadoModificacion } from '../../../models/estado-modificacion';

import { SelectModule } from 'primeng/select';
import { ComponenteService } from '../../../services/componente.service';
import { CasoService } from '../../../services/caso.service';
import { Componente } from '../../../models/componente';
import { CasoConEvidencia } from '../../../models/casoevidencia';

import { Ciclo, CicloRequest } from '../../../models/ciclo';
import { CicloService } from '../../../services/ciclo.service';
import { AutenticacionService } from '../../../services/autenticacion.service';
import { ProyectoService } from '../../../services/proyecto.service';

@Component({
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule, ToolbarModule,
        DialogModule, InputTextModule, TextareaModule, DatePickerModule,
        TagModule, ToastModule, ConfirmDialogModule, TooltipModule,
        SelectModule, CheckboxModule, SortFuentesPipe, SelectButtonModule,
        IconFieldModule, InputIconModule, RouterModule
    ],
    providers: [MessageService, ConfirmationService, DatePipe],
    templateUrl: './ciclos.html'
})
export class CiclosPage implements OnInit {

    // Signals
    ciclos = signal<Ciclo[]>([]);
    loading = signal<boolean>(false);

    // Variables para Diálogo de Creación
    cicloDialog: boolean = false;
    nuevoCiclo: Partial<CicloRequest> = {};

    //Senal para saber si se esta editando
    editando = signal<boolean>(false);
    idCicloEnEdicion: number | null = null;

    alcanceDialog: boolean = false;
    cicloSeleccionado: Ciclo | null = null;

    // Referencia a la tabla del diálogo (le pondremos el ID #dtAlcance en el HTML)
    @ViewChild('dtAlcance') dtAlcance!: Table;

    // Variables para filtros y estados
    estadosModificacion = signal<EstadoModificacion[]>([]);
    opcionesFiltroModificacion: any[] = [];

    // === FILTRO DE ESTADO ===
    filtroEstado = signal<'activos' | 'cerrados' | 'todos'>('activos');

    opcionesEstado = [
        { label: 'Activos', value: 'activos' },
        { label: 'Cerrados', value: 'cerrados' },
        { label: 'Todos', value: 'todos' }
    ];

    // 1. Definimos las opciones del filtro
    opcionesFiltroEstadoEjecucion = [
        { label: 'Ejecutado', value: 'Ejecutado' },
        { label: 'Sin Ejecutar', value: 'Sin Ejecutar' }
    ];

    // Inyecciones nuevas
    private estadoModificacionService = inject(EstadoModificacionService);

    // Datos para los filtros y tablas
    componentes = signal<Componente[]>([]);
    casosDelComponente = signal<CasoConEvidencia[]>([]);
    componenteFiltro: number | null = null;
    loadingCasos: boolean = false;

    //Un Set para guardar IDs únicos sin duplicados
    idsSeleccionadosGlobal = new Set<number>();

    // Inyecciones
    private cicloService = inject(CicloService);
    private authService = inject(AutenticacionService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private datePipe = inject(DatePipe);
    private componenteService = inject(ComponenteService);
    private casoService = inject(CasoService);
    private proyectoService = inject(ProyectoService);

    ngOnInit() {
        this.cargarCiclos();
        this.cargarEstadosModificacion();
        // Inicializar opciones de filtro (Misma lógica que en CasosPage)
        this.opcionesFiltroModificacion = [
            { label: 'Nuevo', value: 1 },
            { label: 'Modificado', value: 2 },
            { label: 'Sin cambios', value: 3 },
            { label: 'Eliminado', value: 6 }
        ];
    }

    cargarEstadosModificacion() {
        this.estadoModificacionService.getEstados().subscribe(data => {
            this.estadosModificacion.set(data);
        });
    }

    findEstadoModificacionNombre(id: number): string {
        const estado = this.estadosModificacion().find(e => e.id_estado_modificacion === id);
        return estado ? estado.nombre : 'N/A';
    }

    getSeverityForModificacion(estado: string | null | undefined): string {
        switch (estado) {
            case 'Modificado': return 'warn';
            case 'Nuevo': return 'info';
            case 'Sin cambios': return 'secondary';
            case 'Eliminado': return 'danger';
            default: return 'secondary';
        }
    }

    cargarCiclos() {
        this.loading.set(true);
        // Pasamos el valor actual de la señal de filtro
        this.cicloService.getCiclos(this.filtroEstado()).subscribe({
            next: (data) => {
                this.ciclos.set(data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error(err);
                this.loading.set(false);
            }
        });
    }

    abrirDialogoNuevo() {
        this.nuevoCiclo = {};
        this.editando.set(false);
        this.idCicloEnEdicion = null;
        this.cicloDialog = true;
    }

    //Cargar datos para editar
    editarCiclo(ciclo: Ciclo) {
        this.editando.set(true);
        this.idCicloEnEdicion = ciclo.idCiclo;

        // Rellenamos el formulario con los datos actuales
        this.nuevoCiclo = {
            jiraKey: ciclo.jiraKey,
            nombre: ciclo.nombre,
            descripcion: ciclo.descripcion,
            // Importante: Convertir string ISO a Date para que el DatePicker lo lea bien
            fechaLiberacion: ciclo.fechaLiberacion ? new Date(ciclo.fechaLiberacion) : undefined
        };

        this.cicloDialog = true;
    }

    cerrarDialogo() {
        this.cicloDialog = false;
        this.nuevoCiclo = {};
    }

    guardarCiclo() {
        const usuario = this.authService.usuarioActual();

        if (!this.nuevoCiclo.jiraKey || !this.nuevoCiclo.nombre || !usuario) {
            this.messageService.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Debe ingresar la Clave Jira y el Nombre.' });
            return;
        }

        // Preparar objeto para el backend
        const request: CicloRequest = {
            jiraKey: this.nuevoCiclo.jiraKey,
            nombre: this.nuevoCiclo.nombre,
            descripcion: this.nuevoCiclo.descripcion || '',
            idUsuarioCreador: usuario.idUsuario,
            // Convertir fecha a string YYYY-MM-DD si viene de un DatePicker
            fechaLiberacion: this.nuevoCiclo.fechaLiberacion ?
                this.datePipe.transform(this.nuevoCiclo.fechaLiberacion, 'yyyy-MM-dd')! : undefined
        };

        if (this.editando()) {
            // --- LÓGICA DE ACTUALIZACIÓN ---
            this.cicloService.updateCiclo(this.idCicloEnEdicion!, request).subscribe({
                next: (cicloActualizado) => {
                    this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Ciclo modificado correctamente.' });

                    // Actualizamos la lista localmente sin recargar todo
                    this.ciclos.update(lista => lista.map(c =>
                        c.idCiclo === cicloActualizado.idCiclo ? cicloActualizado : c
                    ));

                    this.cerrarDialogo();
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el ciclo.' });
                }
            });
        } else {
            // --- LÓGICA DE CREACIÓN (La que ya tenías) ---
            this.cicloService.createCiclo(request).subscribe({
                next: (cicloCreado) => {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ciclo creado correctamente.' });
                    this.ciclos.update(lista => [cicloCreado, ...lista]);
                    this.cerrarDialogo();
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el ciclo.' });
                }
            });
        }
    }

    confirmarCierre(ciclo: Ciclo) {
        const usuario = this.authService.usuarioActual();
        if (!usuario) return;

        this.confirmationService.confirm({
            message: `¿Está seguro de cerrar el ciclo "${ciclo.nombre}"? Pasará al histórico y no podrá recibir más ejecuciones.`,
            header: 'Confirmar Cierre',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, Cerrar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.cicloService.cerrarCiclo(ciclo.idCiclo, usuario.idUsuario).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Ciclo Cerrado', detail: 'El ciclo ha sido archivado.' });
                        // Lo quitamos de la lista de activos
                        this.ciclos.update(lista => lista.filter(c => c.idCiclo !== ciclo.idCiclo));
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cerrar el ciclo.' });
                    }
                });
            }
        });
    }

    // 1. Abrir el Gestor de Alcance
    gestionarAlcance(ciclo: Ciclo) {
        this.cicloSeleccionado = ciclo;
        this.idsSeleccionadosGlobal.clear(); // Limpiamos memoria
        this.componenteFiltro = null;
        this.casosDelComponente.set([]);

        // Cargar componentes del proyecto actual (para el dropdown)
        const proyectoActual = this.proyectoService.proyectoSeleccionado();
        if (proyectoActual) {
            this.componenteService.getComponentesPorProyecto(proyectoActual.id_proyecto)
                .subscribe(data => this.componentes.set(data));
        }

        // Cargar el alcance actual desde el backend (IDs)
        this.cicloService.getAlcance(ciclo.idCiclo).subscribe(ids => {
            // Llenamos nuestro Set global con lo que ya existe
            ids.forEach(id => this.idsSeleccionadosGlobal.add(id));
            this.alcanceDialog = true;
        });
    }

    // 2. Cargar casos cuando el usuario elige un componente
    onComponenteChange() {
        if (!this.componenteFiltro) {
            this.casosDelComponente.set([]);
            return;
        }

        this.loadingCasos = true;
        this.casoService.getCasosPorComponente(this.componenteFiltro).subscribe({
            next: (data) => {
                // Mapeamos para agregar campos "planos" que facilitan el filtrado en la tabla
                const casosEnriquecidos = data.map(item => {
                    const nombreEstado = this.findEstadoModificacionNombre(item.caso.id_estado_modificacion);
                    const nombresFuentes = item.caso.fuentes?.map(f => f.nombre_fuente).join(' ') || '';

                    const estadoEjecucion = item.ultimaEvidencia ? 'Ejecutado' : 'Sin Ejecutar';

                    // Creamos una copia del caso con las propiedades extra para filtrado
                    const casoConExtras = {
                        ...item.caso,
                        nombre_estado_modificacion: nombreEstado, // Para filtrar por texto o dropdown
                        fuentes_nombres: nombresFuentes, // Para filtrar por texto "string"
                        estado_ejecucion: estadoEjecucion
                    };

                    return { ...item, caso: casoConExtras };
                });

                // Ordenamiento
                casosEnriquecidos.sort((a, b) => {
                    // Verificamos si los IDs están en nuestro Set global de seleccionados
                    const aSelected = this.idsSeleccionadosGlobal.has(a.caso.id_caso!);
                    const bSelected = this.idsSeleccionadosGlobal.has(b.caso.id_caso!);

                    if (aSelected && !bSelected) return -1; // 'a' seleccionado va arriba
                    if (!aSelected && bSelected) return 1;  // 'b' seleccionado va arriba

                    return 0; // Si ambos están igual (ambos marcados o ambos desmarcados), no cambiamos orden
                });

                this.casosDelComponente.set(casosEnriquecidos as any);
                this.loadingCasos = false;
            },
            error: () => this.loadingCasos = false
        });
    }

    // 3. Método auxiliar para verificar si un caso está seleccionado (para el HTML)
    isCasoSelected(idCaso: number): boolean {
        return this.idsSeleccionadosGlobal.has(idCaso);
    }

    // 4. Método para marcar/desmarcar un caso individual
    toggleCaso(idCaso: number, event: any) {
        // event.checked viene del p-checkbox o input check
        if (event.checked) {
            this.idsSeleccionadosGlobal.add(idCaso);
        } else {
            this.idsSeleccionadosGlobal.delete(idCaso);
        }
    }

    // 5. Método para "Seleccionar Todos" los del componente actual
    toggleTodosComponente(event: any) {
        const casos = this.casosDelComponente();
        if (event.checked) {
            // Agregar todos los IDs visibles al Set Global
            casos.forEach(c => this.idsSeleccionadosGlobal.add(c.caso.id_caso!));
        } else {
            // Quitar todos los IDs visibles del Set Global
            casos.forEach(c => this.idsSeleccionadosGlobal.delete(c.caso.id_caso!));
        }
    }

    // 6. Verificar si todos los visibles están seleccionados (para el checkbox maestro)
    areAllSelected(): boolean {
        const casos = this.casosDelComponente();
        if (casos.length === 0) return false;
        return casos.every(c => this.idsSeleccionadosGlobal.has(c.caso.id_caso!));
    }

    // 7. Guardar cambios
    guardarAlcance() {
        if (!this.cicloSeleccionado) return;

        // Convertir el Set a Array
        const idsFinales = Array.from(this.idsSeleccionadosGlobal);

        this.messageService.add({ severity: 'info', summary: 'Guardando', detail: 'Actualizando...' });

        this.cicloService.asignarAlcance(this.cicloSeleccionado.idCiclo, idsFinales).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Alcance actualizado correctamente.' });
                this.alcanceDialog = false;
                this.cargarCiclos(); // Recargar tabla principal para actualizar los KPIs
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el alcance.' });
            }
        });
    }

    /**
     * Genera la URL para ir al ticket de Jira.
     * Asume que la clave ya viene completa (ej: CERTRTA26-150).
     */
    getJiraUrl(jiraKey: string): string {
        if (!jiraKey) return '#';
        // Usamos la base de Jira pero sin el prefijo del proyecto, ya que el key lo trae
        return `http://jira.sii.cl:8080/browse/${jiraKey}`;
    }

    // Método para filtrar globalmente
    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }
}