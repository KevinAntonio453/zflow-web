import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Actividad,
  CampoFormulario,
  Departamento,
  ResponsableTipo,
  TipoCampo,
  Usuario,
} from '../../../core/models';
import { DepartamentosApiService } from '../../../core/services/departamentos-api.service';
import { UsuariosApiService } from '../../../core/services/usuarios-api.service';

type Tab = 'formulario' | 'responsable' | 'condicion';

const TIPO_CAMPO_LABELS: Record<TipoCampo, string> = {
  TEXTO:    'Texto',
  NUMERO:   'Número',
  FECHA:    'Fecha',
  SELECTOR: 'Selector',
  ARCHIVO:  'Archivo',
};

const TIPOS_CAMPO: TipoCampo[] = ['TEXTO', 'NUMERO', 'FECHA', 'SELECTOR', 'ARCHIVO'];

@Component({
  selector: 'zf-configurador-actividad',
  imports: [FormsModule],
  template: `
    <!-- Overlay -->
    <div
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      (click)="onCancel()"
      (keydown.escape)="onCancel()"
    >
      <!-- Modal -->
      <div
        class="bg-surface rounded-card shadow-lg w-full max-w-2xl max-h-[85vh] flex flex-col"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 class="text-lg font-semibold text-text-primary">Configurar actividad</h2>
            <p class="text-sm text-text-secondary mt-0.5">{{ actividadNombre() }}</p>
          </div>
          <button
            type="button"
            (click)="onCancel()"
            class="w-8 h-8 flex items-center justify-center rounded-button text-text-secondary hover:text-text-primary hover:bg-background"
          >
            ✕
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-border px-5">
          @for (tab of tabs; track tab.key) {
            <button
              type="button"
              (click)="activeTab.set(tab.key)"
              class="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
              [class]="activeTab() === tab.key
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-text-secondary hover:text-text-primary'"
            >
              {{ tab.label }}
            </button>
          }
        </div>

        <!-- Tab content -->
        <div class="flex-1 overflow-y-auto p-5">
          @switch (activeTab()) {
            @case ('formulario') {
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <p class="text-sm text-text-secondary">
                    Definí los campos del formulario que el funcionario completará.
                  </p>
                  <button
                    type="button"
                    (click)="agregarCampo()"
                    class="px-3 py-1.5 text-xs rounded-button bg-primary-500 text-white hover:bg-primary-600"
                  >
                    + Agregar campo
                  </button>
                </div>

                @if (campos().length === 0) {
                  <div class="py-8 text-center text-text-secondary text-sm">
                    No hay campos definidos. Hacé clic en "Agregar campo" para empezar.
                  </div>
                }

                @for (campo of campos(); track campo.id; let i = $index) {
                  <div class="border border-border rounded-input p-3 bg-background space-y-2">
                    <div class="flex items-start gap-2">
                      <!-- Nombre -->
                      <div class="flex-1">
                        <label class="block text-xs font-medium text-text-secondary mb-1">Nombre del campo</label>
                        <input
                          type="text"
                          [ngModel]="campo.nombre"
                          (ngModelChange)="updateCampo(i, 'nombre', $event)"
                          placeholder="ej: Nombre completo"
                          class="w-full px-2 py-1.5 text-sm rounded-input border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <!-- Tipo -->
                      <div class="w-32">
                        <label class="block text-xs font-medium text-text-secondary mb-1">Tipo</label>
                        <select
                          [ngModel]="campo.tipo"
                          (ngModelChange)="updateCampo(i, 'tipo', $event)"
                          class="w-full px-2 py-1.5 text-sm rounded-input border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          @for (t of tiposCampo; track t) {
                            <option [value]="t">{{ tipoCampoLabel(t) }}</option>
                          }
                        </select>
                      </div>
                      <!-- Requerido -->
                      <div class="pt-5">
                        <label class="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            [ngModel]="campo.requerido"
                            (ngModelChange)="updateCampo(i, 'requerido', $event)"
                            class="accent-primary-500"
                          />
                          Requerido
                        </label>
                      </div>
                      <!-- Eliminar -->
                      <button
                        type="button"
                        (click)="eliminarCampo(i)"
                        class="mt-5 w-7 h-7 flex items-center justify-center rounded-button text-danger hover:bg-danger/10"
                        title="Eliminar campo"
                      >
                        ✕
                      </button>
                    </div>

                    <!-- Opciones (solo SELECTOR) -->
                    @if (campo.tipo === 'SELECTOR') {
                      <div>
                        <label class="block text-xs font-medium text-text-secondary mb-1">
                          Opciones (separadas por coma)
                        </label>
                        <input
                          type="text"
                          [ngModel]="campo.opciones?.join(', ') ?? ''"
                          (ngModelChange)="updateOpciones(i, $event)"
                          placeholder="ej: Aprobado, Rechazado, Pendiente"
                          class="w-full px-2 py-1.5 text-sm rounded-input border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    }
                  </div>
                }
              </div>
            }

            @case ('responsable') {
              <div class="space-y-4">
                <!-- Lane Name Display (Readonly) -->
                @if (config().laneName; as lane) {
                  <div class="p-3 bg-primary-50 border border-primary-100 rounded-input flex items-center justify-between text-sm">
                    <div>
                      <span class="font-medium text-primary-800">Carril asignado:</span>
                      <span class="ml-1 text-primary-900 font-semibold">{{ lane }}</span>
                    </div>
                    <span class="text-xs text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">Por Defecto</span>
                  </div>
                }

                <p class="text-sm text-text-secondary">
                  Elegí quién será responsable de ejecutar esta actividad. Dejá en "Por defecto del carril" para usar la asignación automática por carril BPMN.
                </p>

                <!-- Tipo de responsable -->
                <div class="flex gap-4">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="responsableTipo"
                      [value]="null"
                      [ngModel]="responsableTipo()"
                      (ngModelChange)="onResponsableTipoChange(null)"
                      class="accent-primary-500"
                    />
                    <span class="text-sm">Por defecto del carril</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="responsableTipo"
                      value="DEPARTAMENTO"
                      [ngModel]="responsableTipo()"
                      (ngModelChange)="onResponsableTipoChange('DEPARTAMENTO')"
                      class="accent-primary-500"
                    />
                    <span class="text-sm">Departamento</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="responsableTipo"
                      value="USUARIO"
                      [ngModel]="responsableTipo()"
                      (ngModelChange)="onResponsableTipoChange('USUARIO')"
                      class="accent-primary-500"
                    />
                    <span class="text-sm">Usuario específico</span>
                  </label>
                </div>

                <!-- Selector -->
                @if (responsableTipo() === 'DEPARTAMENTO') {
                  <div>
                    <label class="block text-sm font-medium mb-1">Departamento</label>
                    <select
                      [ngModel]="responsableId()"
                      (ngModelChange)="responsableId.set($event)"
                      class="w-full px-3 py-2 rounded-input border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">— Seleccionar —</option>
                      @for (d of departamentos(); track d.id) {
                        <option [value]="d.id">{{ d.nombre }}</option>
                      }
                    </select>
                  </div>
                }

                @if (responsableTipo() === 'USUARIO') {
                  <div>
                    <label class="block text-sm font-medium mb-1">Funcionario</label>
                    <select
                      [ngModel]="responsableId()"
                      (ngModelChange)="responsableId.set($event)"
                      class="w-full px-3 py-2 rounded-input border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">— Seleccionar —</option>
                      @for (u of funcionarios(); track u.id) {
                        <option [value]="u.id">{{ u.nombre }} ({{ u.email }})</option>
                      }
                    </select>
                  </div>
                }

                @if (responsableTipo() === null) {
                  <div class="py-4 text-center text-text-secondary text-sm bg-background/50 border border-dashed border-border rounded-input">
                    Asignación automática basada en el carril: <strong class="text-primary-600">{{ config().laneName ?? 'Ninguno' }}</strong>.
                  </div>
                }
              </div>
            }

            @case ('condicion') {
              <div class="space-y-3">
                <p class="text-sm text-text-secondary">
                  Condición de salida para flujos alternativos o iterativos.
                  Dejá vacío si esta actividad no tiene condición.
                </p>
                <textarea
                  [ngModel]="condicionSalida()"
                  (ngModelChange)="condicionSalida.set($event)"
                  rows="4"
                  placeholder='ej: estado == "aprobado"'
                  class="w-full px-3 py-2 rounded-input border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                ></textarea>
                <p class="text-xs text-text-secondary">
                  Tip: usá expresiones simples como <code class="font-mono bg-background px-1 rounded">campo == "valor"</code>
                </p>
              </div>
            }
          }
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <button
            type="button"
            (click)="onCancel()"
            class="px-4 py-2 text-sm rounded-button border border-border bg-surface hover:bg-background"
          >
            Cancelar
          </button>
          <button
            type="button"
            (click)="onSave()"
            class="px-4 py-2 text-sm rounded-button bg-primary-500 text-white hover:bg-primary-600"
          >
            Guardar configuración
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfiguradorActividadComponent implements OnInit {
  /** The current activity configuration to edit */
  config = input.required<Actividad>();
  readonly actividadNombre = computed(() => this.config().nombre);

  /** Emits the updated config when saved */
  saved = output<Actividad>();
  /** Emits when the modal is closed without saving */
  closed = output<void>();

  private readonly deptApi = inject(DepartamentosApiService);
  private readonly usrApi  = inject(UsuariosApiService);

  // ── Tab state ────────────────────────────────────────────────────────────
  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'formulario', label: 'Formulario' },
    { key: 'responsable', label: 'Responsable' },
    { key: 'condicion', label: 'Condición' },
  ];
  readonly activeTab = signal<Tab>('formulario');

  // ── Form fields ──────────────────────────────────────────────────────────
  readonly campos = signal<CampoFormulario[]>([]);
  readonly tiposCampo = TIPOS_CAMPO;

  // ── Responsable ──────────────────────────────────────────────────────────
  readonly responsableTipo = signal<ResponsableTipo | null>(null);
  readonly responsableId   = signal<string>('');
  readonly departamentos   = signal<Departamento[]>([]);
  readonly usuarios        = signal<Usuario[]>([]);

  readonly funcionarios = computed(() =>
    this.usuarios().filter(u => u.rol === 'FUNCIONARIO')
  );

  // ── Condición ────────────────────────────────────────────────────────────
  readonly condicionSalida = signal<string>('');

  // ── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const cfg = this.config();
    this.campos.set([...cfg.formulario]);
    this.responsableTipo.set(cfg.responsableTipo);
    this.responsableId.set(cfg.responsableId ?? '');
    this.condicionSalida.set(cfg.condicionSalida ?? '');

    this.deptApi.list().subscribe(d => this.departamentos.set(d));
    this.usrApi.list().subscribe(u => this.usuarios.set(u));
  }

  // ── Campo helpers ────────────────────────────────────────────────────────
  agregarCampo(): void {
    this.campos.update(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        nombre: '',
        tipo: 'TEXTO' as TipoCampo,
        requerido: false,
      },
    ]);
  }

  eliminarCampo(index: number): void {
    this.campos.update(prev => prev.filter((_, i) => i !== index));
  }

  updateCampo(index: number, key: keyof CampoFormulario, value: unknown): void {
    this.campos.update(prev =>
      prev.map((c, i) => (i === index ? { ...c, [key]: value } : c)),
    );
  }

  updateOpciones(index: number, raw: string): void {
    const opciones = raw.split(',').map(o => o.trim()).filter(Boolean);
    this.campos.update(prev =>
      prev.map((c, i) => (i === index ? { ...c, opciones } : c)),
    );
  }

  tipoCampoLabel(tipo: TipoCampo): string {
    return TIPO_CAMPO_LABELS[tipo];
  }

  // ── Responsable helpers ──────────────────────────────────────────────────
  onResponsableTipoChange(tipo: ResponsableTipo | null): void {
    this.responsableTipo.set(tipo);
    this.responsableId.set('');
  }

  // ── Actions ──────────────────────────────────────────────────────────────
  onSave(): void {
    const cfg = this.config();
    this.saved.emit({
      ...cfg,
      formulario: this.campos(),
      responsableTipo: this.responsableTipo(),
      responsableId: this.responsableId() || null,
      condicionSalida: this.condicionSalida() || null,
    });
  }

  onCancel(): void {
    this.closed.emit();
  }
}
