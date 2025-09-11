// src/app/pages/gestion/tablero-kanban/tablero-kanban.component.ts

import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// Servicios y Modelos
import { ProyectoService } from '../../../services/proyecto.service';
import { CasoService } from '../../../services/caso.service';
import { Caso } from '../../../models/caso';
import { UsuarioService } from '../../../services/usuario.service';
import { AutenticacionService } from '../../../services/autenticacion.service'; // Para obtener el usuario actual
import { Usuario } from '../../../models/usuario';
import { KanbanData } from '../../../models/kanban-data';

@Component({
  selector: 'app-tablero-kanban',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectButtonModule,
    SelectModule,
    CardModule,
    DropdownModule,
    ProgressSpinnerModule 
  ],
  templateUrl: './tablero-kanban.component.html',
  styleUrls: ['./tablero-kanban.component.scss']
})
export class TableroKanbanComponent implements OnInit {

  private proyectoService = inject(ProyectoService);
  private casoService = inject(CasoService);
  private authService = inject(AutenticacionService);
   private usuarioService = inject(UsuarioService);

  // Columnas del Kanban
  porHacer = signal<Caso[]>([]);
  completado = signal<Caso[]>([]);
  conError = signal<Caso[]>([]);
  
  loading = signal(true);

  usuarios = signal<Usuario[]>([]);
  selectedUsuario: Usuario | null = null;

  constructor() {
    // Este effect reaccionará a los cambios de proyecto para cargar el tablero
    effect(() => {
      const proyectoActual = this.proyectoService.proyectoSeleccionado();
      if (proyectoActual) {
        // Obtenemos el ID del usuario seleccionado (puede ser null para "Todos")
        const usuarioId = this.selectedUsuario ? this.selectedUsuario.idUsuario : undefined;
        this.cargarTablero(proyectoActual.id_proyecto, usuarioId);
      } else {
        // Limpiamos las columnas si no hay proyecto seleccionado
        this.porHacer.set([]);
        this.completado.set([]);
        this.conError.set([]);
      }
    });
  }

  ngOnInit(): void {
    // NUEVO: Al iniciar el componente, cargamos la lista de usuarios para el filtro
    this.cargarUsuarios();
    // y establecemos el filtro por defecto al usuario logueado
    this.selectedUsuario = this.authService.usuarioActual();
  }

  cargarTablero(proyectoId: number, usuarioId?: number) {
    this.loading.set(true);
    
    // Usamos el nuevo método del servicio que creamos en el paso anterior
    this.casoService.getCasosKanban(proyectoId, usuarioId).subscribe({
      next: (data: KanbanData) => {
        // --- INICIO DE DEPURACIÓN ---
        console.log('Respuesta del backend recibida:', data); 
        // --- FIN DE DEPURACIÓN ---
        this.porHacer.set(data.porHacer);
        this.completado.set(data.completado);
        this.conError.set(data.conError);
        this.loading.set(false);

        // --- INICIO DE DEPURACIÓN ---
        console.log('Señales actualizadas:', { 
            porHacer: this.porHacer(), 
            completado: this.completado(), 
            conError: this.conError() 
        });
        // --- FIN DE DEPURACIÓN ---
      },
      error: (err) => {
        console.error('Error al cargar los datos del Kanban', err);
        this.loading.set(false);
      }
    });
  }
  cargarUsuarios(): void {
    this.usuarioService.getUsuarios().subscribe({
      next: (usuarios) => this.usuarios.set(usuarios),
      error: (err) => console.error('Error al cargar los usuarios', err)
    });
  }

  onUsuarioChange(): void {
    // Al cambiar la selección, simplemente volvemos a llamar a cargarTablero.
    // El effect ya se encarga de obtener el proyecto actual.
    const proyectoActual = this.proyectoService.proyectoSeleccionado();
    if (proyectoActual) {
      const usuarioId = this.selectedUsuario ? this.selectedUsuario.idUsuario : undefined;
      this.cargarTablero(proyectoActual.id_proyecto, usuarioId);
    }
  }
 
}