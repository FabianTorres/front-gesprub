export interface VectorData {
    id?: number;
    rut: number;
    dv: string;
    periodo: number; // YYYYMM
    valor: number;
    vector: number;  // trrt_keyb
    elvc_seq: string;
    rut2?: number | null;
    dv2?: string | null;

    usuarioModificacion?: string;
    fechaModificacion?: string;

    tipo?: string;

    intencionCarga?: 'INSERT' | 'UPDATE';
    procesado?: boolean;
}