import { Injectable, effect, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'zflow-theme';

/**
 * Gestiona el tema (light / dark) de la aplicación.
 *
 * - Persiste en localStorage.
 * - Detecta la preferencia del SO en la primera visita.
 * - Aplica la clase `dark` en `<html>` para activar las utilities `dark:*` de Tailwind v4.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<Theme>(this.detectInitial());

  readonly theme = this._theme.asReadonly();

  constructor() {
    // El constructor de un service providedIn: 'root' es un injection context,
    // por eso effect() funciona directamente acá.
    effect(() => {
      const current = this._theme();
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', current === 'dark');
      }
      try {
        localStorage.setItem(STORAGE_KEY, current);
      } catch {
        // ignore (private mode, quota, etc.)
      }
    });
  }

  toggle(): void {
    this._theme.update(t => (t === 'light' ? 'dark' : 'light'));
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
  }

  private detectInitial(): Theme {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
}
