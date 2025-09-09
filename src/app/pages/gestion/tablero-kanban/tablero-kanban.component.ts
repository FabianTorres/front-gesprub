// src/app/pages/gestion/tablero-kanban/tablero-kanban.component.ts

import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';

// Servicios y Modelos
import { ProyectoService } from '../../../services/proyecto.service';
import { CasoService } from '../../../services/caso.service';
import { Caso } from '../../../models/caso';

@Component({
  selector: 'app-tablero-kanban',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectButtonModule,
    SelectModule,
    CardModule
  ],
  templateUrl: './tablero-kanban.component.html'
})
export class TableroKanbanComponent implements OnInit {

  private proyectoService = inject(ProyectoService);
  private casoService = inject(CasoService);

  // Columnas del Kanban
  porHacer = signal<Caso[]>([]);
  completado = signal<Caso[]>([]);
  conError = signal<Caso[]>([]);
  
  loading = signal(true);

  constructor() {
    // Reaccionará a los cambios de proyecto para cargar los datos del tablero
    effect(() => {
      const proyectoActual = this.proyectoService.proyectoSeleccionado();
      if (proyectoActual) {
        this.cargarTablero(proyectoActual.id_proyecto);
      } else {
        // Limpiamos las columnas si no hay proyecto
        this.porHacer.set([]);
        this.completado.set([]);
        this.conError.set([]);
      }
    });
  }

  ngOnInit(): void {}

  cargarTablero(proyectoId: number) {
    this.loading.set(true);
    // AVISO: Usaremos un método de servicio que aún no existe.
    // Lo crearemos en el siguiente paso.
    /*
    this.casoService.getCasosParaTablero(proyectoId).subscribe(data => {
        this.porHacer.set(data.porHacer);
        this.completado.set(data.completado);
        this.conError.set(data.conError);
        this.loading.set(false);
    });
    */
    console.log(`Cargando tablero para el proyecto con ID: ${proyectoId}`);
  }
}