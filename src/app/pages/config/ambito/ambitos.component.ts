// src/app/pages/config/ambitos/ambitos.component.ts

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
import { Ambito } from '../../../models/ambito';
import { AmbitoService } from '../../../services/ambito.service';

@Component({
  selector: 'app-ambitos',
  standalone: true,
  imports: [ CommonModule, FormsModule, TableModule, ButtonModule, ToolbarModule, DialogModule, InputTextModule, ToastModule, TooltipModule, InputSwitchModule ],
  providers: [MessageService],
  templateUrl: './ambitos.component.html'
})
export class AmbitosComponent implements OnInit {

  private ambitoService = inject(AmbitoService);
  private messageService = inject(MessageService);

  ambitos = signal<Ambito[]>([]);
  ambitoDialog: boolean = false;
  ambito!: Partial<Ambito>;
  editando: boolean = false;
  activoDialog: boolean = true;

  ngOnInit() {
    this.cargarAmbitos();
  }

  cargarAmbitos() {
    this.ambitoService.getAmbitos().subscribe({
      next: (data) => this.ambitos.set(data),
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los ámbitos.' })
    });
  }

  abrirDialogoNuevo() {
    this.ambito = { activo: 1 };
    this.activoDialog = true;
    this.editando = false;
    this.ambitoDialog = true;
  }

  abrirDialogoEditar(ambitoAEditar: Ambito) {
    this.ambito = { ...ambitoAEditar };
    this.activoDialog = ambitoAEditar.activo === 1;
    this.editando = true;
    this.ambitoDialog = true;
  }

  cerrarDialogo() {
    this.ambitoDialog = false;
  }

  guardarAmbito() {
    if (!this.ambito.nombre_ambito) {
        this.messageService.add({ severity: 'warn', summary: 'Campo requerido', detail: 'El nombre es obligatorio.' });
        return;
    }

    this.ambito.activo = this.activoDialog ? 1 : 0;

    const peticion = this.editando
      ? this.ambitoService.updateAmbito(this.ambito.id_ambito!, this.ambito)
      : this.ambitoService.createAmbito(this.ambito);

    peticion.subscribe({
      next: (ambitoGuardado) => {
        const mensaje = this.editando ? 'Ámbito actualizado' : 'Ámbito creado';
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: mensaje });

        if (this.editando) {
          this.ambitos.update(lista => {
            const index = lista.findIndex(a => a.id_ambito === ambitoGuardado.id_ambito);
            if (index !== -1) lista[index] = ambitoGuardado;
            return [...lista];
          });
        } else {
          this.ambitos.update(lista => [...lista, ambitoGuardado]);
        }
        this.cerrarDialogo();
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el ámbito.' })
    });
  }
}