import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Notificacion } from '../../core/models';
import { NotificacionesApiService } from '../../core/services/notificaciones-api.service';

@Component({
  selector: 'zf-notificaciones',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto bg-surface rounded-card border border-border shadow-card p-6 flex flex-col h-full">
      <div class="flex justify-between items-center border-b border-border pb-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text-primary">Notificaciones</h1>
          <p class="text-sm text-text-secondary">Historial de alertas y asignaciones de tareas</p>
        </div>
        <button 
          (click)="marcarTodasComoLeidas()"
          [disabled]="cargando() || notificaciones().length === 0"
          class="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-button text-sm font-medium transition-colors"
        >
          Marcar todas como leídas
        </button>
      </div>

      @if (cargando()) {
        <div class="flex justify-center items-center py-20 flex-1">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
        </div>
      } @else {
        <div class="flex-1 overflow-y-auto space-y-4">
          @if (notificaciones().length === 0) {
            <div class="text-center py-20 italic text-text-secondary">
              No tienes notificaciones registradas.
            </div>
          } @else {
            @for (n of notificaciones(); track n.id) {
              <div 
                (click)="leerNotificacion(n)"
                [class.border-l-4]="!n.leida"
                [class.border-primary-500]="!n.leida"
                [class.bg-primary-50]="!n.leida"
                [class.dark:bg-primary-950/10]="!n.leida"
                class="p-4 bg-surface border border-border rounded-card hover:bg-background dark:hover:bg-primary-900/10 cursor-pointer transition-all flex justify-between items-start gap-4"
              >
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span 
                      [class.bg-primary-500]="n.tipo === 'TAREA_ASIGNADA'"
                      [class.bg-success]="n.tipo === 'TRAMITE_AVANCE'"
                      [class.bg-warning]="n.tipo === 'TRAMITE_PAUSADO' || n.tipo === 'DOCUMENTO_REQUERIDO'"
                      class="w-2.5 h-2.5 rounded-full"
                    ></span>
                    <h3 class="font-semibold text-sm text-text-primary">{{ n.titulo }}</h3>
                  </div>
                  <p class="text-xs text-text-secondary mt-1.5">{{ n.mensaje }}</p>
                  <div class="flex items-center gap-4 mt-2 text-[10px] text-text-secondary">
                    <span>Trámite: {{ n.tramiteId }}</span>
                    <span>•</span>
                    <span>{{ n.createdAt | date:'medium' }}</span>
                  </div>
                </div>
                
                @if (!n.leida) {
                  <span class="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-[10px] font-semibold rounded-full">
                    Nueva
                  </span>
                }
              </div>
            }

            <!-- Paginación -->
            <div class="flex justify-between items-center border-t border-border pt-4 mt-6">
              <span class="text-xs text-text-secondary">
                Página {{ pagina() + 1 }} de {{ totalPaginas() }} ({{ totalElementos() }} elementos)
              </span>
              <div class="flex gap-2">
                <button 
                  (click)="irAPagina(pagina() - 1)"
                  [disabled]="pagina() === 0"
                  class="px-3 py-1.5 border border-border hover:bg-background text-text-primary rounded-button text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <button 
                  (click)="irAPagina(pagina() + 1)"
                  [disabled]="pagina() >= totalPaginas() - 1"
                  class="px-3 py-1.5 border border-border hover:bg-background text-text-primary rounded-button text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class NotificacionesComponent implements OnInit {
  private readonly notificacionesService = inject(NotificacionesApiService);
  private readonly router = inject(Router);

  cargando = signal(false);
  notificaciones = signal<Notificacion[]>([]);
  pagina = signal(0);
  totalPaginas = signal(0);
  totalElementos = signal(0);

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  cargarNotificaciones(): void {
    this.cargando.set(true);
    this.notificacionesService.list(this.pagina(), 10).subscribe({
      next: (res) => {
        this.notificaciones.set(res.content);
        this.totalPaginas.set(res.totalPages);
        this.totalElementos.set(res.totalElements);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  leerNotificacion(n: Notificacion): void {
    if (!n.leida) {
      this.notificacionesService.leer(n.id).subscribe({
        next: () => {
          this.cargarNotificaciones();
        }
      });
    }

    if (n.tramiteId) {
      this.router.navigate(['/funcionario/tareas']);
    }
  }

  marcarTodasComoLeidas(): void {
    this.cargando.set(true);
    this.notificacionesService.leerTodas().subscribe({
      next: () => {
        this.cargarNotificaciones();
      },
      error: () => this.cargando.set(false)
    });
  }

  irAPagina(p: number): void {
    if (p >= 0 && p < this.totalPaginas()) {
      this.pagina.set(p);
      this.cargarNotificaciones();
    }
  }
}
