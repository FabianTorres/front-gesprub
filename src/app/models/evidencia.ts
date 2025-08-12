// src/app/models/evidencia.ts

import { ArchivoEvidencia } from "./archivo-evidencia";
import { Usuario } from "./usuario";

export interface Evidencia {
  id_evidencia?: number;
  descripcion_evidencia: string;
  //estado_evidencia: 'OK' | 'NK' | 'N/A';
  id_estado_evidencia: number;
  version_ejecucion: string;
  //criticidad?: 'Leve' | 'Medio' | 'Grave' | 'Crítico' | null;
  id_criticidad?: number | null;
  fecha_evidencia?: string;
  id_jira?: number | null;
  id_usuario_ejecutante: number;
  usuarioEjecutante?: Usuario;
  id_caso: number;
  archivos?: ArchivoEvidencia[];
  rut?: string;
}