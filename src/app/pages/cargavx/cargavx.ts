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

@Component({
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule, ToolbarModule, InputSwitchModule,
        DialogModule, InputTextModule, InputNumberModule, ToastModule, TabViewModule, RadioButtonModule,
        ConfirmDialogModule, FieldsetModule, TagModule, TooltipModule, InputTextModule, SelectModule, DropdownModule
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

    // Señales para los logs
    logs = signal<VectorLog[]>([]);
    logDialog: boolean = false;
    loadingLogs: boolean = false;

    ordenamientoInicial: SortMeta[] = [];

    catalogo = signal<CatalogoVector[]>([]);
    catalogoDialog: boolean = false;
    catalogoItem: Partial<CatalogoVector> = {};
    esEdicionCatalogo: boolean = false;

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

        this.servicio.descargarTXT().subscribe({
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
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el archivo.' });
            }
        });
    }

    cargarDatos() {
        this.loading = true;
        const periodo = this.periodoSeleccionado();
        this.servicio.getVectores(periodo).subscribe({
            next: (data) => {
                // Recorremos los datos y les agregamos la propiedad 'tipo' calculada
                const datosEnriquecidos = data.map(item => {
                    return {
                        ...item,

                        tipo: this.getTipoVector(item.vector)
                    };
                });

                this.vectores.set(datosEnriquecidos);
                this.actualizarVista();
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
        this.actualizarVista();

        if (this.filtrandoDuplicados()) {
            this.messageService.add({ severity: 'info', summary: 'Filtro Activo', detail: 'Mostrando solo registros duplicados.' });
        } else {
            this.messageService.add({ severity: 'info', summary: 'Filtro Inactivo', detail: 'Mostrando todos los registros.' });
        }
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

        // Validaciones básicas
        if (!this.vector.rut || !this.vector.dv || !this.vector.periodo || !this.vector.vector) {
            return;
        }

        if (!this.validarRutChileno(this.vector.rut, this.vector.dv)) {
            this.messageService.add({ severity: 'warn', summary: 'RUT Inválido', detail: 'El dígito verificador no corresponde al RUT ingresado.' });
            return;
        }

        // Si es edición, actualizamos directamente (asumimos que el usuario sabe lo que hace al editar)
        // Opcional: Podrías validar también en edición si cambian los campos clave.
        if (this.esEdicion) {
            this.ejecutarGuardado();
            return;
        }

        // === FLUJO NUEVO: VERIFICACIÓN PREVIA ===
        // Antes de guardar, consultamos al backend
        this.loading = true; // Feedback visual sutil

        this.servicio.verificarExistencia(this.vector.rut, this.vector.periodo, this.vector.vector)
            .subscribe({
                next: (existe) => {
                    this.loading = false;

                    if (existe) {
                        // CASO: YA EXISTE -> PREGUNTAR AL USUARIO
                        this.confirmationService.confirm({
                            header: 'Registro Duplicado',
                            message: `Ya existe un registro con RUT ${this.vector.rut}, Periodo ${this.vector.periodo} y Vector ${this.vector.vector}.<br><br>¿Desea guardarlo de todas formas?`,
                            icon: 'pi pi-exclamation-circle',
                            acceptLabel: 'Sí, Guardar',
                            rejectLabel: 'Cancelar',
                            acceptButtonStyleClass: 'p-button-warning', // Color amarillo de advertencia
                            accept: () => {
                                // Si acepta, procedemos a guardar
                                this.ejecutarGuardado();
                            }
                        });
                    } else {
                        // CASO: NO EXISTE -> GUARDAR DIRECTAMENTE
                        this.ejecutarGuardado();
                    }
                    this.cargarDatos()
                },
                error: (err) => {
                    this.loading = false;
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo verificar la existencia del registro.' });
                }
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

        this.servicio.descargarSQL().subscribe({
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
                if (campo === 'principal') {
                    this.vector.rut = Number(partes[0]);
                    this.vector.dv = partes[1];
                } else {
                    this.vector.rut2 = Number(partes[0]);
                    this.vector.dv2 = partes[1];
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


}