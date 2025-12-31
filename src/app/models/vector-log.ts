export interface VectorLog {
    logId: number;
    tipoAccion: 'CREACION' | 'MODIFICACION' | 'ELIMINACION';
    logFecha: string; // O Date
    logUsuario: string;

    // Snapshot de los datos
    rut: number;
    dv: string;
    periodo: number;
    vector: number;
    valor: number;
    elvcSeq: string;
}