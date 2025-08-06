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
}