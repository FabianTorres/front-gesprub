// src/app/services/criticidad.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { Criticidad } from '../models/criticidad'; // Asegúrate que el modelo Criticidad exista

@Injectable({
  providedIn: 'root'
})
export class CriticidadService {
  private http = inject(HttpClient);
  // El endpoint base para las operaciones de criticidad
  private apiUrl = `${environment.apiUrl}/criticidad`;

  /** Obtiene todas las criticidades */
  getCriticidades(): Observable<Criticidad[]> {
    return this.http.get<Criticidad[]>(this.apiUrl);
  }

  /** Crea una nueva criticidad */
  createCriticidad(criticidad: Partial<Criticidad>): Observable<Criticidad> {
    return this.http.post<Criticidad>(this.apiUrl, criticidad);
  }

  /** Actualiza una criticidad existente */
  updateCriticidad(id: number, criticidad: Partial<Criticidad>): Observable<Criticidad> {
    return this.http.put<Criticidad>(`${this.apiUrl}/${id}`, criticidad);
  }
}