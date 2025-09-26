// src/app/pages/gestion/muro-tareas/muro-tareas.component.ts

import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DragDropModule } from 'primeng/dragdrop';
import { TooltipModule } from 'primeng/tooltip'; 
import { InputTextModule } from 'primeng/inputtext'; 
import { MessageService } from 'primeng/api'; 
import { ToastModule } from 'primeng/toast';

// Servicios y Modelos
import { ProyectoService } from '../../../services/proyecto.service';
import { ComponenteService } from '../../../services/componente.service';
import { CasoService } from '../../../services/caso.service';
import { Componente } from '../../../models/componente';
import { Caso } from '../../../models/caso';
import { AutenticacionService } from '../../../services/autenticacion.service';

@Component({
  selector: 'app-muro-tareas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    CardModule,
    ButtonModule,
    TagModule,
    DragDropModule,
    TooltipModule, InputTextModule, ToastModule
  ],
   providers: [MessageService],
   styleUrls: ['./muro-tareas.component.scss'],
  templateUrl: './muro-tareas.component.html'
})
export class MuroTareasComponent implements OnInit {
  private proyectoService = inject(ProyectoService);
  private componenteService = inject(ComponenteService);
  private casoService = inject(CasoService);
  private authService = inject(AutenticacionService); 
  private messageService = inject(MessageService);

  componentes = signal<Componente[]>([]);
  componenteSeleccionadoId: number | null = null;

  backlogCasos = signal<Caso[]>([]);
  misTareasCasos = signal<Caso[]>([]);
  loading = signal(false);

  private casoArrastrado: Caso | null = null;

  filtroBacklog = signal<string>('');
    backlogFiltrado = computed(() => {
        const filtro = this.filtroBacklog().toLowerCase();
        if (!filtro) {
            return this.backlogCasos();
        }
        return this.backlogCasos().filter(caso => 
            caso.nombre_caso.toLowerCase().includes(filtro)
        );
    });

  constructor() {
    // Reacciona al cambio de proyecto global
    effect(() => {
      const proyectoActual = this.proyectoService.proyectoSeleccionado();
      this.componenteSeleccionadoId = null;
      this.backlogCasos.set([]);
      this.misTareasCasos.set([]);
      
      if (proyectoActual) {
        this.cargarComponentes(proyectoActual.id_proyecto);
      } else {
        this.componentes.set([]);
      }
    });
  }

  ngOnInit(): void {}

  cargarComponentes(proyectoId: number) {
    this.componenteService.getComponentesPorProyecto(proyectoId).subscribe(data => {
      this.componentes.set(data);
    });
  }

  onComponenteSeleccionado() {
        if (!this.componenteSeleccionadoId) {
            this.backlogCasos.set([]);
            this.misTareasCasos.set([]);
            return;
        }

        this.loading.set(true);
        this.casoService.getCasosParaMuro(this.componenteSeleccionadoId).subscribe({
            next: (data) => {
                this.backlogCasos.set(data.backlog);
                this.misTareasCasos.set(data.misTareas);
                //console.log(data.misTareas);
                this.loading.set(false);
            },
            error: () => {
                // Manejo de error básico
                this.loading.set(false);
                // this.messageService.add(...) Opcional: mostrar mensaje de error
            }
        });
    }

    asignarCaso(caso: Caso) {
        const usuarioActual = this.authService.usuarioActual();
        if (!usuarioActual) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo identificar al usuario.' });
        return;
        }

        this.casoService.asignarCaso(caso.id_caso!, usuarioActual.idUsuario).subscribe({
        next: () => {
            // Actualización optimista de la UI para una respuesta instantánea
            this.backlogCasos.update(casos => casos.filter(c => c.id_caso !== caso.id_caso));
            this.misTareasCasos.update(casos => [...casos, caso]);
            
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Caso "${caso.nombre_caso}" asignado.` });
        },
        error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo asignar el caso.' });
            console.error('Error al asignar caso:', err);
        }
        });
    }

    onDragStart(caso: Caso) {
        this.casoArrastrado = caso;
    }

    onDrop(columnaDestino: 'backlog' | 'misTareas') {
        if (!this.casoArrastrado) return;

        const caso = this.casoArrastrado; // Guardamos una referencia local

        // --- Lógica de Movimiento ---
        const esDelBacklog = this.backlogCasos().some(c => c.id_caso === caso.id_caso);
        const esDeMisTareas = this.misTareasCasos().some(c => c.id_caso === caso.id_caso);

        // Mover de Backlog -> Mis Tareas
        if (esDelBacklog && columnaDestino === 'misTareas') {
            this.asignarCaso(caso);
        }
        // Mover de Mis Tareas -> Backlog
        else if (esDeMisTareas && columnaDestino === 'backlog') {
            this.devolverCasoAlBacklog(caso);
        }
        
        this.casoArrastrado = null; // Limpiamos la variable después de soltar
    }

    devolverCasoAlBacklog(caso: Caso) {
        this.casoService.desasignarCaso(caso.id_caso!).subscribe({
            next: () => {
                // Esta es la lógica que antes estaba dentro del 'else', ahora se ejecuta siempre.
                this.misTareasCasos.update(casos => casos.filter(c => c.id_caso !== caso.id_caso));
                if(caso.id_componente === this.componenteSeleccionadoId) {
                    this.backlogCasos.update(casos => [...casos, caso]);
                }
                this.messageService.add({ 
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: `Caso "${caso.nombre_caso}" devuelto al backlog.` 
                });
            },
            error: (err) => {
                this.messageService.add({ 
                    severity: 'error', 
                    summary: 'Error', 
                    detail: 'No se pudo devolver el caso al backlog.' 
                });
                console.error('Error al desasignar caso:', err);
            }
        });
    }
}