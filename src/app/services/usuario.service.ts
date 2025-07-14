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
  private apiUrl = `${environment.apiUrl}`; // URL base de la API

  constructor() { }


  //Servicio de registrar usuario
  register(datosUsuario: any): Observable<Usuario> {
    return this.http.post<Usuario>(`${environment.apiUrl}/usuario`, datosUsuario);
  }
}
