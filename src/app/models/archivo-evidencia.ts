export interface ArchivoEvidencia {
  id_archivo: number;
  nombre_archivo: string;
  url_archivo: string;
  id_evidencia?: number; // Opcional, por si el backend lo incluye
}