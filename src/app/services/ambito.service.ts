// src/app/services/ambito.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { Ambito } from '../models/ambito';

@Injectable({
  providedIn: 'root'
})
export class AmbitoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ambito`;

  /** Obtiene todos los ámbitos */
  getAmbitos(): Observable<Ambito[]> {
    return this.http.get<Ambito[]>(this.apiUrl);
  }

  /** Crea un nuevo ámbito */
  createAmbito(ambito: Partial<Ambito>): Observable<Ambito> {
    return this.http.post<Ambito>(this.apiUrl, ambito);
  }

  /** Actualiza un ámbito existente */
  updateAmbito(id: number, ambito: Partial<Ambito>): Observable<Ambito> {
    return this.http.put<Ambito>(`${this.apiUrl}/${id}`, ambito);
  }
}