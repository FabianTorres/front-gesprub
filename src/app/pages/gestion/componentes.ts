// src/app/pages/gestion/componentes.ts

import { Component, OnInit, ViewChild, inject, effect, signal, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService, SortMeta } from 'primeng/api';

// Importaciones de PrimeNG (siguiendo el patrón de los ejemplos)
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber'; // Útil para el Hito
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

// Modelos y Servicios
import { Componente } from '../../models/componente';
import { ComponenteService } from '../../services/componente.service';
import { ProyectoService } from '../../services/proyecto.service'; 

@Component({
    standalone: true,
    imports: [
        CommonModule,IconFieldModule,InputIconModule, FormsModule,TooltipModule ,SelectModule ,TableModule, ButtonModule, ToolbarModule, DialogModule,
        InputTextModule, InputSwitchModule, DatePickerModule, InputNumberModule, ConfirmDialogModule, ToastModule
    ],
    providers: [MessageService, ConfirmationService, DatePipe],
    templateUrl: './componentes.html'
})
export class ComponentesPage implements OnInit {
    
    componentes = signal<Componente[]>([]);
    componente!: Partial<Componente>;
    
    componenteDialog: boolean = false;
    editando: boolean = false;
    submitted: boolean = false;

    // Propiedades para manejar los tipos de datos en el diálogo
    fechaLimiteDialog: Date | null = null;
    activoDialog: boolean = true;

    multiSortMeta: SortMeta[] = [];

    @ViewChild('dtc') dtc!: Table;
    @ViewChild('filterInputComp') filterInput!: ElementRef<HTMLInputElement>;

    // Inyección de dependencias
    private componenteService = inject(ComponenteService);
    private messageService = inject(MessageService);
    private datePipe = inject(DatePipe);

    private router = inject(Router);
    private proyectoService = inject(ProyectoService); 

    hitos = signal<any[]>([]);
    opcionesFiltroActivo: any[];

    constructor() {

        effect(() => {
            const proyectoActual = this.proyectoService.proyectoSeleccionado();
            if (proyectoActual) {
                this.cargarComponentes(proyectoActual.id_proyecto);
            } else {
                this.componentes.set([]); // Si no hay proyecto, se vacía la lista.
            }
        });
        // Se inicializan las opciones para el filtro de Activo.
        this.opcionesFiltroActivo = [
            { label: 'Activo', value: 1 },
            { label: 'Inactivo', value: 0 }
        ];
    }
    
    ngOnInit() {
        //this.cargarComponentes();
        this.multiSortMeta = [
            { field: 'hito_componente', order: 1 },
            { field: 'nombre_componente', order: 1 }
        ];
    }

    cargarComponentes(proyectoId: number) {
        this.componenteService.getComponentesPorProyecto(proyectoId).subscribe(data => {
            this.componentes.set(data);
            const hitosUnicos = [...new Map(data.map(c => [c.hito_componente, c.hito_componente])).values()];
            this.hitos.set(hitosUnicos.map(h => ({ label: `Hito ${h}`, value: h })));
        });
    }

    abrirDialogoNuevo() {
        this.componente = {};
        this.editando = false;
        this.submitted = false;
        this.fechaLimiteDialog = null;
        this.activoDialog = true;
        this.componenteDialog = true;
    }

    editarComponente(componente: Componente) {
        this.componente = { ...componente };
        this.editando = true;
        this.fechaLimiteDialog = componente.fecha_limite ? new Date(componente.fecha_limite.replace(/-/g, '/')) : null;
        this.activoDialog = componente.activo === 1;
        this.componenteDialog = true;
    }
    
    cerrarDialogo() {
        this.componenteDialog = false;
        this.submitted = false;
    }

    guardarComponente() {
        this.submitted = true;

        if (!this.componente.nombre_componente?.trim()) {
            return;
        }

        // Se obtiene el proyecto activo desde el servicio.
        const proyectoActual = this.proyectoService.proyectoSeleccionado();
        if (!proyectoActual) {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'No hay un proyecto seleccionado.'});
            return;
        }

        // Preparamos el objeto para enviar
        this.componente.activo = this.activoDialog ? 1 : 0;
        this.componente.fecha_limite = this.datePipe.transform(this.fechaLimiteDialog, 'yyyy-MM-dd') || '';
        this.componente.proyecto = proyectoActual;


        const peticion = this.editando
            ? this.componenteService.updateComponente(this.componente.id_componente!, this.componente as Componente)
            : this.componenteService.createComponente(this.componente as Componente);
        
        peticion.subscribe({
            next: () => {
                const mensaje = this.editando ? 'Componente actualizado' : 'Componente creado';
                this.messageService.add({severity: 'success', summary: 'Éxito', detail: mensaje});
                const proyectoActual = this.proyectoService.proyectoSeleccionado();
                if(proyectoActual) this.cargarComponentes(proyectoActual.id_proyecto);
            },
            error: (err) => this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo guardar el componente'})
        });
        
        this.cerrarDialogo();
    }

    irACasos(componente: Componente) {
        if (componente.id_componente) {
            const proyectoActual = this.proyectoService.proyectoSeleccionado();
            // CAMBIO: Se asegura de que haya un proyecto activo antes de guardar
            if (proyectoActual) {
                // Se construye la clave específica para el proyecto
                const key = `ultimoComponente_${proyectoActual.id_proyecto}`;
                localStorage.setItem(key, componente.id_componente.toString());
                this.router.navigate(['/pages/gestion/casos']);
            } else {
                this.messageService.add({severity: 'warn', summary: 'Acción no disponible', detail: 'Por favor, seleccione un proyecto activo primero.'});
            }
        }
    }



    // Se añade la función para el filtro global
    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    // Se añade la función para limpiar los filtros
    clear(table: Table) {
        table.clear();
        if (this.filterInput) {
            this.filterInput.nativeElement.value = '';
        }
    }
}