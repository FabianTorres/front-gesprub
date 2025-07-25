// src/app/models/evidencia.ts

export interface Evidencia {
  id_evidencia?: number;
  descripcion_evidencia: string;
  estado_evidencia: 'OK' | 'NK';
  criticidad?: 'Leve' | 'Medio' | 'Grave' | 'Crítico' | null; // La nueva columna opcional
  fecha_evidencia?: string;
  url_evidencia?: string;
  id_jira?: number | null;
  id_usuario_ejecutante: number;
  id_caso: number;
}