// src/app/pages/dashboard/widgets/kpi-card.component.ts

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, CardModule],
  template: `
        <div class="p-3 rounded-lg shadow-md bg-surface-card border border-surface-200 dark:border-surface-700">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="font-semibold m-0 text-surface-700 dark:text-surface-200">{{ titulo }}</h3>
        </div>
        <div class="p-2 rounded-md" [ngClass]="color">
          <i [class]="'pi ' + icono + ' text-xl text-white'"></i>
        </div>
      </div>
      <div class="text-left mt-2">
        <span class="text-3xl font-bold text-surface-900 dark:text-surface-0">{{ valor | number:'1.0-2' }}{{ unidad }}</span>
      </div>
    </div>
  `
})
export class KpiCardComponent {
  @Input() label: string = '';
  @Input() value: string | number = '';
  @Input() icon: string = '';
  @Input() loading: boolean = true;

  // --- AÑADIR los decoradores @Input() ---
  @Input() titulo: string = '';
  @Input() valor: number = 0;
  @Input() icono: string = '';
  @Input() unidad: string = '';
  @Input() color: string = 'bg-primary-500';
}