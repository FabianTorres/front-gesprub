import { Component } from '@angular/core';
import { version } from '../../../environment/version';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
        RAC Consultores
        <a href="https://solucionacomp.cl" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">https://solucionacomp.cl/</a>
        </div>
        <div class="layout-footer">
            <p>Gesprub v.{{ appVersion }}</p>
        </div>`
})
export class AppFooter {
    public appVersion = version;
}
