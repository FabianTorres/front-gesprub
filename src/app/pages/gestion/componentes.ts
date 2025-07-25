// src/app/pages/gestion/componentes.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService, SortMeta } from 'primeng/api';

// Importaciones de PrimeNG (siguiendo el patrón de los ejemplos)
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber'; // Útil para el Hito
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

// Modelos y Servicios
import { Componente } from '../../models/componente';
import { ComponenteService } from '../../services/componente.service';

@Component({
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule, ToolbarModule, DialogModule,
        InputTextModule, InputSwitchModule, DatePickerModule, InputNumberModule, ConfirmDialogModule, ToastModule
    ],
    providers: [MessageService, ConfirmationService, DatePipe],
    templateUrl: './componentes.html'
})
export class ComponentesPage implements OnInit {
    // Señales para el estado, como en crud.ts
    componentes = signal<Componente[]>([]);
    componente!: Partial<Componente>;
    
    componenteDialog: boolean = false;
    editando: boolean = false;
    submitted: boolean = false;

    // Propiedades para manejar los tipos de datos en el diálogo
    fechaLimiteDialog: Date | null = null;
    activoDialog: boolean = true;

    multiSortMeta: SortMeta[] = [];

    // Inyección de dependencias
    private componenteService = inject(ComponenteService);
    private messageService = inject(MessageService);
    private datePipe = inject(DatePipe);
    
    ngOnInit() {
        this.cargarComponentes();
        this.multiSortMeta = [
            { field: 'hito_componente', order: 1 },
            { field: 'nombre_componente', order: 1 }
        ];
    }

    cargarComponentes() {
        this.componenteService.getComponentes().subscribe(data => this.componentes.set(data));
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

        // Preparamos el objeto para enviar
        this.componente.activo = this.activoDialog ? 1 : 0;
        this.componente.fecha_limite = this.datePipe.transform(this.fechaLimiteDialog, 'yyyy-MM-dd') || '';

        const peticion = this.editando
            ? this.componenteService.updateComponente(this.componente.id_componente!, this.componente as Componente)
            : this.componenteService.createComponente(this.componente as Componente);
        
        peticion.subscribe({
            next: () => {
                const mensaje = this.editando ? 'Componente actualizado' : 'Componente creado';
                this.messageService.add({severity: 'success', summary: 'Éxito', detail: mensaje});
                this.cargarComponentes();
            },
            error: (err) => this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo guardar el componente'})
        });
        
        this.cerrarDialogo();
    }
}