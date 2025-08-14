import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Importaciones de PrimeNG que usaremos
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { InputSwitchModule } from 'primeng/inputswitch'; 
import { InputNumberModule } from 'primeng/inputnumber';

// Modelos y Servicios
import { Proyecto } from '../../../models/proyecto';
import { ProyectoService } from '../../../services/proyecto.service';
import { environment } from './../../../../environment/environment';

@Component({
  selector: 'app-proyectos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule,
    ToolbarModule, DialogModule, InputTextModule, ToastModule, TooltipModule,
    InputSwitchModule, InputNumberModule
  ],
  providers: [MessageService],
  templateUrl: './proyectos.component.html'
})
export class ProyectosComponent implements OnInit {

  // Inyectamos los servicios
  private proyectoService = inject(ProyectoService);
  private messageService = inject(MessageService);

  // Señal para almacenar la lista de proyectos
  proyectos = signal<Proyecto[]>([]);
  // Propiedades para el diálogo
  proyectoDialog: boolean = false;
  proyecto!: Partial<Proyecto>;
  editando: boolean = false; 
  activoDialog: boolean = true;

  ngOnInit() {
    this.cargarProyectos();
  }

  // Método para cargar los proyectos desde el servicio
  cargarProyectos() {
    this.proyectoService.getProyectos().subscribe({
      next: (data) => this.proyectos.set(data),
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los proyectos.' })
    });
  }

  
  abrirDialogoNuevo() {
    const anioProyecto = environment.anioTributario;
    this.proyecto = {
        
        anio: anioProyecto, 
        activo: 1 
    };
    this.activoDialog = true;
    this.editando = false;
    this.proyectoDialog = true;
  }

  cerrarDialogo() {
    this.proyectoDialog = false;
  }

  abrirDialogoEditar(proyectoAEditar: Proyecto) {
    // 1. Hacemos una copia del proyecto para no modificar el original directamente.
    this.proyecto = { ...proyectoAEditar };
    
    // 2. Sincronizamos el estado del interruptor con el dato del proyecto.
    this.activoDialog = proyectoAEditar.activo === 1;
    
    // 3. Ponemos el diálogo en modo "Edición".
    this.editando = true;
    
    // 4. Mostramos el diálogo.
    this.proyectoDialog = true;
  }

  guardarProyecto() {
    // --- 1. Validaciones del Frontend ---
    if (!this.proyecto.nombre_proyecto || !this.proyecto.anio) {
        this.messageService.add({ 
            severity: 'warn', 
            summary: 'Campos requeridos', 
            detail: 'El nombre y el año del proyecto son obligatorios.' 
        });
        return; // Detenemos la ejecución
    }

    // --- 2. Preparar los datos para enviar ---
    // Asignamos el estado del interruptor al objeto que vamos a guardar
    this.proyecto.activo = this.activoDialog ? 1 : 0;

    if (this.editando) {
        // MODO EDICIÓN
        this.proyectoService.updateProyecto(this.proyecto.id_proyecto!, this.proyecto).subscribe({
            next: (proyectoActualizado) => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Proyecto actualizado' });
                
                // Reemplazamos el proyecto en la lista en lugar de añadirlo
                this.proyectos.update(lista => {
                    const index = lista.findIndex(p => p.id_proyecto === proyectoActualizado.id_proyecto);
                    if (index !== -1) {
                        lista[index] = proyectoActualizado;
                    }
                    return [...lista];
                });

                this.cerrarDialogo();
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el proyecto' })
        });
    } else {
        // MODO CREACIÓN (esta lógica ya la tenías)
        this.proyectoService.createProyecto(this.proyecto).subscribe({
            next: (proyectoGuardado) => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Proyecto creado' });
                
                // Añadimos el nuevo proyecto a la lista
                this.proyectos.update(proyectosActuales => [...proyectosActuales, proyectoGuardado]);
                
                this.cerrarDialogo();
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el proyecto' })
        });
    }
  }
}