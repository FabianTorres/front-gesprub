// src/app/services/evidencia.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, retry, timer } from 'rxjs';
import { environment } from '../../environment/environment';
import { Evidencia } from '../models/evidencia';
import { ArchivoEvidencia } from '../models/archivo-evidencia';

@Injectable({ providedIn: 'root' })
export class EvidenciaService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/evidencia`; // Asumiendo que el endpoint es /api/evidencias

    // Por ahora, solo necesitamos un método para crear la evidencia
    createEvidencia(evidencia: Evidencia): Observable<Evidencia> {
        return this.http.post<Evidencia>(this.apiUrl, evidencia);
    }

    getEvidencias(): Observable<Evidencia[]> {
        return this.http.get<Evidencia[]>(this.apiUrl);
    }


    // /**
    //  * Sube un archivo de evidencia al backend usando multipart/form-data.
    //  * El backend se encarga de almacenarlo en Azure Blob Storage.
    //  * @param idEvidencia El ID de la evidencia a la que pertenece el archivo.
    //  * @param file El objeto File que se va a subir.
    //  * @returns Un Observable con los detalles del archivo guardado.
    //  */
    // uploadArchivo(idEvidencia: number, file: File): Observable<ArchivoEvidencia> {
    //     // 1. Se crea un objeto FormData, necesario para el formato multipart/form-data.
    //     const formData = new FormData();

    //     // 2. Se añade el archivo. La clave 'file' debe coincidir con la que espera el backend.
    //     formData.append('file', file, file.name);

    //     // 3. Se realiza la petición POST. HttpClient maneja las cabeceras automáticamente.
    //     const url = `${this.apiUrl}/${idEvidencia}/archivos`;
    //     return this.http.post<ArchivoEvidencia>(url, formData);
    // }



    /**
     * Sube un archivo de evidencia al backend usando multipart/form-data.
     * El backend se encarga de almacenarlo en Azure Blob Storage.
     */
    uploadArchivo(idEvidencia: number, file: File): Observable<ArchivoEvidencia> {
        const formData = new FormData();
        formData.append('file', file, file.name);

        const url = `${this.apiUrl}/${idEvidencia}/archivos`;

        // === LÓGICA DE REINTENTO AUTOMÁTICO (RETRY) ===
        return this.http.post<ArchivoEvidencia>(url, formData).pipe(
            retry({
                count: 2, // Intentará subirlo hasta 2 veces más si falla la primera vez
                delay: (error, retryCount) => {
                    console.warn(`Intento fallido de subida (${retryCount}/2). Reintentando...`, error);
                    // Espera 1 segundo en el primer reintento, 2 segundos en el segundo...
                    return timer(1000 * retryCount);
                }
            })
        );
    }

    getArchivosPorEvidencia(idEvidencia: number): Observable<ArchivoEvidencia[]> {
        return this.http.get<ArchivoEvidencia[]>(`${this.apiUrl}/${idEvidencia}/archivos`);
    }

    moverEvidencia(idEvidencia: number, nuevoIdCaso: number): Observable<any> {
        const url = `${this.apiUrl}/${idEvidencia}/mover`;
        const body = { nuevoIdCaso };
        return this.http.patch(url, body);
    }

    updateEstadoActivo(idEvidencia: number, activo: number): Observable<Evidencia> {

        return this.http.patch<Evidencia>(`${this.apiUrl}/${idEvidencia}/activo`, { activo });
    }
}