import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { Ciclo, CicloRequest } from '../models/ciclo';

@Injectable({ providedIn: 'root' })
export class CicloService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/ciclos`;

    // 1. Crear Nuevo Ciclo
    createCiclo(ciclo: CicloRequest): Observable<Ciclo> {
        return this.http.post<Ciclo>(this.apiUrl, ciclo);
    }

    // 2. Listar Ciclos Activos (Dashboard)
    getCiclos(idProyecto: number, estado: 'activos' | 'cerrados' | 'todos' = 'activos'): Observable<Ciclo[]> {
        // Enviamos ambos parámetros
        const params = new HttpParams()
            .set('idProyecto', idProyecto.toString())
            .set('estado', estado);

        return this.http.get<Ciclo[]>(this.apiUrl, { params });
    }

    // 3. Asignar Alcance (Lo usaremos en el siguiente paso)
    asignarAlcance(idCiclo: number, idsCasos: number[]): Observable<number[]> {
        return this.http.post<number[]>(`${this.apiUrl}/${idCiclo}/asignar`, { idsCasos });
    }

    // 4. Cerrar Ciclo
    cerrarCiclo(idCiclo: number, idUsuarioCierre: number): Observable<Ciclo> {
        return this.http.post<Ciclo>(`${this.apiUrl}/${idCiclo}/cerrar`, { idUsuarioCierre });
    }

    // 5. Obtener IDs del alcance (Lo usaremos después para precargar selecciones)
    getAlcance(idCiclo: number): Observable<number[]> {
        return this.http.get<number[]>(`${this.apiUrl}/${idCiclo}/alcance`);
    }

    // 6. Actualizar Ciclo
    updateCiclo(idCiclo: number, ciclo: CicloRequest): Observable<Ciclo> {
        return this.http.put<Ciclo>(`${this.apiUrl}/${idCiclo}`, ciclo);
    }

    // 7. Obtener ciclos activos donde participa un caso (Para el selector de contexto)
    getCiclosActivosPorCaso(idCaso: number): Observable<Ciclo[]> {
        return this.http.get<Ciclo[]>(`${this.apiUrl}/activos/por-caso/${idCaso}`);
    }

    // 8. Obtener un ciclo por su ID (Para mostrar el nombre en la ejecución)
    getCicloById(id: number): Observable<Ciclo> {
        return this.http.get<Ciclo>(`${this.apiUrl}/${id}`);
    }

    getReporteDetallado(idCiclo: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${idCiclo}/reporte`);
    }
}