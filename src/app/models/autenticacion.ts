import { Usuario } from "./usuario";

// src/app/models/autenticacion.ts
export interface LoginCredentials {
  username: string; 
  password: string;
}


export interface LoginResponse {
  token: string;
}