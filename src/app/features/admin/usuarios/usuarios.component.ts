import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  Rol,
  Usuario,
  Departamento,
  CreateUsuarioRequest,
  UpdateUsuarioRequest,
} from '../../../core/models';
import { UsuariosApiService } from '../../../core/services/usuarios-api.service';
import { DepartamentosApiService } from '../../../core/services/departamentos-api.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'zf-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 class="text-2xl font-bold">Usuarios</h1>
          <p class="text-sm text-text-secondary">Administrá las cuentas de la organización, roles y departamentos.</p>
        </div>
        <button
          type="button"
          (click)="openCreateModal()"
          class="bg-primary-500 text-white px-4 py-2 rounded-button hover:bg-primary-600 font-medium text-sm transition-colors"
        >
          + Nuevo usuario
        </button>
      </div>

      <!-- Filtros -->
      <div class="bg-surface border border-border rounded-card p-4 space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <!-- Búsqueda -->
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">Buscar por nombre o email</label>
            <input
              type="text"
              [value]="searchQuery()"
              (input)="updateSearch($event)"
              placeholder="ej: Juan Pérez"
              class="w-full px-3 py-2 text-sm rounded-input border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <!-- Filtro Rol -->
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">Filtrar por rol</label>
            <select
              [value]="filtroRol()"
              (change)="updateRolFilter($event)"
              class="w-full px-3 py-2 text-sm rounded-input border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">Todos los roles</option>
              <option value="ADMIN">Administrador</option>
              <option value="JEFE">Jefe de departamento</option>
              <option value="FUNCIONARIO">Funcionario</option>
              <option value="CLIENTE">Cliente</option>
            </select>
          </div>

          <!-- Filtro Departamento -->
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">Filtrar por depto.</label>
            <select
              [value]="filtroDepto()"
              (change)="updateDeptoFilter($event)"
              class="w-full px-3 py-2 text-sm rounded-input border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">Todos los deptos.</option>
              @for (d of departamentos(); track d.id) {
                <option [value]="d.id">{{ d.nombre }}</option>
              }
            </select>
          </div>

          <!-- Filtro Estado -->
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">Filtrar por estado</label>
            <select
              [value]="filtroEstado()"
              (change)="updateEstadoFilter($event)"
              class="w-full px-3 py-2 text-sm rounded-input border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVO">Activos</option>
              <option value="INACTIVO">Inactivos</option>
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
        <zf-loading-spinner size="lg" />
      } @else {
        <div class="bg-surface border border-border rounded-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-background text-text-secondary">
                <tr class="border-b border-border">
                  <th class="text-left p-3 font-medium">Nombre</th>
                  <th class="text-left p-3 font-medium">Email</th>
                  <th class="text-left p-3 font-medium">Rol</th>
                  <th class="text-left p-3 font-medium">Departamento</th>
                  <th class="text-left p-3 font-medium">Estado</th>
                  <th class="text-right p-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (u of paginatedUsuarios(); track u.id) {
                  <tr class="border-b border-border hover:bg-primary-50/20 dark:hover:bg-primary-900/10 transition-colors">
                    <td class="p-3 font-medium text-text-primary">{{ u.nombre }}</td>
                    <td class="p-3 text-text-secondary">{{ u.email }}</td>
                    <td class="p-3">
                      <span
                        class="px-2 py-0.5 text-xs font-semibold rounded-badge"
                        [ngClass]="getRolBadgeClass(u.rol)"
                      >
                        {{ u.rol }}
                      </span>
                    </td>
                    <td class="p-3 text-text-secondary">
                      {{ getDeptoNombre(u.departamentoId) }}
                    </td>
                    <td class="p-3">
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded-badge text-xs font-medium"
                        [ngClass]="u.activo ? 'bg-accent-50 text-accent-500 dark:bg-accent-500/10' : 'bg-border text-text-secondary'"
                      >
                        {{ u.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="p-3 text-right space-x-1">
                      <button
                        type="button"
                        (click)="openEditModal(u)"
                        class="px-2.5 py-1 text-xs rounded-button hover:bg-background border border-border text-text-primary transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        (click)="toggleEstado(u)"
                        class="px-2.5 py-1 text-xs rounded-button transition-colors border border-border"
                        [ngClass]="u.activo ? 'text-danger hover:bg-danger/10' : 'text-accent-500 hover:bg-accent-50'"
                      >
                        {{ u.activo ? 'Desactivar' : 'Activar' }}
                      </button>
                      <button
                        type="button"
                        (click)="confirmDelete(u)"
                        class="px-2.5 py-1 text-xs rounded-button bg-danger/10 text-danger hover:bg-danger hover:text-white transition-colors"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="p-8 text-center text-text-secondary">
                      No se encontraron usuarios con los filtros seleccionados.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Paginación -->
          @if (filteredUsuarios().length > itemsPerPage) {
            <div class="px-4 py-3 bg-background border-t border-border flex items-center justify-between text-xs text-text-secondary">
              <div>
                Mostrando {{ pageStart() + 1 }} - {{ pageEnd() }} de {{ filteredUsuarios().length }} usuarios
              </div>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  [disabled]="currentPage() === 1"
                  (click)="currentPage.set(currentPage() - 1)"
                  class="p-1.5 rounded-button border border-border bg-surface disabled:opacity-50 hover:bg-background"
                >
                  ◀
                </button>
                <span class="px-2 font-medium">Página {{ currentPage() }} de {{ totalPages() }}</span>
                <button
                  type="button"
                  [disabled]="currentPage() === totalPages()"
                  (click)="currentPage.set(currentPage() + 1)"
                  class="p-1.5 rounded-button border border-border bg-surface disabled:opacity-50 hover:bg-background"
                >
                  ▶
                </button>
              </div>
            </div>
          }
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
              {{ editingUser() ? 'Editar usuario' : 'Nuevo usuario' }}
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
          <form [formGroup]="form" (ngSubmit)="saveUser()" novalidate class="p-5 space-y-4">
            <!-- Nombre -->
            <div>
              <label class="block text-xs font-semibold text-text-secondary mb-1">Nombre *</label>
              <input
                type="text"
                formControlName="nombre"
                placeholder="ej: Juan Pérez"
                class="w-full px-3 py-2 text-sm rounded-input border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
                [class.border-danger]="form.controls.nombre.touched && form.controls.nombre.invalid"
              />
              @if (form.controls.nombre.touched && form.controls.nombre.invalid) {
                <p class="text-xs text-danger mt-1">El nombre es requerido (mínimo 2 letras).</p>
              }
            </div>

            <!-- Email -->
            <div>
              <label class="block text-xs font-semibold text-text-secondary mb-1">Email *</label>
              <input
                type="email"
                formControlName="email"
                placeholder="ej: juan@empresa.com"
                class="w-full px-3 py-2 text-sm rounded-input border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
                [class.border-danger]="form.controls.email.touched && form.controls.email.invalid"
              />
              @if (form.controls.email.touched && form.controls.email.invalid) {
                <p class="text-xs text-danger mt-1">Ingrese un email válido.</p>
              }
            </div>

            <!-- Password (solo obligatorio en creación) -->
            @if (!editingUser()) {
              <div>
                <label class="block text-xs font-semibold text-text-secondary mb-1">Contraseña *</label>
                <input
                  type="password"
                  formControlName="password"
                  placeholder="Mínimo 8 caracteres"
                  class="w-full px-3 py-2 text-sm rounded-input border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
                  [class.border-danger]="form.controls.password.touched && form.controls.password.invalid"
                />
                @if (form.controls.password.touched && form.controls.password.invalid) {
                  <p class="text-xs text-danger mt-1">La contraseña debe tener al menos 8 caracteres.</p>
                }
              </div>
            }

            <!-- Rol -->
            <div>
              <label class="block text-xs font-semibold text-text-secondary mb-1">Rol *</label>
              <select
                formControlName="rol"
                class="w-full px-3 py-2 text-sm rounded-input border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ADMIN">Administrador</option>
                <option value="JEFE">Jefe de departamento</option>
                <option value="FUNCIONARIO">Funcionario</option>
                <option value="CLIENTE">Cliente</option>
              </select>
            </div>

            <!-- Departamento (ocultar/deshabilitar si es ADMIN o CLIENTE) -->
            @if (showDeptoField()) {
              <div>
                <label class="block text-xs font-semibold text-text-secondary mb-1">Departamento *</label>
                <select
                  formControlName="departamentoId"
                  class="w-full px-3 py-2 text-sm rounded-input border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
                  [class.border-danger]="form.controls.departamentoId.touched && form.controls.departamentoId.invalid"
                >
                  <option value="">— Seleccionar departamento —</option>
                  @for (d of departamentos(); track d.id) {
                    <option [value]="d.id">{{ d.nombre }}</option>
                  }
                </select>
                @if (form.controls.departamentoId.touched && form.controls.departamentoId.invalid) {
                  <p class="text-xs text-danger mt-1">El departamento es requerido para este rol.</p>
                }
              </div>
            }

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
    @if (deleteUserTarget(); as target) {
      <div
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        (click)="deleteUserTarget.set(null)"
        (keydown.escape)="deleteUserTarget.set(null)"
      >
        <div
          class="bg-surface rounded-card shadow-lg w-full max-w-sm p-5 space-y-4"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center gap-3 text-danger">
            <span class="text-2xl">⚠️</span>
            <h3 class="text-lg font-semibold text-text-primary">¿Eliminar usuario?</h3>
          </div>
          <p class="text-sm text-text-secondary">
            Estás a punto de eliminar permanentemente a <span class="font-semibold text-text-primary">{{ target.nombre }}</span>.
            Esta acción no se puede deshacer.
          </p>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              (click)="deleteUserTarget.set(null)"
              class="px-4 py-2 text-sm rounded-button border border-border bg-surface hover:bg-background"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="deleteUser()"
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
export class UsuariosComponent implements OnInit {
  private readonly fb      = inject(FormBuilder);
  private readonly userApi = inject(UsuariosApiService);
  private readonly deptoApi = inject(DepartamentosApiService);

  // Estados
  protected readonly usuarios       = signal<Usuario[]>([]);
  protected readonly departamentos  = signal<Departamento[]>([]);
  protected readonly loading        = signal(true);
  protected readonly saving         = signal(false);
  protected readonly error          = signal<string | null>(null);

  // Filtros
  protected readonly searchQuery    = signal<string>('');
  protected readonly filtroRol      = signal<Rol | 'ALL'>('ALL');
  protected readonly filtroDepto    = signal<string | 'ALL'>('ALL');
  protected readonly filtroEstado   = signal<'ACTIVO' | 'INACTIVO' | 'ALL'>('ALL');

  // Paginación
  protected readonly currentPage    = signal<number>(1);
  protected readonly itemsPerPage   = 15;

  // Modales
  protected readonly modalOpen         = signal(false);
  protected readonly editingUser       = signal<Usuario | null>(null);
  protected readonly deleteUserTarget  = signal<Usuario | null>(null);

  // Formulario reactivo
  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(8), Validators.maxLength(100)]],
    rol: ['FUNCIONARIO' as Rol, [Validators.required]],
    departamentoId: [''],
  });

  ngOnInit(): void {
    this.loadData();

    // Dinámicamente agregar o remover validadores de departamentoId según el rol
    this.form.controls.rol.valueChanges.subscribe(rol => {
      const deptoCtrl = this.form.controls.departamentoId;
      if (rol === 'JEFE' || rol === 'FUNCIONARIO') {
        deptoCtrl.setValidators([Validators.required]);
      } else {
        deptoCtrl.clearValidators();
      }
      deptoCtrl.updateValueAndValidity();
    });
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    // Cargar usuarios y departamentos
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

  // Filtrado reactivo de usuarios
  protected readonly filteredUsuarios = computed(() => {
    let list = this.usuarios();
    const query = this.searchQuery().trim().toLowerCase();
    const rol = this.filtroRol();
    const depto = this.filtroDepto();
    const estado = this.filtroEstado();

    if (query) {
      list = list.filter(
        u => u.nombre.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
      );
    }
    if (rol !== 'ALL') {
      list = list.filter(u => u.rol === rol);
    }
    if (depto !== 'ALL') {
      list = list.filter(u => u.departamentoId === depto);
    }
    if (estado !== 'ALL') {
      const activeVal = estado === 'ACTIVO';
      list = list.filter(u => u.activo === activeVal);
    }

    return list;
  });

  // Paginación reactiva
  protected readonly totalPages = computed(() =>
    Math.ceil(this.filteredUsuarios().length / this.itemsPerPage) || 1
  );

  protected readonly paginatedUsuarios = computed(() => {
    const list = this.filteredUsuarios();
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return list.slice(start, start + this.itemsPerPage);
  });

  protected readonly pageStart = computed(() => (this.currentPage() - 1) * this.itemsPerPage);
  protected readonly pageEnd = computed(() =>
    Math.min(this.currentPage() * this.itemsPerPage, this.filteredUsuarios().length)
  );

  // Helpers de filtros
  protected updateSearch(e: Event): void {
    this.searchQuery.set((e.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  protected updateRolFilter(e: Event): void {
    this.filtroRol.set((e.target as HTMLSelectElement).value as Rol | 'ALL');
    this.currentPage.set(1);
  }

  protected updateDeptoFilter(e: Event): void {
    this.filtroDepto.set((e.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }

  protected updateEstadoFilter(e: Event): void {
    this.filtroEstado.set((e.target as HTMLSelectElement).value as 'ACTIVO' | 'INACTIVO' | 'ALL');
    this.currentPage.set(1);
  }

  // Modales
  protected openCreateModal(): void {
    this.editingUser.set(null);
    this.form.reset({
      nombre: '',
      email: '',
      password: '',
      rol: 'FUNCIONARIO',
      departamentoId: '',
    });
    // Poner el password como obligatorio en creación
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
    this.form.controls.password.updateValueAndValidity();
    this.modalOpen.set(true);
  }

  protected openEditModal(u: Usuario): void {
    this.editingUser.set(u);
    this.form.reset({
      nombre: u.nombre,
      email: u.email,
      password: '',
      rol: u.rol,
      departamentoId: u.departamentoId ?? '',
    });
    // Omitir requerimiento de password en edición
    this.form.controls.password.clearValidators();
    this.form.controls.password.setValidators([Validators.minLength(8)]);
    this.form.controls.password.updateValueAndValidity();
    this.modalOpen.set(true);
  }

  protected closeModal(): void {
    this.modalOpen.set(false);
  }

  // Helper para visibilidad de dpto según el rol
  protected showDeptoField(): boolean {
    const rol = this.form.controls.rol.value;
    return rol === 'JEFE' || rol === 'FUNCIONARIO';
  }

  // Acciones CRUD
  protected saveUser(): void {
    if (this.form.invalid || this.saving()) return;

    this.saving.set(true);
    this.error.set(null);

    const val = this.form.value;
    const reqDept = this.showDeptoField() ? (val.departamentoId || null) : null;

    if (this.editingUser()) {
      const payload: UpdateUsuarioRequest = {
        nombre: val.nombre ?? undefined,
        email: val.email ?? undefined,
        rol: val.rol ?? undefined,
        departamentoId: reqDept,
      };

      this.userApi.update(this.editingUser()!.id, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.modalOpen.set(false);
          this.loadData();
        },
        error: (err) => {
          this.error.set(err.error?.message ?? 'Error al actualizar usuario');
          this.saving.set(false);
        },
      });
    } else {
      const payload: CreateUsuarioRequest = {
        nombre: val.nombre!,
        email: val.email!,
        password: val.password!,
        rol: val.rol!,
        departamentoId: reqDept,
      };

      this.userApi.create(payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.modalOpen.set(false);
          this.loadData();
        },
        error: (err) => {
          this.error.set(err.error?.message ?? 'Error al crear usuario');
          this.saving.set(false);
        },
      });
    }
  }

  protected toggleEstado(u: Usuario): void {
    this.error.set(null);
    this.userApi.changeEstado(u.id, !u.activo).subscribe({
      next: () => this.loadData(),
      error: (err) => this.error.set(err.error?.message ?? 'No se pudo cambiar el estado'),
    });
  }

  protected confirmDelete(u: Usuario): void {
    this.deleteUserTarget.set(u);
  }

  protected deleteUser(): void {
    const target = this.deleteUserTarget();
    if (!target) return;

    this.error.set(null);
    this.userApi.delete(target.id).subscribe({
      next: () => {
        this.deleteUserTarget.set(null);
        this.loadData();
      },
      error: (err) => {
        this.deleteUserTarget.set(null);
        this.error.set(err.error?.message ?? 'Error al eliminar usuario');
      },
    });
  }

  // Visual helpers
  protected getRolBadgeClass(rol: Rol): string {
    switch (rol) {
      case 'ADMIN': return 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400';
      case 'JEFE': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
      case 'FUNCIONARIO': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
      case 'CLIENTE': return 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  protected getDeptoNombre(deptoId: string | null): string {
    if (!deptoId) return '—';
    const d = this.departamentos().find(dept => dept.id === deptoId);
    return d ? d.nombre : 'Cargando...';
  }
}
