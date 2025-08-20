// src/app/services/fuente.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { Fuente } from '../models/fuente'; // Asumiendo que ya creaste este modelo

@Injectable({
  providedIn: 'root'
})
export class FuenteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/fuentes`; // Endpoint para obtener el listado

  /**
   * Obtiene una lista de todas las fuentes de información disponibles.
   */
  getFuentes(): Observable<Fuente[]> {
    return this.http.get<Fuente[]>(this.apiUrl);
  }

  // POST: Crea una nueva fuente
  createFuente(fuente: Partial<Fuente>): Observable<Fuente> {
    return this.http.post<Fuente>(this.apiUrl, fuente);
  }

  // PUT: Actualiza una fuente existente
  updateFuente(id: number, fuente: Partial<Fuente>): Observable<Fuente> {
    return this.http.put<Fuente>(`${this.apiUrl}/${id}`, fuente);
  }
  
  // PATCH: Para activar/desactivar (asumiendo este endpoint)
  updateActivo(id: number, activo: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/activo`, { activo });
  }
}