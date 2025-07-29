import { Proyecto } from "./proyecto";

export interface Componente {
    id_componente?: number;
    nombre_componente: string;
    hito_componente: number;
    fecha_limite: string;
    activo: number;
    id_proyecto?: number; // Mantenemos el ID por si acaso
    proyecto?: Proyecto;    // Se añade el objeto Proyecto
}