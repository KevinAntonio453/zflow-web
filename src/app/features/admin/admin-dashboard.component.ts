import { Component, inject, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { AnaliticaApiService, AdminMetricasResponse, AdminGraficasResponse } from '../../core/services/analitica-api.service';
import { TramitesApiService, DiagnosticoIaResponse } from '../../core/services/tramites-api.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'zf-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 p-6">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">Panel de Administración</h1>
        <p class="text-text-secondary">
          Bienvenido, {{ auth.user()?.nombre }}. Estas son las métricas globales del sistema.
        </p>
      </div>

      <!-- Tarjetas métricas -->
      @if (metricas(); as m) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-surface rounded-card p-5 border border-border shadow-card hover:border-primary-300 transition-colors">
            <div class="text-xs font-semibold text-text-secondary uppercase tracking-wider">Trámites activos</div>
            <div class="text-3xl font-extrabold text-text-primary mt-2">{{ m.tramitesActivos }}</div>
          </div>
          <div class="bg-surface rounded-card p-5 border border-border shadow-card hover:border-primary-300 transition-colors">
            <div class="text-xs font-semibold text-text-secondary uppercase tracking-wider">Políticas activas</div>
            <div class="text-3xl font-extrabold text-text-primary mt-2">{{ m.politicasActivas }}</div>
          </div>
          <div class="bg-surface rounded-card p-5 border border-border shadow-card hover:border-primary-300 transition-colors">
            <div class="text-xs font-semibold text-text-secondary uppercase tracking-wider">Funcionarios</div>
            <div class="text-3xl font-extrabold text-text-primary mt-2">{{ m.funcionarios }}</div>
          </div>
          <div class="bg-surface rounded-card p-5 border border-border shadow-card hover:border-primary-300 transition-colors">
            <div class="text-xs font-semibold text-text-secondary uppercase tracking-wider">Completados hoy</div>
            <div class="text-3xl font-extrabold text-text-primary mt-2">{{ m.tramitesCompletadosHoy }}</div>
          </div>
        </div>

        <!-- Sección de gráficas -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div class="bg-surface rounded-card p-5 border border-border shadow-card">
            <h3 class="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">Trámites por política (Últimos 7 días)</h3>
            <div class="relative h-64 w-full">
              <canvas #barChart></canvas>
            </div>
          </div>
          <div class="bg-surface rounded-card p-5 border border-border shadow-card">
            <h3 class="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">Tiempos de resolución (Horas promedio)</h3>
            <div class="relative h-64 w-full">
              <canvas #lineChart></canvas>
            </div>
          </div>
        </div>

        <!-- Tabla de últimos trámites -->
        <div class="bg-surface rounded-card border border-border shadow-card p-5 mt-6">
          <h3 class="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">Últimos 10 trámites</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-border text-xs font-semibold text-text-secondary uppercase">
                  <th class="pb-3">Política</th>
                  <th class="pb-3">Paso Actual</th>
                  <th class="pb-3">Cliente</th>
                  <th class="pb-3">Creado</th>
                  <th class="pb-3">Prioridad</th>
                  <th class="pb-3">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border text-sm text-text-primary">
                @for (t of m.ultimosTramites; track t.id) {
                  <tr (click)="abrirDiagnostico(t.id)" class="hover:bg-background/50 transition-colors cursor-pointer" title="Hacé clic para ver el Diagnóstico de IA">
                    <td class="py-3 font-medium">{{ t.politicaNombre }}</td>
                    <td class="py-3">{{ t.pasoActualNombre || 'Finalizado' }}</td>
                    <td class="py-3 text-text-secondary text-xs truncate max-w-[180px]" [title]="t.clienteNombre || t.clienteId">{{ t.clienteNombre || t.clienteId }}</td>
                    <td class="py-3 text-xs text-text-secondary">{{ t.createdAt | date:'short' }}</td>
                    <td class="py-3">
                      @if (t.prioridad) {
                        <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider"
                              [class]="t.prioridad === 'alta' ? 'bg-danger/10 text-danger' : t.prioridad === 'media' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'">
                          {{ t.prioridad }}
                        </span>
                      } @else {
                        <span class="text-text-secondary">—</span>
                      }
                    </td>
                    <td class="py-3">
                      <span class="px-2 py-0.5 text-xs font-medium rounded"
                            [class]="t.estado === 'COMPLETADO' ? 'bg-accent-50/10 text-accent-500' : 'bg-warning/10 text-warning'">
                        {{ t.estado }}
                      </span>
                    </td>
                  </tr>
                }
                @if (m.ultimosTramites.length === 0) {
                  <tr>
                    <td colspan="6" class="py-6 text-center text-text-secondary italic">No hay trámites registrados.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      } @else {
        <p class="text-text-secondary animate-pulse">Cargando métricas del sistema...</p>
      }

      <!-- Modal Diagnóstico IA -->
      @if (showDiagnosticoModal()) {
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all duration-300">
          <div class="bg-surface border border-border w-full max-w-lg rounded-card shadow-dropdown p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div class="flex justify-between items-center pb-3 border-b border-border">
              <div>
                <h3 class="text-base font-bold text-text-primary uppercase tracking-wide">Diagnóstico de Enrutamiento Inteligente</h3>
                <span class="text-xs text-text-secondary">Trámite ID: <strong class="font-mono">{{ diagnostico()?.tramiteId }}</strong></span>
              </div>
              <button (click)="cerrarDiagnostico()" class="text-text-secondary hover:text-text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            @if (cargandoDiagnostico()) {
              <div class="flex flex-col items-center justify-center py-10 space-y-3">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                <span class="text-xs text-primary-600 font-semibold uppercase tracking-wider animate-pulse">Calculando predicciones de TensorFlow...</span>
              </div>
            } @else if (diagnostico(); as diag) {
              <div class="space-y-5">
                
                <div class="p-3 bg-background rounded-input border border-border text-xs space-y-1.5">
                  <div class="flex justify-between">
                    <span class="text-text-secondary">Política:</span>
                    <strong class="text-text-primary">{{ diag.politicaNombre }}</strong>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-text-secondary">Paso Actual:</span>
                    <strong class="text-text-primary">{{ diag.actividadNombre }}</strong>
                  </div>
                </div>

                <div class="flex justify-between items-center p-3 rounded-input border border-border">
                  <span class="text-xs font-semibold text-text-secondary uppercase">Prioridad Recomendada:</span>
                  <span class="px-2.5 py-1 text-[10px] font-bold rounded uppercase tracking-wider"
                    [class]="diag.prioridadLabel === 'alta' ? 'bg-danger/10 text-danger border border-danger/20' : diag.prioridadLabel === 'media' ? 'bg-warning/10 text-warning border border-warning/20' : 'bg-success/10 text-success border border-success/20'">
                    {{ diag.prioridadLabel }} ({{ diag.prioridadScore }})
                  </span>
                </div>

                <div class="space-y-2">
                  <div class="flex justify-between text-xs font-semibold text-text-secondary uppercase">
                    <span>Riesgo de Demora SLA:</span>
                    <span [class]="diag.riesgoDemora > 0.6 ? 'text-danger' : diag.riesgoDemora > 0.3 ? 'text-warning' : 'text-success'">
                      {{ diag.riesgoDemora * 100 | number:'1.0-0' }}%
                    </span>
                  </div>
                  <div class="w-full bg-border rounded-full h-2">
                    <div class="h-2 rounded-full transition-all duration-500"
                      [class]="diag.riesgoDemora > 0.6 ? 'bg-danger' : diag.riesgoDemora > 0.3 ? 'bg-warning' : 'bg-accent-500'"
                      [style.width.%]="diag.riesgoDemora * 100">
                    </div>
                  </div>
                </div>

                @if (diag.anomaliaDetectada) {
                  <div class="p-4 rounded-input border border-red-200 bg-red-50/50 text-red-800 text-xs space-y-1.5 flex items-start gap-2.5">
                    <svg class="flex-shrink-0 text-red-600 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-red-600"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <div>
                      <span class="font-bold block uppercase tracking-wider mb-0.5 text-red-700">Alerta de Anomalía Detectada</span>
                      <p class="leading-relaxed text-[11px]">Esta tarea presenta una desviación significativa respecto al comportamiento histórico en su duración, volumen o secuencia (score: {{ diag.anomaliaScore }}).</p>
                    </div>
                  </div>
                } @else {
                  <div class="p-3 rounded-input border border-emerald-100 bg-emerald-50/30 text-emerald-800 text-xs flex items-center gap-2">
                    <svg class="flex-shrink-0 text-emerald-600" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    <span class="font-medium text-[11px]">Comportamiento normal (sin anomalías detectadas).</span>
                  </div>
                }

                <div class="p-3 bg-background rounded-input border border-border text-xs flex justify-between items-center">
                  <span class="text-text-secondary">Ruta Óptima Sugerida:</span>
                  <span class="font-mono font-semibold px-2 py-0.5 bg-primary-50 text-primary-700 border border-primary-100 rounded text-[11px] uppercase tracking-wide">
                    {{ diag.rutaOptimaSugerida }}
                  </span>
                </div>

                @if (diag.sugerenciaReenrutamiento) {
                  <div class="p-4 bg-indigo-50 border border-indigo-200 rounded-input text-xs space-y-3">
                    <div class="flex items-start gap-2">
                      <svg class="flex-shrink-0 text-indigo-600 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                      <div>
                        <span class="font-bold block text-indigo-800 uppercase tracking-wide mb-0.5">Propuesta de Reenrutamiento Inteligente</span>
                        <p class="text-[11px] leading-relaxed text-indigo-700">{{ diag.sugerenciaReenrutamiento }}</p>
                      </div>
                    </div>
                    
                    <div class="flex gap-2 pt-1">
                      <button type="button"
                        (click)="aplicarReenrutamiento(diag.tramiteId, diag.candidatoReenrutamientoId!)"
                        [disabled]="enviandoReenrutamiento()"
                        class="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold transition-colors disabled:opacity-50">
                        {{ enviandoReenrutamiento() ? 'Procesando...' : 'Aprobar Reenrutamiento' }}
                      </button>
                      <button type="button"
                        (click)="cerrarDiagnostico()"
                        [disabled]="enviandoReenrutamiento()"
                        class="px-3 py-1.5 bg-transparent border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-semibold transition-colors disabled:opacity-50">
                        Rechazar
                      </button>
                    </div>
                  </div>
                }

              </div>
            }

            <div class="pt-2 border-t border-border flex justify-end">
              <button 
                (click)="cerrarDiagnostico()"
                [disabled]="enviandoReenrutamiento()"
                class="px-4 py-2 bg-background border border-border text-text-primary rounded-button text-xs font-semibold hover:bg-border transition-colors disabled:opacity-50">
                Cerrar Panel
              </button>
            </div>
            
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  private readonly analiticaApi = inject(AnaliticaApiService);

  protected metricas = signal<AdminMetricasResponse | null>(null);
  
  showDiagnosticoModal = signal(false);
  cargandoDiagnostico = signal(false);
  enviandoReenrutamiento = signal(false);
  diagnostico = signal<DiagnosticoIaResponse | null>(null);

  protected readonly tramitesApi = inject(TramitesApiService);
  
  @ViewChild('barChart') private barChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChart') private lineChartRef!: ElementRef<HTMLCanvasElement>;

  private barChartInstance?: Chart;
  private lineChartInstance?: Chart;
  private graficasData?: AdminGraficasResponse;

  ngOnInit() {
    this.analiticaApi.getAdminMetricas().subscribe({
      next: (data) => this.metricas.set(data),
      error: (err) => console.error('Error cargando métricas', err)
    });
  }

  abrirDiagnostico(tramiteId: string) {
    this.showDiagnosticoModal.set(true);
    this.cargandoDiagnostico.set(true);
    this.diagnostico.set(null);

    this.tramitesApi.getDiagnosticoIa(tramiteId).subscribe({
      next: (data) => {
        this.diagnostico.set(data);
        this.cargandoDiagnostico.set(false);
      },
      error: (err) => {
        this.cargandoDiagnostico.set(false);
        alert('No se pudo cargar el diagnóstico de la IA: ' + (err.error?.message || err.message));
        this.cerrarDiagnostico();
      }
    });
  }

  cerrarDiagnostico() {
    this.showDiagnosticoModal.set(false);
    this.diagnostico.set(null);
  }

  aplicarReenrutamiento(tramiteId: string, nuevoResponsableId: string) {
    this.enviandoReenrutamiento.set(true);
    this.tramitesApi.aplicarReenrutamiento(tramiteId, nuevoResponsableId).subscribe({
      next: () => {
        this.enviandoReenrutamiento.set(false);
        this.cerrarDiagnostico();
        this.ngOnInit();
      },
      error: (err) => {
        this.enviandoReenrutamiento.set(false);
        alert('Error al aplicar el reenrutamiento: ' + (err.error?.message || err.message));
      }
    });
  }

  ngAfterViewInit() {
    this.analiticaApi.getAdminGraficas().subscribe({
      next: (data) => {
        this.graficasData = data;
        this.renderCharts();
      },
      error: (err) => console.error('Error cargando gráficas', err)
    });
  }

  private renderCharts() {
    if (!this.graficasData) return;

    const ctxBar = this.barChartRef?.nativeElement?.getContext('2d');
    if (ctxBar) {
      const labels = this.graficasData.tramitesPorPolitica.map(p => p.politicaNombre);
      const data = this.graficasData.tramitesPorPolitica.map(p => p.cantidad);

      this.barChartInstance = new Chart(ctxBar, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Cantidad de Trámites',
            data,
            backgroundColor: 'rgba(37, 99, 235, 0.7)',
            borderColor: '#2563EB',
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    const ctxLine = this.lineChartRef?.nativeElement?.getContext('2d');
    if (ctxLine) {
      const labels = this.graficasData.tiemposAtencionPromedio.map(d => d.fecha);
      const data = this.graficasData.tiemposAtencionPromedio.map(d => d.valor);

      this.lineChartInstance = new Chart(ctxLine, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Horas promedio',
            data,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.barChartInstance) this.barChartInstance.destroy();
    if (this.lineChartInstance) this.lineChartInstance.destroy();
  }
}
