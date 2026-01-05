export interface CatalogoVector {
    id: number;           // ID Técnico (PK)
    vectorId: number;     // El número del vector (Ej: 381)
    periodo: number;
    nombre: string;
    tipoTecnologia: 'BATCH' | 'BIGDATA_INTEGRADO';
    estado: boolean;      // TRUE = Activo, FALSE = Eliminado
    versionIngreso: string; // Ej: "1.0"
    versionRetiro?: string; // Ej: "1.2" (Opcional)
}