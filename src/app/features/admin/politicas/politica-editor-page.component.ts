import { Component, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PoliticasApiService } from '../../../core/services/politicas-api.service';
import { ApiError, Politica } from '../../../core/models';
import { BpmnEditorComponent } from './bpmn-editor.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'zf-politica-editor-page',
  imports: [ReactiveFormsModule, BpmnEditorComponent, LoadingSpinnerComponent],
  templateUrl: './politica-editor-page.component.html',
})
export class PoliticaEditorPageComponent {
  private readonly fb      = inject(FormBuilder);
  private readonly api     = inject(PoliticasApiService);
  private readonly router  = inject(Router);
  private readonly route   = inject(ActivatedRoute);

  protected readonly editorRef = viewChild<BpmnEditorComponent>('editor');

  protected readonly editingId = signal<string | null>(this.route.snapshot.paramMap.get('id'));
  protected readonly initial   = signal<Politica | null>(null);
  protected readonly loading   = signal(this.editingId() !== null);
  protected readonly saving    = signal(false);
  protected readonly error     = signal<string | null>(null);
  protected readonly showSaveModal = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    nombre:      ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    descripcion: ['', [Validators.maxLength(1000)]],
  });

  protected openSaveModal(): void {
    this.form.controls.nombre.markAsUntouched();
    this.form.controls.descripcion.markAsUntouched();
    this.showSaveModal.set(true);
  }

  protected closeSaveModal(): void {
    this.showSaveModal.set(false);
  }

  protected onConfirmSave(): void {
    if (this.form.invalid || this.saving()) return;
    this.onSaveClicked();
  }

  constructor() {
    if (this.editingId()) {
      this.loadExisting(this.editingId()!);
    }
  }

  private loadExisting(id: string): void {
    this.api.getById(id).subscribe({
      next: (p) => {
        this.initial.set(p);
        this.form.patchValue({ nombre: p.nombre, descripcion: p.descripcion ?? '' });
        this.loading.set(false);
      },
      error: (err: { error?: ApiError }) => {
        this.error.set(err.error?.message ?? 'No se pudo cargar la política');
        this.loading.set(false);
      },
    });
  }

  /**
   * Pide el XML actual al editor embebido y persiste.
   * El XML puede ser null si la serialización falló (bpmn-js error).
   */
  protected async onSaveClicked(): Promise<void> {
    if (this.form.invalid || this.saving()) return;
    const editor = this.editorRef();
    if (!editor) return;

    const diagramaBpmn = await editor.getXml();
    if (diagramaBpmn === null) {
      this.error.set('No se pudo serializar el diagrama. Revisá la consola.');
      this.showSaveModal.set(false);
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const payload = {
      ...this.form.getRawValue(),
      diagramaBpmn,
      actividades: editor.getActividades(),
    };

    const op = this.editingId()
      ? this.api.update(this.editingId()!, payload)
      : this.api.create(payload);

    op.subscribe({
      next: () => {
        this.saving.set(false);
        this.showSaveModal.set(false);
        this.router.navigate(['/admin/politicas']);
      },
      error: (err: { error?: ApiError }) => {
        this.error.set(this.extractMessage(err));
        this.saving.set(false);
        this.showSaveModal.set(false);
      },
    });
  }

  protected onCancel(): void {
    this.router.navigate(['/admin/politicas']);
  }

  private extractMessage(err: { error?: ApiError }): string {
    if (err.error?.fieldErrors && err.error.fieldErrors.length > 0) {
      return err.error.fieldErrors.map(f => f.message).join(' · ');
    }
    return err.error?.message ?? 'No se pudo guardar la política';
  }
}
