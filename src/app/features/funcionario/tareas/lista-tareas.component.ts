import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tramite } from '../../../core/models';

@Component({
  selector: 'app-lista-tareas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-semibold text-text-primary">Bandeja de Tareas</h1>
        
        <div class="flex gap-4">
          <input 
            type="text" 
            [(ngModel)]="busqueda"
            placeholder="Buscar por política o cliente..."
            class="px-4 py-2 border border-border rounded-input text-sm w-64 bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
          <select 
            [(ngModel)]="orden"
            class="px-4 py-2 border border-border rounded-input text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="prioridad">Alta prioridad primero</option>
            <option value="recientes">Más recientes</option>
            <option value="antiguos">Más antiguos</option>
          </select>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto pr-2 space-y-4">
        @for (tramite of tramitesFiltrados(); track tramite.id) {
          <div 
            (click)="seleccionar.emit(tramite)"
            class="bg-surface rounded-card p-5 border cursor-pointer hover:shadow-card transition-shadow border-l-4"
            [class.border-primary-500]="seleccionadoId() === tramite.id"
            [class.border-border]="seleccionadoId() !== tramite.id"
            [class.border-l-danger]="tramite.prioridad === 'alta'"
            [class.border-l-warning]="tramite.prioridad === 'media'"
            [class.border-l-success]="tramite.prioridad === 'baja' || !tramite.prioridad">
            
            <div class="flex justify-between items-start mb-2">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full"
                     [class.bg-danger]="tramite.prioridad === 'alta'"
                     [class.bg-warning]="tramite.prioridad === 'media'"
                     [class.bg-success]="tramite.prioridad === 'baja' || !tramite.prioridad"></div>
                <h3 class="font-medium text-text-primary">{{ tramite.pasoActualNombre }}</h3>
              </div>
              <span class="text-xs text-text-secondary">{{ tramite.updatedAt | date:'short' }}</span>
            </div>
            
            <div class="text-sm text-text-secondary ml-6 mb-3">
              {{ tramite.politicaNombre }}
            </div>
            
            <div class="flex justify-between items-center ml-6 mt-4 pt-4 border-t border-border">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-semibold"
                     [title]="tramite.clienteNombre || tramite.clienteEmail || tramite.clienteId">
                  {{ (tramite.clienteNombre || tramite.clienteEmail || tramite.clienteId).substring(0, 1).toUpperCase() }}
                </div>
                <span class="text-xs text-text-secondary">
                  Cliente: 
                  <strong class="text-text-primary">{{ tramite.clienteNombre || tramite.clienteId }}</strong>
                  @if (tramite.clienteEmail) {
                    <span class="text-text-secondary font-normal"> ({{ tramite.clienteEmail }})</span>
                  }
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">En Proceso</span>
                <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider"
                      [class]="tramite.prioridad === 'alta' ? 'bg-danger/10 text-danger' : tramite.prioridad === 'media' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'">
                  {{ tramite.prioridad || 'baja' }}
                </span>
              </div>
            </div>
          </div>
        }
        @if (tramitesFiltrados().length === 0) {
          <div class="text-center py-12 text-text-secondary">
            No tienes tareas pendientes. ¡Buen trabajo!
          </div>
        }
      </div>
    </div>
  `
})
export class ListaTareasComponent {
  tramites = input.required<Tramite[]>();
  seleccionadoId = input<string | undefined>();
  seleccionar = output<Tramite>();

  busqueda = signal('');
  orden = signal('recientes');

  tramitesFiltrados = computed(() => {
    let result = this.tramites();
    
    const term = this.busqueda().toLowerCase();
    if (term) {
      result = result.filter(t => 
        t.politicaNombre.toLowerCase().includes(term) || 
        t.clienteId.toLowerCase().includes(term) ||
        (t.clienteNombre && t.clienteNombre.toLowerCase().includes(term)) ||
        (t.clienteEmail && t.clienteEmail.toLowerCase().includes(term)) ||
        t.pasoActualNombre.toLowerCase().includes(term)
      );
    }

    const order = this.orden();
    result = [...result].sort((a, b) => {
      if (order === 'prioridad') {
        return (b.prioridadScore || 0) - (a.prioridadScore || 0);
      }
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return order === 'recientes' ? dateB - dateA : dateA - dateB;
    });

    return result;
  });
}
