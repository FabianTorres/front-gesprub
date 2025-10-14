//
//  src/app/pages/dashboard/avance-componente.ts
//
import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';

import { ProyectoService } from '../../services/proyecto.service';
import { ComponenteService } from '../../services/componente.service';
import { DashboardService, AvanceComponenteData } from '../../services/dashboard.service';
import { AmbitoService } from '../../services/ambito.service';
import { Ambito } from '../../models/ambito';
import { Componente } from '../../models/componente';

interface Hito {
    id: number;
    nombre: string;
}

@Component({
    standalone: true,
    imports: [ CommonModule, ChartModule, SelectModule, FormsModule, PaginatorModule],
    templateUrl: './avance-componente.html'
})
export class AvanceComponenteComponent implements OnInit {

    private proyectoService = inject(ProyectoService);
    private dashboardService = inject(DashboardService);
    private componenteService = inject(ComponenteService);
    private ambitoService = inject(AmbitoService);

    cargando = signal<boolean>(true);
    chartData: any;
    chartOptions: any;

    //Señal para paginacion y altura
    private fullData = signal<AvanceComponenteData[]>([]);
    // Configuración de la paginación
    readonly pageSize = 10; // Mínimo de 10 componentes por página
    currentPage = signal(1);
    totalRecords = computed(() => this.datosFiltrados().length);

    // Altura dinámica para el gráfico
    chartHeight = signal('60vh');
    private readonly heightPerBar = 50; // 50px de altura por cada barra

    // Filtros
    hitos = signal<Hito[]>([]);
    hitoSeleccionado = signal<number | null>(null);

    ambitos = signal<Ambito[]>([]);
    ambitoSeleccionadoId = signal<number | null>(null);
    private todosLosComponentes = signal<Componente[]>([]);

    private rawData = signal<AvanceComponenteData[]>([]);

    

    datosFiltrados = computed(() => {
        const data = this.rawData();
        const ambitoId = this.ambitoSeleccionadoId();
        const componentes = this.todosLosComponentes();

        // Si no hay ámbito seleccionado, devolvemos todos los datos.
        if (!ambitoId) {
            return data;
        }

        // 1. Obtenemos los IDs de los componentes que pertenecen al ámbito seleccionado.
        const idsComponentesDelAmbito = componentes
            .filter(c => c.id_ambito === ambitoId)
            .map(c => c.id_componente);

        // 2. Filtramos los datos del dashboard, manteniendo solo aquellos cuyo ID esté en nuestra lista.
        return data.filter(d => idsComponentesDelAmbito.includes(d.idComponente));
    });


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

