//
// src/app/pages/dashboard/productividad.ts
//
import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { SelectButtonModule } from 'primeng/selectbutton';

import { DashboardService } from '../../services/dashboard.service';
import { ProyectoService } from '../../services/proyecto.service';
import { ProductividadData } from '../../models/productividad-data';

@Component({
    standalone: true,
    imports: [ CommonModule, FormsModule, ChartModule, TableModule, SelectButtonModule ],
    providers: [ DatePipe ],
    templateUrl: './productividad.html'
})
export class ProductividadComponent implements OnInit {

    private dashboardService = inject(DashboardService);
    private proyectoService = inject(ProyectoService);
    private datePipe = inject(DatePipe);

    cargando = signal<boolean>(true);
    productividadData = signal<ProductividadData | null>(null);

    // Gráficos
    cargaChartData: any;
    cargaChartOptions: any;
    productividadChartData: any;
    productividadChartOptions: any;

    // Filtro de Período
    opcionesPeriodo = [
        { label: 'Últimos 7 días', value: '7d' },
        { label: 'Últimos 30 días', value: '30d' },
        { label: 'Este Mes', value: 'mesActual' }
    ];
    periodoSeleccionado = signal('7d');

    constructor() {
        // Effect que recarga el dashboard cuando cambia el proyecto o el período
        effect(() => {
            const proyecto = this.proyectoService.proyectoSeleccionado();
            const periodo = this.periodoSeleccionado();

            if (proyecto) {
                this.cargarDatos(proyecto.id_proyecto, periodo);
            } else {
                this.productividadData.set(null);
            }
        });
    }

    ngOnInit() {
        this.initChartsOptions();
    }

    cargarDatos(proyectoId: number, periodo: string) {
        this.cargando.set(true);
        this.dashboardService.getProductividad(proyectoId, periodo).subscribe({
            next: (data) => {
                this.productividadData.set(data);
                this.actualizarGraficos();
                this.cargando.set(false);
            },
            error: (err) => {
                console.error('Error al cargar datos de productividad:', err);
                this.cargando.set(false);
                this.productividadData.set(null);
            }
        });
    }

    actualizarGraficos() {
        const data = this.productividadData();
        if (!data) return;
        
        this.initCargaChart(data);
        this.initProductividadChart(data);
    }

    initCargaChart(data: ProductividadData) {
        const documentStyle = getComputedStyle(document.documentElement);
        const cargaData = data.cargaPorUsuario;

        this.cargaChartData = {
            labels: cargaData.map(u => u.nombreUsuario),
            datasets: [
                {
                    label: 'Sin Ejecutar',
                    backgroundColor: documentStyle.getPropertyValue('--color-sin-ejecutar'),
                    data: cargaData.map(u => u.casosAsignados.sinEjecutar)
                },
                {
                    label: 'OK',
                    backgroundColor: documentStyle.getPropertyValue('--color-ok'),
                    data: cargaData.map(u => u.casosAsignados.ok)
                },
                {
                    label: 'NK',
                    backgroundColor: documentStyle.getPropertyValue('--color-fallo'),
                    data: cargaData.map(u => u.casosAsignados.nk)
                }
            ]
        };
    }

    initProductividadChart(data: ProductividadData) {
        const documentStyle = getComputedStyle(document.documentElement);
        const productividadData = data.ejecucionesPorPeriodo;

        this.productividadChartData = {
            labels: productividadData.map(u => u.nombreUsuario),
            datasets: [
                {
                    label: 'Total de Ejecuciones',
                    backgroundColor: documentStyle.getPropertyValue('--primary-500'),
                    borderColor: documentStyle.getPropertyValue('--primary-500'),
                    data: productividadData.map(u => u.totalEjecuciones)
                }
            ]
        };
    }

    initChartsOptions() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

        // Opciones para el gráfico de Carga de Trabajo
        this.cargaChartOptions = {
            indexAxis: 'y', // Barras horizontales
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                tooltip: { mode: 'index', intersect: false , axis: 'y'},
                legend: { labels: { color: textColor } }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: { color: textColorSecondary },
                    grid: { color: surfaceBorder }
                },
                y: {
                    stacked: true,
                    ticks: { color: textColorSecondary },
                    grid: { color: surfaceBorder }
                }
            }
        };

        // Opciones para el gráfico de Productividad
        this.productividadChartOptions = {
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                legend: { display: false } // Ocultamos la leyenda, es redundante
            },
            scales: {
                x: {
                    ticks: { color: textColorSecondary },
                    grid: { color: surfaceBorder }
                },
                y: {
                    ticks: { color: textColorSecondary },
                    grid: { color: surfaceBorder }
                }
            }
        };
    }
}