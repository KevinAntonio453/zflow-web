import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiError } from '../../../core/models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'zf-login',
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb      = inject(FormBuilder);
  private readonly auth    = inject(AuthService);
  private readonly router  = inject(Router);
  private readonly route   = inject(ActivatedRoute);

  protected readonly loading = signal(false);
  protected readonly error   = signal<string | null>(null);
  protected readonly expired = signal(this.route.snapshot.queryParamMap.get('expired') === '1');

  protected readonly form = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        const target = this.route.snapshot.queryParamMap.get('redirect') ?? this.homeFor(this.auth.rol());
        this.router.navigateByUrl(target);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.extractMessage(err));
      },
    });
  }

  private homeFor(rol: string | null): string {
    switch (rol) {
      case 'ADMIN':       return '/admin/dashboard';
      case 'JEFE':        return '/jefe/dashboard';
      case 'FUNCIONARIO': return '/funcionario/dashboard';
      case 'CLIENTE':     return '/cliente/dashboard';
      default:            return '/auth/login';
    }
  }

  private extractMessage(err: { error?: ApiError }): string {
    if (err.error?.message) return err.error.message;
    return 'No se pudo iniciar sesión. Intentá de nuevo.';
  }
}
