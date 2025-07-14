import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
        RAC Consultores
        <a href="https://solucionacomp.cl" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">https://solucionacomp.cl/</a>
    </div>`
})
export class AppFooter {}
