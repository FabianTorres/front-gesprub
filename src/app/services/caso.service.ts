// src/app/services/caso.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { Caso } from '../models/caso';
import { CasoConEvidencia } from '../models/casoevidencia';
import { HistorialCaso } from '../models/historial-caso';
import { Fuente } from '../models/fuente';
import { KanbanData } from '../models/kanban-data';

@Injectable({ providedIn: 'root' })
export class CasoService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/caso`; 

    getCasos(): Observable<CasoConEvidencia[]> {
        return this.http.get<CasoConEvidencia[]>(`${this.apiUrl}/evidencia`);
    }

    getCasoById(id: number): Observable<Caso> {
        return this.http.get<Caso>(`${this.apiUrl}/${id}`);
    }

    //Nuevo metodo que obtiene las evidencias de un solo caso
    getHistorialPorCasoId(id: number): Observable<HistorialCaso> {
        return this.http.get<HistorialCaso>(`${this.apiUrl}/${id}/historial`);
    }

    createCaso(caso: Caso): Observable<Caso> {
        return this.http.post<Caso>(this.apiUrl, caso);
    }

    updateCaso(id: number, caso: Caso): Observable<Caso> {
        return this.http.put<Caso>(`${this.apiUrl}/${id}`, caso);
    }

    updateCasoVersion(id: number, nuevaVersion: string): Observable<any> {
        const body = { version: nuevaVersion };
        return this.http.patch(`${this.apiUrl}/${id}/version`, body);
    }

    getCasosPorComponente(id_componente: number): Observable<CasoConEvidencia[]> {
        
        return this.http.get<CasoConEvidencia[]>(`${this.apiUrl}/evidenciacomp`, { params: { componenteId: id_componente } });
    }

    getFormularios(): Observable<number[]> {
        return this.http.get<number[]>(`${this.apiUrl}/formularios`);
    }


    updateFuentesDeCaso(idCaso: number, fuentes: Fuente[]): Observable<any> {
        const url = `${this.apiUrl}/${idCaso}/fuentes`;
        

        // Transformamos el array de objetos Fuente en un array de solo los IDs.
        const idsFuente = fuentes.map(fuente => fuente.id_fuente);
        
        // Enviamos el array de IDs en el cuerpo de la petición PUT.
        return this.http.put(url, idsFuente);
    }

    importarCasos(casos: any[], idComponente: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/importar?id_componente=${idComponente}`, casos);
    }

    getCasosParaMuro(componenteId: number): Observable<{ backlog: Caso[], misTareas: Caso[] }> {
        return this.http.get<{ backlog: Caso[], misTareas: Caso[] }>(`${this.apiUrl}/muro`, {
            params: { componenteId: componenteId.toString() }
        });
    }

    asignarCaso(idCaso: number, idUsuario: number): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${idCaso}/asignar`, { usuarioId: idUsuario });
    }

    desasignarCaso(idCaso: number): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${idCaso}/desasignar`, {});
    }

    getCasosKanban(proyectoId: number, usuarioId?: number): Observable<KanbanData> {
        let params = new HttpParams().set('proyectoId', proyectoId.toString());
        if (usuarioId) {
            params = params.set('usuarioId', usuarioId.toString());
        }

        const url = `${this.apiUrl}/kanban/proyecto`; 

        return this.http.get<KanbanData>(url, { params });
    }
}