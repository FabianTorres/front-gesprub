import { Fuente } from "./fuente";
import { Usuario } from "./usuario";

export interface Caso {
  id_caso?: number;
  nombre_caso: string;
  descripcion_caso: string;
  activo: number; // 1 para activo, 0 para inactivo
  id_componente: number;
  nombre_componente?: string;
  id_usuario_creador: number;
  id_estado_modificacion: number;
  precondiciones: string;
  pasos: string;
  resultado_esperado: string;
  jp_responsable: number;
  version?: string;
  anio?: number;
  fuentes?: Fuente[];
  id_usuario_asignado?: number;
  idUsuarioAsignado?: number; //Se agrega en caso de inconsistencia
  estado_kanban?: string;
  fechaMovimientoKanban?: string; // o Date
  usuarioEjecutante?: Usuario;
  idCriticidad?: number;
  fechaUltimaEvidencia?: string;
  ciclosActivos?: {
    idCiclo: number;
    jiraKey: string;
    nombre: string;
  }[];
}