// src/app/services/estado-evidencia.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { EstadoEvidencia } from '../models/estado-evidencia';

@Injectable({
  providedIn: 'root'
})
export class EstadoEvidenciaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/estado-evidencia`;

  getEstados(): Observable<EstadoEvidencia[]> {
    return this.http.get<EstadoEvidencia[]>(this.apiUrl);
  }

  createEstado(estado: Partial<EstadoEvidencia>): Observable<EstadoEvidencia> {
    return this.http.post<EstadoEvidencia>(this.apiUrl, estado);
  }

  updateEstado(id: number, estado: Partial<EstadoEvidencia>): Observable<EstadoEvidencia> {
    return this.http.put<EstadoEvidencia>(`${this.apiUrl}/${id}`, estado);
  }
}