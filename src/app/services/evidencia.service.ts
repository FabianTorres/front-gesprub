// src/app/services/evidencia.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { Evidencia } from '../models/evidencia';

@Injectable({ providedIn: 'root' })
export class EvidenciaService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/evidencia`; // Asumiendo que el endpoint es /api/evidencias

    // Por ahora, solo necesitamos un método para crear la evidencia
    createEvidencia(evidencia: Evidencia): Observable<Evidencia> {
        return this.http.post<Evidencia>(this.apiUrl, evidencia);
    }

    // Más adelante podríamos añadir métodos para ver o editar evidencias
}