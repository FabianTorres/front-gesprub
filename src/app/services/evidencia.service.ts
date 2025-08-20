// src/app/services/evidencia.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

    uploadArchivo(idEvidencia: number, archivoData: { nombre_archivo: string; url_archivo: string }): Observable<ArchivoEvidencia> {
        return this.http.post<ArchivoEvidencia>(`${this.apiUrl}/${idEvidencia}/archivos`, archivoData);
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