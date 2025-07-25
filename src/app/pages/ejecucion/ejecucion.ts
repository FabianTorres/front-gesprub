// src/app/pages/ejecucion/ejecucion.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, Location  } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { Caso } from '../../models/caso';
import { CasoService } from '../../services/caso.service';
import { Evidencia } from '../../models/evidencia';
import { EvidenciaService } from '../../services/evidencia.service';

@Component({
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, ButtonModule, ButtonGroupModule, CardModule, InputTextModule,
        TextareaModule, SelectModule, SelectButtonModule, FileUploadModule, ToastModule
    ],
    providers: [MessageService, DatePipe],
    templateUrl: './ejecucion.html'
})
export class EjecucionPage implements OnInit {
    caso = signal<Caso | null>(null);
    nuevaEvidencia: Partial<Evidencia> = {};
    jiraInput: string | null = null;

    // Opciones para el botón de estado
    //opcionesDeEstado: any[] = [
    //    { label: 'OK', value: 'OK', icon: 'pi pi-check-circle' },
    //    { label: 'NK', value: 'NK', icon: 'pi pi-times-circle' }
    //];

    // opcionesDeCriticidad: any[] = [
    //     { label: 'Leve', value: 'Leve' },
    //     { label: 'Medio', value: 'Medio' },
    //     { label: 'Grave', value: 'Grave' },
    //     { label: 'Crítico', value: 'Crítico' }
    // ];

    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private casoService = inject(CasoService);
    private evidenciaService = inject(EvidenciaService);
    private messageService = inject(MessageService);
    private location = inject(Location);

    ngOnInit() {
        
        const casoId = this.route.snapshot.paramMap.get('id');
        if (casoId) {
           
            this.casoService.getCasoById(+casoId).subscribe(data => {
                this.caso.set(data);
            });
            this.nuevaEvidencia.id_caso = +casoId;
        }
    }

    guardarEvidencia() {
        if (!this.nuevaEvidencia.estado_evidencia || !this.nuevaEvidencia.descripcion_evidencia) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'El estado y la descripción son requeridos.' });
            return;
        }
        if (this.nuevaEvidencia.estado_evidencia === 'NK' && !this.nuevaEvidencia.criticidad) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Si el resultado es NK, la criticidad es requerida.' });
            return;
        }

        if (this.nuevaEvidencia.estado_evidencia !== 'NK') {
            this.nuevaEvidencia.criticidad = null;
        }

        if (this.jiraInput) {
            const parts = this.jiraInput.split('-');
            const numeroJira = parts.length > 1 ? parseInt(parts[parts.length - 1], 10) : null;
            this.nuevaEvidencia.id_jira = isNaN(numeroJira!) ? null : numeroJira;
        } else {
            this.nuevaEvidencia.id_jira = null;
        }

        // Asignamos el usuario ejecutante (valor temporal)
        this.nuevaEvidencia.id_usuario_ejecutante = 1;

        this.evidenciaService.createEvidencia(this.nuevaEvidencia as Evidencia).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Evidencia guardada correctamente.' });
                // Esperamos un momento y volvemos a la lista de casos
                setTimeout(() => this.router.navigate(['/pages/casos', this.nuevaEvidencia.id_caso]), 1500);
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la evidencia.' })
        });
    }

    onUpload(event: any) {
        // Aquí manejarías la subida del archivo. Por ahora, solo mostraremos un mensaje.
        // En una implementación real, aquí se llamaría a un servicio que sube el archivo y devuelve la URL.
        const file = event.files[0];
        this.nuevaEvidencia.url_evidencia = `path/to/uploaded/${file.name}`; // URL simulada
        this.messageService.add({ severity: 'info', summary: 'Archivo Subido', detail: file.name });
    }
    volverAtras(): void {
        this.location.back();
    }
}