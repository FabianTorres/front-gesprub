import { Injectable, inject } from '@angular/core';
import { environment } from '../../environment/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/usuario`;

  constructor() { }

  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  // Se asegura que este método exista para que el AuthService lo pueda llamar.
  getUsuarioPorNombre(nombreUsuario: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/nombreusuario/${nombreUsuario}`);
  }

  updateUsuario(id: number, datosActualizados: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, datosActualizados);
  }


  //Servicio de registrar usuario
  register(datosUsuario: any): Observable<Usuario> {
    return this.http.post<Usuario>(`${environment.apiUrl}/usuario`, datosUsuario);
  }
}
