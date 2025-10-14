import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { DashboardData } from '../models/dashboard-data';
import { ProductividadData } from '../models/productividad-data';


export interface AvanceComponenteData {
    idComponente: number;
    nombreComponente: string;
    totalCasos: number;
    casosOk: number;
    casosNk: CasosNkDesglose;
    casosSinEjecutar: number;
}

export interface CasosNkDesglose {
    total: number;
    leve: number;
    medio: number;
    grave: number;
    critico: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/dashboard`;

  

    /**
     * Obtiene los datos consolidados para el dashboard.
     * @param proyectoId El ID del proyecto a consultar.
     * @param componenteId (Opcional) El ID del componente específico a filtrar.
     */
    getDashboardGeneral(proyectoId: number, componenteId?: number | null): Observable<DashboardData> {
        // Construye los parámetros dinámicamente
        let params: { [param: string]: string } = { 
            proyectoId: proyectoId.toString() 
        };

        if (componenteId) {
            params['componenteId'] = componenteId.toString();
        }

        // Llama al endpoint del backend con los parámetros correctos
        return this.http.get<DashboardData>(`${this.apiUrl}/general`, { params });
    }

    /**
     * Obtiene los datos de avance agrupados por componente.
     * @param proyectoId El ID del proyecto a consultar.
     * @param hito (Opcional) El número del hito para filtrar.
     */
    getAvancePorComponente(proyectoId: number, hito?: number | null): Observable<AvanceComponenteData[]> {
        let params: { [param: string]: string } = { 
            proyectoId: proyectoId.toString() 
        };

        if (hito) {
            params['hito'] = hito.toString();
        }

        return this.http.get<AvanceComponenteData[]>(`${this.apiUrl}/avance-por-componente`, { params });
    }

    getProductividad(proyectoId: number, periodo: string): Observable<ProductividadData> {
        let params = new HttpParams()
            .set('proyectoId', proyectoId.toString())
            .set('periodo', periodo);
        
        return this.http.get<ProductividadData>(`${this.apiUrl}/productividad`, { params });
    }

}