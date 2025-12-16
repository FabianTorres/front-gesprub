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
     * Descarga un ZIP con todas las evidencias del componente o por idEstadoModificacion
     * Endpoint: GET /api/componente/{id}/descargar-zip
     */
    descargarZipEvidencias(idComponente: number, idEstadoModificacion?: number | null) {
        let params = new HttpParams();

        // Si el usuario seleccionó un filtro específico, lo agregamos a la URL
        if (idEstadoModificacion) {
            params = params.set('idEstadoModificacion', idEstadoModificacion.toString());
        }

        return this.http.get(`${this.apiUrl}/${idComponente}/descargar-zip`, {
            params: params,
            responseType: 'blob'
        });
    }
}