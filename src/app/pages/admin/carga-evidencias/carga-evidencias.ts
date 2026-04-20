import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { descargarPlantillaEvidencias, leerYValidarExcelEvidencias } from '../../../utils/excel.utils';
import { EvidenciaService } from '../../../services/evidencia.service';
import { CatalogoService } from '../../../services/catalogo.service';
import { AutenticacionService } from '../../../services/autenticacion.service';
import { Evidencia } from '../../../models/evidencia';
import { EstadoEvidencia } from '../../../models/estado-evidencia';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, TooltipModule, ToastModule, ButtonModule, FileUploadModule, TableModule, TagModule, ProgressBarModule],
    providers: [MessageService],
    templateUrl: './carga-evidencias.html'
})
export class CargaEvidenciasPage implements OnInit {
    private messageService = inject(MessageService);
    private evidenciaService = inject(EvidenciaService);
    private catalogoService = inject(CatalogoService);
    private authService = inject(AutenticacionService);



    // Estados de datos
    filasExcel = signal<any[]>([]);
    archivosFisicos = signal<File[]>([]);
    estadosEvidencia = this.catalogoService.estadosEvidencia;

    // Estados de la interfaz
    procesando = signal<boolean>(false);
    progresoActual = signal<number>(0);

    ngOnInit() {

    }

    descargarPlantilla() {
        descargarPlantillaEvidencias();
    }

    // PASO 1: Leer el Excel
    onExcelSelect(event: any) {
        const file = event.files[0];
        if (file) {
            leerYValidarExcelEvidencias(file, this.messageService).then(datos => {
                // Inicializamos el estado de cada fila para la tabla visual
                const datosConEstado = datos.map(fila => ({
                    ...fila,
                    estadoSubida: 'Pendiente', // Pendiente, Subiendo, Exitoso, Error
                    archivosEncontrados: [] // Guardaremos aquí las referencias a los Files reales
                }));
                this.filasExcel.set(datosConEstado);
                this.cruzarArchivos(); // Intentamos cruzar por si ya habían arrastrado fotos antes
            }).catch(err => console.error("Error validando:", err));
        }
    }

    // PASO 2: Recibir los archivos arrastrados
    onArchivosSelect(event: any) {
        this.archivosFisicos.set(event.currentFiles);
        this.cruzarArchivos();
    }

    // PASO 3: Cruzar nombres del Excel con archivos reales arrastrados
    cruzarArchivos() {
        const archivos = this.archivosFisicos();
        const filas = [...this.filasExcel()];

        filas.forEach(fila => {
            fila.archivosEncontrados = [];
            fila.faltanArchivos = false;

            const nombresEsperados = fila['ArchivosLimpios'] as string[];

            nombresEsperados.forEach(nombreEsperado => {
                const archivoReal = archivos.find(f => f.name === nombreEsperado);
                if (archivoReal) {
                    fila.archivosEncontrados.push(archivoReal);
                } else {
                    fila.faltanArchivos = true; // Falta una o más fotos para esta fila
                }
            });
        });

        this.filasExcel.set(filas);
    }

    // Verificamos si hay filas válidas listas para subir (que no les falten archivos)
    get filasListasParaSubir() {
        return this.filasExcel().filter(f => !f.faltanArchivos && f.estadoSubida !== 'Exitoso');
    }

    // PASO 4: El motor de subida masiva
    async procesarLote() {
        const filasAProcesar = this.filasListasParaSubir;
        if (filasAProcesar.length === 0) return;

        const usuario = this.authService.usuarioActual();
        if (!usuario) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Sesión expirada.' });
            return;
        }

        this.procesando.set(true);
        this.progresoActual.set(0);

        let exitosos = 0;
        let errores = 0; // Agregamos un contador de errores

        for (let i = 0; i < filasAProcesar.length; i++) {
            const fila = filasAProcesar[i];
            fila.estadoSubida = 'Subiendo';
            fila.mensajeError = ''; // Limpiamos errores previos
            this.filasExcel.set([...this.filasExcel()]);

            try {
                const textoEstado = String(fila['Resultado (OK/NK/NA)']).trim().toUpperCase();
                const estadoDb = this.estadosEvidencia().find(e => e.nombre.toUpperCase() === textoEstado);

                if (!estadoDb) throw new Error(`El estado '${textoEstado}' no existe en el sistema.`);

                const nuevaEvidencia: Partial<Evidencia> = {
                    id_caso: parseInt(fila['ID Caso'], 10),
                    id_estado_evidencia: estadoDb.id_estado_evidencia,
                    version_ejecucion: String(fila['Versión Ejecución']).replace(',', '.'),
                    rut: fila['RUT'] ? String(fila['RUT']).trim() : '',
                    descripcion_evidencia: fila['Descripción'] || '',
                    id_jira: fila['Jira'] ? parseInt(fila['Jira'], 10) : null,
                    usuarioEjecutante: usuario
                };

                // Enviamos la petición y esperamos
                const evidenciaCreada = await lastValueFrom(this.evidenciaService.createEvidencia(nuevaEvidencia as Evidencia));

                // VALIDACIÓN CRÍTICA: Si el servicio se tragó el error HTTP 500 y no devolvió un ID, lanzamos error manual
                if (!evidenciaCreada || !evidenciaCreada.id_evidencia) {
                    throw new Error('El caso indicado no existe o el servidor rechazó la evidencia.');
                }

                const idEvidencia = evidenciaCreada.id_evidencia;
                if (fila.archivosEncontrados.length > 0) {
                    for (const archivo of fila.archivosEncontrados) {
                        await lastValueFrom(this.evidenciaService.uploadArchivo(idEvidencia, archivo));
                    }
                }

                fila.estadoSubida = 'Exitoso';
                exitosos++;

            } catch (error: any) {
                console.error(`Error en fila del caso ${fila['ID Caso']}:`, error);

                fila.estadoSubida = 'Error';
                errores++;

                // Intentamos extraer el error directo desde Spring Boot (HTTP 500/400) o usamos uno genérico
                if (error && error.error && typeof error.error.message === 'string') {
                    fila.mensajeError = error.error.message;
                } else if (error && error.message) {
                    fila.mensajeError = error.message; // Mensajes manuales (como el del ID faltante)
                } else {
                    fila.mensajeError = 'Error de integridad (Revisa que el ID del Caso exista).';
                }
            }

            this.progresoActual.set(Math.round(((i + 1) / filasAProcesar.length) * 100));
            this.filasExcel.set([...this.filasExcel()]);
        }

        this.procesando.set(false);

        // NOTIFICACIÓN FINAL INTELIGENTE
        if (errores === 0) {
            this.messageService.add({ severity: 'success', summary: 'Carga Exitosa', detail: `Se procesaron las ${exitosos} evidencias sin errores.` });
        } else if (exitosos === 0) {
            this.messageService.add({ severity: 'error', summary: 'Carga Fallida', detail: `Fallaron los ${errores} registros intentados. Revisa la tabla.` });
        } else {
            this.messageService.add({ severity: 'warn', summary: 'Proceso Incompleto', detail: `Se subieron ${exitosos} correctamente, pero fallaron ${errores}.` });
        }
    }

    // Verifica si un archivo específico ya fue arrastrado por el usuario
    tieneArchivo(fila: any, nombreArchivo: string): boolean {
        if (!fila.archivosEncontrados) return false;
        return fila.archivosEncontrados.some((f: File) => f.name === nombreArchivo);
    }
}