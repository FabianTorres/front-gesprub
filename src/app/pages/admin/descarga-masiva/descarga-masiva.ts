import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ProyectoService } from '../../../services/proyecto.service';
import { ComponenteService } from '../../../services/componente.service';
import { Proyecto } from '../../../models/proyecto';
import { Componente } from '../../../models/componente';

@Component({
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        ButtonModule,
        SelectModule,
        ToastModule
    ],
    providers: [MessageService],
    templateUrl: './descarga-masiva.html'
})
export class DescargaMasivaPage implements OnInit {

    // Servicios
    private proyectoService = inject(ProyectoService);
    private componenteService = inject(ComponenteService);
    private messageService = inject(MessageService);

    // Señales para datos
    proyectos = signal<Proyecto[]>([]);
    componentes = signal<Componente[]>([]);

    // Variables de selección
    proyectoSeleccionadoId: number | null = null;
    componenteSeleccionadoId: number | null = null;

    // Estado de carga
    descargando = signal<boolean>(false);

    //Variable para el filtro de estado
    estadoSeleccionadoId = signal<number | null>(null);

    // Opciones basadas en tus IDs de base de datos
    opcionesEstado = [
        { label: 'Todos los estados', value: null },
        { label: 'Nuevo', value: 1 },
        { label: 'Modificado', value: 2 },
        { label: 'Sin Cambios', value: 3 },
        { label: 'Eliminado', value: 6 }
    ];

    constructor() { }

    ngOnInit() {
        this.cargarProyectos();
    }

    cargarProyectos() {
        this.proyectoService.getProyectos().subscribe({
            next: (data) => this.proyectos.set(data),
            error: (err) => console.error('Error cargando proyectos', err)
        });
    }

    onProyectoChange() {
        this.componenteSeleccionadoId = null;
        this.estadoSeleccionadoId.set(null);
        this.componentes.set([]);

        if (this.proyectoSeleccionadoId) {
            this.componenteService.getComponentesPorProyecto(this.proyectoSeleccionadoId)
                .subscribe(data => this.componentes.set(data));
        }
    }

    descargarZip() {
        if (!this.componenteSeleccionadoId) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione un componente para descargar.' });
            return;
        }

        this.descargando.set(true);
        const estadoLabel = this.opcionesEstado.find(e => e.value === this.estadoSeleccionadoId())?.label || 'Total';
        this.messageService.add({ severity: 'info', summary: 'Procesando', detail: `Generando ZIP (${estadoLabel}), espere...` });

        this.componenteService.descargarZipEvidencias(this.componenteSeleccionadoId, this.estadoSeleccionadoId()).subscribe({
            next: (blob) => {
                // Crear nombre del archivo con fecha
                const nombreComponente = this.componentes().find(c => c.id_componente === this.componenteSeleccionadoId)?.nombre_componente || 'componente';
                const fecha = new Date().toISOString().slice(0, 10);
                const sufijo = this.estadoSeleccionadoId() ? `_Filtro${this.estadoSeleccionadoId()}` : '_Completo';
                const fileName = `Evidencias_${nombreComponente}${sufijo}_${fecha}.zip`;

                // Crear enlace temporal y descargar
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Descarga iniciada.' });
                this.descargando.set(false);
            },
            error: (err) => {
                console.error('Error en descarga ZIP:', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el archivo ZIP. Verifique si hay evidencias.' });
                this.descargando.set(false);
            }
        });
    }
}