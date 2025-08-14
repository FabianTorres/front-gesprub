// src/app/pages/config/criticidades/criticidades.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Importaciones de PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';

// Modelos y Servicios
import { Criticidad } from '../../../models/criticidad';
import { CriticidadService } from '../../../services/criticidad.service';

@Component({
  selector: 'app-criticidades',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule,
    ToolbarModule, DialogModule, InputTextModule, ToastModule,
    TooltipModule, InputSwitchModule
  ],
  providers: [MessageService],
  templateUrl: './criticidades.component.html'
})
export class CriticidadesComponent implements OnInit {

  private criticidadService = inject(CriticidadService);
  private messageService = inject(MessageService);

  criticidades = signal<Criticidad[]>([]);
  
  criticidadDialog: boolean = false;
  criticidad!: Partial<Criticidad>;
  editando: boolean = false;
  activoDialog: boolean = true;

  ngOnInit() {
    this.cargarCriticidades();
  }

  cargarCriticidades() {
    this.criticidadService.getCriticidades().subscribe({
      next: (data) => this.criticidades.set(data),
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las criticidades.' })
    });
  }

  abrirDialogoNuevo() {
    this.criticidad = { activo: 1 };
    this.activoDialog = true;
    this.editando = false;
    this.criticidadDialog = true;
  }

  abrirDialogoEditar(criticidadAEditar: Criticidad) {
    this.criticidad = { ...criticidadAEditar };
    this.activoDialog = criticidadAEditar.activo === 1;
    this.editando = true;
    this.criticidadDialog = true;
  }

  cerrarDialogo() {
    this.criticidadDialog = false;
  }

  guardarCriticidad() {
    if (!this.criticidad.nombre_criticidad) {
        this.messageService.add({ severity: 'warn', summary: 'Campo requerido', detail: 'El nombre es obligatorio.' });
        return;
    }

    this.criticidad.activo = this.activoDialog ? 1 : 0;

    const peticion = this.editando
      ? this.criticidadService.updateCriticidad(this.criticidad.id_criticidad!, this.criticidad)
      : this.criticidadService.createCriticidad(this.criticidad);

    peticion.subscribe({
      next: (criticidadGuardada) => {
        const mensaje = this.editando ? 'Criticidad actualizada' : 'Criticidad creada';
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: mensaje });

        if (this.editando) {
          this.criticidades.update(lista => {
            const index = lista.findIndex(c => c.id_criticidad === criticidadGuardada.id_criticidad);
            if (index !== -1) lista[index] = criticidadGuardada;
            return [...lista];
          });
        } else {
          this.criticidades.update(lista => [...lista, criticidadGuardada]);
        }
        this.cerrarDialogo();
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la criticidad.' })
    });
  }
}