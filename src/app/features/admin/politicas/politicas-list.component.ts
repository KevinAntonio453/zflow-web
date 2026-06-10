import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PoliticasApiService } from '../../../core/services/politicas-api.service';
import {
  ESTADO_POLITICA_LABELS,
  EstadoPolitica,
  Politica,
} from '../../../core/models';
import { ApiError } from '../../../core/models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'zf-politicas-list',
  imports: [RouterLink, LoadingSpinnerComponent],
  templateUrl: './politicas-list.component.html',
})
export class PoliticasListComponent {
  private readonly api    = inject(PoliticasApiService);
  private readonly router = inject(Router);

  protected readonly politicas = signal<Politica[]>([]);
  protected readonly loading   = signal(true);
  protected readonly error     = signal<string | null>(null);
  protected readonly filtro    = signal<EstadoPolitica | 'TODAS'>('TODAS');

  /** Opciones del filtro (tipadas, con etiqueta visible). */
  protected readonly filtros: ReadonlyArray<{ value: EstadoPolitica | 'TODAS'; label: string }> = [
    { value: 'TODAS',    label: 'Todas' },
    { value: 'BORRADOR', label: ESTADO_POLITICA_LABELS.BORRADOR },
    { value: 'ACTIVA',   label: ESTADO_POLITICA_LABELS.ACTIVA },
    { value: 'INACTIVA', label: ESTADO_POLITICA_LABELS.INACTIVA },
  ];

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (list) => {
        this.politicas.set(list);
        this.loading.set(false);
      },
      error: (err: { error?: ApiError }) => {
        this.error.set(err.error?.message ?? 'No se pudieron cargar las políticas');
        this.loading.set(false);
      },
    });
  }

  protected filtered(): Politica[] {
    const all = this.politicas();
    const f = this.filtro();
    return f === 'TODAS' ? all : all.filter(p => p.estado === f);
  }

  protected changeFiltro(value: EstadoPolitica | 'TODAS'): void {
    this.filtro.set(value);
  }

  protected activate(p: Politica): void {
    this.api.activate(p.id).subscribe({
      next: () => void this.load(),
      error: (err: { error?: ApiError }) => this.error.set(err.error?.message ?? 'No se pudo activar'),
    });
  }

  protected deactivate(p: Politica): void {
    this.api.deactivate(p.id).subscribe({
      next: () => void this.load(),
      error: (err: { error?: ApiError }) => this.error.set(err.error?.message ?? 'No se pudo desactivar'),
    });
  }

  protected edit(p: Politica): void {
    this.router.navigate(['/admin/politicas', p.id, 'editar']);
  }

  protected estadoLabel(e: EstadoPolitica): string {
    return ESTADO_POLITICA_LABELS[e];
  }

  protected formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
  }
}
