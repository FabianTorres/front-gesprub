// src/app/pages/config/estados-modificacion/estados-modificacion.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { EstadoModificacion } from '../../../models/estado-modificacion';
import { EstadoModificacionService } from '../../../services/estado-modificacion.service';

@Component({
  selector: 'app-estados-modificacion',
  standalone: true,
  imports: [ CommonModule, FormsModule, TableModule, ButtonModule, ToolbarModule, DialogModule, InputTextModule, ToastModule, TooltipModule, InputSwitchModule ],
  providers: [MessageService],
  templateUrl: './estados-modificacion.component.html'
})
export class EstadosModificacionComponent implements OnInit {

  private estadoService = inject(EstadoModificacionService);
  private messageService = inject(MessageService);

  estados = signal<EstadoModificacion[]>([]);
  estadoDialog: boolean = false;
  estado!: Partial<EstadoModificacion>;
  editando: boolean = false;
  activoDialog: boolean = true;

  ngOnInit() {
    this.cargarEstados();
  }

  cargarEstados() {
    this.estadoService.getEstados().subscribe({
      next: (data) => this.estados.set(data),
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los estados.' })
    });
  }

  abrirDialogoNuevo() {
    this.estado = { activo: 1 };
    this.activoDialog = true;
    this.editando = false;
    this.estadoDialog = true;
  }

  abrirDialogoEditar(estadoAEditar: EstadoModificacion) {
    this.estado = { ...estadoAEditar };
    this.activoDialog = estadoAEditar.activo === 1;
    this.editando = true;
    this.estadoDialog = true;
  }

  cerrarDialogo() {
    this.estadoDialog = false;
  }

  guardarEstado() {
    if (!this.estado.nombre) {
        this.messageService.add({ severity: 'warn', summary: 'Campo requerido', detail: 'El nombre es obligatorio.' });
        return;
    }

    this.estado.activo = this.activoDialog ? 1 : 0;

    const peticion = this.editando
      ? this.estadoService.updateEstado(this.estado.id_estado_modificacion!, this.estado)
      : this.estadoService.createEstado(this.estado);

    peticion.subscribe({
      next: (estadoGuardado) => {
        const mensaje = this.editando ? 'Estado actualizado' : 'Estado creado';
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: mensaje });

        if (this.editando) {
          this.estados.update(lista => {
            const index = lista.findIndex(e => e.id_estado_modificacion === estadoGuardado.id_estado_modificacion);
            if (index !== -1) lista[index] = estadoGuardado;
            return [...lista];
          });
        } else {
          this.estados.update(lista => [...lista, estadoGuardado]);
        }
        this.cerrarDialogo();
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el estado.' })
    });
  }
}