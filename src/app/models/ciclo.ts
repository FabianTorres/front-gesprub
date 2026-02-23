export interface Ciclo {
    idCiclo: number;
    jiraKey: string;
    nombre: string;
    descripcion?: string;
    fechaLiberacion?: string; // Viene como string (ISO) del backend
    fechaCreacion: string;
    nombreUsuarioCreador: string;
    activo: number; // 1 = Activo, 0 = Cerrado

    // KPIs (Contadores para el dashboard)
    totalCasosAsignados: number;
    casosCertificados: number;
    casosError: number;
    casosSinEjecutar: number;
    casosNA: number;
    idProyecto: number;
    componentesInvolucrados?: string[];
}

export interface CicloRequest {
    jiraKey: string;
    nombre: string;
    descripcion?: string;
    fechaLiberacion?: string | Date; // Puede ser Date en el formulario, string para el backend
    idUsuarioCreador: number;
    idProyecto: number;
}