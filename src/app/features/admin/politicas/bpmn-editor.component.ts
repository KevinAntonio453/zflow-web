import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  output,
  signal,
  viewChild,
  inject,
} from '@angular/core';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import { Actividad, Departamento } from '../../../core/models';
import { DepartamentosApiService } from '../../../core/services/departamentos-api.service';
import { TramitesApiService } from '../../../core/services/tramites-api.service';
import { ConfiguradorActividadComponent } from './configurador-actividad.component';
import { BPMN_TEMPLATES } from './bpmn-templates';

// ─────────────────────────────────────────────────────────────────────────────
// XML inicial — proceso BPMN simple (SIN pool / lanes).
// El diseñador agrega Pool + Lane manualmente desde la palette si los necesita.
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_DIAGRAM_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  id="Definitions_zflow"
  targetNamespace="http://zflow.io/schema/bpmn">

  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Inicio"/>
  </bpmn:process>

  <bpmndi:BPMNDiagram id="Diagram_1">
    <bpmndi:BPMNPlane id="Plane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="156" y="82" width="36" height="36"/>
        <bpmndi:BPMNLabel>
          <dc:Bounds x="162" y="125" width="24" height="14"/>
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

// ─────────────────────────────────────────────────────────────────────────────
// Palette personalizada — REEMPLAZA el PaletteProvider original.
// La clave es exportar el módulo con __depends__: ['paletteModule'] y
// sobrescribir 'paletteProvider' con nuestro provider.
// ─────────────────────────────────────────────────────────────────────────────
function ZFlowPaletteProvider(
  this: any,
  palette: any,
  create: any,
  elementFactory: any,
  spaceTool: any,
  lassoTool: any,
  handTool: any,
) {
  this._palette        = palette;
  this._create         = create;
  this._elementFactory = elementFactory;
  this._spaceTool      = spaceTool;
  this._lassoTool      = lassoTool;
  this._handTool       = handTool;
  palette.registerProvider(this);
}

(ZFlowPaletteProvider as any).$inject = [
  'palette', 'create', 'elementFactory',
  'spaceTool', 'lassoTool', 'handTool',
];

ZFlowPaletteProvider.prototype.getPaletteEntries = function () {
  const create         = this._create;
  const elementFactory = this._elementFactory;
  const spaceTool      = this._spaceTool;
  const lassoTool      = this._lassoTool;
  const handTool       = this._handTool;

  function startDrag(type: string, options: Record<string, unknown> = {}) {
    return function (event: MouseEvent) {
      const shape = elementFactory.createShape({ type, ...options });
      create.start(event, shape);
    };
  }

  return {
    // ── Herramientas ──────────────────────────────────────────────────────
    'hand-tool': {
      group: 'tools',
      className: 'bpmn-icon-hand-tool',
      title: 'Mover canvas',
      action: {
        click:     (e: MouseEvent) => handTool.activateHand(e),
        dragstart: (e: MouseEvent) => handTool.activateHand(e),
      },
    },
    'lasso-tool': {
      group: 'tools',
      className: 'bpmn-icon-lasso-tool',
      title: 'Selección múltiple',
      action: {
        click:     (e: MouseEvent) => lassoTool.activateSelection(e),
        dragstart: (e: MouseEvent) => lassoTool.activateSelection(e),
      },
    },
    'space-tool': {
      group: 'tools',
      className: 'bpmn-icon-space-tool',
      title: 'Crear espacio',
      action: {
        click:     (e: MouseEvent) => spaceTool.activateSelection(e),
        dragstart: (e: MouseEvent) => spaceTool.activateSelection(e),
      },
    },
    'sep-tools': { group: 'tools', separator: true },

    // ── Inicio / Fin ──────────────────────────────────────────────────────
    'create-start-event': {
      group: 'uml',
      className: 'bpmn-icon-start-event-none',
      title: 'Inicio ●',
      action: {
        click:     startDrag('bpmn:StartEvent'),
        dragstart: startDrag('bpmn:StartEvent'),
      },
    },
    'create-end-event': {
      group: 'uml',
      className: 'bpmn-icon-end-event-none',
      title: 'Fin ◎',
      action: {
        click:     startDrag('bpmn:EndEvent'),
        dragstart: startDrag('bpmn:EndEvent'),
      },
    },
    'sep-eventos': { group: 'uml', separator: true },

    // ── Acción (rectángulo redondeado) ────────────────────────────────────
    'create-task': {
      group: 'uml',
      className: 'bpmn-icon-task',
      title: 'Acción / Tarea',
      action: {
        click:     startDrag('bpmn:Task'),
        dragstart: startDrag('bpmn:Task'),
      },
    },
    'sep-tarea': { group: 'uml', separator: true },

    // ── Decisión (rombo) ──────────────────────────────────────────────────
    'create-exclusive-gateway': {
      group: 'uml',
      className: 'bpmn-icon-gateway-xor',
      title: 'Decisión ◇',
      action: {
        click:     startDrag('bpmn:ExclusiveGateway'),
        dragstart: startDrag('bpmn:ExclusiveGateway'),
      },
    },

    // ── Fork / Join (barra gruesa) ────────────────────────────────────────
    'create-parallel-gateway': {
      group: 'uml',
      className: 'bpmn-icon-gateway-parallel',
      title: 'Fork / Join ⊕',
      action: {
        click:     startDrag('bpmn:ParallelGateway'),
        dragstart: startDrag('bpmn:ParallelGateway'),
      },
    },
    'sep-gateways': { group: 'uml', separator: true },

    // ── Carril / Pool (swimlane) ──────────────────────────────────────────
    'create-participant': {
      group: 'swimlane',
      className: 'bpmn-icon-participant',
      title: 'Carril horizontal',
      action: {
        click(event: MouseEvent) {
          const shape = elementFactory.createParticipantShape();
          create.start(event, shape);
        },
        dragstart(event: MouseEvent) {
          const shape = elementFactory.createParticipantShape();
          create.start(event, shape);
        },
      },
    },
  };
};

