import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { VectorData } from '../../models/vector-data';
import { CargaVxService } from '../../services/cargavx.service';
import { FieldsetModule } from 'primeng/fieldset';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { VectorLog } from '../../models/vector-log';
import { CatalogoVector } from '../../models/catalogo-vector';
import { SelectModule } from 'primeng/select';
import { TabViewModule } from 'primeng/tabview';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DropdownModule } from 'primeng/dropdown';
import { SortMeta } from 'primeng/api';
import { InputSwitchModule } from 'primeng/inputswitch';
import * as XLSX from 'xlsx';
import { FileUploadModule } from 'primeng/fileupload';
import { DividerModule } from 'primeng/divider';

@Component({
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule, ToolbarModule, InputSwitchModule, FileUploadModule,
        DialogModule, InputTextModule, InputNumberModule, ToastModule, TabViewModule, RadioButtonModule,
        ConfirmDialogModule, FieldsetModule, TagModule, TooltipModule, InputTextModule, SelectModule, DropdownModule, DividerModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './cargavx.html'
})
export class CargaVxPage implements OnInit {

    periodoSeleccionado = signal<number>(202600);

    periodosDisponibles = [
        { label: 'AT 2025', value: 202500 },
        { label: 'AT 2026', value: 202600 }
    ];

    //VARIABLES PARA EL VX599
    dialogoDecision599 = false;
    rutaSeleccionada599: 'INSERT' | 'UPDATE' | null = null;
    tempVector599: any = null; // Guarda los datos temporalmente

    // Estado catalogo
    mostrarEliminados = signal<boolean>(false); // Switch para ver historial

    versionRetiroInput: string = '';
    vectorAEliminar: CatalogoVector | null = null;
    bajaDialog: boolean = false;

    vectores = signal<VectorData[]>([]);
    vectoresVisuales = signal<VectorData[]>([]);
    filtrandoDuplicados = signal<boolean>(false);
    vectorDialog: boolean = false;
    vector: Partial<VectorData> = {};
    submitted: boolean = false;
    esEdicion: boolean = false;
    loading: boolean = false;

    // Variables para Importación Masiva
    importDialog: boolean = false;
    vectoresParaImportar: VectorData[] = [];
    resumenImportacion: { total: number, validos: number, errores: string[] } = { total: 0, validos: 0, errores: [] };
    loadingImport: boolean = false;

    // Señales para los logs
    logs = signal<VectorLog[]>([]);
    logDialog: boolean = false;
    loadingLogs: boolean = false;

    ordenamientoInicial: SortMeta[] = [];

    catalogo = signal<CatalogoVector[]>([]);
    catalogoDialog: boolean = false;
    catalogoItem: Partial<CatalogoVector> = {};
    esEdicionCatalogo: boolean = false;

    catalogoMap = computed(() => {
        const map = new Map<number, CatalogoVector>();
        this.catalogo().forEach(c => map.set(c.vectorId, c));
        return map;
    });

    // Esta señal reemplaza a 'vectoresVisuales'. Se recalcula automáticamente si cambia
    // la lista de vectores, si llega el catálogo o si activas el filtro de duplicados.
    listaVectoresEnriquecida = computed(() => {
        const rawVectores = this.vectores();
        const mapa = this.catalogoMap();
        const soloDuplicados = this.filtrandoDuplicados();

        // A. Enriquecimiento (Cruce de datos)
        let data = rawVectores.map(v => {
            const def = mapa.get(v.vector);
            return {
                ...v,
                // Aquí ocurre la magia: Si el mapa ya cargó, pone el tipo. Si no, espera.
                tipo: def ? def.tipoTecnologia : 'DESCONOCIDO',
                // Opcional: También podrías traer el nombre real si lo necesitas
                nombreCalculado: def ? def.nombre : ''
            };
        });

        // B. Filtrado de Duplicados (Tu lógica original migrada aquí)
        if (soloDuplicados) {
            const conteo = new Map<string, number>();
            data.forEach(v => {
                const key = `${v.rut}-${v.periodo}-${v.vector}`;
                conteo.set(key, (conteo.get(key) || 0) + 1);
            });

            data = data.filter(v => {
                const key = `${v.rut}-${v.periodo}-${v.vector}`;
                return (conteo.get(key) || 0) > 1;
            });
        }

        return data;
    });

