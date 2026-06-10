import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { PoliticasApiService } from '../../core/services/politicas-api.service';
import { TramitesApiService } from '../../core/services/tramites-api.service';
import { DocumentosApiService } from '../../core/services/documentos-api.service';
import { Politica, Actividad, SugerenciaPoliticaResponse } from '../../core/models';

@Component({
  selector: 'zf-cliente-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- ── VISTA 1: DASHBOARD CONSOLIDADO ── -->
      @if (currentPath() === '/cliente/dashboard' || currentPath() === '/cliente') {
        <div>
          <h1 class="text-2xl font-bold text-text-primary">Mi Panel</h1>
          <p class="text-text-secondary text-sm">
            Hola, {{ auth.user()?.nombre }}. Consultá el estado de tus solicitudes o inicia un nuevo trámite.
          </p>
        </div>

        <!-- KPIs del Cliente -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-surface border border-border rounded-card p-4 shadow-sm flex flex-col justify-between">
            <div>
              <span class="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">Solicitudes Activas</span>
              <span class="text-3xl font-extrabold text-text-primary block">{{ enProcesoCount() }}</span>
            </div>
            <p class="text-xs text-text-secondary mt-2">Trámites en curso esperando resolución.</p>
          </div>

          <div class="bg-surface border border-border rounded-card p-4 shadow-sm flex flex-col justify-between">
            <div>
              <span class="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">Completadas</span>
              <span class="text-3xl font-extrabold text-text-primary block">{{ completadosCount() }}</span>
            </div>
            <p class="text-xs text-text-secondary mt-2">Trámites finalizados exitosamente.</p>
          </div>

          <div class="bg-surface border border-border rounded-card p-4 shadow-sm flex flex-col justify-between">
            <div>
              <span class="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">Iniciar Nueva Gestión</span>
              <button
                type="button"
                (click)="irNuevoTramite()"
                class="mt-2 w-full px-3 py-1.5 rounded-button bg-primary-500 text-white hover:bg-primary-600 text-xs font-semibold transition-colors animate-fade-in"
              >
                Ver catálogo de trámites
              </button>
            </div>
            <p class="text-xs text-text-secondary mt-2">Creá una solicitud de trámite en línea.</p>
          </div>
        </div>

        <!-- Asistente de Voz Gemini (FI-03) -->
        <ng-container *ngTemplateOutlet="asistenteVozTpl"></ng-container>

        <!-- Dos Columnas: Catálogo Rápido + Solicitudes Recientes -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Trámites Frecuentes -->
          <div class="bg-surface border border-border p-5 rounded-card shadow-sm flex flex-col justify-between">
            <div>
              <h2 class="text-base font-bold text-text-primary mb-3">Trámites Frecuentes</h2>
              <div class="grid grid-cols-1 gap-3">
                @for (pol of destacadosPoliticas(); track pol.id) {
                  <div class="p-3 rounded-card border border-border bg-background flex flex-col justify-between gap-2">
                    <div>
                      <div class="font-bold text-xs text-text-primary">{{ pol.nombre }}</div>
                      <p class="text-[11px] text-text-secondary line-clamp-2 mt-0.5 leading-relaxed">{{ pol.descripcion }}</p>
                    </div>
                    <div class="flex justify-end">
                      <button type="button" (click)="iniciarTramite(pol.id)" [disabled]="creandoId() === pol.id"
                        class="bg-primary-500 hover:bg-primary-600 text-white font-bold py-1 px-2.5 rounded-button text-[10px] transition-colors">
                        {{ creandoId() === pol.id ? 'Iniciando...' : 'Iniciar' }}
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
            <div class="mt-4 pt-2 border-t border-border flex justify-end">
              <button (click)="irNuevoTramite()" class="text-xs text-primary-500 font-bold hover:underline cursor-pointer">
                Ver todos los trámites disponibles →
              </button>
            </div>
          </div>

          <!-- Actividad Reciente -->
          <div class="bg-surface border border-border p-5 rounded-card shadow-sm flex flex-col justify-between">
            <div>
              <h2 class="text-base font-bold text-text-primary mb-3">Solicitudes Recientes</h2>
              <div class="space-y-3">
                @for (tram of recientesTramites(); track tram.id) {
                  <div class="p-3 rounded-card border border-border bg-background flex items-center justify-between gap-2 text-xs">
                    <div>
                      <span class="font-bold text-text-primary block">{{ tram.politicaNombre }}</span>
                      <span class="text-[10px] text-text-secondary block mt-0.5">Paso: {{ tram.pasoActualNombre || 'Finalizado' }}</span>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                      [class]="tram.estado === 'COMPLETADO' ? 'bg-success/10 text-success' : tram.estado === 'EN_PROCESO' ? 'bg-primary-50 text-primary-600 font-semibold' : 'bg-text-secondary/10 text-text-secondary'">
                      {{ tram.estado }}
                    </span>
                  </div>
                } @empty {
                  <p class="text-xs text-text-secondary italic py-6 text-center">Aún no iniciaste ninguna solicitud.</p>
                }
              </div>
            </div>
            <div class="mt-4 pt-2 border-t border-border flex justify-end">
              <button (click)="irMisSolicitudes()" class="text-xs text-primary-500 font-bold hover:underline cursor-pointer">
                Ver historial completo de solicitudes →
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ── VISTA 2: INICIAR TRÁMITE (CATÁLOGO COMPLETO) ── -->
      @if (currentPath() === '/cliente/nuevo') {
        <div>
          <h1 class="text-2xl font-bold text-text-primary">Iniciar nuevo trámite</h1>
          <p class="text-text-secondary text-sm">
            Elegí el trámite correspondiente a tu gestión o describí tu caso por voz para recibir una sugerencia de la IA.
          </p>
        </div>

        <!-- Asistente de Voz Gemini -->
        <ng-container *ngTemplateOutlet="asistenteVozTpl"></ng-container>

        <!-- Catálogo completo -->
        <div class="space-y-3">
          <h2 class="text-base font-bold text-text-primary pb-1 border-b border-border">Trámites disponibles</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (pol of politicasActivas(); track pol.id) {
              <div class="bg-surface border border-border p-4 rounded-card shadow-sm flex flex-col justify-between">
                <div>
                  <h3 class="font-bold text-base text-text-primary mb-2">{{ pol.nombre }}</h3>
                  <p class="text-xs text-text-secondary line-clamp-3 mb-4 leading-relaxed">
                    {{ pol.descripcion || 'Sin descripción' }}
                  </p>
                </div>
                <button 
                  type="button" 
                  (click)="iniciarTramite(pol.id)"
                  [disabled]="creandoId() === pol.id"
                  class="w-full bg-primary-500 text-white px-4 py-2 rounded-button hover:bg-primary-600 disabled:opacity-50 text-xs font-semibold transition-colors">
                  {{ creandoId() === pol.id ? 'Iniciando...' : 'Iniciar trámite' }}
                </button>
              </div>
            } @empty {
              <p class="text-text-secondary text-xs col-span-full">No hay trámites disponibles para iniciar en este momento.</p>
            }
          </div>
        </div>
      }

      <!-- ── VISTA 3: MIS SOLICITUDES (TABLA COMPLETA) ── -->
      @if (currentPath() === '/cliente/solicitudes') {
        <div class="flex items-center justify-between flex-wrap gap-4 flex-shrink-0 pb-1 border-b border-border">
          <div>
            <h1 class="text-2xl font-bold text-text-primary">Mis solicitudes</h1>
            <p class="text-text-secondary text-sm mt-0.5">
              Hacé el seguimiento de tus trámites ingresados, su prioridad y el paso actual.
            </p>
          </div>
          <!-- Buscador Local -->
          <div class="flex items-center gap-2">
            <input type="text" 
              [value]="searchTerms()"
              (input)="onSearchInput($event)"
              placeholder="Buscar por ID o tipo de trámite..." 
              class="px-3 py-1.5 bg-surface border border-border rounded-input text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500 w-64 shadow-sm"
            />
          </div>
        </div>

        <div class="bg-surface border border-border p-5 rounded-card shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-border text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                  <th class="pb-3 pr-2">ID Trámite</th>
                  <th class="pb-3 pr-2">Política / Flujo</th>
                  <th class="pb-3 pr-2">Paso Actual</th>
                  <th class="pb-3 pr-2">Estado</th>
                  <th class="pb-3 pr-2">Prioridad</th>
                  <th class="pb-3 pr-2">Última actualización</th>
                  <th class="pb-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border text-xs text-text-primary">
                @for (tram of filteredTramites(); track tram.id) {
                  <tr class="hover:bg-background/50 transition-colors">
                    <td class="py-3 font-mono text-[10px] text-text-secondary pr-2">{{ tram.id }}</td>
                    <td class="py-3 font-semibold pr-2">{{ tram.politicaNombre }}</td>
                    <td class="py-3 pr-2">{{ tram.pasoActualNombre || 'Finalizado' }}</td>
                    <td class="py-3 pr-2">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                        [class]="tram.estado === 'COMPLETADO' ? 'bg-success/10 text-success' : tram.estado === 'EN_PROCESO' ? 'bg-primary-50 text-primary-600 font-semibold' : 'bg-text-secondary/10 text-text-secondary'">
                        {{ tram.estado }}
                      </span>
                    </td>
                    <td class="py-3 pr-2">
                      @if (tram.prioridad) {
                        <span class="px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider"
                          [class]="tram.prioridad === 'alta' ? 'bg-danger/10 text-danger border border-danger/20' : tram.prioridad === 'media' ? 'bg-warning/10 text-warning border border-warning/20' : 'bg-success/10 text-success border border-success/20'">
                          {{ tram.prioridad }}
                        </span>
                      } @else {
                        <span class="text-text-secondary">—</span>
                      }
                    </td>
                    <td class="py-3 text-text-secondary pr-2">{{ tram.updatedAt | date:'short' }}</td>
                    <td class="py-3 text-right">
                      @if (puedeCancelar(tram)) {
                        <button type="button" (click)="cancelarTramite(tram.id)"
                          class="px-2 py-1 bg-danger hover:bg-danger/90 text-white rounded text-[10px] font-bold transition-all shadow hover:scale-105">
                          Cancelar
                        </button>
                      } @else {
                        <span class="text-text-secondary text-[10px] italic">—</span>
                      }
                    </td>
                  </tr>
                }
                @if (filteredTramites().length === 0) {
                  <tr>
                    <td colspan="7" class="py-8 text-center text-text-secondary italic">
                      {{ searchTerms() ? 'No se encontraron solicitudes que coincidan con tu búsqueda.' : 'Aún no iniciaste ninguna solicitud de trámite.' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>

    <!-- ── TEMPLATE COMPARTIDO: ASISTENTE DE VOZ GEMINI ── -->
    <ng-template #asistenteVozTpl>
      <div class="p-4 bg-primary-50/50 rounded-card border border-primary-100 flex items-start gap-4 shadow-sm">
        <button 
          type="button"
          (click)="toggleGrabacion()"
          [disabled]="procesandoAudio()"
          [class.bg-danger]="grabando()"
          [class.bg-primary-500]="!grabando() && !procesandoAudio()"
          [class.bg-gray-400]="procesandoAudio()"
          [class.animate-pulse]="grabando() || procesandoAudio()"
          class="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-white transition-all duration-300 disabled:cursor-not-allowed shadow hover:scale-105">
          @if (grabando()) {
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="text-white"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
          }
        </button>
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-primary-700 text-xs mb-1">Iniciar Trámite con Asistente de Voz</h3>
          
          @if (!grabando() && !procesandoAudio() && !sugerenciaResultado()) {
            <p class="text-[11px] text-primary-600/90 leading-relaxed font-medium">
              ¿No estás seguro de qué trámite necesitas? Presioná el micrófono y describí tu situación (ej: "necesito pedir vacaciones" o "quiero abrir una cuenta"). La IA te sugerirá el trámite adecuado.
            </p>
          } @else if (grabando()) {
            <div class="space-y-1">
              <div class="flex items-center gap-1.5">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-danger"></span>
                </span>
                <span class="text-[9px] font-bold text-danger uppercase tracking-wider">Escuchando tu descripción...</span>
              </div>
              <p class="text-xs text-text-primary italic font-medium">
                @if (transcripcionEnVivo()) {
                  "{{ transcripcionEnVivo() }}"
                } @else {
                  <span class="text-text-secondary animate-pulse">Hablá ahora...</span>
                }
              </p>
            </div>
          } @else if (procesandoAudio()) {
            <div class="flex items-center gap-2 py-1">
              <div class="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary-500"></div>
              <span class="text-[10px] font-bold text-primary-600 uppercase tracking-wider animate-pulse">Analizando tu situación con Gemini...</span>
            </div>
          } @else if (sugerenciaResultado(); as sug) {
            <div class="space-y-3">
              <div class="text-[11px] text-text-primary">
                <strong>Transcripción:</strong> <span class="italic font-medium">"{{ sug.transcripcion }}"</span>
              </div>

              @if (sug.sugerenciaConfianza && sug.politicaSugeridaId; as sugId) {
                @if (obtenerPoliticaPorId(sugId); as polSug) {
                  <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-input text-emerald-800 text-[11px] space-y-2 max-w-md">
                    <div class="flex items-center gap-1.5 font-bold text-emerald-900">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                      <span>Trámite sugerido por la IA</span>
                    </div>
                    <div class="font-bold text-xs text-emerald-900">{{ polSug.nombre }}</div>
                    <p class="text-emerald-800/90 leading-relaxed font-normal">{{ polSug.descripcion }}</p>
                    <div class="flex gap-2 pt-1">
                      <button type="button" (click)="iniciarTramite(polSug.id); limpiarSugerencia()"
                        class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-button text-[10px] transition-colors">
                        Confirmar e Iniciar
                      </button>
                      <button type="button" (click)="limpiarSugerencia()"
                        class="bg-transparent border border-emerald-300 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-button text-[10px] transition-colors">
                        Descartar
                      </button>
                    </div>
                  </div>
                }
              } @else if (sug.politicasCandidatasIds && sug.politicasCandidatasIds.length > 0) {
                <div class="p-3 bg-amber-50 border border-amber-200 rounded-input text-amber-800 text-[11px] space-y-2 max-w-lg">
                  <div class="flex items-center gap-1.5 font-bold text-amber-900">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-600"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    <span>Selecciona una de las opciones sugeridas:</span>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    @for (candId of sug.politicasCandidatasIds; track candId) {
                      @if (obtenerPoliticaPorId(candId); as candPol) {
                        <div class="p-2.5 bg-surface border border-amber-200 rounded hover:border-amber-400 transition-colors flex flex-col justify-between gap-2">
                          <div>
                            <div class="font-bold text-[10px] text-text-primary">{{ candPol.nombre }}</div>
                            <p class="text-[9px] text-text-secondary line-clamp-2 mt-0.5 leading-relaxed">{{ candPol.descripcion }}</p>
                          </div>
                          <button type="button" (click)="iniciarTramite(candPol.id); limpiarSugerencia()"
                            class="bg-amber-500 hover:bg-amber-600 text-white font-bold py-1 px-2 rounded-button text-[9px] text-center w-full transition-colors">
                            Seleccionar
                          </button>
                        </div>
                      }
                    }
                  </div>
                  <div class="flex justify-end pt-1">
                    <button type="button" (click)="limpiarSugerencia()"
                      class="text-[9px] text-amber-800 font-bold underline hover:text-amber-900">
                      Descartar sugerencias
                    </button>
                  </div>
                </div>
              } @else {
                <div class="p-3 bg-red-50 border border-red-200 rounded-input text-red-800 text-[11px] space-y-1.5 max-w-md">
                  <div class="flex items-center gap-1.5 font-bold text-red-900 mb-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-red-600"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <span>Sin coincidencias</span>
                  </div>
                  <p class="font-normal">No pudimos asociar tu descripción con ningún trámite disponible. Intentá de nuevo con otras palabras.</p>
                  <button type="button" (click)="limpiarSugerencia()"
                    class="text-[9px] text-red-800 font-bold underline mt-1 block">
                    Cerrar aviso
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </ng-template>

    <!-- Modal de Formulario Inicial del Cliente (cuando el primer paso es carril Cliente) -->
    @if (activeFormActivity(); as act) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
        <div class="bg-surface border border-border p-6 rounded-card shadow-lg max-w-lg w-full flex flex-col max-h-[85vh]">
          <!-- Header -->
          <div class="flex justify-between items-center pb-3 border-b border-border">
            <div>
              <h3 class="text-lg font-bold text-text-primary">Completar Solicitud</h3>
              <p class="text-xs text-text-secondary mt-0.5">Completá los datos iniciales para el trámite.</p>
            </div>
            <button type="button" (click)="cerrarModalFormulario()"
              class="text-text-secondary hover:text-text-primary text-lg font-bold">
              ✕
            </button>
          </div>
          
          <!-- Content -->
          <div class="flex-1 overflow-y-auto py-4 space-y-4">
            <h4 class="text-sm font-semibold text-text-secondary">{{ act.nombre }}</h4>
            <form [formGroup]="form" class="space-y-4">
              @for (campo of act.formulario; track campo.id) {
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-medium text-text-primary">
                    {{ campo.nombre }}
                    @if (campo.requerido) {
                      <span class="text-danger">*</span>
                    }
                  </label>
                  
                  @if (campo.tipo === 'TEXTO') {
                    <input type="text" [formControlName]="campo.id" 
                      class="px-3 py-2 bg-background border border-border rounded-input text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500" 
                      placeholder="Ingresar valor">
                  }
                  @if (campo.tipo === 'NUMERO') {
                    <input type="number" [formControlName]="campo.id" 
                      class="px-3 py-2 bg-background border border-border rounded-input text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500" 
                      placeholder="0">
                  }
                  @if (campo.tipo === 'FECHA') {
                    <input type="date" [formControlName]="campo.id" 
                      class="px-3 py-2 bg-background border border-border rounded-input text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500">
                  }
                  @if (campo.tipo === 'SELECTOR') {
                    <select [formControlName]="campo.id" 
                      class="px-3 py-2 bg-background border border-border rounded-input text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500">
                      <option value="">Seleccionar opción...</option>
                      @for (opcion of campo.opciones; track opcion) {
                        <option [value]="opcion">{{ opcion }}</option>
                      }
                    </select>
                  }
                  @if (campo.tipo === 'ARCHIVO') {
                    <div class="flex flex-col gap-1">
                      <input type="file" (change)="onFileSelect($event, campo.id)" 
                        [disabled]="cargandoArchivo()"
                        class="text-sm text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-input file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100 disabled:opacity-50">
                      @if (cargandoArchivo()) {
                        <span class="text-xs text-primary-500 font-medium animate-pulse">Subiendo archivo a S3...</span>
                      } @else if (form.get(campo.id)?.value) {
                        <span class="text-xs text-success font-medium">✓ Archivo listo</span>
                      }
                    </div>
                  }
                </div>
              }
              @if (act.formulario.length === 0) {
                <p class="text-sm text-text-secondary italic">Esta solicitud no requiere datos adicionales. Hacé clic en "Iniciar" para proceder.</p>
              }
            </form>
          </div>
          
          <!-- Footer -->
          <div class="flex justify-end gap-2 pt-3 border-t border-border">
            <button type="button" (click)="cerrarModalFormulario()"
              class="px-4 py-2 text-xs rounded-button border border-border bg-surface hover:bg-primary-50 text-text-secondary">
              Cancelar
            </button>
            <button type="button" (click)="enviarConFormulario()" [disabled]="form.invalid || creandoId() === null || cargandoArchivo()"
              class="px-4 py-2 text-xs rounded-button bg-primary-500 text-white hover:bg-primary-600 font-medium disabled:opacity-50">
              {{ creandoId() !== null ? 'Iniciando...' : 'Iniciar Trámite' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ClienteDashboardComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly politicasApi = inject(PoliticasApiService);
  private readonly tramitesApi = inject(TramitesApiService);
  private readonly documentosApi = inject(DocumentosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly currentPath = signal<string>('');
  protected readonly searchTerms = signal<string>('');

  protected politicasActivas = signal<Politica[]>([]);
  protected creandoId = signal<string | null>(null);
  protected misTramites = signal<any[]>([]);

  protected readonly enProcesoCount = computed(() => 
    this.misTramites().filter(t => t.estado === 'EN_PROCESO').length
  );

  protected readonly completadosCount = computed(() => 
    this.misTramites().filter(t => t.estado === 'COMPLETADO').length
  );

  protected readonly recientesTramites = computed(() => {
    return [...this.misTramites()]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 3);
  });

  protected readonly destacadosPoliticas = computed(() => 
    this.politicasActivas().slice(0, 3)
  );

  protected readonly filteredTramites = computed(() => {
    const term = this.searchTerms().toLowerCase().trim();
    if (!term) return this.misTramites();
    return this.misTramites().filter(t => 
      t.id.toLowerCase().includes(term) || 
      (t.politicaNombre && t.politicaNombre.toLowerCase().includes(term))
    );
  });

  constructor() {
    this.currentPath.set(this.router.url);
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentPath.set(event.urlAfterRedirects || event.url);
    });
  }

  protected irNuevoTramite() {
    this.router.navigate(['/cliente/nuevo']);
  }

  protected irMisSolicitudes() {
    this.router.navigate(['/cliente/solicitudes']);
  }

  protected onSearchInput(event: any) {
    this.searchTerms.set((event.target as HTMLInputElement).value);
  }

  protected puedeCancelar(tram: any): boolean {
    if (tram.estado !== 'EN_PROCESO' && tram.estado !== 'PENDIENTE') {
      return false;
    }
    if (!tram.historial) return true;
    return !tram.historial.some((h: any) => h.funcionarioId != null);
  }

  protected cancelarTramite(id: string) {
    if (confirm('¿Estás seguro de que querés cancelar esta solicitud?')) {
      this.tramitesApi.cancelar(id).subscribe({
        next: () => {
          alert('¡Solicitud cancelada con éxito!');
          this.cargarMisTramites();
        },
        error: (err) => {
          alert('Error al cancelar la solicitud: ' + (err.error?.message || err.message));
          console.error(err);
        }
      });
    }
  }

  protected activeFormActivity = signal<Actividad | null>(null);
  protected activePoliticaId = signal<string | null>(null);
  protected currentTramiteId = signal<string | null>(null);
  protected cargandoArchivo = signal(false);
  form: FormGroup = this.fb.group({});

  protected grabando = signal(false);
  protected procesandoAudio = signal(false);
  protected transcripcionEnVivo = signal('');
  protected sugerenciaResultado = signal<SugerenciaPoliticaResponse | null>(null);

  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private micStream: MediaStream | null = null;
  private leftChannel: number[] = [];
  private recordingLength = 0;
  private sampleRate = 0;
  private recognition: any = null;

  private generateObjectId(): string {
    const timestamp = Math.floor(new Date().getTime() / 1000).toString(16).padStart(8, '0');
    const randomValue = Math.random().toString(16).substring(2, 18).padStart(16, '0');
    return timestamp + randomValue;
  }

  ngOnInit() {
    this.politicasApi.list('ACTIVA').subscribe({
      next: (data) => this.politicasActivas.set(data),
      error: (err) => console.error('Error cargando políticas activas', err)
    });
    this.cargarMisTramites();
  }

  cargarMisTramites() {
    this.tramitesApi.list().subscribe({
      next: (data) => this.misTramites.set(data),
      error: (err) => console.error('Error cargando mis solicitudes', err)
    });
  }

  iniciarTramite(politicaId: string) {
    this.creandoId.set(politicaId);
    const generatedId = this.generateObjectId();
    this.currentTramiteId.set(generatedId);
    
    // 1. Fetch full policy to inspect diagram and activities
    this.politicasApi.getById(politicaId).subscribe({
      next: (pol) => {
        const xml = pol.diagramaBpmn;
        if (!xml) {
          // No diagram -> standard creation
          this.procederCreacionDirecta(politicaId);
          return;
        }

        // 2. Parse first activity ID from diagram
        const firstActId = this.parseFirstActivityId(xml);
        if (!firstActId) {
          this.procederCreacionDirecta(politicaId);
          return;
        }

        // 3. Find activity definition
        const firstAct = pol.actividades.find(a => a.actividadId === firstActId);
        if (firstAct && firstAct.laneName && firstAct.laneName.toLowerCase() === 'cliente') {
          // First step is Cliente -> show form modal!
          this.activeFormActivity.set(firstAct);
          this.activePoliticaId.set(politicaId);
          this.construirFormulario(firstAct);
        } else {
          // First step is not Cliente -> direct creation
          this.procederCreacionDirecta(politicaId);
        }
      },
      error: (err) => {
        this.creandoId.set(null);
        this.currentTramiteId.set(null);
        alert('Error al obtener la política');
        console.error(err);
      }
    });
  }

  private procederCreacionDirecta(politicaId: string) {
    const generatedId = this.currentTramiteId() || this.generateObjectId();
    this.tramitesApi.create({ id: generatedId, politicaId }).subscribe({
      next: (tramite) => {
        this.creandoId.set(null);
        this.currentTramiteId.set(null);
        alert('¡Trámite iniciado con éxito! ID: ' + tramite.id);
        this.cargarMisTramites();
      },
      error: (err) => {
        this.creandoId.set(null);
        this.currentTramiteId.set(null);
        alert('Error al iniciar trámite');
        console.error(err);
      }
    });
  }

  private construirFormulario(act: Actividad) {
    this.form = this.fb.group({});
    if (!act.formulario) return;

    act.formulario.forEach(campo => {
      const validators = campo.requerido ? [Validators.required] : [];
      this.form.addControl(campo.id, this.fb.control('', validators));
    });
  }

  onFileSelect(event: any, controlName: string) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo no puede superar los 10MB');
        event.target.value = '';
        return;
      }
      this.cargandoArchivo.set(true);
      const tramiteId = this.currentTramiteId();
      if (!tramiteId) {
        this.cargandoArchivo.set(false);
        alert('ID de trámite no inicializado');
        return;
      }
      this.documentosApi.upload(file, tramiteId).subscribe({
        next: (doc) => {
          this.form.patchValue({ [controlName]: doc.id });
          this.cargandoArchivo.set(false);
        },
        error: (err) => {
          this.cargandoArchivo.set(false);
          alert('Error al subir el archivo a S3: ' + (err.error?.message || err.message));
          event.target.value = '';
        }
      });
    }
  }

  cerrarModalFormulario() {
    this.activeFormActivity.set(null);
    this.activePoliticaId.set(null);
    this.creandoId.set(null);
    this.currentTramiteId.set(null);
    this.form = this.fb.group({});
  }

  enviarConFormulario() {
    if (this.form.invalid) return;

    const politicaId = this.activePoliticaId();
    const generatedId = this.currentTramiteId();
    if (!politicaId || !generatedId) return;

    this.tramitesApi.create({
      id: generatedId,
      politicaId,
      datosFormulario: this.form.value
    }).subscribe({
      next: (tramite) => {
        this.cerrarModalFormulario();
        alert('¡Trámite iniciado con éxito! ID: ' + tramite.id);
        this.cargarMisTramites();
      },
      error: (err) => {
        this.creandoId.set(null);
        alert('Error al iniciar el trámite con formulario');
        console.error(err);
      }
    });
  }

  private parseFirstActivityId(xml: string): string | null {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'application/xml');
      
      const startEvent = doc.getElementsByTagNameNS('*', 'startEvent')[0] || doc.querySelector('startEvent');
      if (!startEvent) return null;
      
      const startId = startEvent.getAttribute('id');
      if (!startId) return null;
      
      const flows = Array.from(doc.getElementsByTagNameNS('*', 'sequenceFlow') || doc.querySelectorAll('sequenceFlow'));
      const firstFlow = flows.find(f => f.getAttribute('sourceRef') === startId);
      
      return firstFlow ? firstFlow.getAttribute('targetRef') : null;
    } catch (e) {
      console.error('Error parsing BPMN diagram to find first activity', e);
      return null;
    }
  }

  toggleGrabacion() {
    if (this.grabando()) {
      this.detenerGrabacion();
    } else {
      this.iniciarGrabacion();
    }
  }

  private iniciarGrabacion() {
    this.leftChannel = [];
    this.recordingLength = 0;

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      this.micStream = stream;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.sampleRate = this.audioContext.sampleRate;

      const source = this.audioContext.createMediaStreamSource(stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        const left = e.inputBuffer.getChannelData(0);
        this.leftChannel.push(...Array.from(left));
        this.recordingLength += left.length;
      };

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.grabando.set(true);
      setTimeout(() => {
        if (this.grabando()) {
          this.iniciarReconocimientoVoz();
        }
      }, 150);

      console.log('🎤 Grabando audio para sugerencia de política...');
    }).catch(err => {
      alert('No se pudo acceder al micrófono: ' + err.message);
      console.error(err);
    });
  }

  private detenerGrabacion() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    this.grabando.set(false);
    this.detenerReconocimientoVoz();

    if (this.leftChannel.length > 0) {
      const wavBlob = this.exportarWAV(this.leftChannel, this.recordingLength, this.sampleRate);
      this.enviarAudioAIServicio(wavBlob);
    }
  }

  private exportarWAV(channelData: number[], recordingLength: number, sampleRate: number): Blob {
    const buffer = new ArrayBuffer(44 + recordingLength * 2);
    const view = new DataView(buffer);

    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + recordingLength * 2, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, recordingLength * 2, true);

    let offset = 44;
    for (let i = 0; i < channelData.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  private iniciarReconocimientoVoz() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.transcripcionEnVivo.set('');
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'es';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event: any) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      this.transcripcionEnVivo.set(text);
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.error(e);
    }
  }

  private detenerReconocimientoVoz() {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
  }

  private enviarAudioAIServicio(audioBlob: Blob) {
    this.procesandoAudio.set(true);
    this.tramitesApi.sugerirPolitica(audioBlob).subscribe({
      next: (resultado) => {
        this.sugerenciaResultado.set(resultado);
        this.procesandoAudio.set(false);
        this.transcripcionEnVivo.set('');
      },
      error: (err) => {
        this.procesandoAudio.set(false);
        this.transcripcionEnVivo.set('');
        alert('Error al obtener sugerencias de la IA: ' + (err.error?.message || err.message));
        console.error(err);
      }
    });
  }

  protected obtenerPoliticaPorId(id: string): Politica | null {
    return this.politicasActivas().find(p => p.id === id) || null;
  }

  protected limpiarSugerencia() {
    this.sugerenciaResultado.set(null);
  }
}
