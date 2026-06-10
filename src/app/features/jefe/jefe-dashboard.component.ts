import { Component, inject, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { AnaliticaApiService, JefeMetricasResponse } from '../../core/services/analitica-api.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'zf-jefe-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 p-6">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">Panel de Jefe de Departamento</h1>
        <p class="text-text-secondary">
          Hola, {{ auth.user()?.nombre }}. Controlá el rendimiento y la carga de tareas de tu área.
        </p>
      </div>

      <!-- Tarjetas métricas -->
      @if (metricas(); as m) {
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-surface rounded-card p-5 border border-border shadow-card hover:border-primary-300 transition-colors">
            <div class="text-xs font-semibold text-text-secondary uppercase tracking-wider">Tareas pendientes</div>
            <div class="text-3xl font-extrabold text-text-primary mt-2">{{ m.tareasPendientes }}</div>
          </div>
          <div class="bg-surface rounded-card p-5 border border-border shadow-card hover:border-danger transition-colors">
            <div class="text-xs font-semibold text-text-secondary uppercase tracking-wider">En riesgo (SLA)</div>
            <div class="text-3xl font-extrabold text-danger mt-2">{{ m.tareasEnRiesgo }}</div>
          </div>
          <div class="bg-surface rounded-card p-5 border border-border shadow-card hover:border-accent-500 transition-colors">
            <div class="text-xs font-semibold text-text-secondary uppercase tracking-wider">Completadas hoy</div>
            <div class="text-3xl font-extrabold text-accent-500 mt-2">{{ m.tareasCompletadasHoy }}</div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <!-- Carga de funcionarios (Chart.js) -->
          <div class="bg-surface rounded-card p-5 border border-border shadow-card lg:col-span-2">
            <h3 class="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">Carga de trabajo por funcionario</h3>
            <div class="relative h-64 w-full">
              <canvas #workloadChart></canvas>
            </div>
          </div>

          <!-- Resumen de funcionarios lista -->
          <div class="bg-surface rounded-card p-5 border border-border shadow-card">
            <h3 class="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">Mi Equipo</h3>
            <div class="divide-y divide-border text-sm max-h-64 overflow-y-auto pr-1">
              @for (func of m.cargaTrabajoFuncionario; track func.nombre) {
                <div class="py-3 flex justify-between items-center">
                  <span class="font-medium text-text-primary">{{ func.nombre }}</span>
                  <span class="px-2 py-1 text-xs font-semibold rounded-full bg-primary-50 text-primary-600">
                    {{ func.tareasPendientes }} tareas
                  </span>
                </div>
              }
              @if (m.cargaTrabajoFuncionario.length === 0) {
                <p class="py-6 text-center text-text-secondary italic">No hay funcionarios registrados en tu departamento.</p>
              }
            </div>
          </div>
        </div>

        <!-- Trámites en curso en el departamento -->
        <div class="bg-surface rounded-card border border-border shadow-card p-5 mt-6">
          <h3 class="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">Trámites en proceso (Área)</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-border text-xs font-semibold text-text-secondary uppercase">
                  <th class="pb-3">Política</th>
                  <th class="pb-3">Paso Actual</th>
                  <th class="pb-3">Cliente</th>
                  <th class="pb-3">Última Modificación</th>
                  <th class="pb-3">Prioridad</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border text-sm text-text-primary">
                @for (t of m.tramitesPausados; track t.id) {
                  <tr class="hover:bg-background/50 transition-colors">
                    <td class="py-3 font-medium">{{ t.politicaNombre }}</td>
                    <td class="py-3">{{ t.pasoActualNombre }}</td>
                    <td class="py-3 text-text-secondary text-xs truncate max-w-[180px]" [title]="t.clienteNombre || t.clienteId">{{ t.clienteNombre || t.clienteId }}</td>
                    <td class="py-3 text-xs text-text-secondary">{{ t.updatedAt | date:'short' }}</td>
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
                  </tr>
                }
                @if (m.tramitesPausados.length === 0) {
                  <tr>
                    <td colspan="5" class="py-6 text-center text-text-secondary italic">No se registran trámites activos en tu departamento.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      } @else {
        <p class="text-text-secondary animate-pulse">Cargando datos del departamento...</p>
      }
    </div>
  `,
})
export class JefeDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  private readonly analiticaApi = inject(AnaliticaApiService);

  protected metricas = signal<JefeMetricasResponse | null>(null);

  @ViewChild('workloadChart') private chartRef!: ElementRef<HTMLCanvasElement>;
  private chartInstance?: Chart;

  ngOnInit() {
    this.analiticaApi.getJefeMetricas().subscribe({
      next: (data) => {
        this.metricas.set(data);
        setTimeout(() => this.renderWorkloadChart(), 50);
      },
      error: (err) => console.error('Error cargando métricas de jefe', err)
    });
  }

  ngAfterViewInit() {
    this.renderWorkloadChart();
  }

  private renderWorkloadChart() {
    const data = this.metricas();
    if (!data || !this.chartRef) return;

    const ctx = this.chartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const labels = data.cargaTrabajoFuncionario.map(f => f.nombre);
    const workloads = data.cargaTrabajoFuncionario.map(f => f.tareasPendientes);

    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Tareas Asignadas',
          data: workloads,
          backgroundColor: 'rgba(37, 99, 235, 0.7)',
          borderColor: '#2563EB',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
          y: { grid: { display: false } }
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }
}
