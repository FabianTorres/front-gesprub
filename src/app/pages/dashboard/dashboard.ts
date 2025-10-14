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
        //this.initChartOptions();
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
                console.log('Datos para los KPIs (Avance General):', data.kpis);
                console.log('Datos para el Gráfico (Distribución de Estados):', data.distribucionEstados);
                this.dashboardData.set(data);
                this.actualizarGrafico(data);
                this.cargando.set(false);
                this.initChartOptions();
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

        // Los datos para el gráfico principal no cambian
        const kpis = this.dashboardData()?.kpis;
        const data = this.dashboardData()?.distribucionEstados;
        
        if (!data) return;

        if (!kpis || !data) {
            this.chartData = null;
            return;
        }

        const casosConEstado = data.ok + (data.nk ? data.nk.total : 0) + data.na;

        // 2. Restamos esa suma del total de casos para obtener los pendientes.
        //    Usamos Math.max(0, ...) para evitar números negativos si hay alguna inconsistencia.
        const sinEjecutarCalculado = Math.max(0, kpis.totalCasos - casosConEstado);


        const nkValue = data.nk ? data.nk.total : 0;
        const dataArray = [data.ok, nkValue, data.na, sinEjecutarCalculado];

        console.log('Valores finales para el gráfico:', dataArray);

        this.chartData = {
            labels: ['OK', 'NK', 'N/A', 'Sin Ejecutar'],
            datasets: [
                {
                   
                    data: dataArray,
                    backgroundColor: [
                        documentStyle.getPropertyValue('--color-ok'),
                        documentStyle.getPropertyValue('--color-fallo'),
                        documentStyle.getPropertyValue('--color-na'),
                        documentStyle.getPropertyValue('--color-sin-ejecutar')
                    ],
                    hoverBackgroundColor: [
                        documentStyle.getPropertyValue('--color-ok-hover'),
                        documentStyle.getPropertyValue('--color-fallo-hover'),
                        documentStyle.getPropertyValue('--color-na-hover'),
                        documentStyle.getPropertyValue('--color-sin-ejecutar-hover')
                    ]
                }
            ]
        };

        this.chartOptions = {
            plugins: {
                legend: {
                    labels: {
                        usePointStyle: true,
                        color: textColor
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context: any) => {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            
                            // Usamos un array para construir el tooltip línea por línea
                            let tooltipLines = [`${label}: ${value}`];

                            // Si estamos sobre la sección 'NK' y hay un desglose, lo añadimos
                            if (label === 'NK' && data.nk && data.nk.total > 0) {
                                const nkData = data.nk;
                                
                                // Función interna para añadir detalle solo si es mayor que cero
                                const addDetail = (criticidad: string, valor: number) => {
                                    if (valor > 0) {
                                        // Añade la línea con indentación
                                        tooltipLines.push(`  - ${criticidad}: ${valor}`);
                                    }
                                };
                                
                                addDetail('Leve', nkData.leve);
                                addDetail('Medio', nkData.medio);
                                addDetail('Grave', nkData.grave);
                                addDetail('Crítico', nkData.critico);
                            }

                            // Devolvemos el array de líneas. Chart.js lo unirá con saltos de línea.
                            return tooltipLines;
                        }
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