        effect(() => {
            const data = this.fullData();
            const page = this.currentPage();

            const startIndex = (page - 1) * this.pageSize;
            const endIndex = startIndex + this.pageSize;
            
            const slicedData = data.slice(startIndex, endIndex);

            if (slicedData.length > 0) {
                // Actualizamos el gráfico solo con los datos de la página actual
                this.actualizarGrafico(slicedData);
            } else {
                this.chartData = null; // Limpia el gráfico si no hay datos
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
                this.fullData.set(data);
                this.currentPage.set(1);
                this.actualizarGrafico(data);
                this.cargando.set(false);
            },
            error: (err) => {
                console.error('Error al cargar datos de avance:', err);
                this.cargando.set(false);
                this.rawData.set([]);
                this.fullData.set([]);
            }
        });
    }

    actualizarGrafico(data: AvanceComponenteData[]) {
        const documentStyle = getComputedStyle(document.documentElement);


        // La altura se basa en el tamaño de página para ser constante, 
        // o en el número de barras si son menos que el tamaño de página.
        const barCount = Math.min(data.length, this.pageSize);
        const newHeight = barCount * this.heightPerBar;
        this.chartHeight.set(`${Math.max(newHeight, 400)}px`);

        // Preparamos los datos para el gráfico
        const labels = data.map(d => d.nombreComponente);
        
        const calcPercentage = (value: number, total: number) => (total > 0 ? (value / total) * 100 : 0);

        const dataOk = data.map(d => calcPercentage(d.casosOk, d.totalCasos));
        const dataNkLeve = data.map(d => calcPercentage(d.casosNk.leve, d.totalCasos));
        const dataNkMedio = data.map(d => calcPercentage(d.casosNk.medio, d.totalCasos));
        const dataNkGrave = data.map(d => calcPercentage(d.casosNk.grave, d.totalCasos));
        const dataNkCritico = data.map(d => calcPercentage(d.casosNk.critico, d.totalCasos));
        const dataSinEjecutar = data.map(d => calcPercentage(d.casosSinEjecutar, d.totalCasos));

        this.chartData = {
            labels: labels,
            datasets: [
                {
                    type: 'bar',
                    label: 'OK',
                    backgroundColor: documentStyle.getPropertyValue('--color-ok'),
                    data: dataOk
                },
                // Se apilan las criticidades. El orden importa para la visualización.
                {
                    type: 'bar',
                    label: 'Leve',
                    backgroundColor: documentStyle.getPropertyValue('--color-criticidad-leve'),
                    data: dataNkLeve
                },
                {
                    type: 'bar',
                    label: 'Medio',
                    backgroundColor: documentStyle.getPropertyValue('--color-criticidad-medio'),
                    data: dataNkMedio
                },
                {
                    type: 'bar',
                    label: 'Grave',
                    backgroundColor: documentStyle.getPropertyValue('--color-criticidad-grave'),
                    data: dataNkGrave
                },
                {
                    type: 'bar',
                    label: 'Crítico',
                    backgroundColor: documentStyle.getPropertyValue('--color-criticidad-critico'),
                    data: dataNkCritico
                },
                {
                    type: 'bar',
                    label: 'Sin Ejecutar',
                    backgroundColor: documentStyle.getPropertyValue('--color-sin-ejecutar'),
                    data: dataSinEjecutar
                }
            ]

            
        };
    }

    onPageChange(event: PaginatorState) {
        if (event.page || event.page === 0) {
            this.currentPage.set(event.page + 1);
        }
    }

    initChartOptions() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

        const criticidadLabels = ['Leve', 'Medio', 'Grave', 'Crítico'];

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
                        // 1. ANTES DEL CUERPO: Muestra el "Total NK" como un subtítulo.
                        beforeBody: (tooltipItems: any[]) => {
                            const dataIndex = tooltipItems[0].dataIndex;
                            const componentData = this.datosFiltrados()[dataIndex];
                            if (!componentData || componentData.casosNk.total === 0) {
                                return '';
                            }
                            const totalNk = componentData.casosNk.total;
                            const totalCasos = componentData.totalCasos;
                            const percentageNk = totalCasos > 0 ? (totalNk / totalCasos) * 100 : 0;
                            return `NK: ${totalNk} (${percentageNk.toFixed(2)}%)`;
                        },

                        // 2. CUERPO: Muestra SOLO el desglose de criticidades.
                        label: (context: any) => {
                            const label = context.dataset.label || '';
                            // Si la etiqueta no es una criticidad, no devolvemos NADA.
                            if (!criticidadLabels.includes(label)) {
                                return null;
                            }

                            const componentData = this.datosFiltrados()[context.dataIndex];
                            if (!componentData) return '';
                            const percentage = context.parsed.x;
                            
                            let count = 0;
                            if (label === 'Leve') count = componentData.casosNk.leve;
                            else if (label === 'Medio') count = componentData.casosNk.medio;
                            else if (label === 'Grave') count = componentData.casosNk.grave;
                            else if (label === 'Crítico') count = componentData.casosNk.critico;

                            // Si el conteo es cero, tampoco lo mostramos.
                            if (count === 0) return null;

                            // Usamos espacios para indentar y que se vea como un sub-item.
                            return `  ${label}: ${count} (${percentage.toFixed(2)}%)`;
                        },
                        
                        // 3. PIE DE PÁGINA: Muestra un resumen limpio de OK y Sin Ejecutar.
                        footer: (tooltipItems: any[]) => {
                            const dataIndex = tooltipItems[0].dataIndex;
                            const componentData = this.datosFiltrados()[dataIndex];
                            if (!componentData) return '';
                            
                            const totalCasos = componentData.totalCasos;
                            const footerLines = [];
                            const formatLine = (label: string, count: number) => {
                                const percentage = totalCasos > 0 ? (count / totalCasos) * 100 : 0;
                                return `${label}: ${count} (${percentage.toFixed(2)}%)`;
                            };

                            if (componentData.casosOk > 0) footerLines.push(formatLine('OK', componentData.casosOk));
                            if (componentData.casosSinEjecutar > 0) footerLines.push(formatLine('Sin Ejecutar', componentData.casosSinEjecutar));

                            // Añadimos un separador si hay desglose de NK para mayor claridad.
                            if (componentData.casosNk.total > 0 && footerLines.length > 0) {
                               // return '\n--------------------\n' + footerLines.join('\n');
                            }
                            
                            return footerLines.join('\n');
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