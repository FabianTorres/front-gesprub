import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { DashboardData } from '../models/dashboard';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/dashboard`;

  /**
   * Obtiene los datos del dashboard para un proyecto específico.
   * @param proyectoId El ID del proyecto a consultar.
   * @param usuarioId (Opcional) El ID del usuario para obtener una vista personal. 
   * Si no se provee, se asume la vista general.
   */
  getDashboardData(proyectoId: number, usuarioId?: number): Observable<DashboardData> {
    let params = new HttpParams().set('proyectoId', proyectoId.toString());

    if (usuarioId) {
      params = params.append('usuarioId', usuarioId.toString());
    }

    return this.http.get<DashboardData>(this.apiUrl, { params });
  }
}