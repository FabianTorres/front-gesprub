import { Component } from '@angular/core';
import { version } from '../../../environment/version';
import { DialogModule } from 'primeng/dialog';
import { MarkdownModule } from 'ngx-markdown';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    standalone: true,
    selector: 'app-footer',
    imports: [CommonModule, DialogModule, MarkdownModule, ButtonModule, TooltipModule],
    template: `<div class="layout-footer flex flex-column align-items-center justify-content-center p-3 gap-2">
            
            <div class="flex align-items-center gap-2">
                <span class="font-bold">RAC Consultores</span>
                <a href="https://solucionacomp.cl" target="_blank" rel="noopener noreferrer" 
                   class="text-primary font-bold hover:underline">
                   https://solucionacomp.cl/
                </a>
            </div>

            <div class="flex align-items-center">
                <span class="text-sm text-color-secondary cursor-pointer hover:text-primary transition-colors font-medium border-round p-1 hover:surface-hover" 
                      (click)="mostrarChangelog = true" 
                      pTooltip="Clic para ver Novedades" 
                      tooltipPosition="top">
                    Gesprub v.{{ appVersion }}
                </span>
            </div>
        </div>

        <p-dialog header="Novedades y Cambios" 
                  [(visible)]="mostrarChangelog" 
                  [modal]="true" 
                  [style]="{width: '70vw', maxWidth: '800px'}" 
                  [maximizable]="true" 
                  [draggable]="false" 
                  [resizable]="false"
                  [dismissableMask]="true">
            
            <div class="p-3 surface-card border-round">
                <markdown src="assets/CHANGELOG.md"></markdown>
            </div>

            <ng-template pTemplate="footer">
                <button pButton label="Entendido" icon="pi pi-check" (click)="mostrarChangelog = false"></button>
            </ng-template>
        </p-dialog>`,
    // Estilos CSS para "embellecer" el Markdown crudo
    styles: [`
        .layout-footer {
            flex-direction: column !important; 
        }
        :host ::ng-deep markdown h1 { font-size: 1.5rem; color: var(--primary-color); border-bottom: 1px solid var(--surface-border); padding-bottom: 0.5rem; margin-bottom: 1rem; }
        :host ::ng-deep markdown h2 { font-size: 1.25rem; margin-top: 1.5rem; color: var(--text-color); font-weight: 600; }
        :host ::ng-deep markdown h3 { font-size: 1.1rem; margin-top: 1rem; color: var(--text-color-secondary); }
        :host ::ng-deep markdown ul { padding-left: 1.5rem; margin-bottom: 1rem; }
        :host ::ng-deep markdown li { margin-bottom: 0.25rem; line-height: 1.5; }
        :host ::ng-deep markdown code { background-color: var(--surface-ground); padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; color: var(--primary-color); }
        :host ::ng-deep markdown blockquote { border-left: 4px solid var(--primary-color); padding-left: 1rem; margin-left: 0; color: var(--text-color-secondary); font-style: italic; }
    `]
})
export class AppFooter {
    public appVersion = version;
    public mostrarChangelog = false;
}
