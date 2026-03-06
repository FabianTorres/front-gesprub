import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { CasoService } from '../../services/caso.service';
import { ProyectoService } from '../../services/proyecto.service';
import { ComponenteService } from '../../services/componente.service';
import { Proyecto } from '../../models/proyecto';
import { Componente } from '../../models/componente';
import { CasoConEvidencia } from '../../models/casoevidencia';

@Component({
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule, ToolbarModule,
        DialogModule, InputTextModule, SelectModule, ConfirmDialogModule,
        ToastModule, TagModule, IconFieldModule, InputIconModule, TooltipModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './admin-casos.html'
})
export class AdminCasosPage implements OnInit {
    private casoService = inject(CasoService);
    private proyectoService = inject(ProyectoService);
    private componenteService = inject(ComponenteService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    proyectos = signal<Proyecto[]>([]);
    proyectoSeleccionadoId: number | null = null;

    componentes = signal<Componente[]>([]);
    componenteOrigenId: number | null = null;

    casos = signal<CasoConEvidencia[]>([]);
    casosSeleccionados: CasoConEvidencia[] = [];
    cargandoCasos = signal<boolean>(false);

    // Variables para el diálogo de Mover
    moverDialog: boolean = false;
    componenteDestinoId: number | null = null;
    procesando = signal<boolean>(false);

    // Computed para el destino (excluye el componente de origen)
    componentesDestino = computed(() => {
        return this.componentes().filter(c => c.id_componente !== this.componenteOrigenId);
    });

    ngOnInit() {
        this.cargarProyectos();
    }

    cargarProyectos() {
        this.proyectoService.getProyectos().subscribe(data => {
            this.proyectos.set(data);
        });
    }

    onProyectoChange() {
        this.componenteOrigenId = null;
        this.casos.set([]);
        this.casosSeleccionados = [];

        if (this.proyectoSeleccionadoId) {
            this.componenteService.getComponentesPorProyecto(this.proyectoSeleccionadoId).subscribe(data => {
                this.componentes.set(data);
            });
        } else {
            this.componentes.set([]);
        }
    }

    onComponenteOrigenChange() {
        this.casosSeleccionados = [];
        if (this.componenteOrigenId) {
            this.cargarCasos();
        } else {
            this.casos.set([]);
        }
    }

    cargarCasos() {
        this.cargandoCasos.set(true);
        this.casoService.getCasosPorComponente(this.componenteOrigenId!).subscribe({
            next: (data) => {
                const datosProcesados = data.map(item => {
                    const casoAsAny = item.caso as any;

                    // 1. Aplanar las fuentes
                    casoAsAny.fuente_str = (item.caso.fuentes && item.caso.fuentes.length > 0)
                        ? item.caso.fuentes.map((f: any) => f.nombre_fuente).join(', ')
                        : '';

                    // 2. Mapear el Tipo de Modificación a texto
                    // (Cambia estos números si en tu BD corresponden a otros IDs)
                    switch (item.caso.id_estado_modificacion) {
                        case 1: casoAsAny.estado_mod_str = 'Nuevo'; break;
                        case 2: casoAsAny.estado_mod_str = 'Modificado'; break;
                        case 3: casoAsAny.estado_mod_str = 'Sin Cambios'; break;
                        default: casoAsAny.estado_mod_str = 'Sin Asignar';
                    }

                    // 3. Mapear Evidencias a texto para el filtro
                    casoAsAny.tiene_evidencia_str = item.ultimaEvidencia ? 'Sí' : 'No';

                    return item;
                });

                this.casos.set(datosProcesados);
                this.cargandoCasos.set(false);
            },
            error: () => {
                this.cargandoCasos.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los casos.' });
            }
        });
    }

    // --- LÓGICA MOVER ---
    abrirDialogoMover() {
        this.componenteDestinoId = null;
        this.moverDialog = true;
    }

    confirmarMover() {
        if (!this.componenteDestinoId || this.casosSeleccionados.length === 0) return;

        this.procesando.set(true);
        const ids = this.casosSeleccionados.map(c => c.caso.id_caso!);

        this.casoService.moverCasosMasivo(ids, this.componenteDestinoId).subscribe({
            next: () => {
                this.procesando.set(false);
                this.moverDialog = false;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Se movieron ${ids.length} casos correctamente.` });
                this.casosSeleccionados = [];
                this.cargarCasos(); // Recargamos para que desaparezcan de la tabla actual
            },
            error: (err) => {
                this.procesando.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.mensaje || 'No se pudieron mover los casos.' });
            }
        });
    }

    // --- LÓGICA ELIMINAR ---
    confirmarEliminacion() {
        if (this.casosSeleccionados.length === 0) return;

        this.confirmationService.confirm({
            message: `¿Está <strong>completamente seguro</strong> de que desea eliminar definitivamente los ${this.casosSeleccionados.length} casos seleccionados?<br><br>Esta acción <strong>NO se puede deshacer</strong> y borrará historiales y evidencias asociadas.`,
            header: '⚠️ Peligro: Eliminación Definitiva',
            icon: 'pi pi-exclamation-triangle text-red-500 text-3xl',
            acceptLabel: 'Sí, Eliminar Definitivamente',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                const ids = this.casosSeleccionados.map(c => c.caso.id_caso!);

                this.casoService.eliminarCasosMasivo(ids).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Eliminados', detail: 'Los casos fueron borrados del sistema.' });
                        this.casosSeleccionados = [];
                        this.cargarCasos();
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.mensaje || 'Ocurrió un error al intentar eliminar los casos.' });
                    }
                });
            }
        });
    }
}