import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { EstadoModificacion } from '../models/estado-modificacion';

@Injectable({ providedIn: 'root' })
export class EstadoModificacionService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/estado-modificacion`;

    getEstados(): Observable<EstadoModificacion[]> {
        return this.http.get<EstadoModificacion[]>(this.apiUrl);
    }

     createEstado(estado: Partial<EstadoModificacion>): Observable<EstadoModificacion> {
        return this.http.post<EstadoModificacion>(this.apiUrl, estado);
      }
    
      updateEstado(id: number, estado: Partial<EstadoModificacion>): Observable<EstadoModificacion> {
        return this.http.put<EstadoModificacion>(`${this.apiUrl}/${id}`, estado);
      }
}