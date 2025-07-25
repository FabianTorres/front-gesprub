// src/app/services/caso.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { Caso } from '../models/caso';
import { CasoConEvidencia } from '../models/casoevidencia';
import { Evidencia } from '../models/evidencia';

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

    getEvidenciasByCasoId(id: number): Observable<Evidencia[]> {
        return this.http.get<Evidencia[]>(`${this.apiUrl}/${id}/evidencias`);
    }

    createCaso(caso: Caso): Observable<Caso> {
        return this.http.post<Caso>(this.apiUrl, caso);
    }

    updateCaso(id: number, caso: Caso): Observable<Caso> {
        return this.http.put<Caso>(`${this.apiUrl}/${id}`, caso);
    }

    getCasosPorComponente(idComponente: number): Observable<CasoConEvidencia[]> {
        // Asumimos que tu endpoint puede recibir un parámetro así: /api/caso/evidencia?componenteId=1
        return this.http.get<CasoConEvidencia[]>(`${this.apiUrl}/evidenciacomp`, { params: { componenteId: idComponente } });
    }
}