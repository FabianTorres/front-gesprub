// src/app/services/componente.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { Componente } from '../models/componente';


@Injectable({ providedIn: 'root' })
export class ComponenteService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/componente`;

    getComponentes(): Observable<Componente[]> {
        return this.http.get<Componente[]>(this.apiUrl);
    }

    createComponente(componente: Componente): Observable<Componente> {
        return this.http.post<Componente>(this.apiUrl, componente);
    }

    updateComponente(id: number, componente: Componente): Observable<Componente> {
        return this.http.put<Componente>(`${this.apiUrl}/${id}`, componente);
    }

    deleteComponente(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    getComponentesPorProyecto(proyectoId: number): Observable<Componente[]> {
        return this.http.get<Componente[]>(this.apiUrl, { params: { proyectoId } });
    }

    /**
     * Descarga un ZIP con todas las evidencias.
     * Soporta filtro por estado y límite de tamaño para particionado (Jira).
     * Endpoint: GET /api/componente/{id}/descargar-zip
     * * @param idComponente ID del componente
     * @param idEstadoModificacion (Opcional) ID del estado para filtrar
     * @param limiteMb (Opcional) Límite en Megabytes para dividir el archivo. Default 20MB.
     */
    descargarZipEvidencias(idComponente: number, idEstadoModificacion?: number | null, limiteMb: number = 20): Observable<Blob> {
        let params = new HttpParams();

        // 1. Filtro de Estado
        if (idEstadoModificacion) {
            params = params.set('idEstadoModificacion', idEstadoModificacion.toString());
        }

        // 2. Límite de Tamaño (Conversión MB -> Bytes)
        // El backend espera 'limiteBytes' (long)
        if (limiteMb) {
            const limiteBytes = limiteMb * 1024 * 1024;
            params = params.set('limiteBytes', limiteBytes.toString());
        }

        return this.http.get(`${this.apiUrl}/${idComponente}/descargar-zip`, {
            params: params,
            responseType: 'blob'
        });
    }
}