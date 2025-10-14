export interface ProductividadData {
    cargaPorUsuario: CargaPorUsuario[];
    ejecucionesPorPeriodo: EjecucionesPorPeriodo[];
}

export interface CargaPorUsuario {
    idUsuario: number;
    nombreUsuario: string;
    casosAsignados: {
        ok: number;
        nk: number;
        sinEjecutar: number;
        total: number;
    };
    ultimaActividad: string | null;
}

export interface EjecucionesPorPeriodo {
    idUsuario: number;
    nombreUsuario: string;
    totalEjecuciones: number;
}