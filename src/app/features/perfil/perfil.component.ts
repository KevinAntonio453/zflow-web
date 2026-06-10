import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'zf-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AvatarComponent, LoadingSpinnerComponent],
  template: `
    <div class="max-w-2xl mx-auto space-y-6">
      <!-- Datos Generales / Vista del Perfil -->
      <div class="bg-surface rounded-card border border-border shadow-card p-6">
        <h1 class="text-2xl font-bold mb-6 text-text-primary">Mi perfil</h1>
        
        @if (auth.user(); as u) {
          <div class="flex items-center gap-4 mb-6">
            <zf-avatar [nombre]="u.nombre" size="lg" />
            <div>
              <div class="text-lg font-bold text-text-primary">{{ u.nombre }}</div>
              <div class="text-sm text-text-secondary">{{ u.email }}</div>
            </div>
          </div>
        }

        <!-- Mensajes de Estado del Perfil -->
        @if (profileError()) {
          <div class="p-3 mb-4 rounded-input border border-danger text-sm text-danger bg-danger/10" role="alert">
            {{ profileError() }}
          </div>
        }
        @if (profileSuccess()) {
          <div class="p-3 mb-4 rounded-input border border-success text-sm text-success bg-success/10" role="alert">
            {{ profileSuccess() }}
          </div>
        }

        <!-- Formulario de Edición de Perfil -->
        <form [formGroup]="profileForm" (ngSubmit)="onUpdateProfile()" novalidate class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="nombre" class="block text-xs font-semibold text-text-secondary mb-1">Nombre *</label>
              <input
                id="nombre"
                type="text"
                formControlName="nombre"
                class="w-full px-3 py-2 rounded-input border border-border bg-background text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                [class.border-danger]="profileForm.controls.nombre.touched && profileForm.controls.nombre.invalid"
              />
              @if (profileForm.controls.nombre.touched && profileForm.controls.nombre.invalid) {
                <p class="text-xs text-danger mt-1">El nombre es requerido (mín. 2 letras).</p>
              }
            </div>
            <div>
              <label for="email" class="block text-xs font-semibold text-text-secondary mb-1">Correo electrónico</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="w-full px-3 py-2 rounded-input border border-border bg-background/50 text-text-secondary text-sm focus:outline-none cursor-not-allowed opacity-75"
              />
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button
              type="submit"
              [disabled]="profileSaving() || profileForm.invalid || !profileForm.dirty"
              class="px-4 py-2 text-sm rounded-button bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
            >
              @if (profileSaving()) { <zf-loading-spinner size="sm" /> }
              Guardar cambios
            </button>
          </div>
        </form>
      </div>

      <!-- Tarjeta: Cambio de Contraseña -->
      <div class="bg-surface rounded-card border border-border shadow-card p-6">
        <h2 class="text-xl font-bold mb-4 text-text-primary">Cambiar contraseña</h2>
        
        <!-- Mensajes de Estado de Contraseña -->
        @if (passError()) {
          <div class="p-3 mb-4 rounded-input border border-danger text-sm text-danger bg-danger/10" role="alert">
            {{ passError() }}
          </div>
        }
        @if (passSuccess()) {
          <div class="p-3 mb-4 rounded-input border border-success text-sm text-success bg-success/10" role="alert">
            {{ passSuccess() }}
          </div>
        }

        <form [formGroup]="passForm" (ngSubmit)="onChangePassword()" novalidate class="space-y-4">
          <div>
            <label for="oldPassword" class="block text-xs font-semibold text-text-secondary mb-1">Contraseña actual *</label>
            <input
              id="oldPassword"
              type="password"
              formControlName="oldPassword"
              placeholder="••••••••"
              class="w-full px-3 py-2 rounded-input border border-border bg-background text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              [class.border-danger]="passForm.controls.oldPassword.touched && passForm.controls.oldPassword.invalid"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="newPassword" class="block text-xs font-semibold text-text-secondary mb-1">Nueva contraseña *</label>
              <input
                id="newPassword"
                type="password"
                formControlName="newPassword"
                placeholder="Mínimo 8 caracteres"
                class="w-full px-3 py-2 rounded-input border border-border bg-background text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                [class.border-danger]="passForm.controls.newPassword.touched && passForm.controls.newPassword.invalid"
              />
              @if (passForm.controls.newPassword.touched && passForm.controls.newPassword.invalid) {
                <p class="text-xs text-danger mt-1">Mínimo 8 caracteres.</p>
              }
            </div>
            <div>
              <label for="confirmPassword" class="block text-xs font-semibold text-text-secondary mb-1">Confirmar nueva contraseña *</label>
              <input
                id="confirmPassword"
                type="password"
                formControlName="confirmPassword"
                placeholder="Mínimo 8 caracteres"
                class="w-full px-3 py-2 rounded-input border border-border bg-background text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                [class.border-danger]="passForm.controls.confirmPassword.touched && (passForm.controls.confirmPassword.invalid || passForm.errors?.['passwordMismatch'])"
              />
              @if (passForm.controls.confirmPassword.touched && passForm.errors?.['passwordMismatch']) {
                <p class="text-xs text-danger mt-1">Las contraseñas no coinciden.</p>
              }
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button
              type="submit"
              [disabled]="passSaving() || passForm.invalid"
              class="px-4 py-2 text-sm rounded-button bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
            >
              @if (passSaving()) { <zf-loading-spinner size="sm" /> }
              Actualizar contraseña
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class PerfilComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(AuthApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly profileForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
  });

  protected readonly passForm = this.fb.nonNullable.group({
    oldPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    confirmPassword: ['', [Validators.required]],
  }, {
    validators: (group) => {
      const pass = group.get('newPassword')?.value;
      const confirm = group.get('confirmPassword')?.value;
      return pass === confirm ? null : { passwordMismatch: true };
    }
  });

  protected readonly profileSaving = signal(false);
  protected readonly profileSuccess = signal<string | null>(null);
  protected readonly profileError = signal<string | null>(null);

  protected readonly passSaving = signal(false);
  protected readonly passSuccess = signal<string | null>(null);
  protected readonly passError = signal<string | null>(null);

  ngOnInit() {
    const user = this.auth.user();
    if (user) {
      this.profileForm.patchValue({
        nombre: user.nombre,
        email: user.email,
      });
    }
  }

  protected onUpdateProfile() {
    if (this.profileForm.invalid || this.profileSaving()) return;
    this.profileSaving.set(true);
    this.profileSuccess.set(null);
    this.profileError.set(null);

    const { nombre, email } = this.profileForm.getRawValue();

    this.api.updateProfile(nombre, email).subscribe({
      next: (updatedUser) => {
        this.auth.updateCurrentUser(updatedUser);
        this.profileForm.markAsPristine();
        this.profileSuccess.set('Perfil actualizado exitosamente.');
        this.profileSaving.set(false);
      },
      error: (err) => {
        console.error('Error al actualizar perfil', err);
        this.profileError.set(err.error?.message ?? 'No se pudo actualizar el perfil. Intentá de nuevo.');
        this.profileSaving.set(false);
      }
    });
  }

  protected onChangePassword() {
    if (this.passForm.invalid || this.passSaving()) return;
    this.passSaving.set(true);
    this.passSuccess.set(null);
    this.passError.set(null);

    const { oldPassword, newPassword } = this.passForm.getRawValue();

    this.api.changePassword(oldPassword, newPassword).subscribe({
      next: () => {
        this.passForm.reset();
        this.passSuccess.set('Contraseña actualizada exitosamente.');
        this.passSaving.set(false);
      },
      error: (err) => {
        console.error('Error al cambiar contraseña', err);
        this.passError.set(err.error?.message ?? 'No se pudo cambiar la contraseña. Verificá los datos e intentá de nuevo.');
        this.passSaving.set(false);
      }
    });
  }
}
