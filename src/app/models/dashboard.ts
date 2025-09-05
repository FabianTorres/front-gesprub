export interface DashboardData {
    // Tarjetas de resumen (KPIs)
    kpis: KpiData;

    // Datos para los gráficos
    estadoEjecuciones: ChartData;
    actividadSemanal: ChartData;
    casosPorEstado: ChartData;
}

export interface KpiData {
    totalCasos: number;
    totalEjecuciones: number;
    casosSinEjecutar: number;
    promedioEjecucionesDiarias: number;
}

export interface ChartData {
    labels: string[];
    datasets: ChartDataset[];
}

export interface ChartDataset {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
}