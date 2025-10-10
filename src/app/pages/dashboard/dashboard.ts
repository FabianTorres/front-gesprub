import { Component, OnInit, inject, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { Subscription } from 'rxjs';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

import { DashboardService } from '../../services/dashboard.service';
import { ProyectoService } from '../../services/proyecto.service';
import { DashboardData } from '../../models/dashboard-data';
import { KpiCardComponent } from '../dashboard/widgets/kpi-card.component'; 
import { RouterModule } from '@angular/router';
import { ComponenteService } from '../../services/componente.service';
import { Componente } from '../../models/componente';

@Component({
    standalone: true,
    imports: [ CommonModule, SelectModule , FormsModule , ChartModule, CardModule, TableModule, TagModule, KpiCardComponent, RouterModule ],
    providers: [DatePipe],
    templateUrl: './dashboard.html',
    styles: [`
        :host .card {
            background: var(--surface-card);
            color: var(--text-color);
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
    `]
})
export class Dashboard implements OnInit, OnDestroy {
    
    // Inyección de servicios
    private dashboardService = inject(DashboardService);
    private proyectoService = inject(ProyectoService);
    private componenteService = inject(ComponenteService);
    private datePipe = inject(DatePipe);

    // Señales para el estado del componente
    dashboardData = signal<DashboardData | null>(null);
    cargando = signal<boolean>(true);

    // Señales para el grafico
    componentes = signal<Componente[]>([]);
    componenteSeleccionadoId = signal<number | null>(null);

    // Propiedades para los gráficos
    chartData: any;
    chartOptions: any;

    private subscriptions = new Subscription();

    constructor() {
        // Effect 1: Gestiona la lista de componentes. Se ejecuta solo cuando cambia el proyecto.
        effect(() => {
            const proyecto = this.proyectoService.proyectoSeleccionado();
            if (proyecto) {
                this.cargarComponentes(proyecto.id_proyecto);
                // Al cambiar de proyecto, reseteamos el filtro de componente
                this.componenteSeleccionadoId.set(null); 
            } else {
                this.componentes.set([]);
                this.componenteSeleccionadoId.set(null);
            }
        });

        // Effect 2: Carga los datos del dashboard. Se ejecuta cuando cambia el proyecto O el filtro de componente.
        effect(() => {
            const proyecto = this.proyectoService.proyectoSeleccionado();
            if (proyecto) {
                const componenteId = this.componenteSeleccionadoId();
                this.cargarDashboard(proyecto.id_proyecto, componenteId);
            } else {
                // Si no hay proyecto, nos aseguramos de limpiar los datos
                this.dashboardData.set(null);
            }
        });
    }

    ngOnInit() {
        this.initChartOptions();
    }

    cargarComponentes(proyectoId: number) {
        const sub = this.componenteService.getComponentesPorProyecto(proyectoId).subscribe(data => {
            this.componentes.set(data);
        });
        this.subscriptions.add(sub);
    }

    cargarDashboard(proyectoId: number, componenteId: number | null = null) {
        this.cargando.set(true);
        const sub = this.dashboardService.getDashboardGeneral(proyectoId, componenteId).subscribe({
            next: (data) => {
                this.dashboardData.set(data);
                this.actualizarGrafico(data);
                this.cargando.set(false);
            },
            error: (err) => {
                console.error('Error al cargar datos del dashboard:', err);
                this.dashboardData.set(null); // Limpiar datos en caso de error
                this.cargando.set(false);
            }
        });
        this.subscriptions.add(sub);
    }

    actualizarGrafico(data: DashboardData) {
        const documentStyle = getComputedStyle(document.documentElement);
        
        this.chartData = {
            labels: ['OK', 'NK', 'No Aplica (N/A)'],
            datasets: [
                {
                    data: [data.distribucionEstados.ok, data.distribucionEstados.nk, data.distribucionEstados.na],
                    backgroundColor: [
                        documentStyle.getPropertyValue('--color-ok'),
                        documentStyle.getPropertyValue('--color-fallo'),
                        documentStyle.getPropertyValue('--color-na')
                    ],
                    hoverBackgroundColor: [
                        documentStyle.getPropertyValue('--color-ok-hover'),
                        documentStyle.getPropertyValue('--color-fallo-hover'),
                        documentStyle.getPropertyValue('--color-na-hover')
                    ]
                }
            ]
        };
    }

    initChartOptions() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');

        this.chartOptions = {
            plugins: {
                legend: {
                    labels: {
                        usePointStyle: true,
                        color: textColor
                    }
                }
            }
        };
    }

    // Devuelve la severidad para el tag de estado
    getSeverityForEstado(estado: string): string {
        switch (estado) {
            case 'OK': return 'success';
            case 'NK': return 'danger';
            case 'N/A': return 'secondary';
            default: return 'info';
        }
    }

    // Formatea la fecha para mostrarla de forma amigable
    formatRelativeTime(fecha: string): string {
        const date = new Date(fecha);
        return this.datePipe.transform(date, 'medium') || '';
    }

    ngOnDestroy() {
        // Buena práctica: desuscribirse para evitar fugas de memoria
        this.subscriptions.unsubscribe();
    }
}
