import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TramitesApiService } from '../../../core/services/tramites-api.service';
import { Tramite } from '../../../core/models';
import { ListaTareasComponent } from './lista-tareas.component';
import { DetalleTareaComponent } from './detalle-tarea.component';

@Component({
  selector: 'app-panel-tareas',
  standalone: true,
  imports: [CommonModule, ListaTareasComponent, DetalleTareaComponent],
  template: `
    <div class="flex h-full w-full overflow-hidden bg-background">
      <!-- Lista de tareas -->
      <div 
        class="flex-1 overflow-hidden transition-all duration-300"
        [class.pr-[400px]]="tareaSeleccionada()">
        <app-lista-tareas 
          [tramites]="tramites()"
          [seleccionadoId]="tareaSeleccionada()?.id"
          (seleccionar)="seleccionarTarea($event)">
        </app-lista-tareas>
      </div>

      <!-- Sidebar de detalle -->
      <div 
        class="fixed top-[64px] right-0 h-[calc(100vh-64px)] w-[400px] bg-surface border-l border-border shadow-xl transform transition-transform duration-300"
        [class.translate-x-full]="!tareaSeleccionada()">
        @if (tareaSeleccionada()) {
          <app-detalle-tarea 
            [tramite]="tareaSeleccionada()!"
            (cerrar)="cerrarDetalle()"
            (completado)="onPasoCompletado()">
          </app-detalle-tarea>
        }
      </div>
    </div>
  `
})
export class PanelTareasComponent implements OnInit {
  private tramitesService = inject(TramitesApiService);
  
  tramites = signal<Tramite[]>([]);
  tareaSeleccionada = signal<Tramite | null>(null);

  ngOnInit() {
    this.cargarTramites();
  }

  cargarTramites() {
    this.tramitesService.list().subscribe(data => {
      // Filtrar solo los que están en proceso
      const activos = data.filter(t => t.estado === 'EN_PROCESO');
      this.tramites.set(activos);
      
      // Actualizar la tarea seleccionada si existe
      const actual = this.tareaSeleccionada();
      if (actual) {
        const actualizada = activos.find(t => t.id === actual.id);
        this.tareaSeleccionada.set(actualizada || null);
      }
    });
  }

  seleccionarTarea(tramite: Tramite) {
    this.tareaSeleccionada.set(tramite);
  }

  cerrarDetalle() {
    this.tareaSeleccionada.set(null);
  }

  onPasoCompletado() {
    this.cerrarDetalle();
    this.cargarTramites();
  }
}
