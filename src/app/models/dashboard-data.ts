// Define la estructura de la respuesta del endpoint del dashboard general

export interface DashboardData {
    kpis: Kpis;
    distribucionEstados: DistribucionEstados;
    actividadReciente: ActividadReciente[];
}

export interface Kpis {
    totalCasos: number;
    casosEjecutados: number;
    casosPendientes: number;
    porcentajeAvance: number;
}

export interface DistribucionEstados {
    ok: number;
    nk: NkDesglose;
    na: number;
    sinEjecutar: number;
}

export interface ActividadReciente {
    idCaso: number;
    nombreCaso: string;
    estado: 'OK' | 'NK' | 'N/A';
    nombreTester: string;
    fechaEjecucion: string; // Formato ISO 8601
}

export interface NkDesglose {
    total: number;
    leve: number;
    medio: number;
    grave: number;
    critico: number;
}