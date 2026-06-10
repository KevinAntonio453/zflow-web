import { Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Actividad, Documento, Politica, Tramite, VersionDocumento } from '../../../core/models';
import { PoliticasApiService } from '../../../core/services/politicas-api.service';
import { TramitesApiService } from '../../../core/services/tramites-api.service';
import { DocumentosApiService } from '../../../core/services/documentos-api.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-detalle-tarea',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="h-full flex flex-col">
      <div class="p-6 border-b border-border flex justify-between items-center">
        <div>
          <h2 class="text-lg font-semibold text-text-primary">{{ tramite().pasoActualNombre }}</h2>
          <div class="flex flex-col gap-0.5 text-xs text-text-secondary">
            <span>Trámite: <span class="font-mono">{{ tramite().id }}</span></span>
            <span>Cliente: <strong class="text-text-primary">{{ tramite().clienteNombre || tramite().clienteId }}</strong>@if (tramite().clienteEmail) { ({{ tramite().clienteEmail }})}</span>
          </div>
        </div>
        <button 
          (click)="cerrar.emit()"
          class="text-text-secondary hover:text-text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6">
        @if (cargando()) {
          <div class="flex justify-center items-center py-10">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        } @else {
          
          <!-- Datos de Pasos Previos -->
          @if (obtenerPasosPrevios().length > 0) {
            <div class="mb-6 border-b border-border pb-4">
              <h4 class="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Datos de Pasos Previos</h4>
              <div class="space-y-3">
                @for (paso of obtenerPasosPrevios(); track paso.actividadId) {
                  <div class="p-3 bg-background rounded-input border border-border text-sm space-y-1.5">
                    <div class="flex justify-between items-center text-xs font-semibold text-text-secondary">
                      <span class="font-medium text-text-primary">{{ obtenerNombreActividad(paso.actividadId) }}</span>
                      <span class="px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 border border-primary-100 uppercase text-[10px]">{{ paso.laneName }}</span>
                    </div>
                    <div class="space-y-1 pl-1">
                      @for (item of paso.datosFormulario | keyvalue; track item.key) {
                        <div class="flex justify-between gap-4 text-xs">
                          <span class="text-text-secondary font-medium">{{ obtenerLabelCampo(paso.actividadId, item.key) }}:</span>
                          <span class="text-text-primary font-semibold truncate max-w-[200px]" [title]="obtenerValorCampo(item.value)">{{ obtenerValorCampo(item.value) }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Documentos Adjuntos -->
          @if (documentos().length > 0) {
            <div class="mb-6 border-b border-border pb-4">
              <h4 class="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Documentos Adjuntos</h4>
              <div class="space-y-2">
                @for (doc of documentos(); track doc.id) {
                  <div class="p-2.5 bg-background rounded-input border border-border text-sm flex flex-col gap-1.5">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2 overflow-hidden">
                        <svg class="flex-shrink-0 text-text-secondary" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                        <span class="truncate font-medium text-text-primary text-xs" [title]="doc.nombre">{{ doc.nombre }}</span>
                      </div>
                      
                      <div class="flex items-center gap-1">
                        <button type="button" 
                          (click)="descargarDocumento(doc.id, doc.nombre)"
                          [disabled]="analizandoDocs()[doc.id] || subiendoNuevaVersionId() === doc.id"
                          class="text-xs text-primary-500 hover:text-primary-600 font-semibold px-2 py-1 hover:bg-primary-50 rounded disabled:opacity-50">
                          Descargar
                        </button>
                        
                        <button type="button" 
                          (click)="analizarConIa(doc.id)"
                          [disabled]="analizandoDocs()[doc.id] || subiendoNuevaVersionId() === doc.id"
                          class="text-xs text-indigo-600 hover:text-indigo-700 font-semibold px-2 py-1 hover:bg-indigo-50 rounded disabled:opacity-50">
                          Analizar con IA
                        </button>

                        <button type="button"
                          (click)="toggleVersiones(doc.id)"
                          [disabled]="analizandoDocs()[doc.id] || subiendoNuevaVersionId() === doc.id"
                          class="text-xs text-emerald-600 hover:text-emerald-700 font-semibold px-2 py-1 hover:bg-emerald-50 rounded disabled:opacity-50">
                          Historial
                        </button>
                      </div>
                    </div>

                    <!-- Panel de versiones/historial -->
                    @if (showVersionesMap()[doc.id]) {
                      <div class="p-3 bg-surface border border-border rounded-input text-xs space-y-3">
                        <div class="flex justify-between items-center pb-2 border-b border-border">
                          <span class="font-semibold text-text-primary text-[11px] uppercase tracking-wider">Historial de Versiones</span>
                          
                          <!-- Input para subir nueva versión -->
                          <label class="cursor-pointer px-2.5 py-1 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded text-[11px] font-semibold transition-colors">
                            Subir Nueva Versión
                            <input type="file" 
                              (change)="subirNuevaVersion($event, doc.id)" 
                              [disabled]="subiendoNuevaVersionId() === doc.id"
                              class="hidden">
                          </label>
                        </div>

                        @if (cargandoVersiones()[doc.id]) {
                          <div class="flex justify-center items-center py-2">
                            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                          </div>
                        } @else {
                          <div class="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                            @for (v of versionesMap()[doc.id]; track v.version) {
                              <div class="flex justify-between items-center p-2 rounded bg-background border border-border/60 hover:bg-surface transition-colors">
                                <div class="flex flex-col gap-0.5">
                                  <div class="flex items-center gap-1.5">
                                    <span class="font-bold text-text-primary text-[11px]">V{{ v.version }}</span>
                                    @if (isVersionActiva(doc, v)) {
                                      <span class="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] uppercase tracking-wider font-semibold">Activa</span>
                                    }
                                  </div>
                                  <span class="text-[10px] text-text-secondary">
                                    Por: {{ v.subidoPor }} | {{ v.fecha | date:'dd/MM/yyyy HH:mm' }}
                                  </span>
                                </div>

                                @if (!isVersionActiva(doc, v)) {
                                  <button type="button"
                                    (click)="restaurarVersion(doc.id, v.version)"
                                    [disabled]="subiendoNuevaVersionId() === doc.id"
                                    class="text-[10px] px-2 py-0.8 bg-transparent text-primary-500 hover:bg-primary-50 border border-primary-100 hover:border-primary-200 rounded font-semibold transition-colors disabled:opacity-50">
                                    Restaurar
                                  </button>
                                }
                              </div>
                            }
                            @if (!versionesMap()[doc.id] || versionesMap()[doc.id].length === 0) {
                              <p class="text-[10px] text-text-secondary italic text-center py-2">No hay versiones registradas.</p>
                            }
                          </div>
                        }
                      </div>
                    }

                    <!-- Panel de análisis de IA -->
                    @if (doc.analisisIa) {
                      <div class="p-3 rounded-input text-xs border transition-all duration-300"
                        [ngClass]="{
                          'bg-red-50/50 border-red-200 text-red-800': !doc.analisisIa.valido || doc.analisisIa.scoreDiscrepancia > 50,
                          'bg-amber-50/50 border-amber-200 text-amber-800': doc.analisisIa.valido && doc.analisisIa.scoreDiscrepancia > 0 && doc.analisisIa.scoreDiscrepancia <= 50,
                          'bg-emerald-50/50 border-emerald-200 text-emerald-800': doc.analisisIa.valido && doc.analisisIa.scoreDiscrepancia === 0
                        }">
                        <div class="flex justify-between items-center mb-1.5 font-semibold">
                          <span class="flex items-center gap-1.5">
                            @if (!doc.analisisIa.valido || doc.analisisIa.scoreDiscrepancia > 50) {
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-red-600"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                              <span>Auditoría de IA: Discrepancia Crítica</span>
                            } @else if (doc.analisisIa.scoreDiscrepancia > 0) {
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-amber-600"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                              <span>Auditoría de IA: Discrepancia Menor</span>
                            } @else {
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                              <span>Auditoría de IA: Conforme</span>
                            }
                          </span>
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-mono border uppercase tracking-wider"
                            [ngClass]="{
                              'bg-red-100 border-red-200 text-red-800': !doc.analisisIa.valido || doc.analisisIa.scoreDiscrepancia > 50,
                              'bg-amber-100 border-amber-200 text-amber-800': doc.analisisIa.valido && doc.analisisIa.scoreDiscrepancia > 0 && doc.analisisIa.scoreDiscrepancia <= 50,
                              'bg-emerald-100 border-emerald-200 text-emerald-800': doc.analisisIa.valido && doc.analisisIa.scoreDiscrepancia === 0
                            }">
                            Score: {{ doc.analisisIa.scoreDiscrepancia }}
                          </span>
                        </div>
                        
                        <p class="leading-relaxed mb-2 font-medium text-[11px]">{{ doc.analisisIa.resumen }}</p>
                        
                        @if (doc.analisisIa.alertas && doc.analisisIa.alertas.length > 0) {
                          <div class="border-t border-current/10 pt-1.5 mt-1.5">
                            <span class="font-semibold text-[9px] uppercase tracking-wider block mb-1">Alertas:</span>
                            <ul class="list-disc list-inside space-y-0.5 text-[10px] font-normal">
                              @for (alerta of doc.analisisIa.alertas; track $index) {
                                <li>{{ alerta }}</li>
                              }
                            </ul>
                          </div>
                        }
                      </div>
                    }

                    <!-- Panel de carga -->
                    @if (analizandoDocs()[doc.id]) {
                      <div class="p-3 rounded-input text-xs border border-blue-200 bg-blue-50/50 text-blue-800 flex items-center gap-2">
                        <div class="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-blue-500"></div>
                        <span class="font-semibold uppercase tracking-wider animate-pulse">Analizando documento con Gemini...</span>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- Botón de Inteligencia Artificial (Gemini dictado por voz) y Transcripción Integrada -->
          <div class="mb-6 p-4 bg-primary-50 rounded-card flex items-start gap-4 transition-all duration-300">
            <button 
              (click)="toggleGrabacion()"
              [disabled]="procesandoVoz()"
              [class.bg-danger]="grabando()"
              [class.bg-primary-500]="!grabando() && !procesandoVoz()"
              [class.bg-gray-400]="procesandoVoz()"
              [class.animate-pulse]="grabando() || procesandoVoz()"
              class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-300 disabled:cursor-not-allowed shadow-md hover:scale-105">
              @if (grabando()) {
                <!-- Stop Icon (solid white square) -->
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-white"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg>
              } @else {
                <!-- Microphone Icon -->
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
              }
            </button>
            <div class="flex-1 min-w-0">
              <h4 class="font-semibold text-primary-700 text-sm mb-1">Completar con IA de Voz</h4>
              
              @if (!grabando() && !procesandoVoz()) {
                <p class="text-xs text-primary-600/90 leading-relaxed">
                  Dictá los datos del formulario y la IA los completará automáticamente. Ej: "Monto de cincuenta mil pesos".
                </p>
              } @else if (grabando()) {
                <div class="space-y-1.5">
                  <div class="flex items-center gap-1.5">
                    <span class="relative flex h-2 w-2">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-2 w-2 bg-danger"></span>
                    </span>
                    <span class="text-[11px] font-bold text-danger uppercase tracking-wider">Escuchando...</span>
                  </div>
                  <p class="text-xs text-text-primary italic font-medium break-words leading-relaxed">
                    @if (transcripcionEnVivo()) {
                      "{{ transcripcionEnVivo() }}"
                    } @else if (errorReconocimiento()) {
                      <span class="text-xs text-warning-600 block mb-1 font-semibold">Transcripción en tiempo real no disponible.</span>
                      <span class="text-xs text-text-secondary font-normal block">Igual podés hablar; al presionar el botón de detener, la IA procesará tu audio completo.</span>
                    } @else {
                      <span class="text-text-secondary animate-pulse">Hablá ahora, el texto aparecerá acá...</span>
                    }
                  </p>
                </div>
              } @else if (procesandoVoz()) {
                <div class="flex items-center gap-2 py-1">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                  <span class="text-xs font-semibold text-primary-600 uppercase tracking-wider animate-pulse">Procesando con Gemini 2.5...</span>
                </div>
              }
            </div>
          </div>

          <form [formGroup]="form" class="space-y-6">
            @for (campo of actividad()?.formulario; track campo.id) {
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-text-primary">
                  {{ campo.nombre }}
                  @if (campo.requerido) {
                    <span class="text-danger">*</span>
                  }
                </label>
                
                @if (campo.tipo === 'TEXTO') {
                  <input type="text" [formControlName]="campo.id" class="px-3 py-2 bg-surface border border-border rounded-input text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Ingresar valor">
                }
                @if (campo.tipo === 'NUMERO') {
                  <input type="number" [formControlName]="campo.id" class="px-3 py-2 bg-surface border border-border rounded-input text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0">
                }
                @if (campo.tipo === 'FECHA') {
                  <input type="date" [formControlName]="campo.id" class="px-3 py-2 bg-surface border border-border rounded-input text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500">
                }
                @if (campo.tipo === 'SELECTOR') {
                  <select [formControlName]="campo.id" class="px-3 py-2 bg-surface border border-border rounded-input text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">Seleccionar opción...</option>
                    @for (opcion of campo.opciones; track opcion) {
                      <option [value]="opcion">{{ opcion }}</option>
                    }
                  </select>
                }
                @if (campo.tipo === 'ARCHIVO') {
                  <input type="file" (change)="onFileSelect($event, campo.id)" class="text-sm text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-input file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100">
                }
              </div>
            }
            @if (actividad()?.formulario?.length === 0) {
              <p class="text-sm text-text-secondary italic">Esta actividad no requiere completar campos. Simplemente marca completado para avanzar al siguiente paso.</p>
            }
          </form>
        }
      </div>

      <div class="p-6 border-t border-border flex gap-3">
        <button 
          (click)="cerrar.emit()"
          class="flex-1 px-4 py-2 bg-transparent border border-border text-text-primary rounded-button text-sm font-medium hover:bg-background transition-colors">
          Dejar Pendiente
        </button>
        <button 
          (click)="completar()"
          [disabled]="form.invalid || enviando() || cargando()"
          class="flex-1 px-4 py-2 bg-primary-500 text-white rounded-button text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {{ enviando() ? 'Enviando...' : 'Completar Tarea' }}
        </button>
      </div>
    </div>
  `
})
export class DetalleTareaComponent {
  tramite = input.required<Tramite>();
  cerrar = output<void>();
  completado = output<void>();

  private politicasService = inject(PoliticasApiService);
  private tramitesService = inject(TramitesApiService);
  private documentosService = inject(DocumentosApiService);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  cargando = signal(false);
  enviando = signal(false);
  grabando = signal(false);
  procesandoVoz = signal(false);
  politica = signal<Politica | null>(null);
  actividad = signal<Actividad | null>(null);
  documentos = signal<Documento[]>([]);
  analizandoDocs = signal<Record<string, boolean>>({});
  showVersionesMap = signal<Record<string, boolean>>({});
  versionesMap = signal<Record<string, VersionDocumento[]>>({});
  cargandoVersiones = signal<Record<string, boolean>>({});
  subiendoNuevaVersionId = signal<string | null>(null);
  form: FormGroup = this.fb.group({});

  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private micStream: MediaStream | null = null;
  private leftChannel: number[] = [];
  private recordingLength = 0;
  private sampleRate = 0;
  transcripcionEnVivo = signal('');
  errorReconocimiento = signal<string | null>(null);
  private recognition: any = null;

  constructor() {
    effect(() => {
      const t = this.tramite();
      if (t) {
        this.cargarDatos(t);
      }
    });
  }

  private cargarDatos(t: Tramite) {
    this.cargando.set(true);
    this.politicasService.getById(t.politicaId).subscribe({
      next: (politica) => {
        this.politica.set(politica);
        const currentAct = politica.actividades.find(a => a.actividadId === t.pasoActual);
        this.actividad.set(currentAct || null);
        this.construirFormulario(currentAct);
        
        // Cargar los documentos asociados al trámite
        this.documentosService.listByTramite(t.id).subscribe({
          next: (docs) => {
            this.documentos.set(docs);
            this.cargando.set(false);
          },
          error: () => {
            this.cargando.set(false);
          }
        });
      },
      error: () => this.cargando.set(false)
    });
  }

  private construirFormulario(act: Actividad | undefined) {
    this.form = this.fb.group({});
    if (!act || !act.formulario) return;

    act.formulario.forEach(campo => {
      const validators = campo.requerido ? [Validators.required] : [];
      this.form.addControl(campo.id, this.fb.control('', validators));
    });
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
      // Create a ScriptProcessorNode (bufferSize 4096, 1 input channel, 1 output channel)
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        const left = e.inputBuffer.getChannelData(0);
        this.leftChannel.push(...Array.from(left));
        this.recordingLength += left.length;
      };

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.grabando.set(true);
      // Start speech recognition with a 150ms delay to prevent audio engine init race conditions
      setTimeout(() => {
        if (this.grabando()) {
          this.iniciarReconocimientoVoz();
        }
      }, 150);

      console.log('🎤 Grabando audio con AudioContext (WAV)...');
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
    console.log('🛑 Grabación detenida. Exportando a WAV...');

    if (this.leftChannel.length > 0) {
      const wavBlob = this.exportarWAV(this.leftChannel, this.recordingLength, this.sampleRate);
      this.procesarAudioConIA(wavBlob);
    }
  }

  private exportarWAV(channelData: number[], recordingLength: number, sampleRate: number): Blob {
    const buffer = new ArrayBuffer(44 + recordingLength * 2);
    const view = new DataView(buffer);

    // RIFF identifier
    this.writeString(view, 0, 'RIFF');
    // file length
    view.setUint32(4, 36 + recordingLength * 2, true);
    // RIFF type
    this.writeString(view, 8, 'WAVE');
    // format chunk identifier
    this.writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw PCM = 1)
    view.setUint16(20, 1, true);
    // channel count (1 channel)
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * 2, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample (16 bits)
    view.setUint16(34, 16, true);
    // data chunk identifier
    this.writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, recordingLength * 2, true);

    // Write PCM samples
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
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition no está soportado en este navegador.');
      this.errorReconocimiento.set('not-supported');
      return;
    }

    this.transcripcionEnVivo.set('');
    this.errorReconocimiento.set(null);
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'es';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onstart = () => {
      console.log('🎙️ Reconocimiento de voz iniciado');
    };

    this.recognition.onresult = (event: any) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      this.transcripcionEnVivo.set(text);
      this.errorReconocimiento.set(null);
    };

    this.recognition.onerror = (err: any) => {
      console.error('🎙️ Error en reconocimiento de voz:', err);
      this.errorReconocimiento.set(err.error || 'error');
    };

    this.recognition.onend = () => {
      console.log('🎙️ Reconocimiento de voz finalizado');
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.error('No se pudo iniciar el reconocimiento de voz:', e);
      this.errorReconocimiento.set('init-failed');
    }
  }

  private detenerReconocimientoVoz() {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
  }

  private procesarAudioConIA(audioBlob: Blob) {
    const act = this.actividad();
    if (!act || !act.formulario) return;

    this.procesandoVoz.set(true);

    const formData = new FormData();
    // Use grabacion.wav for WAV file
    formData.append('file', audioBlob, 'grabacion.wav');
    formData.append('esquema', JSON.stringify(act.formulario));

    this.http.post<Record<string, any>>('http://localhost:8001/api/ai/voz-formulario', formData).subscribe({
      next: (resultado) => {
        console.log('🤖 [Gemini Voice AI] Resultado de extracción:', resultado);
        this.form.patchValue(resultado);
        this.procesandoVoz.set(false);
        this.transcripcionEnVivo.set('');
        this.errorReconocimiento.set(null);
      },
      error: (err) => {
        this.procesandoVoz.set(false);
        this.transcripcionEnVivo.set('');
        this.errorReconocimiento.set(null);
        alert('Error al procesar el audio con IA: ' + (err.error?.detail || err.message));
        console.error(err);
      }
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
      this.cargando.set(true);
      const tramiteId = this.tramite().id;
      this.documentosService.upload(file, tramiteId).subscribe({
        next: (doc) => {
          this.form.patchValue({ [controlName]: doc.id });
          // Recargar lista de documentos
          this.documentosService.listByTramite(tramiteId).subscribe(docs => {
            this.documentos.set(docs);
            this.cargando.set(false);
          });
        },
        error: (err) => {
          this.cargando.set(false);
          alert('Error al subir el archivo a S3: ' + (err.error?.message || err.message));
          event.target.value = '';
        }
      });
    }
  }

  descargarDocumento(docId: string, nombre: string) {
    this.documentosService.descargar(docId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombre;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        alert('Error al descargar el archivo de S3');
        console.error(err);
      }
    });
  }

  analizarConIa(docId: string) {
    this.analizandoDocs.update(state => ({ ...state, [docId]: true }));
    this.documentosService.analizar(docId).subscribe({
      next: (docActualizado) => {
        this.documentos.update(docs => docs.map(d => d.id === docId ? docActualizado : d));
        this.analizandoDocs.update(state => ({ ...state, [docId]: false }));
      },
      error: (err) => {
        this.analizandoDocs.update(state => ({ ...state, [docId]: false }));
        alert('Error al analizar el documento con IA: ' + (err.error?.message || err.message));
        console.error(err);
      }
    });
  }

  toggleVersiones(docId: string) {
    const isShowing = !this.showVersionesMap()[docId];
    this.showVersionesMap.update(state => ({ ...state, [docId]: isShowing }));
    
    if (isShowing) {
      this.cargarVersiones(docId);
    }
  }

  cargarVersiones(docId: string) {
    this.cargandoVersiones.update(state => ({ ...state, [docId]: true }));
    this.documentosService.listVersiones(docId).subscribe({
      next: (versiones) => {
        const ordenadas = [...versiones].sort((a, b) => b.version - a.version);
        this.versionesMap.update(state => ({ ...state, [docId]: ordenadas }));
        this.cargandoVersiones.update(state => ({ ...state, [docId]: false }));
      },
      error: (err) => {
        this.cargandoVersiones.update(state => ({ ...state, [docId]: false }));
        console.error('Error al cargar versiones:', err);
      }
    });
  }

  subirNuevaVersion(event: any, docId: string) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo no puede superar los 10MB');
      event.target.value = '';
      return;
    }

    this.subiendoNuevaVersionId.set(docId);
    this.documentosService.subirNuevaVersion(docId, file).subscribe({
      next: (docActualizado) => {
        this.documentosService.listByTramite(this.tramite().id).subscribe(docs => {
          this.documentos.set(docs);
          this.cargarVersiones(docId);
          this.subiendoNuevaVersionId.set(null);
          event.target.value = '';
        });
      },
      error: (err) => {
        this.subiendoNuevaVersionId.set(null);
        alert('Error al subir la nueva versión: ' + (err.error?.message || err.message));
        event.target.value = '';
      }
    });
  }

  restaurarVersion(docId: string, version: number) {
    if (!confirm(`¿Estás seguro de que querés restaurar la versión ${version}?`)) {
      return;
    }

    this.subiendoNuevaVersionId.set(docId);
    this.documentosService.restaurar(docId, version).subscribe({
      next: () => {
        this.documentosService.listByTramite(this.tramite().id).subscribe(docs => {
          this.documentos.set(docs);
          this.cargarVersiones(docId);
          this.subiendoNuevaVersionId.set(null);
        });
      },
      error: (err) => {
        this.subiendoNuevaVersionId.set(null);
        alert('Error al restaurar la versión: ' + (err.error?.message || err.message));
      }
    });
  }

  isVersionActiva(doc: Documento, version: VersionDocumento): boolean {
    return version.s3Key === doc.s3Key;
  }

  obtenerPasosPrevios() {
    const t = this.tramite();
    if (!t || !t.historial) return [];
    return t.historial.filter(h => h.fin && h.datosFormulario && Object.keys(h.datosFormulario).length > 0);
  }

  completar() {
    if (this.form.invalid) return;
    
    this.enviando.set(true);
    const t = this.tramite();
    
    this.tramitesService.completarPaso(t.id, {
      actividadId: t.pasoActual!,
      datosFormulario: this.form.value
    }).subscribe({
      next: () => {
        this.enviando.set(false);
        this.completado.emit();
      },
      error: () => {
        this.enviando.set(false);
      }
    });
  }

  obtenerNombreActividad(actividadId: string): string {
    const pol = this.politica();
    if (!pol) return actividadId;
    const act = pol.actividades.find(a => a.actividadId === actividadId);
    return act ? act.nombre : actividadId;
  }

  obtenerLabelCampo(actividadId: string, campoId: string): string {
    const pol = this.politica();
    if (!pol) return campoId;
    const act = pol.actividades.find(a => a.actividadId === actividadId);
    if (!act) return campoId;
    const campo = act.formulario.find(c => c.id === campoId);
    return campo ? campo.nombre : campoId;
  }

  obtenerValorCampo(val: any): string {
    if (typeof val !== 'string') return String(val);
    const doc = this.documentos().find(d => d.id === val);
    return doc ? doc.nombre : val;
  }
}
