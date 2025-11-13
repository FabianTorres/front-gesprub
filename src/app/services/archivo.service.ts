import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

// Interfaz para la respuesta que esperamos del backend
export interface SecureUrlResponse {
  url: string;
}

@Injectable({ providedIn: 'root' })
export class ArchivoService {
    private http = inject(HttpClient);
    // La URL base para el nuevo controlador de archivos
    private apiUrl = `${environment.apiUrl}/archivos`; 

    /**
     * Solicita al backend una URL segura y temporal para descargar un archivo.
     * @param idArchivo El ID del archivo a descargar.
     * @returns Un Observable que emite un objeto con la URL segura.
     */
    getSecureDownloadUrl(idArchivo: number): Observable<SecureUrlResponse> {
        return this.http.get<SecureUrlResponse>(`${this.apiUrl}/${idArchivo}/descargar`);
    }

    // --- AÑADIR ESTE NUEVO MÉTODO ---
    /**
     * Descarga el archivo como un stream (blob) desde el backend.
     * Este método SÍ envía el token de autenticación gracias al AuthInterceptor.
     * @param idArchivo El ID del archivo a descargar.
     * @returns Un Observable que emite el Blob del archivo.
     */
    descargarArchivoStream(idArchivo: number): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/stream/${idArchivo}`, {
            responseType: 'blob' // ¡Esto es crucial! Le dice a HttpClient que espere un archivo.
        });
    }
}