// src/app/pages/dashboard/widgets/kpi-card.component.ts

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, SkeletonModule],
  template: `
    <div class="card !p-0 h-full flex flex-col" style="position: relative; z-index: 1;">
      <div class="flex justify-between p-4">
        <div>
          <span class="block text-muted-color font-medium">{{ label }}</span>
          <div class="text-surface-900 dark:text-surface-0 font-bold text-3xl mt-2">
            <p-skeleton width="6rem" height="2rem" *ngIf="loading; else valueTpl"></p-skeleton>
            <ng-template #valueTpl>{{ value }}</ng-template>
          </div>
        </div>
        <div class="flex items-center justify-center bg-primary-100 dark:bg-primary-900/40 rounded-full w-16 h-16">
          <i [class]="'pi text-3xl text-primary-600 dark:text-primary-300 ' + icon"></i>
        </div>
      </div>
    </div>
  `
})
export class KpiCardComponent {
  @Input() label: string = '';
  @Input() value: string | number = '';
  @Input() icon: string = '';
  @Input() loading: boolean = true;
}