export interface Caso {
  id_caso?: number;
  nombre_caso: string;
  descripcion_caso: string;
  activo: number; // 1 para activo, 0 para inactivo
  num_formulario: number;
  id_componente: number;
  id_usuario_creador: number;
  id_estado_modificacion: number;
  precondiciones: string;
  pasos: string;
  resultado_esperado: string;
  jp_responsable: number;
  version?: string;
  anio?: number;
}