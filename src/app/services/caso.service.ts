// src/app/services/caso.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { Caso } from '../models/caso';
import { CasoConEvidencia } from '../models/casoevidencia';
import { Evidencia } from '../models/evidencia';
import { HistorialCaso } from '../models/historial-caso';
import { Fuente } from '../models/fuente';

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
        
        // ===== CAMBIO CLAVE =====
        // Transformamos el array de objetos Fuente en un array de solo los IDs.
        const idsFuente = fuentes.map(fuente => fuente.id_fuente);
        
        // Enviamos el array de IDs en el cuerpo de la petición PUT.
        return this.http.put(url, idsFuente);
    }
}