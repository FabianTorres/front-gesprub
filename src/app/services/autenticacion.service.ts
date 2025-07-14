import { Injectable , inject} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environment/environment';
import { LoginCredentials, LoginResponse } from '../models/autenticacion';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AutenticacionService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/autenticacion`; 


  constructor() { }


    // Método principal de login
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        // Cuando el login es exitoso, se guarda el token
        this.guardarToken(response.token);
        // Y redirigimos al dashboard
        this.router.navigate(['/']);
      })
    );
  }

  // Método para cerrar sesión
  logout(): void {
    localStorage.removeItem('authToken');
    this.router.navigate(['/login']);
  }

  // Método privado para guardar el token en el almacenamiento local del navegador
  private guardarToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  // Método público para obtener el token
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Método para verificar si el usuario está autenticado
  isLoggedIn(): boolean {
    return !!this.getToken(); // Devuelve true si el token existe, false si no
  }


}
