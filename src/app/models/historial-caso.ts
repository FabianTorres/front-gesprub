import { Caso } from './caso';
import { Evidencia } from './evidencia';

export interface HistorialCaso {
  id_caso: number;
  nombre_caso: string;
  descripcion_caso: string;
  id_estado_modificacion: number;
  num_formulario: number;
  // Se pueden añadir otros campos del caso si los necesitas en esta vista
  historial: Evidencia[];
}