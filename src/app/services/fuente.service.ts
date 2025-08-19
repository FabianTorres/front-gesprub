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
}