// src/app/pages/home/home.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutenticacionService } from '../../services/autenticacion.service';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  private authService = inject(AutenticacionService);
  usuarioActual = this.authService.usuarioActual;
}