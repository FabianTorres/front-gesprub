// src/app/pages/dashboard/widgets/chart-widget.component.ts

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-chart-widget',
  standalone: true,
  imports: [CommonModule, ChartModule, SkeletonModule],
  template: `
    <div class="card h-full flex flex-col" style="position: relative; z-index: 1;">
      <div class="flex justify-between items-center mb-4">
        <span class="font-bold text-lg">{{ title }}</span>
        </div>
      <div class="flex-1 flex items-center justify-center">
        <ng-container *ngIf="!loading; else skeletonTpl">
          <p-chart [type]="type" [data]="data" [options]="options" height="100%"></p-chart>
        </ng-container>
        <ng-template #skeletonTpl>
          <p-skeleton width="90%" height="200px"></p-skeleton>
        </ng-template>
      </div>
    </div>
  `
})
export class ChartWidgetComponent {
  @Input() title: string = '';
  @Input() type: 'doughnut' | 'bar' | 'line' | 'pie' = 'bar';
  @Input() data: any;
  @Input() options: any;
  @Input() loading: boolean = true;
}