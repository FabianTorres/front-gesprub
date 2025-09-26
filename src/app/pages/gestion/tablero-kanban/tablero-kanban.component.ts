// src/app/pages/gestion/tablero-kanban/tablero-kanban.component.ts

import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- IMPORTS DE PRIMENG ---
import { DatePickerModule } from 'primeng/datepicker';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';

// --- PIPES, SERVICIOS Y MODELOS ---
import { TruncatePipe } from '../../../pipes/truncate.pipe';
import { ProyectoService } from '../../../services/proyecto.service';
import { CasoService } from '../../../services/caso.service';
import { UsuarioService } from '../../../services/usuario.service';
import { AutenticacionService } from '../../../services/autenticacion.service';
import { Usuario } from '../../../models/usuario';
import { Caso } from '../../../models/caso';
import { Fuente } from '../../../models/fuente';
import { KanbanData } from '../../../models/kanban-data';

@Component({
  selector: 'app-tablero-kanban',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    CardModule,
    ProgressSpinnerModule,
    TooltipModule,
    TruncatePipe,
    DatePickerModule,
    SelectButtonModule
  ],
  templateUrl: './tablero-kanban.component.html',
  styleUrls: ['./tablero-kanban.component.scss']
})
export class TableroKanbanComponent implements OnInit {

  private proyectoService = inject(ProyectoService);
  private casoService = inject(CasoService);
  private authService = inject(AutenticacionService);
  private usuarioService = inject(UsuarioService);

  loading = signal(true);

  // --- SEÑALES PARA FILTROS ---
  usuarios = signal<Usuario[]>([]);
  selectedUsuario: Usuario | null = null;
  
  opcionesFecha = [
    { label: 'Todos', value: 'todos' },
    { label: 'Hoy', value: 'hoy' },
    { label: 'Últimos 2 días', value: '2dias' },
    { label: 'Última Semana', value: 'semana' }
  ];
  filtroFechaRapido = signal('todos');
  filtroRangoFechas = signal<Date[] | null>(null);

  // --- GESTIÓN DE DATOS ---
  // Almacena TODOS los casos que vienen del backend
  private todosLosCasos = signal<KanbanData>({ porHacer: [], completado: [], conError: [] });

  // --- LÓGICA REFACTORIZADA Y SEGURA ---
  // 1. Se crea una señal computada que calcula el rango de fechas del filtro
  private fechasDelFiltro = computed(() => {
    const filtroRapido = this.filtroFechaRapido();
    const rango = this.filtroRangoFechas();

    if (filtroRapido === 'todos' && (!rango || !rango[0])) {
        return null; // No hay filtro activo
    }

    let fechaInicio: Date;
    let fechaFin: Date;

    if (rango && rango[0]) {
        fechaInicio = new Date(rango[0]);
        fechaFin = rango[1] ? new Date(rango[1]) : new Date(rango[0]);
    } else {
        const hoy = new Date();
        fechaFin = new Date();
        fechaInicio = new Date();
        switch (filtroRapido) {
            case 'hoy':
                break; // fechaInicio ya es hoy
            case '2dias':
                fechaInicio.setDate(hoy.getDate() - 1);
                break;
            case 'semana':
                fechaInicio.setDate(hoy.getDate() - 6);
                break;
            default:
                return null; // Caso 'todos' sin rango
        }
    }
    
    fechaInicio.setHours(0, 0, 0, 0);
    fechaFin.setHours(23, 59, 59, 999);

    return { fechaInicio, fechaFin };
  });

  // 2. Las columnas ahora se computan directamente desde la fuente y el filtro de fecha
  porHacer = computed(() => {
    const todos = this.todosLosCasos().porHacer;
    const fechas = this.fechasDelFiltro();
    if (!fechas) return todos;
    return todos.filter(caso => {
        if (!caso.fechaMovimientoKanban) return false;
        const fechaMovimiento = new Date(caso.fechaMovimientoKanban);
        return fechaMovimiento >= fechas.fechaInicio && fechaMovimiento <= fechas.fechaFin;
    });
  });

  completado = computed(() => {
    const todos = this.todosLosCasos().completado;
    const fechas = this.fechasDelFiltro();
    if (!fechas) return todos;
    return todos.filter(caso => {
        if (!caso.fechaMovimientoKanban) return false;
        const fechaMovimiento = new Date(caso.fechaMovimientoKanban);
        return fechaMovimiento >= fechas.fechaInicio && fechaMovimiento <= fechas.fechaFin;
    });
  });

  conError = computed(() => {
    const todos = this.todosLosCasos().conError;
    const fechas = this.fechasDelFiltro();
    if (!fechas) return todos;
    return todos.filter(caso => {
        if (!caso.fechaMovimientoKanban) return false;
        const fechaMovimiento = new Date(caso.fechaMovimientoKanban);
        return fechaMovimiento >= fechas.fechaInicio && fechaMovimiento <= fechas.fechaFin;
    });
  });

  constructor() {
    effect(() => {
      const proyectoActual = this.proyectoService.proyectoSeleccionado();
      if (proyectoActual) {
        const usuarioId = this.selectedUsuario ? this.selectedUsuario.idUsuario : undefined;
        this.cargarTablero(proyectoActual.id_proyecto, usuarioId);
      } else {
        this.todosLosCasos.set({ porHacer: [], completado: [], conError: [] });
      }
    });
  }

  ngOnInit(): void {
    this.cargarUsuarios();
    this.selectedUsuario = this.authService.usuarioActual();
  }

  cargarTablero(proyectoId: number, usuarioId?: number) {
    this.loading.set(true);
    this.casoService.getCasosKanban(proyectoId, usuarioId).subscribe({
      next: (data: KanbanData) => {
        this.todosLosCasos.set(data);
        this.loading.set(false);
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
    const proyectoActual = this.proyectoService.proyectoSeleccionado();
    if (proyectoActual) {
      const usuarioId = this.selectedUsuario ? this.selectedUsuario.idUsuario : undefined;
      this.cargarTablero(proyectoActual.id_proyecto, usuarioId);
    }
  }

  onFiltroFechaRapidoChange(): void {
    this.filtroRangoFechas.set(null);
  }

  onRangoFechasChange(value: Date[] | null): void {
      // Esta condición es importante: solo desactivamos el filtro rápido
      // si el usuario realmente ha seleccionado una fecha de inicio.
      if (value && value[0]) {
        this.filtroFechaRapido.set('todos');
      }
  }

  getNombreUsuario(usuarioId: number | undefined): string {
    if (!usuarioId) return 'No asignado';
    const usuario = this.usuarios().find(u => u.idUsuario === usuarioId);
    return usuario ? usuario.nombreUsuario : 'Usuario no encontrado';
  }

  getFuentesTooltip(fuentes: Fuente[] | undefined): string {
    if (!fuentes || fuentes.length === 0) return 'No hay fuentes asignadas';
    return fuentes.map(f => f.nombre_fuente).join('<br>');
  }
}