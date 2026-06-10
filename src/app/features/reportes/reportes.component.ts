import { Component, inject, OnInit, OnDestroy, signal, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnaliticaApiService } from '../../core/services/analitica-api.service';
import { PoliticasApiService } from '../../core/services/politicas-api.service';
import { TramitesApiService } from '../../core/services/tramites-api.service';
import { Politica, Tramite } from '../../core/models';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'zf-reportes-ia',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 p-6">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">Reportes Dinámicos por IA</h1>
        <p class="text-text-secondary">
          Buscá y filtrá trámites interactivamente. Dictá o escribí consultas avanzadas para filtrar con IA o exportar reportes en PDF.
        </p>
      </div>

      <!-- Atajos y Filtros -->
      <div class="bg-surface rounded-card border border-border shadow-card p-5 space-y-4">
        <!-- Sugerencias Rápidas (Chips) -->
        <div>
          <span class="text-xs font-semibold text-text-secondary uppercase tracking-wider">Sugerencias rápidas</span>
          <div class="flex flex-wrap gap-2 mt-2">
            @for (sug of sugerencias; track sug.titulo) {
              <button 
                type="button"
                (click)="seleccionarSugerencia(sug.query)"
                [disabled]="procesandoReporte() || buscandoDatos() || grabando()"
                class="px-3 py-1.5 text-xs rounded-full border border-border bg-background hover:bg-primary-50 text-text-secondary hover:text-primary-600 font-medium transition-all duration-200 disabled:opacity-50">
                {{ sug.titulo }}
              </button>
            }
          </div>
        </div>

        <div class="h-px bg-border"></div>

        <!-- Filtros -->
        <div class="space-y-3">
          <span class="text-xs font-semibold text-text-secondary uppercase tracking-wider">Filtros</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="space-y-1">
              <label class="text-[11px] font-semibold text-text-secondary">Limitar a Política</label>
              <select 
                [value]="selectedPolitica()"
                [disabled]="procesandoReporte() || buscandoDatos() || grabando()"
                (change)="onPoliticaFilterChange($event)"
                class="w-full px-3 py-2 border border-border rounded-input bg-background text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-primary-500">
                <option value="">Todas las políticas</option>
                @for (pol of politicas(); track pol.id) {
                  <option [value]="pol.nombre">{{ pol.nombre }}</option>
                }
              </select>
            </div>
            
            <div class="space-y-1">
              <label class="text-[11px] font-semibold text-text-secondary">Estado del Trámite</label>
              <select 
                [value]="selectedEstado()"
                [disabled]="procesandoReporte() || buscandoDatos() || grabando()"
                (change)="onEstadoFilterChange($event)"
                class="w-full px-3 py-2 border border-border rounded-input bg-background text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-primary-500">
                <option value="">Todos los estados</option>
                <option value="EN_PROCESO">En Proceso</option>
                <option value="PAUSADO">Pausados</option>
                <option value="COMPLETADO">Completados</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-[11px] font-semibold text-text-secondary">Fecha Desde</label>
              <input 
                type="date"
                [value]="selectedDesde()"
                [disabled]="procesandoReporte() || buscandoDatos() || grabando()"
                (change)="onDesdeFilterChange($event)"
                class="w-full px-3 py-2 border border-border rounded-input bg-background text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div class="space-y-1">
              <label class="text-[11px] font-semibold text-text-secondary">Fecha Hasta</label>
              <input 
                type="date"
                [value]="selectedHasta()"
                [disabled]="procesandoReporte() || buscandoDatos() || grabando()"
                (change)="onHastaFilterChange($event)"
                class="w-full px-3 py-2 border border-border rounded-input bg-background text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        <div class="h-px bg-border"></div>

        <!-- Barra de búsqueda y control por voz -->
        <div class="flex items-center gap-3 flex-wrap sm:flex-nowrap pt-2">
          <button 
            type="button"
            (click)="toggleGrabacion()"
            [disabled]="procesandoReporte() || buscandoDatos()"
            [class.bg-danger]="grabando()"
            [class.bg-primary-500]="!grabando() && !procesandoReporte() && !buscandoDatos()"
            [class.bg-gray-400]="procesandoReporte() || buscandoDatos()"
            [class.animate-pulse]="grabando()"
            class="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all duration-300 disabled:cursor-not-allowed hover:scale-105 shadow-sm"
            title="Dictar consulta para filtrar">
            @if (grabando()) {
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="text-white"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
            }
          </button>

          <div class="flex-1 min-w-[200px]">
            <input 
              type="text" 
              #promptInput
              [value]="promptValue()"
              (input)="promptValue.set(promptInput.value)"
              (keyup.enter)="buscarConIA(promptInput.value)"
              [disabled]="procesandoReporte() || buscandoDatos() || grabando()"
              [placeholder]="grabando() ? (transcripcion() ? 'Escuchando: ' + transcripcion() : 'Hablá para filtrar la lista...') : 'Buscá con IA en lenguaje natural (ej: trámites de prioridad alta)...'"
              class="w-full px-3 py-2 bg-surface border border-border rounded-input text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-75"
            />
          </div>

          <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            <button 
              type="button" 
              (click)="buscarConIA(promptValue())"
              [disabled]="procesandoReporte() || buscandoDatos() || grabando() || !promptValue().trim()"
              class="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-button bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 transition-colors flex-shrink-0">
              Buscar con IA
            </button>

            @if (esBusquedaActiva()) {
              <button 
                type="button" 
                (click)="limpiarBusqueda()"
                [disabled]="procesandoReporte() || buscandoDatos() || grabando()"
                class="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-button border border-border bg-background text-text-secondary hover:bg-gray-100 disabled:opacity-50 transition-colors flex-shrink-0">
                Limpiar
              </button>
            }

            <button 
              type="button" 
              (click)="exportarPdf()"
              [disabled]="procesandoReporte() || buscandoDatos() || grabando()"
              class="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-button bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-50 transition-colors flex-shrink-0 flex items-center justify-center gap-1.5 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Exportar PDF
            </button>
          </div>
        </div>

        @if (buscandoDatos()) {
          <div class="flex flex-col items-center justify-center py-6 border border-dashed border-border rounded-card bg-background/25">
            <div class="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p class="text-[11px] text-text-secondary mt-2 animate-pulse">Filtrando lista de trámites e interpretando datos...</p>
          </div>
        }

        @if (procesandoReporte()) {
          <div class="flex flex-col items-center justify-center py-8 border border-dashed border-border rounded-card bg-background/25">
            <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p class="text-xs text-text-secondary mt-3 animate-pulse">Compilando reporte PDF, traduciendo consulta a MongoDB e interpretando datos...</p>
          </div>
        }

        @if (pdfUrl()) {
          <div class="space-y-4 mt-6">
            <div class="flex justify-between items-center bg-background/50 p-2 rounded border border-border">
              <span class="text-xs font-semibold text-text-secondary">Vista Previa del Reporte PDF</span>
              <button 
                type="button"
                (click)="descargarReporte()"
                class="px-3 py-1.5 text-xs font-semibold rounded-button bg-success text-white hover:bg-success-600 transition-colors">
                Descargar PDF
              </button>
            </div>
            
            <div class="border border-border rounded-card overflow-hidden bg-background" style="height: 600px;">
              <iframe [src]="pdfUrl()" class="w-full h-full border-none"></iframe>
            </div>
          </div>
        }
      </div>

      <!-- Tabla de Listado Consolidado -->
      <div class="bg-surface rounded-card border border-border shadow-card p-5 mt-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-sm font-semibold text-text-secondary uppercase tracking-wider">Listado de trámites</h3>
          <span class="text-xs font-medium text-text-secondary bg-background px-2.5 py-1 rounded border border-border">
            {{ tramitesFiltrados().length }} encontrados
          </span>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-border text-xs font-semibold text-text-secondary uppercase">
                <th class="pb-3">Política</th>
                <th class="pb-3">Paso Actual</th>
                <th class="pb-3">Cliente</th>
                <th class="pb-3">Creado</th>
                <th class="pb-3">Prioridad</th>
                <th class="pb-3">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border text-sm text-text-primary">
              @for (t of tramitesFiltrados(); track t.id) {
                <tr class="hover:bg-background/50 transition-colors">
                  <td class="py-3 font-medium">{{ t.politicaNombre }}</td>
                  <td class="py-3">{{ t.pasoActualNombre || 'Finalizado' }}</td>
                  <td class="py-3 text-text-secondary text-xs truncate max-w-[180px]" [title]="t.clienteNombre || t.clienteId">{{ t.clienteNombre || t.clienteId }}</td>
                  <td class="py-3 text-xs text-text-secondary">{{ t.createdAt | date:'short' }}</td>
                  <td class="py-3">
                    @if (t.prioridad) {
                      <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider"
                            [class]="t.prioridad === 'alta' ? 'bg-danger/10 text-danger' : t.prioridad === 'media' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'">
                        {{ t.prioridad }}
                      </span>
                    } @else {
                      <span class="text-text-secondary">—</span>
                    }
                  </td>
                  <td class="py-3">
                    <span class="px-2 py-0.5 text-xs font-medium rounded"
                          [class]="getEstadoClass(t.estado)">
                      {{ t.estado }}
                    </span>
                  </td>
                </tr>
              }
              @if (tramitesFiltrados().length === 0) {
                <tr>
                  <td colspan="6" class="py-6 text-center text-text-secondary italic">No se encontraron trámites con los criterios seleccionados.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class ReportesComponent implements OnInit, OnDestroy {
  private readonly analiticaApi = inject(AnaliticaApiService);
  private readonly politicasApi = inject(PoliticasApiService);
  private readonly tramitesApi = inject(TramitesApiService);
  protected readonly sanitizer = inject(DomSanitizer);

  protected politicas = signal<Politica[]>([]);
  protected todosLosTramites = signal<Tramite[]>([]);
  protected tramitesFiltrados = signal<Tramite[]>([]);
  protected promptValue = signal('');
  protected grabando = signal(false);
  protected procesandoReporte = signal(false);
  protected buscandoDatos = signal(false);
  protected esBusquedaActiva = signal(false);
  protected transcripcion = signal('');
  protected pdfUrl = signal<SafeResourceUrl | null>(null);
  
  private pdfBlob: Blob | null = null;
  private ultimoAudioBlob?: Blob;

  // Filtros seleccionados
  protected selectedPolitica = signal('');
  protected selectedEstado = signal('');
  protected selectedDesde = signal('');
  protected selectedHasta = signal('');

  protected tieneFiltrosOTexto = computed(() => {
    return !!(
      this.promptValue().trim() ||
      this.selectedPolitica() ||
      this.selectedEstado() ||
      this.selectedDesde() ||
      this.selectedHasta()
    );
  });

  protected sugerencias = [
    { titulo: 'Resumen General', query: 'Mostrar un resumen general de todos los trámites en el sistema' },
    { titulo: 'Trámites Activos', query: 'Listar todos los trámites que se encuentran actualmente en proceso' },
    { titulo: 'Tiempos de Atención', query: 'Calcular el promedio de tiempo de resolución para los trámites completados' },
  ];

  private recognition: any = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private micStream: MediaStream | null = null;
  private leftChannel: number[] = [];
  private recordingLength = 0;
  private sampleRate = 0;

  constructor() {
    // Escucha de manera reactiva cambios en los filtros y actualiza el listado
    effect(() => {
      this.selectedPolitica();
      this.selectedEstado();
      this.selectedDesde();
      this.selectedHasta();
      this.todosLosTramites();
      
      untracked(() => {
        this.aplicarFiltrosLocales();
      });
    });
  }

  ngOnInit() {
    this.politicasApi.list().subscribe({
      next: (list) => this.politicas.set(list),
      error: (err) => console.error('Error cargando políticas para filtros', err)
    });

    this.cargarTodosLosTramites();
  }

  private cargarTodosLosTramites() {
    this.buscandoDatos.set(true);
    this.tramitesApi.list().subscribe({
      next: (list) => {
        this.todosLosTramites.set(list);
        this.aplicarFiltrosLocales();
        this.buscandoDatos.set(false);
      },
      error: (err) => {
        console.error('Error cargando todos los trámites', err);
        this.buscandoDatos.set(false);
      }
    });
  }

  protected aplicarFiltrosLocales() {
    let filtered = this.todosLosTramites();

    if (this.selectedPolitica()) {
      filtered = filtered.filter(t => t.politicaNombre === this.selectedPolitica());
    }

    if (this.selectedEstado()) {
      filtered = filtered.filter(t => t.estado === this.selectedEstado());
    }

    if (this.selectedDesde()) {
      const desdeDate = new Date(this.selectedDesde());
      filtered = filtered.filter(t => t.createdAt && new Date(t.createdAt) >= desdeDate);
    }

    if (this.selectedHasta()) {
      const hastaDate = new Date(this.selectedHasta());
      hastaDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => t.createdAt && new Date(t.createdAt) <= hastaDate);
    }

    this.tramitesFiltrados.set(filtered);
  }

  protected getEstadoClass(estado: any): string {
    const est = String(estado);
    if (est === 'COMPLETADO' || est === 'FINALIZADO') {
      return 'bg-accent-50/10 text-accent-500';
    } else if (est === 'PAUSADO') {
      return 'bg-danger/10 text-danger';
    }
    return 'bg-warning/10 text-warning';
  }

  protected seleccionarSugerencia(query: string) {
    this.promptValue.set(query);
    this.buscarConIA(query);
  }

  protected onPoliticaFilterChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedPolitica.set(value);
  }

  protected onEstadoFilterChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedEstado.set(value);
  }

  protected onDesdeFilterChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.selectedDesde.set(value);
  }

  protected onHastaFilterChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.selectedHasta.set(value);
  }

  protected buscarConIA(prompt: string) {
    const finalPrompt = prompt || '';
    if (!finalPrompt && !this.ultimoAudioBlob) return;

    this.buscandoDatos.set(true);
    this.esBusquedaActiva.set(true);
    this.pdfUrl.set(null); // Limpiar preview PDF anterior

    this.analiticaApi.queryReporteDatos(finalPrompt, this.ultimoAudioBlob).subscribe({
      next: (res: any) => {
        const data = res.data || [];
        this.todosLosTramites.set(data);
        this.buscandoDatos.set(false);
        this.ultimoAudioBlob = undefined;
      },
      error: (err) => {
        alert('Error al buscar con la IA: ' + err.message);
        this.buscandoDatos.set(false);
      }
    });
  }

  protected limpiarBusqueda() {
    this.promptValue.set('');
    this.esBusquedaActiva.set(false);
    this.ultimoAudioBlob = undefined;
    
    // Limpiar también los filtros selectores
    this.selectedPolitica.set('');
    this.selectedEstado.set('');
    this.selectedDesde.set('');
    this.selectedHasta.set('');

    this.cargarTodosLosTramites();
  }

  protected exportarPdf() {
    let finalPrompt = this.promptValue() || 'Reporte de analítica';
    
    // Concatenar filtros seleccionados al prompt si existen
    const filterParts: string[] = [];
    if (this.selectedPolitica()) {
      filterParts.push(`política: ${this.selectedPolitica()}`);
    }
    if (this.selectedEstado()) {
      filterParts.push(`estado: ${this.selectedEstado()}`);
    }
    if (this.selectedDesde()) {
      filterParts.push(`desde: ${this.selectedDesde()}`);
    }
    if (this.selectedHasta()) {
      filterParts.push(`hasta: ${this.selectedHasta()}`);
    }
    
    if (filterParts.length > 0) {
      const filterStr = `(filtrado por ${filterParts.join(', ')})`;
      finalPrompt = `${finalPrompt} ${filterStr}`.trim();
    }

    this.procesandoReporte.set(true);
    this.pdfUrl.set(null);
    this.pdfBlob = null;

    this.analiticaApi.generarReportePdf(finalPrompt, this.ultimoAudioBlob).subscribe({
      next: (blob) => {
        this.pdfBlob = blob;
        const url = URL.createObjectURL(blob);
        this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        this.procesandoReporte.set(false);
      },
      error: (err) => {
        alert('Error al exportar el reporte PDF: ' + err.message);
        this.procesandoReporte.set(false);
      }
    });
  }

  protected descargarReporte() {
    if (!this.pdfBlob) return;
    const url = URL.createObjectURL(this.pdfBlob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `reporte-zflow-${new Date().getTime()}.pdf`
    });
    a.click();
    URL.revokeObjectURL(url);
  }

  protected toggleGrabacion() {
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

      console.log('🎤 Grabando audio para reporte interactivo...');
    }).catch(err => {
      alert('No se pudo acceder al micrófono: ' + err.message);
      console.error(err);
    });
  }

  private iniciarReconocimientoVoz() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.transcripcion.set('');
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'es';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event: any) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      this.transcripcion.set(text);
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.error('No se pudo iniciar SpeechRecognition local:', e);
    }
  }

  private detenerReconocimientoVoz() {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
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
      this.ultimoAudioBlob = wavBlob;
      this.buscarConIA('');
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

  ngOnDestroy() {
    this.detenerReconocimientoVoz();
    if (this.processor) this.processor.disconnect();
    if (this.audioContext) this.audioContext.close();
    if (this.micStream) this.micStream.getTracks().forEach(track => track.stop());
  }
}