    totalesCatalogo = computed(() => {
        const lista = this.catalogo();
        return {
            total: lista.length,
            batch: lista.filter(v => v.tipoTecnologia === 'BATCH').length,
            bigdata: lista.filter(v => v.tipoTecnologia === 'BIGDATA_INTEGRADO').length
        };
    });

    private servicio = inject(CargaVxService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    ngOnInit() {
        this.cargarDatos();
        this.cargarCatalogo();
        this.recargarTodo();

        this.ordenamientoInicial = [
            { field: 'vector', order: 1 },
            { field: 'rut', order: 1 },
            { field: 'valor', order: 1 }
        ];
    }

    recargarTodo() {
        this.loading = true;
        const periodo = this.periodoSeleccionado();

        // 1. Cargar Vectores de la Pestaña 1 (Carga)
        this.servicio.getVectores(periodo).subscribe({
            next: (data) => {
                // ... tu lógica de mapeo de tipos ...
                const datosEnriquecidos = data.map(item => ({ ...item, tipo: this.getTipoVector(item.vector) }));
                this.vectores.set(datosEnriquecidos);
                this.actualizarVista(); // Filtros de duplicados
                this.loading = false;
            }
        });

        // 2. Cargar Catálogo de la Pestaña 2
        this.servicio.getCatalogoVectores(periodo, this.mostrarEliminados()).subscribe({
            next: (data) => this.catalogo.set(data)
        });
    }

    cambiarPeriodo() {
        this.messageService.add({ severity: 'info', summary: 'Cambiando Periodo', detail: `Cargando datos para ${this.periodoSeleccionado()}...` });
        this.recargarTodo();
    }

    toggleEliminados() {
        this.recargarTodo();
    }

    cargarCatalogo() {
        // Obtenemos el periodo y el estado del switch
        const periodo = this.periodoSeleccionado();
        const verEliminados = this.mostrarEliminados();

        // Pasamos ambos argumentos al servicio
        this.servicio.getCatalogoVectores(periodo, verEliminados).subscribe({
            next: (data) => this.catalogo.set(data),
            error: () => console.error('Error cargando catálogo')
        });
    }

    getTipoVector(vectorId: number): string {
        const v = this.catalogo().find(c => c.vectorId === vectorId);
        return v ? v.tipoTecnologia : 'DESCONOCIDO';
    }

    // Helper para color del tag
    getSeverityTipo(vectorId: number): any {
        const tipo = this.getTipoVector(vectorId);
        return tipo === 'BATCH' ? 'info' : (tipo === 'BIGDATA_INTEGRADO' ? 'help' : 'danger');
    }

    // Exportar TXT
    exportarTXT() {
        this.messageService.add({ severity: 'info', summary: 'Generando', detail: 'Solicitando archivo BigData...' });
        this.loading = true;
        this.servicio.descargarTXT(this.periodoSeleccionado()).subscribe({
            next: (data: string) => {
                // 1. Validar si llegó texto
                if (!data || data.trim().length === 0) {
                    this.messageService.add({ severity: 'warn', summary: 'Sin Datos', detail: 'El servidor respondió, pero el archivo está vacío.' });
                    return;
                }

                // 2. CONVERTIR TEXTO A BLOB MANUALMENTE
                // Aquí tomamos el string que vimos en tu foto y lo convertimos en objeto descargable
                const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });

                // 3. Lógica de descarga estándar
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'result_vectores_RAC.txt';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                this.messageService.add({ severity: 'success', summary: 'Descargado', detail: 'Archivo TXT generado correctamente.' });
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el archivo.' });
                this.loading = false;
            }
        });
    }

    cargarDatos() {
        this.loading = true;
        const periodo = this.periodoSeleccionado();
        this.servicio.getVectores(periodo).subscribe({
            next: (data) => {
                this.vectores.set(data);
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
            }
        });
    }

    toggleFiltroDuplicados() {
        this.filtrandoDuplicados.update(val => !val);

        if (this.filtrandoDuplicados()) {
            this.messageService.add({ severity: 'info', summary: 'Filtro Activo', detail: 'Mostrando solo registros duplicados.' });
        } else {
            this.messageService.add({ severity: 'info', summary: 'Filtro Inactivo', detail: 'Mostrando todos los registros.' });
        }
    }

    // Helper para saber si un vector está "en espera" de ser exportado a Excel
    esPendienteDeEnvio(v: VectorData): boolean {
        return v.vector === 599 &&
            v.intencionCarga === 'UPDATE' &&
            !v.procesado; // Si ya fue procesado, deja de ser pendiente
    }

    // Función auxiliar para calcular qué mostrar
    private actualizarVista() {
        if (!this.filtrandoDuplicados()) {
            // Si el filtro está apagado, mostramos todo
            this.vectoresVisuales.set(this.vectores());
        } else {
            // Si el filtro está encendido, buscamos duplicados
            const todos = this.vectores();

            // 1. Contamos cuántas veces aparece cada llave compuesta
            const conteo = new Map<string, number>();

            todos.forEach(v => {
                const key = `${v.rut}-${v.periodo}-${v.vector}`;
                conteo.set(key, (conteo.get(key) || 0) + 1);
            });

            // 2. Filtramos solo los que aparezcan más de 1 vez
            const duplicados = todos.filter(v => {
                const key = `${v.rut}-${v.periodo}-${v.vector}`;
                return (conteo.get(key) || 0) > 1;
            });

            this.vectoresVisuales.set(duplicados);
        }
    }

    abrirNuevo() {
        this.vector = {
            periodo: 202600,
            elvc_seq: 'NOMCES'
        };
        this.submitted = false;
        this.vectorDialog = true;
        this.esEdicion = false;
    }

    editarVector(v: VectorData) {
        this.vector = { ...v };
        this.vectorDialog = true;
        this.esEdicion = true;
    }

    eliminarVector(v: VectorData) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de borrar el vector ${v.vector} del RUT ${v.rut}?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.servicio.deleteVector(v.id!).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Vector eliminado' });
                        this.cargarDatos();
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' })
                });
            }
        });
    }

    guardarVector() {
        this.submitted = true;

        // Se cambia la k minuscula a mayuscula
        if (this.vector.dv) {
            this.vector.dv = this.vector.dv.toUpperCase();
        }
        if (this.vector.dv2) {
            this.vector.dv2 = this.vector.dv2.toUpperCase();
        }

        // Validaciones basicas
        if (!this.vector.rut || !this.vector.dv || !this.vector.periodo || !this.vector.vector) {
            return;
        }

        if (!this.validarRutChileno(this.vector.rut, this.vector.dv)) {
            this.messageService.add({ severity: 'warn', summary: 'RUT Inválido', detail: 'El dígito verificador no corresponde al RUT ingresado.' });
            return;
        }

        // Buscamos si este vector ya existe en la lista que estamos viendo en pantalla
        if (!this.esEdicion) {
            const yaExiste = this.vectores().find(v =>
                v.rut === this.vector.rut &&
                v.vector === this.vector.vector &&
                v.periodo === this.vector.periodo
            );

            if (yaExiste) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Duplicado Detectado',
                    detail: `El RUT ${this.vector.rut} ya tiene el vector ${this.vector.vector} cargado en esta lista.`
                });
                return;
            }
        }

        // Si es edición, actualizamos directamente (asumimos que el usuario sabe lo que hace al editar)
        // Opcional: Podrías validar también en edición si cambian los campos clave.
        if (this.esEdicion) {
            this.ejecutarGuardado();
            return;
        }

        // Si el usuario intenta crear un 599, pausamos y mostramos el diálogo.
        if (this.vector.vector === 599) {
            this.tempVector599 = { ...this.vector }; // Copia de seguridad
            this.rutaSeleccionada599 = null;         // Resetear radio buttons
            this.dialogoDecision599 = true;
            return;
        }

        // Si no es 599, sigue el flujo normal de verificación que ya tenías
        this.verificarYGuardarNormal();
    }

    // Verificacion de duplicacion
    verificarYGuardarNormal() {
        this.loading = true;
        this.servicio.verificarExistencia(this.vector.rut!, this.vector.periodo!, this.vector.vector!)
            .subscribe({
                next: (existe) => {
                    this.loading = false;
                    if (existe) {
                        this.confirmationService.confirm({
                            header: 'Registro Duplicado',
                            message: 'Este registro ya existe. ¿Guardar de todas formas?',
                            accept: () => this.ejecutarGuardado()
                        });
                    } else {
                        this.ejecutarGuardado();
                    }
                },
                error: () => this.loading = false
            });
    }

    //FUNCIONES PARA EL DIALOGO 599 ===

    cancelarDecision599() {
        this.dialogoDecision599 = false;
        this.tempVector599 = null;
    }

    confirmarDecision599() {
        if (!this.rutaSeleccionada599 || !this.tempVector599) return;

        // Asignamos la intención elegida por el usuario
        this.vector = {
            ...this.tempVector599,
            intencionCarga: this.rutaSeleccionada599 // <--- ESTO VA AL BACKEND
        };

        // Cerramos diálogo y procedemos a guardar sin verificar existencia (porque el usuario ya decidió)
        this.dialogoDecision599 = false;
        this.ejecutarGuardado();
    }

    //FUNCIÓN DE EXPORTACIÓN Y CIERRE 
    descargarModificaciones599() {
        this.loading = true;
        this.servicio.descargarModificaciones599(this.periodoSeleccionado()).subscribe({
            next: (data: string) => {
                if (!data || data.trim().length === 0) { // Validación simple de archivo vacío
                    this.messageService.add({ severity: 'info', summary: 'Al día', detail: 'No hay pendientes.' });
                    this.loading = false;
                    return;
                }

                // Agregamos \uFEFF al inicio
                const BOM = '\uFEFF';
                const contenidoCsv = BOM + data;

                const blob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                // Cambiamos extensión a .csv
                a.download = `MODIF_599_${this.periodoSeleccionado()}.csv`;
                a.click();
                this.loading = false;

                // PREGUNTA DE CIERRE
                setTimeout(() => {
                    this.confirmationService.confirm({
                        header: 'Confirmar Envío',
                        message: '¿Marcar registros como "ENVIADOS" para que no salgan la próxima vez?',
                        icon: 'pi pi-check-circle',
                        acceptLabel: 'Sí, Marcar',
                        accept: () => this.marcarComoProcesados()
                    });
                }, 4500);
            },
            error: () => {
                this.loading = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Falló la descarga.' });
            }
        });
    }

    marcarComoProcesados() {
        this.servicio.marcar599ComoEnviados(this.periodoSeleccionado()).subscribe(() => {
            this.messageService.add({ severity: 'success', summary: 'Listo', detail: 'Registros marcados.' });
            this.cargarDatos(); // Recargar tabla para actualizar colores
        });
    }

    /**
     * Lógica real de guardado (POST/PUT).
     * Se llama directamente si no hay duplicados, o tras la confirmación si los hay.
     */
    private ejecutarGuardado() {
        if (this.esEdicion) {
            this.servicio.updateVector(this.vector.id!, this.vector as VectorData).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Vector modificado correctamente' });
                    this.vectorDialog = false;
                    this.cargarDatos();
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar.' });
                }
            });
        } else {
            this.servicio.createVector(this.vector as VectorData).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Vector creado correctamente' });
                    this.vectorDialog = false;
                    this.cargarDatos();
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear el registro.' });
                }
            });
        }
    }

    exportarSQL() {
        this.messageService.add({ severity: 'info', summary: 'Generando', detail: 'Solicitando archivo SQL...' });

        this.servicio.descargarSQL(this.periodoSeleccionado()).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'inserta_vx_2026_pp_rac.sql';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                this.messageService.add({ severity: 'success', summary: 'Descargado', detail: 'Archivo SQL listo.' });
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el archivo.' });
            }
        });
    }

    onRutChange(event: any, campo: 'principal' | 'secundario') {
        const valor = event.target.value;
        if (valor && valor.includes('-')) {
            const partes = valor.split('-');
            if (partes.length === 2) {
                const dvMayuscula = partes[1].trim().toUpperCase();

                if (campo === 'principal') {
                    this.vector.rut = Number(partes[0]);
                    this.vector.dv = dvMayuscula;
                } else {
                    this.vector.rut2 = Number(partes[0]);
                    this.vector.dv2 = dvMayuscula;
                }
            }
        }
    }

    private validarRutChileno(rut: number, dv: string): boolean {
        if (!rut || !dv) return false;

        let suma = 0;
        let multiplicador = 2;
        // Convertimos a string, revertimos y recorremos
        const rutReverso = rut.toString().split('').reverse();

        for (let digit of rutReverso) {
            suma += parseInt(digit) * multiplicador;
            multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
        }

        const resto = 11 - (suma % 11);
        let dvCalculado = '';

        if (resto === 11) dvCalculado = '0';
        else if (resto === 10) dvCalculado = 'K';
        else dvCalculado = resto.toString();

        return dvCalculado === dv.toUpperCase();
    }

    abrirHistorial() {
        this.logDialog = true;
        this.loadingLogs = true;

        this.servicio.getLogs().subscribe({
            next: (data) => {
                this.logs.set(data);
                this.loadingLogs = false;
            },
            error: (err) => {
                console.error(err);
                this.loadingLogs = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el historial.' });
            }
        });
    }

    // Helper para dar color a la acción
    getSeverityAccion(accion: string): 'success' | 'info' | 'danger' | 'warn' | undefined {
        switch (accion) {
            case 'CREACION': return 'success';     // Verde
            case 'MODIFICACION': return 'warn';    // Amarillo/Naranja
            case 'ELIMINACION': return 'danger';   // Rojo
            default: return 'info';
        }
    }

    abrirNuevoCatalogo() {
        this.catalogoItem = {
            tipoTecnologia: 'BATCH',
            versionIngreso: '',
            estado: true
        };
        this.esEdicionCatalogo = false;
        this.catalogoDialog = true;
    }

    confirmarBaja(item: CatalogoVector) {
        this.vectorAEliminar = item;
        this.versionRetiroInput = '';
        this.bajaDialog = true;
    }

    editarCatalogo(item: CatalogoVector) {
        this.catalogoItem = { ...item };
        this.esEdicionCatalogo = true;
        this.catalogoDialog = true;
    }

    ejecutarBaja() {
        if (!this.versionRetiroInput || !this.vectorAEliminar) {
            this.messageService.add({ severity: 'warn', detail: 'Indique la versión de retiro.' });
            return;
        }

        this.servicio.darBajaVector(this.vectorAEliminar.id, this.versionRetiroInput).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: `Vector dado de baja en v${this.versionRetiroInput}` });

                // Cerramos el diálogo
                this.bajaDialog = false;

                // Recargamos la tabla para ver el cambio (ahora saldrá rojo)
                this.cargarCatalogo();

                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo dar de baja el vector.' });
                this.loading = false;
            }
        });
    }

    guardarCatalogo() {
        // 1. Validaciones simples
        if (!this.catalogoItem.vectorId || !this.catalogoItem.nombre) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Complete ID y Nombre del vector.' });
            return;
        }

        // 2. Convertir y Asignar Periodo
        // IMPORTANTE: Aseguramos que el objeto tenga el periodo seleccionado actualmente
        const itemAGuardar = {
            ...this.catalogoItem,
            periodo: this.periodoSeleccionado()
        } as CatalogoVector;

        this.loading = true; // (Opcional) Activar spinner

        if (this.esEdicionCatalogo) {
            // === EDITAR ===
            // OJO: Aquí usualmente se usa el ID técnico (PK), asegúrate si tu backend espera 'id' o 'vectorId' en la URL.
            // Asumo que 'id' es la PK de la tabla.
            this.servicio.updateCatalogoVector(itemAGuardar.id, itemAGuardar).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Vector actualizado en catálogo' });
                    this.catalogoDialog = false;
                    this.cargarCatalogo();
                    this.loading = false;
                },
                error: (err) => {
                    console.error(err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar.' });
                    this.loading = false;
                }
            });
        } else {
            // === CREAR (Aquí manejamos el 409) ===
            this.servicio.createCatalogoVector(itemAGuardar).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Vector ${itemAGuardar.vectorId} creado.` });
                    this.catalogoDialog = false;
                    this.cargarCatalogo();
                    this.loading = false;
                },
                error: (err) => {
                    console.error(err);
                    this.loading = false;

                    // === CAPTURA DEL ERROR 409 ===
                    if (err.status === 409) {
                        this.messageService.add({
                            severity: 'warn',
                            summary: 'Ya existe',
                            detail: `El Vector ${itemAGuardar.vectorId} ya existe en el periodo ${itemAGuardar.periodo}.`
                        });
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No se pudo crear el vector.'
                        });
                    }
                }
            });
        }
    }

    gestionVersionesDialog: boolean = false;
    tipoGestion: 'ALTA' | 'BAJA' = 'ALTA'; // ALTA = Nuevos, BAJA = Eliminar
    versionForm = {
        codigo: '',       // Ej: "1.2"
        descripcion: '',
        listaIds: ''      // String para pegar IDs: "381, 400, 405"
    };

    abrirGestionVersiones() {
        // Reiniciamos el formulario
        this.versionForm = {
            codigo: '',
            descripcion: '',
            listaIds: ''
        };
        this.tipoGestion = 'ALTA'; // Por defecto Alta
        this.gestionVersionesDialog = true;
    }

    procesarVersion() {
        console.log('Procesando versión:', this.versionForm);
        // Aquí llamaremos al backend más adelante
        this.gestionVersionesDialog = false;
    }

    /**
     * Convierte la fecha string de Azure (que viene en UTC pero sin la 'Z')
     * a un objeto Date real interpretado como UTC.
     * Resultado: El navegador restará 3 o 4 horas automáticamente según corresponda.
     */
    fixFechaLog(fechaStr: string): Date {
        if (!fechaStr) return new Date();

        // 1. Si viene en formato SQL "2026-01-06 12:35:00", cambiamos espacio por 'T'
        let isoStr = fechaStr.replace(' ', 'T');

        // 2. IMPORTANTE: Si no termina en 'Z', se la agregamos.
        // La 'Z' le grita al navegador: "¡ESTO ES HORA ZULU (UTC)!"
        if (!isoStr.endsWith('Z')) {
            isoStr += 'Z';
        }

        return new Date(isoStr);
    }

    //Importacion masiva
    // 1. Abrir el diálogo
    abrirImportar() {
        this.importDialog = true;
        this.vectoresParaImportar = [];
        this.resumenImportacion = { total: 0, validos: 0, errores: [] };
    }

    // 2. Procesar el archivo Excel seleccionado
    onArchivoSeleccionado(event: any) {
        const file = event.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e: any) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Leemos el Excel como JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            this.procesarDatosImportados(jsonData);
        };
        reader.readAsArrayBuffer(file);

        // Limpiamos el uploader visualmente
        event.originalEvent.target.value = '';
    }

    // 3. Validar y transformar datos
    procesarDatosImportados(data: any[]) {
        this.vectoresParaImportar = [];
        const errores: string[] = [];
        const periodoActual = this.periodoSeleccionado();

        data.forEach((row: any, index) => {
            const fila = index + 2; // Ajuste por cabecera Excel

            // Validar campos obligatorios
            if (!row['RUT'] || !row['VECTOR'] || row['VALOR'] === undefined) {
                errores.push(`Fila ${fila}: Faltan datos obligatorios (RUT, VECTOR o VALOR).`);
                return;
            }

            // Normalizar RUT y DV
            const rutRaw = String(row['RUT']).replace(/\./g, '').replace(/-/g, '').trim();
            let rut = 0;
            let dv = '';

            // Si el RUT viene con DV pegado (ej: 12345678K) o separado
            if (row['DV']) {
                // Caso A: Columnas separadas (RUT: 123, DV: K)
                rut = parseInt(rutRaw, 10);
                dv = String(row['DV']).trim().toUpperCase();
            } else {
                // Caso B: Todo en la columna RUT (12345678K)
                const cuerpo = rutRaw.slice(0, -1);
                const digito = rutRaw.slice(-1).toUpperCase();

                if (!isNaN(Number(cuerpo)) && cuerpo.length > 0) {
                    rut = parseInt(cuerpo, 10);
                    dv = digito;
                } else {
                    // Si no pudimos separar cuerpo y dígito, asumimos que es un RUT sin DV o inválido
                    rut = parseInt(rutRaw, 10);
                    // Opcional: Podríamos marcar error aquí si exigimos DV
                }
            }

            // 3. Validar que el RUT sea un número válido
            if (isNaN(rut)) {
                errores.push(`Fila ${fila}: El RUT no tiene un formato numérico válido.`);
                return;
            }



            // Validar periodo (Si el excel no trae, usamos el seleccionado)
            const periodo = row['PERIODO'] ? parseInt(row['PERIODO'], 10) : periodoActual;

            // Construir objeto VectorData
            const vector: VectorData = {
                rut: rut,
                dv: dv,
                vector: parseInt(row['VECTOR'], 10),
                valor: Number(row['VALOR']),
                periodo: periodo,
                elvc_seq: 'CARGA_MASIVA', // Marca de origen
                intencionCarga: 'INSERT' // Por defecto, asumimos carga nueva
            };


            if (!this.validarRutChileno(vector.rut, vector.dv)) {
                errores.push(`Fila ${fila}: El RUT ${vector.rut}-${vector.dv} es inválido (Dígito Verificador incorrecto).`);
                return;
            }

            // Detección especial Vector 599 en Excel
            if (vector.vector === 599) {
                // Podrías agregar lógica aquí si quieres leer una columna "INTENCION" del Excel
                // Por ahora, lo forzamos a INSERT o pedimos que lo separen.
                if (String(row['TIPO']).toUpperCase() === 'MODIFICACION') {
                    vector.intencionCarga = 'UPDATE';
                }
            }

            this.vectoresParaImportar.push(vector);
        });

        this.resumenImportacion = {
            total: data.length,
            validos: this.vectoresParaImportar.length,
            errores: errores
        };

        if (errores.length > 0) {
            this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: `Se detectaron ${errores.length} filas con errores.` });
        }
    }

    // 4. Enviar al Backend
    confirmarImportacion() {
        if (this.vectoresParaImportar.length === 0) return;

        this.loadingImport = true;
        this.servicio.importarVectoresMasivos(this.vectoresParaImportar).subscribe({
            next: (resp) => {
                this.messageService.add({ severity: 'success', summary: 'Importación Exitosa', detail: `Se procesaron ${this.vectoresParaImportar.length} registros.` });
                this.importDialog = false;
                this.loadingImport = false;
                this.cargarDatos(); // Recargar tabla
            },
            error: (err) => {
                this.loadingImport = false;
                console.error('Error Import:', err);
                // Prioridad 1: Mensaje explícito enviado por el Backend (ej: "El vector 800 no existe")
                let detalleError = 'Ocurrió un error inesperado al procesar el archivo.';

                if (err.error) {
                    // A veces viene como objeto JSON { message: "...", ... }
                    if (err.error.mensaje) {
                        detalleError = err.error.mensaje;
                    }
                    // A veces viene como string plano si el backend devuelve text/plain
                    else if (typeof err.error === 'string') {
                        detalleError = err.error;
                    }
                }

                // Mostramos exactamente lo que dijo el Backend
                this.messageService.add({
                    severity: 'error',
                    summary: 'No se pudo cargar',
                    detail: detalleError,
                    life: 10000 // 10 segundos para que alcancen a leer
                });
            }
        });
    }

    // Helper para calcular DV si falta (opcional)
    calcularDV(rut: number): string {
        let suma = 0;
        let multiplicador = 2;
        const rutReverso = rut.toString().split('').reverse();
        for (let digit of rutReverso) {
            suma += parseInt(digit) * multiplicador;
            multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
        }
        const resto = 11 - (suma % 11);
        if (resto === 11) return '0';
        if (resto === 10) return 'K';
        return resto.toString();
    }


}