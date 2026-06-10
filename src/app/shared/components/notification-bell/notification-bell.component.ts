import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Notificacion } from '../../../core/models';
import { NotificacionesApiService } from '../../../core/services/notificaciones-api.service';
import { Subscription, interval, startWith, switchMap } from 'rxjs';

@Component({
  selector: 'zf-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="relative">
      <button
        type="button"
        (click)="toggleDropdown()"
        aria-label="Notificaciones"
        class="relative p-2 rounded-button hover:bg-primary-50 dark:hover:bg-primary-900/40 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        @if (count() > 0) {
          <span class="absolute -top-0.5 -right-0.5 bg-danger text-white text-xs rounded-full h-4 min-w-4 px-1 flex items-center justify-center font-semibold">
            {{ count() }}
          </span>
        }
      </button>

      <!-- Dropdown -->
      @if (showDropdown()) {
        <div class="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-card shadow-card z-50 py-2">
          <div class="px-4 py-2 border-b border-border flex justify-between items-center">
            <span class="font-semibold text-sm text-text-primary">Notificaciones</span>
            @if (count() > 0) {
              <button (click)="marcarTodasComoLeidas()" class="text-xs text-primary-500 hover:text-primary-600 font-medium">Leer todas</button>
            }
          </div>
          
          <div class="max-h-64 overflow-y-auto">
            @if (notificaciones().length === 0) {
              <p class="text-xs text-text-secondary text-center py-6 italic">No tienes notificaciones nuevas</p>
            } @else {
              @for (n of notificaciones(); track n.id) {
                <div 
                  (click)="hacerClicNotificacion(n)"
                  [class.bg-primary-50]="!n.leida"
                  [class.dark:bg-primary-950/20]="!n.leida"
                  class="px-4 py-2.5 hover:bg-background dark:hover:bg-primary-900/20 cursor-pointer border-b border-border/50 last:border-b-0 transition-colors"
                >
                  <p class="text-xs font-semibold text-text-primary">{{ n.titulo }}</p>
                  <p class="text-xs text-text-secondary line-clamp-2 mt-0.5">{{ n.mensaje }}</p>
                  <span class="text-[10px] text-text-secondary mt-1 block">{{ n.createdAt | date:'shortTime' }}</span>
                </div>
              }
            }
          </div>

          <div class="border-t border-border mt-2 pt-2 px-4 text-center">
            <a 
              routerLink="/notificaciones" 
              (click)="showDropdown.set(false)"
              class="text-xs text-primary-500 hover:text-primary-600 font-medium block w-full py-1"
            >
              Ver todas las notificaciones
            </a>
          </div>
        </div>
      }
    </div>
  `,
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private readonly notificacionesService = inject(NotificacionesApiService);
  private readonly router = inject(Router);

  protected readonly count = signal(0);
  protected readonly notificaciones = signal<Notificacion[]>([]);
  protected readonly showDropdown = signal(false);

  private pollingSub?: Subscription;

  ngOnInit(): void {
    // Polling cada 30 segundos
    this.pollingSub = interval(30000).pipe(
      startWith(0),
      switchMap(() => this.notificacionesService.countNoLeidas())
    ).subscribe({
      next: (c) => {
        this.count.set(c);
        if (this.showDropdown()) {
          this.cargarNotificacionesDropdown();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.pollingSub?.unsubscribe();
  }

  toggleDropdown(): void {
    const nextState = !this.showDropdown();
    this.showDropdown.set(nextState);
    if (nextState) {
      this.cargarNotificacionesDropdown();
    }
  }

  private cargarNotificacionesDropdown(): void {
    this.notificacionesService.list(0, 5).subscribe({
      next: (res) => {
        this.notificaciones.set(res.content);
      }
    });
  }

  hacerClicNotificacion(n: Notificacion): void {
    if (!n.leida) {
      this.notificacionesService.leer(n.id).subscribe({
        next: () => {
          this.cargarNotificacionesDropdown();
          this.count.update(c => Math.max(0, c - 1));
        }
      });
    }

    this.showDropdown.set(false);
    
    if (n.tramiteId) {
      this.router.navigate(['/funcionario/tareas']);
    }
  }

  marcarTodasComoLeidas(): void {
    this.notificacionesService.leerTodas().subscribe({
      next: () => {
        this.count.set(0);
        this.cargarNotificacionesDropdown();
      }
    });
  }
}
