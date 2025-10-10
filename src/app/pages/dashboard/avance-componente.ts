//
//  src/app/pages/dashboard/avance-componente.ts
//
import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';

import { ProyectoService } from '../../services/proyecto.service';
import { ComponenteService } from '../../services/componente.service';
import { DashboardService, AvanceComponenteData } from '../../services/dashboard.service';

interface Hito {
    id: number;
    nombre: string;
}

@Component({
    standalone: true,
    imports: [ CommonModule, ChartModule, SelectModule, FormsModule ],
    templateUrl: './avance-componente.html'
})
export class AvanceComponenteComponent implements OnInit {

    private proyectoService = inject(ProyectoService);
    private dashboardService = inject(DashboardService);
    private componenteService = inject(ComponenteService);

    cargando = signal<boolean>(true);
    chartData: any;
    chartOptions: any;

    // Filtros
    hitos = signal<Hito[]>([]);
    hitoSeleccionado = signal<number | null>(null);

    private rawData = signal<AvanceComponenteData[]>([]);

    constructor() {
        // Effect que recarga todo cuando cambia el proyecto o el filtro de hito
        effect(() => {
            const proyecto = this.proyectoService.proyectoSeleccionado();
            if (proyecto) {
                // Obtenemos los hitos solo cuando el proyecto cambia por primera vez
                if (this.hitos().length === 0) {
                    this.cargarHitos(proyecto.id_proyecto);
                }
                
                const hitoId = this.hitoSeleccionado();
                this.cargarDatos(proyecto.id_proyecto, hitoId);
            } else {
                // Limpiar si no hay proyecto
                this.chartData = null;
                this.hitos.set([]);
                this.hitoSeleccionado.set(null);
                this.rawData.set([]);
            }
        });
    }

    ngOnInit() {
        this.initChartOptions();
    }

    cargarHitos(proyectoId: number) {
        this.componenteService.getComponentesPorProyecto(proyectoId).subscribe(componentes => {
            const hitosUnicos = [...new Map(componentes.map(c => [c.hito_componente, c.hito_componente])).values()];
            this.hitos.set(hitosUnicos.sort((a,b) => a - b).map(h => ({ id: h, nombre: `Hito ${h}` })));
        });
    }

    cargarDatos(proyectoId: number, hitoId: number | null) {
        this.cargando.set(true);
        this.dashboardService.getAvancePorComponente(proyectoId, hitoId).subscribe({
            next: (data) => {
                this.rawData.set(data); 
                this.actualizarGrafico(data);
                this.cargando.set(false);
            },
            error: (err) => {
                console.error('Error al cargar datos de avance:', err);
                this.cargando.set(false);
                this.rawData.set([]);
            }
        });
    }

    actualizarGrafico(data: AvanceComponenteData[]) {
        const documentStyle = getComputedStyle(document.documentElement);

        // Preparamos los datos para el gráfico
        const labels = data.map(d => d.nombreComponente);
        const dataOk = data.map(d => (d.casosOk / d.totalCasos) * 100);
        const dataNk = data.map(d => (d.casosNk / d.totalCasos) * 100);
        const dataSinEjecutar = data.map(d => (d.casosSinEjecutar / d.totalCasos) * 100);

        this.chartData = {
            labels: labels,
            datasets: [
                {
                    type: 'bar',
                    label: 'OK',
                    backgroundColor: documentStyle.getPropertyValue('--color-ok'),
                    data: dataOk
                },
                {
                    type: 'bar',
                    label: 'NK',
                    backgroundColor: documentStyle.getPropertyValue('--color-fallo'),
                    data: dataNk
                },
                {
                    type: 'bar',
                    label: 'Sin Ejecutar',
                    backgroundColor: documentStyle.getPropertyValue('--color-na'),
                    data: dataSinEjecutar
                }
            ]
        };
    }

    initChartOptions() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

        this.chartOptions = {
            indexAxis: 'y', 
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    axis: 'y',
                    callbacks: {
                        label: (context: any) => {
                            // Gracias a la arrow function, 'this' se refiere a nuestro componente
                            const componentData = this.rawData()[context.dataIndex];
                            if (!componentData) {
                                return '';
                            }

                            const label = context.dataset.label || '';
                            const percentage = context.parsed.x;
                            
                            let count = 0;
                            if (label === 'OK') {
                                count = componentData.casosOk;
                            } else if (label === 'NK') {
                                count = componentData.casosNk;
                            } else if (label === 'Sin Ejecutar') {
                                count = componentData.casosSinEjecutar;
                            }

                            // Formateamos el texto para que incluya la cantidad y el porcentaje
                            return `${label}: ${count} (${percentage.toFixed(2)}%)`;
                        }
                    }
                },
                legend: {
                    labels: { color: textColor }
                }
            },
            scales: {
                x: {
                    stacked: true, // <-- Barras apiladas
                    ticks: {
                        color: textColorSecondary,
                        callback: (value: any) => value + '%' // Añadir % al eje X
                    },
                    grid: { color: surfaceBorder }
                },
                y: {
                    stacked: true,
                    ticks: { color: textColorSecondary },
                    grid: { color: surfaceBorder }
                }
            }
        };
    }
}