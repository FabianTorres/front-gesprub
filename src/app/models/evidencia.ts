// src/app/models/evidencia.ts

import { Usuario } from "./usuario";

export interface Evidencia {
  id_evidencia?: number;
  descripcion_evidencia: string;
  estado_evidencia: 'OK' | 'NK';
  criticidad?: 'Leve' | 'Medio' | 'Grave' | 'Crítico' | null;
  fecha_evidencia?: string;
  url_evidencia?: string;
  id_jira?: number | null;
  id_usuario_ejecutante: number;
  usuarioEjecutante?: Usuario;
  id_caso: number;
}