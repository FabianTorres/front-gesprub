import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environment/environment';
import { LoginCredentials, LoginResponse } from '../models/autenticacion';
import { Observable, tap, switchMap } from 'rxjs';
import { Usuario } from '../models/usuario';
import { UsuarioService } from './usuario.service';

@Injectable({
  providedIn: 'root'
})
export class AutenticacionService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private usuarioService = inject(UsuarioService);
  private apiUrl = `${environment.apiUrl}/autenticacion`;

  usuarioActual = signal<Usuario | null>(null);

  constructor() {
    this.cargarSesionGuardada();
  }

  login(credentials: LoginCredentials): Observable<Usuario> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      // Se encadena una segunda operación con switchMap
      switchMap(response => {
        this.guardarToken(response.token);
        const nombreUsuario = this.getNombreUsuarioDesdeToken(response.token);
        // Se llama al servicio de usuario para obtener los detalles completos
        return this.usuarioService.getUsuarioPorNombre(nombreUsuario!);
      }),
      // El resultado final (el objeto Usuario) se maneja aquí
      tap(usuarioCompleto => {
        this.guardarUsuario(usuarioCompleto);
        this.usuarioActual.set(usuarioCompleto);
        //Se actualiza el ultimo login
        this.usuarioService.actualizarUltimoLogin(usuarioCompleto.idUsuario!).subscribe();
        this.router.navigate(['/']);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    this.usuarioActual.set(null);
    this.router.navigate(['/auth/login']);
  }

  private guardarToken(token: string): void {
    localStorage.setItem('authToken', token);
  }
  
  private guardarUsuario(usuario: Usuario): void {
    localStorage.setItem('currentUser', JSON.stringify(usuario));
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private cargarSesionGuardada(): void {
    const token = this.getToken();
    const usuarioGuardado = localStorage.getItem('currentUser');
    if (token && usuarioGuardado && !this.isTokenExpired(token)) {
      this.usuarioActual.set(JSON.parse(usuarioGuardado));
    }
  }
  
  isLoggedIn(): boolean {
    return !!this.usuarioActual();
  }
  
  private getNombreUsuarioDesdeToken(token: string): string | null {
    try {
      return JSON.parse(atob(token.split('.')[1])).sub;
    } catch (e) {
      return null;
    }
  }

  actualizarUsuarioLocal(usuario: Usuario): void {
    // 1. Actualizamos la señal para que toda la app reaccione al cambio.
    this.usuarioActual.set(usuario);
    
    // 2. Sobrescribimos el objeto 'currentUser' en localStorage con los nuevos datos.
    localStorage.setItem('currentUser', JSON.stringify(usuario));
  }

  private isTokenExpired(token: string): boolean {
    try {
      const expiry = JSON.parse(atob(token.split('.')[1])).exp;
      return (Math.floor((new Date).getTime() / 1000)) >= expiry;
    } catch (e) {
      return true;
    }
  }
}