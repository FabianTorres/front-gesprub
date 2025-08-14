import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { Proyecto } from '../models/proyecto';

const PROYECTO_STORAGE_KEY = 'ultimoProyectoSeleccionado';

@Injectable({ providedIn: 'root' })
export class ProyectoService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/proyecto`;

    // Señal para el proyecto seleccionado actualmente
    proyectoSeleccionado = signal<Proyecto | null>(null);

    getProyectos(): Observable<Proyecto[]> {
        return this.http.get<Proyecto[]>(this.apiUrl);
    }

    // Cambia el proyecto activo y lo guarda en localStorage
    seleccionarProyecto(proyecto: Proyecto | null) {
        this.proyectoSeleccionado.set(proyecto);
        if (proyecto) {
            localStorage.setItem(PROYECTO_STORAGE_KEY, JSON.stringify(proyecto));
        } else {
            localStorage.removeItem(PROYECTO_STORAGE_KEY);
        }
    }

    // Carga el último proyecto guardado al iniciar la app
    cargarProyectoGuardado() {
        const proyectoGuardado = localStorage.getItem(PROYECTO_STORAGE_KEY);
        if (proyectoGuardado) {
            this.proyectoSeleccionado.set(JSON.parse(proyectoGuardado));
        }
    }

    createProyecto(proyecto: Partial<Proyecto>): Observable<Proyecto> {
        return this.http.post<Proyecto>(this.apiUrl, proyecto);
    }

    updateProyecto(id: number, proyecto: Partial<Proyecto>): Observable<Proyecto> {
        return this.http.put<Proyecto>(`${this.apiUrl}/${id}`, proyecto);
    }
}