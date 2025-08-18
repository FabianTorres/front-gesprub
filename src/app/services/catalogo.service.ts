import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environment/environment';

import { Criticidad } from '../models/criticidad';
import { EstadoEvidencia } from '../models/estado-evidencia';
import { Ambito } from '../models/ambito';

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Usamos signals para almacenar los datos "en caché"
  criticidades = signal<Criticidad[]>([]);
  estadosEvidencia = signal<EstadoEvidencia[]>([]);
  ambitos = signal<Ambito[]>([]);

  // El constructor se ejecuta una sola vez cuando se crea el servicio
  constructor() {
    this.cargarCatalogosIniciales();
  }

  // Método para cargar todos los catálogos al inicio de la app
  private cargarCatalogosIniciales(): void {
    forkJoin({
      criticidades: this.http.get<Criticidad[]>(`${this.apiUrl}/criticidad`),
      estadosEvidencia: this.http.get<EstadoEvidencia[]>(`${this.apiUrl}/estado-evidencia`),
      ambitos: this.http.get<Ambito[]>(`${this.apiUrl}/ambito`)
    }).pipe(
      tap(resultados => {
        // Guardamos los datos en nuestros signals, filtrando solo los activos
        this.criticidades.set(resultados.criticidades.filter(c => c.activo === 1));
        this.estadosEvidencia.set(resultados.estadosEvidencia.filter(e => e.activo === 1));
        this.ambitos.set(resultados.ambitos.filter(a => a.activo === 1));
      })
    ).subscribe({
      error: (err) => console.error('Error al cargar los catálogos iniciales:', err)
    });
  }
}