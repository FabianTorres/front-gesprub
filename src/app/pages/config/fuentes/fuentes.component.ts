import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Modules
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { InputSwitchModule } from 'primeng/inputswitch';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

// App Services and Models
import { Fuente } from '../../../models/fuente';
import { FuenteService } from '../../../services/fuente.service';

@Component({
  selector: 'app-fuentes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
    InputTextModule, ToolbarModule, ToastModule, TooltipModule, 
    InputSwitchModule, IconFieldModule, InputIconModule
  ],
  providers: [MessageService],
  templateUrl: './fuentes.component.html'
})
export class FuentesComponent implements OnInit {
  
  private fuenteService = inject(FuenteService);
  private messageService = inject(MessageService);

  fuentes = signal<Fuente[]>([]);
  loading = signal(true);
  
  // Propiedades para el diálogo, siguiendo el patrón existente
  fuenteDialog: boolean = false;
  fuente!: Partial<Fuente>;
  editando: boolean = false;
  activoDialog: boolean = true;

  ngOnInit(): void {
    this.cargarFuentes();
  }

  cargarFuentes() {
    this.loading.set(true);
    this.fuenteService.getFuentes().subscribe(data => {
      this.fuentes.set(data);
      this.loading.set(false);
    });
  }

  abrirDialogoNuevo() {
    this.fuente = {};
    this.activoDialog = true;
    this.editando = false;
    this.fuenteDialog = true;
  }

  abrirDialogoEditar(fuenteAEditar: Fuente) {
    this.fuente = { ...fuenteAEditar };
    this.activoDialog = fuenteAEditar.activo === 1;
    this.editando = true;
    this.fuenteDialog = true;
  }

  cerrarDialogo() {
    this.fuenteDialog = false;
  }

  guardarFuente() {
    if (!this.fuente.nombre_fuente?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Campo requerido', detail: 'El nombre es obligatorio.' });
      return;
    }

    this.fuente.activo = this.activoDialog ? 1 : 0;

    const peticion = this.editando
      ? this.fuenteService.updateFuente(this.fuente.id_fuente!, this.fuente)
      : this.fuenteService.createFuente(this.fuente);

    peticion.subscribe({
      next: (fuenteGuardada) => {
        const mensaje = this.editando ? 'Fuente actualizada' : 'Fuente creada';
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: mensaje });

        // Actualización reactiva del signal
        if (this.editando) {
          this.fuentes.update(lista => {
            const index = lista.findIndex(f => f.id_fuente === fuenteGuardada.id_fuente);
            if (index !== -1) lista[index] = fuenteGuardada;
            return [...lista];
          });
        } else {
          this.fuentes.update(lista => [...lista, fuenteGuardada]);
        }
        
        this.cerrarDialogo();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la fuente.' });
        console.error('Error al guardar fuente:', err);
      }
    });
  }
}