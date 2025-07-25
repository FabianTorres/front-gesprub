// src/app/services/componente.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}