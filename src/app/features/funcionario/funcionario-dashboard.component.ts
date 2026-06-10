import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { AnaliticaApiService, FuncionarioMetricasResponse } from '../../core/services/analitica-api.service';
import { Tramite } from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'zf-funcionario-dashboard',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  template: `
    <div class="space-y-6">
      <!-- Cabecera y Bienvenida -->
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-2xl font-bold text-text-primary">Dashboard de Funcionario</h1>
          <p class="text-text-secondary text-sm">
            Hola, {{ auth.user()?.nombre }}. Revisá las métricas de tu desempeño y tareas prioritarias.
          </p>
        </div>
        <button
          type="button"
          (click)="irBandeja()"
          class="px-4 py-2 rounded-button bg-primary-500 text-white hover:bg-primary-600 text-sm font-semibold transition-colors shadow-sm"
        >
          Ver bandeja de tareas completa
        </button>
      </div>

      @if (loading()) {
        <div class="flex flex-col items-center justify-center p-12">
          <zf-loading-spinner size="lg" />
          <p class="text-text-secondary text-sm mt-3 animate-pulse">Cargando métricas de tu panel...</p>
        </div>
      } @else if (error()) {
        <div class="p-4 rounded-card border border-danger text-sm text-danger bg-danger/10" role="alert">
          {{ error() }}
        </div>
      } @else if (metricas(); as m) {
        <!-- Fila de KPIs (Tarjetas analíticas) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- KPI 1: Pendientes -->
          <div class="bg-surface border border-border rounded-card p-4 shadow-sm flex flex-col justify-between">
            <div>
              <span class="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">Tareas Asignadas</span>
              <span class="text-3xl font-extrabold text-text-primary block">{{ m.tareasPendientes }}</span>
            </div>
            <p class="text-xs text-text-secondary mt-3">Pendientes de procesar en tu bandeja.</p>
          </div>

          <!-- KPI 2: Completados hoy/semana -->
          <div class="bg-surface border border-border rounded-card p-4 shadow-sm flex flex-col justify-between">
            <div>
              <span class="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">Tu Productividad</span>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-extrabold text-text-primary">{{ m.tareasCompletadasHoy }}</span>
                <span class="text-xs text-text-secondary font-medium">hoy</span>
                <span class="text-text-secondary">/</span>
                <span class="text-xl font-bold text-text-primary">{{ m.tareasCompletadasSemana }}</span>
                <span class="text-xs text-text-secondary font-medium">semana</span>
              </div>
            </div>
            <p class="text-xs text-text-secondary mt-3">Tareas resueltas acumuladas.</p>
          </div>

          <!-- KPI 3: Tiempo promedio de resolución -->
          <div class="bg-surface border border-border rounded-card p-4 shadow-sm flex flex-col justify-between">
            <div>
              <span class="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">Resolución Promedio</span>
              <span class="text-3xl font-extrabold text-text-primary block">
                {{ m.tiempoResolucionPromedio > 0 ? m.tiempoResolucionPromedio + ' hs' : 'Sin datos' }}
              </span>
            </div>
            <p class="text-xs text-text-secondary mt-3">Tiempo medio de atención por paso.</p>
          </div>

          <!-- KPI 4: Carga del departamento -->
          <div class="bg-surface border border-border rounded-card p-4 shadow-sm flex flex-col justify-between">
            <div>
              <span class="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">Carga del Departamento</span>
              <span class="text-3xl font-extrabold text-text-primary block">{{ m.cargaTrabajoDepartamento }}</span>
            </div>
            <p class="text-xs text-text-secondary mt-3">Tareas totales activas en tu equipo.</p>
          </div>
        </div>

        <!-- Sección: Tareas de Atención Prioritaria -->
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b border-border pb-2">
            <h2 class="text-lg font-bold text-text-primary">Tareas de atención prioritaria</h2>
            <span class="text-xs text-text-secondary font-medium">Sugeridas por el recomendador IA</span>
          </div>

          @if (m.tareasPrioritarias.length === 0) {
            <div class="bg-surface border border-border p-8 rounded-card text-center text-text-secondary">
              No tenés tareas pendientes asignadas para procesar en este momento.
            </div>
          } @else {
            <div class="grid grid-cols-1 gap-3">
              @for (t of m.tareasPrioritarias; track t.id) {
                <div
                  (click)="verDetalle(t)"
                  class="bg-surface border border-border p-4 rounded-card shadow-sm hover:shadow-md hover:border-primary-300 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div class="space-y-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-bold text-text-primary text-base">{{ t.politicaNombre }}</span>
                      <span class="text-xs text-text-secondary font-medium">• Paso: {{ t.pasoActualNombre }}</span>
                    </div>
                    <p class="text-xs text-text-secondary">
                      Creado el {{ t.createdAt | date:'short' }}
                    </p>
                  </div>

                  <div class="flex items-center gap-3 justify-between sm:justify-end">
                    <!-- Badge de Prioridad y Score -->
                    <div class="flex items-center gap-1.5">
                      <span
                        class="px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider"
                        [class]="getPrioridadClass(t.prioridadScore ?? 0)"
                      >
                        {{ getPrioridadLabel(t.prioridadScore ?? 0) }}
                      </span>
                      <span class="text-xs text-text-secondary font-semibold">
                        Score: {{ t.prioridadScore }}
                      </span>
                    </div>
                    
                    <span class="text-text-secondary text-lg hidden sm:inline">→</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class FuncionarioDashboardComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly analiticaApi = inject(AnaliticaApiService);
  private readonly router = inject(Router);

  protected readonly metricas = signal<FuncionarioMetricasResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit() {
    this.cargarMetricas();
  }

  private cargarMetricas() {
    this.loading.set(true);
    this.error.set(null);
    this.analiticaApi.getFuncionarioMetricas().subscribe({
      next: (data) => {
        this.metricas.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando métricas del funcionario', err);
        this.error.set('No se pudieron cargar las métricas de tu dashboard.');
        this.loading.set(false);
      }
    });
  }

  protected getPrioridadClass(score: number): string {
    if (score >= 70) {
      return 'bg-danger/10 text-danger border border-danger/20';
    } else if (score >= 40) {
      return 'bg-warning/10 text-warning border border-warning/20';
    } else {
      return 'bg-success/10 text-success border border-success/20';
    }
  }

  protected getPrioridadLabel(score: number): string {
    if (score >= 70) {
      return 'Alta';
    } else if (score >= 40) {
      return 'Media';
    } else {
      return 'Baja';
    }
  }

  protected irBandeja() {
    this.router.navigate(['/funcionario/tareas']);
  }

  protected verDetalle(tramite: Tramite) {
    this.router.navigate(['/funcionario/tareas']);
  }
}