// Módulo que REEMPLAZA paletteProvider — clave del fix
const zflowPaletteModule = {
  __depends__:     ['paletteModule' as any],
  __init__:        ['paletteProvider'],
  paletteProvider: ['type', ZFlowPaletteProvider],
};

// ─────────────────────────────────────────────────────────────────────────────
// Componente Angular
// ─────────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'zf-bpmn-editor',
  imports: [ConfiguradorActividadComponent],
  host: {
    class: 'block h-full min-h-0'
  },
  template: `
    <div class="flex flex-col border border-border rounded-card overflow-hidden bg-surface h-full">

      <!-- Toolbar -->
      <div class="flex items-center gap-2 px-3 py-2 border-b border-border bg-background flex-wrap">

        <!-- Zoom -->
        <div class="flex items-center gap-1 border border-border rounded-button px-2 py-1 bg-surface">
          <button type="button" (click)="zoomOut()" title="Alejar"
            class="w-6 h-6 flex items-center justify-center text-text-secondary hover:text-text-primary font-bold">
            −
          </button>
          <span class="text-xs text-text-secondary w-10 text-center select-none">
            {{ zoomLevel() }}%
          </span>
          <button type="button" (click)="zoomIn()" title="Acercar"
            class="w-6 h-6 flex items-center justify-center text-text-secondary hover:text-text-primary font-bold">
            +
          </button>
        </div>

        <button type="button" (click)="fitViewport()"
          class="px-2 py-1 text-xs rounded-button border border-border bg-surface hover:bg-primary-50 text-text-secondary">
          Ajustar
        </button>

        <div class="h-4 w-px bg-border mx-1"></div>

        <button type="button" (click)="undo()"
          class="px-2 py-1 text-xs rounded-button border border-border bg-surface hover:bg-primary-50 text-text-secondary">
          ↩ Deshacer
        </button>
        <button type="button" (click)="redo()"
          class="px-2 py-1 text-xs rounded-button border border-border bg-surface hover:bg-primary-50 text-text-secondary">
          ↪ Rehacer
        </button>

        <div class="h-4 w-px bg-border mx-1"></div>

        <button type="button" (click)="exportSvg()"
          class="px-2 py-1 text-xs rounded-button border border-border bg-surface hover:bg-primary-50 text-text-secondary">
          ⬇ SVG
        </button>
        <button type="button" (click)="exportXml()"
          class="px-2 py-1 text-xs rounded-button border border-border bg-surface hover:bg-primary-50 text-text-secondary">
          ⬇ XML
        </button>

        <div class="ml-auto text-xs">
          @if (saving()) {
            <span class="text-warning animate-pulse">● Guardando...</span>
          } @else {
            <span class="text-accent-500">✓ Guardado</span>
          }
        </div>
      </div>

      <!-- Canvas -->
      <div #canvas class="flex-grow min-h-[350px]" style="background:#f8fafc;"></div>

      <!-- Barra de IA Inferior (FI-01) -->
      <div class="flex items-center gap-3 px-4 py-3 border-t border-border bg-primary-50/50">
        <button 
          type="button"
          (click)="toggleGrabacionIA()"
          [disabled]="procesandoIA()"
          [class.bg-danger]="grabandoIA()"
          [class.bg-primary-500]="!grabandoIA() && !procesandoIA()"
          [class.bg-gray-400]="procesandoIA()"
          [class.animate-pulse]="grabandoIA()"
          class="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all duration-300 disabled:cursor-not-allowed hover:scale-105 shadow-sm"
          title="Dictar estructura por voz">
          @if (grabandoIA()) {
            <!-- Stop Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="text-white"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg>
          } @else {
            <!-- Microphone Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
          }
        </button>

        <div class="flex-1 relative">
          <input 
            type="text" 
            #promptInput
            (keyup.enter)="generarFlujoIA(promptInput.value); promptInput.value = ''"
            [disabled]="procesandoIA() || grabandoIA()"
            [placeholder]="grabandoIA() ? (transcripcionIA() ? 'Escuchando: ' + transcripcionIA() : 'Hablá para describir el proceso...') : 'Describí el flujo en español por voz o texto (ej: crear flujo de crédito)...'"
            class="w-full px-3 py-2 bg-surface border border-border rounded-input text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-75"
          />
        </div>

        <button 
          type="button" 
          (click)="generarFlujoIA(promptInput.value); promptInput.value = ''"
          [disabled]="procesandoIA() || grabandoIA() || !promptInput.value"
          class="px-4 py-2 text-xs font-semibold rounded-button bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 transition-colors flex-shrink-0">
          Generar con IA
        </button>
      </div>
    </div>

    @if (errorMsg(); as msg) {
      <div class="mt-2 p-3 rounded-input border border-danger text-sm text-danger bg-danger/10" role="alert">
        {{ msg }}
      </div>
    }

    @if (editingActividad(); as act) {
      <zf-configurador-actividad
        [config]="act"
        (saved)="onActividadSaved($event)"
        (closed)="editingActividad.set(null)"
      />
    }

    @if (editingLane(); as el) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="bg-surface border border-border p-6 rounded-card shadow-lg max-w-sm w-full space-y-4">
          <h3 class="text-lg font-bold text-text-primary">Configurar Carril (Lane)</h3>
          <p class="text-xs text-text-secondary">Selecciona el rol o departamento responsable de las tareas de este carril.</p>
          
          <div class="space-y-2">
            <label class="text-xs font-semibold text-text-secondary">Responsable</label>
            <select #laneSelect [value]="el.name"
              class="w-full px-3 py-2 border border-border rounded-input bg-background text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-primary-500">
              <option value="Cliente">Cliente</option>
              <option value="Jefe">Jefe</option>
              @for (dept of departamentos(); track dept.id) {
                <option [value]="dept.nombre">{{ dept.nombre }}</option>
              }
            </select>
          </div>
          
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" (click)="editingLane.set(null)"
              class="px-3 py-2 text-xs rounded-button border border-border bg-surface hover:bg-primary-50 text-text-secondary">
              Cancelar
            </button>
            <button type="button" (click)="saveLaneName(el.id, laneSelect.value)"
              class="px-3 py-2 text-xs rounded-button bg-primary-500 text-white hover:bg-primary-600 font-medium">
              Guardar
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class BpmnEditorComponent implements AfterViewInit, OnDestroy {
  xml          = input<string | null>(null);
  actividades  = input<Actividad[]>([]);
  save         = output<string>();
  cancel       = output<void>();

  private readonly canvasRef   = viewChild.required<ElementRef<HTMLDivElement>>('canvas');
  protected readonly errorMsg  = signal<string | null>(null);
  protected readonly saving    = signal(false);
  protected readonly zoomLevel = signal(100);

  protected grabandoIA = signal(false);
  protected procesandoIA = signal(false);
  protected transcripcionIA = signal('');
  private recognitionIA: any = null;
  private audioContextIA: AudioContext | null = null;
  private processorIA: ScriptProcessorNode | null = null;
  private micStreamIA: MediaStream | null = null;
  private leftChannelIA: number[] = [];
  private recordingLengthIA = 0;
  private sampleRateIA = 0;

  /** Activity being edited in the configurador modal */
  protected readonly editingActividad = signal<Actividad | null>(null);

  /** Lane being edited in the department selector modal */
  protected readonly editingLane = signal<{ id: string, name: string } | null>(null);

  /** Map of actividadId → config */
  private readonly actividadMap = new Map<string, Actividad>();

  private readonly deptoApi = inject(DepartamentosApiService);
  private readonly tramitesApi = inject(TramitesApiService);
  protected readonly departamentos = signal<Departamento[]>([]);

  private modeler: BpmnModeler | null = null;
  private lastLoadedXml: string | null = null;
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      const incoming = this.xml();
      if (this.modeler && incoming !== null && incoming !== this.lastLoadedXml) {
        void this.importXml(incoming);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initModeler();
    this.loadInitialActividades();
    void this.importXml(this.xml() ?? EMPTY_DIAGRAM_XML);
    this.autoSaveTimer = setInterval(() => void this.autoSave(), 30_000);
    this.deptoApi.list().subscribe(depts => this.departamentos.set(depts));
  }

  ngOnDestroy(): void {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
    this.destroyModeler();
  }

  // ── API pública ──────────────────────────────────────────────────────────

  async getXml(): Promise<string | null> {
    if (!this.modeler) return null;
    try {
      const { xml } = await this.modeler.saveXML({ format: true });
      return xml ?? null;
    } catch (err) {
      this.errorMsg.set(err instanceof Error ? err.message : 'No se pudo serializar el diagrama');
      return null;
    }
  }

  getActividades(): Actividad[] {
    return Array.from(this.actividadMap.values());
  }

  async onSaveRequested(): Promise<void> {
    const xml = await this.getXml();
    if (xml !== null) this.save.emit(xml);
  }

  onCancelRequested(): void { this.cancel.emit(); }

  // ── Configurador ─────────────────────────────────────────────────────────

  protected onActividadSaved(actividad: Actividad): void {
    this.actividadMap.set(actividad.actividadId, actividad);
    this.editingActividad.set(null);
  }

  // ── Toolbar ──────────────────────────────────────────────────────────────

  zoomIn(): void {
    const c = this.canvas(); if (!c) return;
    const next = Math.min(+(c.zoom() + 0.1).toFixed(1), 3);
    c.zoom(next);
    this.zoomLevel.set(Math.round(next * 100));
  }

  zoomOut(): void {
    const c = this.canvas(); if (!c) return;
    const next = Math.max(+(c.zoom() - 0.1).toFixed(1), 0.2);
    c.zoom(next);
    this.zoomLevel.set(Math.round(next * 100));
  }

  fitViewport(): void {
    const c = this.canvas(); if (!c) return;
    c.zoom('fit-viewport');
    this.zoomLevel.set(100);
  }

  undo(): void { this.modeler?.get<any>('commandStack')?.undo(); }
  redo(): void { this.modeler?.get<any>('commandStack')?.redo(); }

  async exportSvg(): Promise<void> {
    if (!this.modeler) return;
    try {
      const { svg } = await this.modeler.saveSVG();
      this.downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'diagrama-zflow.svg');
    } catch {
      this.errorMsg.set('No se pudo exportar el SVG');
    }
  }

  async exportXml(): Promise<void> {
    const xml = await this.getXml();
    if (!xml) return;
    this.downloadBlob(new Blob([xml], { type: 'application/xml' }), 'diagrama-zflow.bpmn');
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private initModeler(): void {
    this.destroyModeler();
    this.modeler = new BpmnModeler({
      container: this.canvasRef().nativeElement,
      // SIN keyboard.bindTo → evita el warning de bpmn-js
      additionalModules: [zflowPaletteModule],
    });
    this.registerDblClick();
  }

  private registerDblClick(): void {
    if (!this.modeler) return;
    const eventBus = this.modeler.get<any>('eventBus');
    eventBus.on('element.dblclick', 10000, (e: any) => {
      const element = e.element;
      if (!element) return true;

      if (element.type === 'bpmn:Lane') {
        const id = element.id as string;
        const name = element.businessObject?.name ?? '';
        this.editingLane.set({ id, name });
        return false;
      }

      if (element.type === 'bpmn:Task') {
        const id = element.id as string;
        const nombre = element.businessObject?.name ?? 'Sin nombre';

        // Resolve lane dynamically
        let resolvedLaneName: string | undefined;
        let parent = element.parent;
        while (parent) {
          if (parent.type === 'bpmn:Lane') {
            resolvedLaneName = parent.businessObject?.name;
            break;
          }
          parent = parent.parent;
        }

        const existing = this.actividadMap.get(id);

        this.editingActividad.set(
          existing ? { ...existing, laneName: existing.laneName ?? resolvedLaneName } : {
            actividadId: id,
            nombre,
            responsableTipo: null,
            responsableId: null,
            tipoFlujo: 'SECUENCIAL',
            laneName: resolvedLaneName,
            formulario: [],
            condicionSalida: null,
          },
        );
        return false;
      }
      return true;
    });
  }

  private loadInitialActividades(): void {
    for (const act of this.actividades()) {
      this.actividadMap.set(act.actividadId, act);
    }
  }

  private async importXml(xml: string): Promise<void> {
    if (!this.modeler) return;
    try {
      await this.modeler.importXML(xml);
      this.canvas()?.zoom('fit-viewport');
      this.lastLoadedXml = xml;
      this.errorMsg.set(null);
    } catch (err) {
      this.errorMsg.set(
        err instanceof Error
          ? `Error al cargar el diagrama: ${err.message}`
          : 'XML inválido',
      );
    }
  }

  private async autoSave(): Promise<void> {
    const xml = await this.getXml();
    if (!xml) return;
    this.saving.set(true);
    this.save.emit(xml);
    setTimeout(() => this.saving.set(false), 800);
  }

  private canvas(): any {
    return this.modeler?.get<any>('canvas');
  }

  private destroyModeler(): void {
    this.modeler?.destroy();
    this.modeler = null;
  }

  protected saveLaneName(elementId: string, newName: string): void {
    if (!this.modeler) return;
    const elementRegistry = this.modeler.get<any>('elementRegistry');
    const element = elementRegistry.get(elementId);
    if (element) {
      const modeling = this.modeler.get<any>('modeling');
      modeling.updateLabel(element, newName);

      // Update laneName of child tasks in activity map
      const refs = element.children || [];
      for (const child of refs) {
        if (child.type === 'bpmn:Task') {
          const act = this.actividadMap.get(child.id);
          if (act) {
            act.laneName = newName;
            this.actividadMap.set(child.id, act);
          }
        }
      }

      void this.autoSave();
    }
    this.editingLane.set(null);
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a   = Object.assign(document.createElement('a'), { href: url, download: filename });
    a.click();
    URL.revokeObjectURL(url);
  }

  protected toggleGrabacionIA() {
    if (this.grabandoIA()) {
      this.detenerGrabacionIA();
    } else {
      this.iniciarGrabacionIA();
    }
  }

  private iniciarGrabacionIA() {
    this.leftChannelIA = [];
    this.recordingLengthIA = 0;

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      this.micStreamIA = stream;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContextIA = new AudioContextClass();
      this.sampleRateIA = this.audioContextIA.sampleRate;

      const source = this.audioContextIA.createMediaStreamSource(stream);
      this.processorIA = this.audioContextIA.createScriptProcessor(4096, 1, 1);

      this.processorIA.onaudioprocess = (e) => {
        const left = e.inputBuffer.getChannelData(0);
        this.leftChannelIA.push(...Array.from(left));
        this.recordingLengthIA += left.length;
      };

      source.connect(this.processorIA);
      this.processorIA.connect(this.audioContextIA.destination);

      this.grabandoIA.set(true);
      setTimeout(() => {
        if (this.grabandoIA()) {
          this.iniciarReconocimientoVozIA();
        }
      }, 150);

      console.log('🎤 Grabando audio para IA en editor BPMN...');
    }).catch(err => {
      alert('No se pudo acceder al micrófono: ' + err.message);
      console.error(err);
    });
  }

  private iniciarReconocimientoVozIA() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.transcripcionIA.set('');
    this.recognitionIA = new SpeechRecognition();
    this.recognitionIA.lang = 'es';
    this.recognitionIA.continuous = true;
    this.recognitionIA.interimResults = true;

    this.recognitionIA.onresult = (event: any) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      this.transcripcionIA.set(text);
    };

    try {
      this.recognitionIA.start();
    } catch (e) {
      console.error('No se pudo iniciar SpeechRecognition local:', e);
    }
  }

  private detenerReconocimientoVozIA() {
    if (this.recognitionIA) {
      this.recognitionIA.stop();
      this.recognitionIA = null;
    }
  }

  private detenerGrabacionIA() {
    if (this.processorIA) {
      this.processorIA.disconnect();
      this.processorIA = null;
    }
    if (this.audioContextIA) {
      this.audioContextIA.close();
      this.audioContextIA = null;
    }
    if (this.micStreamIA) {
      this.micStreamIA.getTracks().forEach(track => track.stop());
      this.micStreamIA = null;
    }
    
    this.grabandoIA.set(false);
    this.detenerReconocimientoVozIA();

    if (this.leftChannelIA.length > 0) {
      const wavBlob = this.exportarWAV(this.leftChannelIA, this.recordingLengthIA, this.sampleRateIA);
      this.procesarAudioIAConBackend(wavBlob);
    }
  }

  private procesarAudioIAConBackend(audioBlob: Blob) {
    this.procesandoIA.set(true);
    this.tramitesApi.transcribir(audioBlob).subscribe({
      next: (res) => {
        const texto = res.text;
        console.log('🤖 Transcripción obtenida por Gemini:', texto);
        this.transcripcionIA.set(texto);
        this.generarFlujoIA(texto);
      },
      error: (err) => {
        this.procesandoIA.set(false);
        alert('Error al transcribir audio con Gemini: ' + (err.error?.message || err.message));
        console.error(err);
      }
    });
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

  protected generarFlujoIA(texto: string) {
    if (!texto || !texto.trim()) return;

    this.procesandoIA.set(true);
    const query = texto.toLowerCase();

    let templateKey: string | null = null;
    if (query.includes('crédito') || query.includes('credito') || query.includes('préstamo') || query.includes('prestamo')) {
      templateKey = 'credito';
    } else if (query.includes('cuenta') || query.includes('apertura')) {
      templateKey = 'cuenta';
    } else if (query.includes('vacaciones') || query.includes('licencia')) {
      templateKey = 'vacaciones';
    } else if (query.includes('contratación') || query.includes('contratacion') || query.includes('empleado') || query.includes('onboarding')) {
      templateKey = 'onboarding';
    } else if (query.includes('compra') || query.includes('aprobación') || query.includes('aprobacion')) {
      templateKey = 'compras';
    }

    if (templateKey && BPMN_TEMPLATES[templateKey]) {
      const xml = BPMN_TEMPLATES[templateKey];
      void this.importXml(xml).then(() => {
        this.actualizarActividadesDesdeXml(xml);
        this.procesandoIA.set(false);
        this.transcripcionIA.set('');
        // Trigger auto-save or emit save so the diagram changes propagate
        this.save.emit(xml);
        alert(`¡Plantilla de "${templateKey}" cargada con éxito mediante IA!`);
      });
    } else {
      this.procesandoIA.set(false);
      this.transcripcionIA.set('');
      alert('No se pudo identificar una plantilla adecuada para la orden dictada. Intenta con palabras como "crédito", "vacaciones", "cuenta", "compras" o "onboarding".');
    }
  }

  private actualizarActividadesDesdeXml(xml: string) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'application/xml');
      
      this.actividadMap.clear();

      const lanes = Array.from(doc.getElementsByTagNameNS('*', 'lane') || doc.querySelectorAll('lane'));
      const taskLaneMap = new Map<string, string>();
      
      lanes.forEach((lane: any) => {
        const laneName = lane.getAttribute('name') || '';
        const nodeRefs = Array.from(lane.getElementsByTagNameNS('*', 'flowNodeRef') || lane.querySelectorAll('flowNodeRef'));
        nodeRefs.forEach((ref: any) => {
          taskLaneMap.set(ref.textContent.trim(), laneName);
        });
      });

      const tasks = Array.from(doc.getElementsByTagNameNS('*', 'task') || doc.querySelectorAll('task'));
      tasks.forEach((task: any) => {
        const id = task.getAttribute('id');
        const name = task.getAttribute('name') || 'Actividad sin nombre';
        const laneName = taskLaneMap.get(id) || undefined;

        this.actividadMap.set(id, {
          actividadId: id,
          nombre: name,
          responsableTipo: null,
          responsableId: null,
          tipoFlujo: 'SECUENCIAL',
          laneName: laneName,
          formulario: [],
          condicionSalida: null,
        });
      });

      console.log('Actividades parseadas de la plantilla:', Array.from(this.actividadMap.values()));
    } catch (e) {
      console.error('Error parseando actividades del XML:', e);
    }
  }
}
