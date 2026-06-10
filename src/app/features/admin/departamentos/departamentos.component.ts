import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  Departamento,
  Usuario,
  CreateDepartamentoRequest,
  UpdateDepartamentoRequest,
} from '../../../core/models';
import { DepartamentosApiService } from '../../../core/services/departamentos-api.service';
import { UsuariosApiService } from '../../../core/services/usuarios-api.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'zf-departamentos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 class="text-2xl font-bold">Departamentos</h1>
          <p class="text-sm text-text-secondary">Administrá las áreas de la organización y asigná sus responsables.</p>
        </div>
        <button
          type="button"
          (click)="openCreateModal()"
          class="bg-primary-500 text-white px-4 py-2 rounded-button hover:bg-primary-600 font-medium text-sm transition-colors"
        >
          + Nuevo departamento
        </button>
      </div>

      <!-- Filtros -->
      <div class="bg-surface border border-border rounded-card p-4 space-y-3">
        <div class="max-w-xs">
          <label class="block text-xs font-medium text-text-secondary mb-1">Buscar por nombre</label>
          <input
            type="text"
            [value]="searchQuery()"
            (input)="updateSearch($event)"
            placeholder="ej: Recursos Humanos"
            class="w-full px-3 py-2 text-sm rounded-input border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
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
        <zf-loading-spinner size="lg" />
      } @else {
        <div class="bg-surface border border-border rounded-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-background text-text-secondary">
                <tr class="border-b border-border">
                  <th class="text-left p-3 font-medium">Nombre</th>
                  <th class="text-left p-3 font-medium">Descripción</th>
                  <th class="text-left p-3 font-medium">Jefe de Área</th>
                  <th class="text-left p-3 font-medium">Usuarios</th>
                  <th class="text-left p-3 font-medium">Estado</th>
                  <th class="text-right p-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (d of filteredDepartamentos(); track d.id) {
                  <tr class="border-b border-border hover:bg-primary-50/20 dark:hover:bg-primary-900/10 transition-colors">
                    <td class="p-3 font-medium text-text-primary">{{ d.nombre }}</td>
                    <td class="p-3 text-text-secondary max-w-xs truncate" [title]="d.descripcion || ''">
                      {{ d.descripcion || '—' }}
                    </td>
                    <td class="p-3 text-text-primary font-medium">
                      {{ getJefeNombre(d.jefeId) }}
                    </td>
                    <td class="p-3">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-badge text-xs font-semibold bg-primary-50 text-primary-500 dark:bg-primary-500/10">
                        {{ d.cantidadUsuarios || 0 }}
                      </span>
                    </td>
                    <td class="p-3">
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded-badge text-xs font-medium"
                        [ngClass]="d.activo ? 'bg-accent-50 text-accent-500 dark:bg-accent-500/10' : 'bg-border text-text-secondary'"
                      >
                        {{ d.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="p-3 text-right space-x-1">
                      <button
                        type="button"
                        (click)="openEditModal(d)"
                        class="px-2.5 py-1 text-xs rounded-button hover:bg-background border border-border text-text-primary transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        (click)="toggleEstado(d)"
                        class="px-2.5 py-1 text-xs rounded-button transition-colors border border-border"
                        [ngClass]="d.activo ? 'text-danger hover:bg-danger/10' : 'text-accent-500 hover:bg-accent-50'"
                      >
                        {{ d.activo ? 'Desactivar' : 'Activar' }}
                      </button>
                      <button
                        type="button"
                        (click)="confirmDelete(d)"
                        class="px-2.5 py-1 text-xs rounded-button bg-danger/10 text-danger hover:bg-danger hover:text-white transition-colors"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="p-8 text-center text-text-secondary">
                      No se encontraron departamentos.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>

    <!-- Modal Formulario (Creación/Edición) -->
    @if (modalOpen()) {
      <div
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        (click)="closeModal()"
        (keydown.escape)="closeModal()"
      >
        <div
          class="bg-surface rounded-card shadow-lg w-full max-w-md overflow-hidden flex flex-col"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-text-primary">
              {{ editingDepto() ? 'Editar departamento' : 'Nuevo departamento' }}
            </h2>
            <button
              type="button"
              (click)="closeModal()"
              class="w-8 h-8 flex items-center justify-center rounded-button text-text-secondary hover:text-text-primary hover:bg-background"
            >
              ✕
            </button>
          </div>

          <!-- Body -->
          <form [formGroup]="form" (ngSubmit)="saveDepto()" novalidate class="p-5 space-y-4">
            <!-- Nombre -->
            <div>
              <label class="block text-xs font-semibold text-text-secondary mb-1">Nombre del Departamento *</label>
              <input
                type="text"
                formControlName="nombre"
                placeholder="ej: Recursos Humanos"
                class="w-full px-3 py-2 text-sm rounded-input border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
                [class.border-danger]="form.controls.nombre.touched && form.controls.nombre.invalid"
              />
              @if (form.controls.nombre.touched && form.controls.nombre.invalid) {
                <p class="text-xs text-danger mt-1">El nombre es requerido (mínimo 2 letras).</p>
              }
            </div>

            <!-- Descripción -->
            <div>
              <label class="block text-xs font-semibold text-text-secondary mb-1">Descripción</label>
              <textarea
                formControlName="descripcion"
                rows="3"
                placeholder="Describí brevemente las responsabilidades del área..."
                class="w-full px-3 py-2 text-sm rounded-input border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              ></textarea>
            </div>

            <!-- Jefe de Departamento -->
            <div>
              <label class="block text-xs font-semibold text-text-secondary mb-1">Jefe de Área</label>
              <select
                formControlName="jefeId"
                class="w-full px-3 py-2 text-sm rounded-input border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">— Sin jefe asignado —</option>
                @for (j of jefes(); track j.id) {
                  <option [value]="j.id">{{ j.nombre }} ({{ j.email }})</option>
                }
              </select>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-2 pt-2 border-t border-border mt-5">
              <button
                type="button"
                (click)="closeModal()"
                class="px-4 py-2 text-sm rounded-button border border-border bg-surface hover:bg-background transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                [disabled]="form.invalid || saving()"
                class="px-4 py-2 text-sm rounded-button bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
              >
                {{ saving() ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Modal Confirmación Eliminación -->
    @if (deleteDeptoTarget(); as target) {
      <div
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        (click)="deleteDeptoTarget.set(null)"
        (keydown.escape)="deleteDeptoTarget.set(null)"
      >
        <div
          class="bg-surface rounded-card shadow-lg w-full max-w-sm p-5 space-y-4"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center gap-3 text-danger">
            <span class="text-2xl">⚠️</span>
            <h3 class="text-lg font-semibold text-text-primary">¿Eliminar departamento?</h3>
          </div>
          <p class="text-sm text-text-secondary">
            Estás a punto de eliminar permanentemente el área <span class="font-semibold text-text-primary">{{ target.nombre }}</span>.
            Esta acción no se puede deshacer.
          </p>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              (click)="deleteDeptoTarget.set(null)"
              class="px-4 py-2 text-sm rounded-button border border-border bg-surface hover:bg-background"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="deleteDepto()"
              class="px-4 py-2 text-sm rounded-button bg-danger text-white hover:bg-danger-hover"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class DepartamentosComponent implements OnInit {
  private readonly fb       = inject(FormBuilder);
  private readonly deptoApi = inject(DepartamentosApiService);
  private readonly userApi  = inject(UsuariosApiService);

  // Estados
  protected readonly departamentos  = signal<Departamento[]>([]);
  protected readonly usuarios       = signal<Usuario[]>([]);
  protected readonly loading        = signal(true);
  protected readonly saving         = signal(false);
  protected readonly error          = signal<string | null>(null);

  // Filtros
  protected readonly searchQuery    = signal<string>('');

  // Modales
  protected readonly modalOpen          = signal(false);
  protected readonly editingDepto       = signal<Departamento | null>(null);
  protected readonly deleteDeptoTarget  = signal<Departamento | null>(null);

  // Formulario reactivo
  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    descripcion: ['', [Validators.maxLength(500)]],
    jefeId: [''],
  });

  // Lista de jefes elegibles
  protected readonly jefes = computed(() =>
    this.usuarios().filter(u => u.rol === 'JEFE')
  );

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.deptoApi.list().subscribe({
      next: (deptos) => {
        this.departamentos.set(deptos);
        this.userApi.list().subscribe({
          next: (users) => {
            this.usuarios.set(users);
            this.loading.set(false);
          },
          error: (err) => {
            this.error.set(err.error?.message ?? 'Error al cargar usuarios');
            this.loading.set(false);
          },
        });
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Error al cargar departamentos');
        this.loading.set(false);
      },
    });
  }

  // Filtrado reactivo de departamentos
  protected readonly filteredDepartamentos = computed(() => {
    let list = this.departamentos();
    const query = this.searchQuery().trim().toLowerCase();

    if (query) {
      list = list.filter(d => d.nombre.toLowerCase().includes(query));
    }
    return list;
  });

  protected updateSearch(e: Event): void {
    this.searchQuery.set((e.target as HTMLInputElement).value);
  }

  // Modales
  protected openCreateModal(): void {
    this.editingDepto.set(null);
    this.form.reset({
      nombre: '',
      descripcion: '',
      jefeId: '',
    });
    this.modalOpen.set(true);
  }

  protected openEditModal(d: Departamento): void {
    this.editingDepto.set(d);
    this.form.reset({
      nombre: d.nombre,
      descripcion: d.descripcion ?? '',
      jefeId: d.jefeId ?? '',
    });
    this.modalOpen.set(true);
  }

  protected closeModal(): void {
    this.modalOpen.set(false);
  }

  // Acciones CRUD
  protected saveDepto(): void {
    if (this.form.invalid || this.saving()) return;

    this.saving.set(true);
    this.error.set(null);

    const val = this.form.value;
    const jefeVal = val.jefeId || null;

    if (this.editingDepto()) {
      const payload: UpdateDepartamentoRequest = {
        nombre: val.nombre ?? undefined,
        descripcion: val.descripcion ?? null,
        jefeId: jefeVal,
      };

      this.deptoApi.update(this.editingDepto()!.id, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.modalOpen.set(false);
          this.loadData();
        },
        error: (err) => {
          this.error.set(err.error?.message ?? 'Error al actualizar departamento');
          this.saving.set(false);
        },
      });
    } else {
      const payload: CreateDepartamentoRequest = {
        nombre: val.nombre!,
        descripcion: val.descripcion ?? null,
        jefeId: jefeVal,
      };

      this.deptoApi.create(payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.modalOpen.set(false);
          this.loadData();
        },
        error: (err) => {
          this.error.set(err.error?.message ?? 'Error al crear departamento');
          this.saving.set(false);
        },
      });
    }
  }

  protected toggleEstado(d: Departamento): void {
    this.error.set(null);
    this.deptoApi.update(d.id, { activo: !d.activo }).subscribe({
      next: () => this.loadData(),
      error: (err) => this.error.set(err.error?.message ?? 'No se pudo cambiar el estado'),
    });
  }

  protected confirmDelete(d: Departamento): void {
    this.deleteDeptoTarget.set(d);
  }

  protected deleteDepto(): void {
    const target = this.deleteDeptoTarget();
    if (!target) return;

    this.error.set(null);
    this.deptoApi.delete(target.id).subscribe({
      next: () => {
        this.deleteDeptoTarget.set(null);
        this.loadData();
      },
      error: (err) => {
        this.deleteDeptoTarget.set(null);
        this.error.set(err.error?.message ?? 'Error al eliminar departamento');
      },
    });
  }

  // Visual Helpers
  protected getJefeNombre(jefeId: string | null): string {
    if (!jefeId) return '—';
    const u = this.usuarios().find(usr => usr.id === jefeId);
    return u ? u.nombre : '—';
  }
}
