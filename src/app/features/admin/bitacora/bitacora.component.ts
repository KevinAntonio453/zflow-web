import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BitacoraApiService, BitacoraRegistro } from '../../../core/services/bitacora-api.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'zf-bitacora',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  template: `
    <div class="space-y-6 p-6">
      <!-- Encabezado -->
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 class="text-2xl font-bold text-text-primary">Bitácora de Actividad</h1>
          <p class="text-sm text-text-secondary">Trazabilidad y auditoría de accesos y modificaciones en el sistema.</p>
        </div>
      </div>

      <!-- Filtros -->
      <div class="bg-surface border border-border rounded-card p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <!-- Filtro Acción -->
          <div>
            <label class="block text-xs font-semibold text-text-secondary mb-1">Filtrar por Acción</label>
            <select
              [value]="filtroAccion()"
              (change)="updateAccionFilter($event)"
              class="w-full px-3 py-2 text-sm rounded-input border border-border bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">Todas las acciones</option>
              <option value="VER_DOCUMENTO">Ver Documento</option>
              <option value="SUBIR_DOCUMENTO">Subir Documento</option>
              <option value="MODIFICAR_DOCUMENTO">Modificar Documento</option>
              <option value="COMPLETAR_TAREA">Completar Tarea</option>
              <option value="CREAR_POLITICA">Crear Política</option>
              <option value="MODIFICAR_POLITICA">Modificar Política</option>
              <option value="ACTIVAR_POLITICA">Activar Política</option>
              <option value="DESACTIVAR_POLITICA">Desactivar Política</option>
            </select>
          </div>

          <!-- Filtro Tipo Entidad -->
          <div>
            <label class="block text-xs font-semibold text-text-secondary mb-1">Filtrar por Entidad</label>
            <select
              [value]="filtroEntidad()"
              (change)="updateEntidadFilter($event)"
              class="w-full px-3 py-2 text-sm rounded-input border border-border bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">Todas las entidades</option>
              <option value="DOCUMENTO">Documento</option>
              <option value="TRAMITE">Trámite</option>
              <option value="POLITICA">Política</option>
              <option value="USUARIO">Usuario</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Errores -->
      @if (error(); as msg) {
        <div class="p-3 rounded-input border border-danger text-sm text-danger bg-danger/10" role="alert">
          {{ msg }}
        </div>
      }

      <!-- Tabla / Loader -->
      @if (loading()) {
        <div class="flex justify-center py-10">
          <zf-loading-spinner size="lg" />
        </div>
      } @else {
        <div class="bg-surface border border-border rounded-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-background text-text-secondary">
                <tr class="border-b border-border">
                  <th class="text-left p-3 font-medium">Fecha</th>
                  <th class="text-left p-3 font-medium">Usuario</th>
                  <th class="text-left p-3 font-medium">Acción</th>
                  <th class="text-left p-3 font-medium">Entidad</th>
                  <th class="text-left p-3 font-medium">Detalles</th>
                </tr>
              </thead>
              <tbody>
                @for (r of filteredRegistros(); track r.id) {
                  <tr class="border-b border-border hover:bg-primary-50/20 dark:hover:bg-primary-900/10 transition-colors">
                    <td class="p-3 text-text-secondary whitespace-nowrap text-xs">{{ r.createdAt | date:'medium' }}</td>
                    <td class="p-3 text-text-primary text-xs">
                      <div class="font-semibold">{{ r.usuarioNombre }}</div>
                      <div class="text-[10px] text-text-secondary select-all">{{ r.usuarioEmail }}</div>
                    </td>
                    <td class="p-3">
                      <span
                        class="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider"
                        [class]="getAccionBadgeClass(r.accion)"
                      >
                        {{ formatAccionLabel(r.accion) }}
                      </span>
                    </td>
                    <td class="p-3 text-text-primary text-xs">
                      <div class="font-semibold">{{ r.entidadNombre }}</div>
                      <div class="text-[10px] text-text-secondary uppercase tracking-wider">{{ r.entidadTipo }}</div>
                    </td>
                    <td class="p-3 text-xs text-text-secondary">
                      @if (r.detalle) {
                        <div class="max-w-xs truncate" [title]="formatDetallesPrettier(r.detalle)">
                          {{ formatDetallesText(r.detalle) }}
                        </div>
                      } @else {
                        <span>—</span>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="p-8 text-center text-text-secondary">
                      No se encontraron registros de auditoría en la bitácora.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Paginación -->
          @if (totalPages() > 1) {
            <div class="px-4 py-3 bg-background border-t border-border flex items-center justify-between text-xs text-text-secondary">
              <div>
                Mostrando página {{ currentPage() + 1 }} de {{ totalPages() }} ({{ totalElements() }} registros en total)
              </div>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  [disabled]="currentPage() === 0"
                  (click)="changePage(currentPage() - 1)"
                  class="p-1.5 rounded-button border border-border bg-surface disabled:opacity-50 hover:bg-background transition-colors"
                >
                  ◀
                </button>
                <span class="px-2 font-medium">Página {{ currentPage() + 1 }}</span>
                <button
                  type="button"
                  [disabled]="currentPage() + 1 === totalPages()"
                  (click)="changePage(currentPage() + 1)"
                  class="p-1.5 rounded-button border border-border bg-surface disabled:opacity-50 hover:bg-background transition-colors"
                >
                  ▶
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class BitacoraComponent implements OnInit {
  private readonly bitacoraApi = inject(BitacoraApiService);

  // Estados reactivos
  protected readonly registros = signal<BitacoraRegistro[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  // Filtros en memoria para facilitar búsquedas locales rápidas sobre la página cargada
  protected readonly filtroAccion = signal<string>('ALL');
  protected readonly filtroEntidad = signal<string>('ALL');

  // Paginación
  protected readonly currentPage = signal<number>(0);
  protected readonly totalPages = signal<number>(1);
  protected readonly totalElements = signal<number>(0);
  protected readonly itemsPerPage = 20;

  ngOnInit(): void {
    this.cargarPagina(this.currentPage());
  }

  protected cargarPagina(pageIndex: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.bitacoraApi.getBitacora(pageIndex, this.itemsPerPage).subscribe({
      next: (res) => {
        this.registros.set(res.content || []);
        this.totalPages.set(res.totalPages || 1);
        this.totalElements.set(res.totalElements || 0);
        this.currentPage.set(res.number || 0);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Error al cargar la bitácora de actividad.');
        this.loading.set(false);
      },
    });
  }

  protected changePage(newPageIndex: number): void {
    if (newPageIndex >= 0 && newPageIndex < this.totalPages()) {
      this.cargarPagina(newPageIndex);
    }
  }

  // Filtrado local reactivo de la página actual
  protected readonly filteredRegistros = computed(() => {
    let list = this.registros();
    const accion = this.filtroAccion();
    const entidad = this.filtroEntidad();

    if (accion !== 'ALL') {
      list = list.filter(r => r.accion === accion);
    }
    if (entidad !== 'ALL') {
      list = list.filter(r => r.entidadTipo === entidad);
    }

    return list;
  });

  protected updateAccionFilter(e: Event): void {
    this.filtroAccion.set((e.target as HTMLSelectElement).value);
  }

  protected updateEntidadFilter(e: Event): void {
    this.filtroEntidad.set((e.target as HTMLSelectElement).value);
  }

  // Estilos y badges de color
  protected getAccionBadgeClass(accion: string): string {
    switch (accion) {
      case 'CREAR_POLITICA':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200/50';
      case 'MODIFICAR_POLITICA':
        return 'bg-pink-100 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400 border border-pink-200/50';
      case 'ACTIVAR_POLITICA':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50';
      case 'DESACTIVAR_POLITICA':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border border-orange-200/50';
      case 'VER_DOCUMENTO':
        return 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 border border-sky-200/50';
      case 'SUBIR_DOCUMENTO':
        return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200/50';
      case 'MODIFICAR_DOCUMENTO':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/50';
      case 'COMPLETAR_TAREA':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200/50';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200/50';
    }
  }

  protected formatAccionLabel(accion: string): string {
    return accion.replace(/_/g, ' ');
  }

  protected formatDetallesText(detalle: Record<string, any>): string {
    return Object.entries(detalle)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  }

  protected formatDetallesPrettier(detalle: Record<string, any>): string {
    return JSON.stringify(detalle, null, 2);
  }
}
