import { ChangeDetectorRef, Component, effect, inject, OnInit, signal, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// --- PrimeNG ---
import { AutoCompleteModule  } from 'primeng/autocomplete'; 
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton'; 
import { ChartModule } from 'primeng/chart'; 
import { SidebarModule } from 'primeng/sidebar'; 
import { OrderListModule } from 'primeng/orderlist';
import { InputSwitchModule } from 'primeng/inputswitch';
import { SelectModule } from 'primeng/select';

import { GridsterConfig, GridsterItem, GridsterModule, GridsterComponentInterface  } from 'angular-gridster2';
import { Usuario } from '../../models/usuario';
import { UsuarioService } from '../../services/usuario.service';
import { AutenticacionService } from '../../services/autenticacion.service';

import { DashboardData } from '../../models/dashboard';
import { ProyectoService } from '../../services/proyecto.service';
import { DashboardService } from '../../services/dashboard.service';

//Dashboard
import { KpiCardComponent } from './widgets/kpi-card.component';
import { ChartWidgetComponent } from './widgets/chart-widget.component';

@Component({
    standalone: true,
    selector: 'app-dashboard',
    imports: [CommonModule,
                FormsModule, 
                ButtonModule,
                GridsterModule,
                AutoCompleteModule, 
                SelectButtonModule,
                ChartModule,
                KpiCardComponent,
                ChartWidgetComponent,
                SidebarModule,
                OrderListModule,   
                InputSwitchModule ,
                SelectModule 
            
            ],
    templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit{
    private usuarioService = inject(UsuarioService); 
    private authService = inject(AutenticacionService);
    private proyectoService = inject(ProyectoService); 
    private dashboardService = inject(DashboardService);
    private cdr = inject(ChangeDetectorRef);
    private zone = inject(NgZone); 


  
    opcionesDeVista: any[] = [
        { label: 'Vista General', value: 'general' },
        { label: 'Mi Vista', value: 'personal' },
        { label: 'Otro Usuario', value: 'otro-usuario' }
    ];
    vistaSeleccionada = signal<'general' | 'personal' | 'otro-usuario'>('general');

    

    todosLosUsuarios = signal<Usuario[]>([]);
    usuarioSeleccionado = signal<Usuario | null>(null);

    usuarioActual = this.authService.usuarioActual;

    // Opciones para los Gráficos ---
    chartOptions: any;
    doughnutOptions: any;


    // --- Estado de los Datos del Dashboard ---
    dashboardData = signal<DashboardData | null>(null); 
    loading = signal(true); 

    // --- Configuración de Gridster2 ---
    options!: GridsterConfig;      
    dashboard!: Array<GridsterItem>; 

    configSidebarVisible: boolean = false;
    // Esta será la lista que se muestra y se manipula en el panel de configuración
    widgetsConfig: any[] = []; 
    
    constructor() {

        // Este effect se re-ejecutará automáticamente cada vez que cambie
        // el proyecto, la vista o el usuario seleccionado.
        effect(() => {
            const proyecto = this.proyectoService.proyectoSeleccionado();
            const vista = this.vistaSeleccionada();
            const usuarioLogueado = this.usuarioActual();
            const otroUsuario = this.usuarioSeleccionado();

            if (!proyecto) return; // Si no hay proyecto, no hacemos nada

            this.loading.set(true);
            let usuarioIdParaApi: number | undefined = undefined;


            // --- LÓGICA DE VISTAS MEJORADA ---
            if (vista === 'personal' && usuarioLogueado) {
                usuarioIdParaApi = usuarioLogueado.idUsuario;
            } else if (vista === 'otro-usuario' && otroUsuario) {
                usuarioIdParaApi = otroUsuario.idUsuario;
            }
            // Si la vista es 'general', usuarioIdParaApi se queda como undefined, lo cual es correcto.
            
            // Solo llamamos a la API si tenemos los datos necesarios
            if ( (vista === 'personal' && usuarioIdParaApi) || 
                (vista === 'otro-usuario' && usuarioIdParaApi) ||
                vista === 'general' ) {
                this.cargarDashboardData(proyecto.id_proyecto, usuarioIdParaApi);
            }

            
        });


        
         effect(() => {
            if (this.usuarioActual() && !this.usuarioSeleccionado()) {
                this.usuarioSeleccionado.set(this.usuarioActual());
            }
        });
    }

    ngOnInit(): void {
        this.cargarTodosLosUsuarios();
        this.configurarLayout(); 
        this.configurarOpcionesGraficos();
    
    }

    cargarDashboardData(proyectoId: number, usuarioId?: number) {
        this.loading.set(true);
        this.dashboardService.getDashboardData(proyectoId, usuarioId).subscribe(data => {
            this.dashboardData.set(data);
            this.loading.set(false);
            
           this.cdr.detectChanges(); 
            
        });
    }
    
    cargarTodosLosUsuarios() {
        this.usuarioService.getUsuarios().subscribe(data => {
            const usuariosActivos = data.filter(usuario => usuario.activo === 1);
            this.todosLosUsuarios.set(usuariosActivos);
        });
    }
    
    onVistaChange() {
        // Si el usuario cambia a una vista que no es "Por Usuario",
        // limpiamos la selección para evitar confusiones.
        if (this.vistaSeleccionada() !== 'otro-usuario') {
            this.usuarioSeleccionado.set(null);
        }
    }

    configurarLayout() {
        // Definimos todos los widgets disponibles y su configuración por defecto
        const layoutPorDefecto = [
            { cols: 3, rows: 1, y: 0, x: 0, type: 'kpi', title: 'Total Casos', visible: true },
            { cols: 3, rows: 1, y: 0, x: 3, type: 'kpi', title: 'Total Ejecuciones', visible: true },
            { cols: 3, rows: 1, y: 0, x: 6, type: 'kpi', title: 'Casos Sin Ejecutar', visible: true },
            { cols: 3, rows: 1, y: 0, x: 9, type: 'kpi', title: 'Promedio Ejecuciones/Día', visible: true },
            { cols: 6, rows: 2, y: 1, x: 0, type: 'chart', title: 'Estado de Ejecuciones', visible: true },
            { cols: 6, rows: 2, y: 1, x: 6, type: 'chart', title: 'Actividad Semanal', visible: true }
        ];

        // Intentamos cargar la configuración guardada del usuario desde localStorage
        const layoutGuardado = localStorage.getItem('dashboard-layout');
        if (layoutGuardado) {
            this.widgetsConfig = JSON.parse(layoutGuardado);
        } else {
            this.widgetsConfig = layoutPorDefecto;
        }

        this.actualizarDashboardDesdeConfig();
        this.configurarOpcionesGridster(); 
    }

    actualizarDashboardDesdeConfig() {
        // Filtramos solo los widgets que el usuario quiere ver
        this.dashboard = this.widgetsConfig.filter(widget => widget.visible);
    }

    abrirPanelConfiguracion() {
        // Clonamos la configuración para no afectar el dashboard principal mientras editamos
        this.widgetsConfig = JSON.parse(JSON.stringify(this.widgetsConfig));
        this.configSidebarVisible = true;
    }

    guardarConfiguracionEnLocalStorage() {
        // Guardamos la configuración (orden y visibilidad) en localStorage
        localStorage.setItem('dashboard-layout', JSON.stringify(this.widgetsConfig));
        this.actualizarDashboardDesdeConfig();
    }

    private configurarOpcionesGridster() {
        this.options = {
            gridType: 'fit',
            draggable: { enabled: true },
            resizable: { enabled: true },
            minCols: 12,
            maxCols: 12,
            minRows: 3,
            mobileBreakpoint: 640,
            margin: 10,
            // La API es la forma correcta de interactuar
            api: {
                optionsChanged: () => {},
            },
        };
    }

    private configurarOpcionesGraficos() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

        this.doughnutOptions = {
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor
                    }
                }
            }
        };

        this.chartOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder
                    }
                },
                x: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder
                    }
                }
            }
        };
    }


}
