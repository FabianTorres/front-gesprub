import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // Importar HttpParams
import { environment } from '../../environment/environment';
import { VectorData } from '../models/vector-data';
import { Observable } from 'rxjs';
import { AutenticacionService } from './autenticacion.service';
import { VectorLog } from '../models/vector-log';
import { CatalogoVector } from '../models/catalogo-vector';

@Injectable({
    providedIn: 'root'
})
export class CargaVxService {

    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/vectores`;
    private authService = inject(AutenticacionService);

    constructor() { }

    private get usuarioActual(): string {
        return this.authService.usuarioActual()?.nombreUsuario || 'DESCONOCIDO';
    }

    getVectores(): Observable<VectorData[]> {
        return this.http.get<VectorData[]>(this.apiUrl);
    }


    verificarExistencia(rut: number, periodo: number, vector: number): Observable<boolean> {
        const params = new HttpParams()
            .set('rut', rut)
            .set('periodo', periodo)
            .set('vector', vector);

        return this.http.get<boolean>(`${this.apiUrl}/verificar-existencia`, { params });
    }


    createVector(vector: VectorData): Observable<VectorData> {
        const payload = { ...vector, usuarioResponsable: this.usuarioActual };
        return this.http.post<VectorData>(this.apiUrl, payload);
    }

    updateVector(id: number, vector: VectorData): Observable<VectorData> {
        const payload = { ...vector, usuarioResponsable: this.usuarioActual };
        return this.http.put<VectorData>(`${this.apiUrl}/${id}`, payload);
    }

    deleteVector(id: number): Observable<void> {
        const params = new HttpParams().set('usuarioResponsable', this.usuarioActual);
        return this.http.delete<void>(`${this.apiUrl}/${id}`, { params });
    }

    descargarSQL(): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/descargar-sql`, { responseType: 'blob' });
    }

    getLogs(): Observable<VectorLog[]> {
        return this.http.get<VectorLog[]>(`${this.apiUrl}/logs`);
    }

    getCatalogoVectores(): Observable<CatalogoVector[]> {
        return this.http.get<CatalogoVector[]>(`${this.apiUrl}/catalogo`);
    }

    descargarTXT(): Observable<string> {
        return this.http.get(`${this.apiUrl}/descargar-txt`, { responseType: 'text' });
    }

    createCatalogoVector(vector: CatalogoVector): Observable<CatalogoVector> {
        return this.http.post<CatalogoVector>(`${this.apiUrl}/catalogo`, vector);
    }

    updateCatalogoVector(id: number, vector: CatalogoVector): Observable<CatalogoVector> {
        return this.http.put<CatalogoVector>(`${this.apiUrl}/catalogo/${id}`, vector);
    }
}