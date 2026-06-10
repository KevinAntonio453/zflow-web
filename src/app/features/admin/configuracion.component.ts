import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'zf-configuracion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 p-6">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">Configuración de la Organización</h1>
        <p class="text-text-secondary">
          Gestioná la identidad de la empresa y la información de contacto institucional en el sistema.
        </p>
      </div>

      <div class="max-w-2xl bg-surface rounded-card border border-border shadow-card p-6 space-y-6">
        <div class="flex items-center gap-3 border-b border-border pb-4">
          <div class="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-text-primary uppercase tracking-wider">Perfil de la Organización</h3>
            <p class="text-[11px] text-text-secondary">Datos básicos de identificación y contacto</p>
          </div>
        </div>

        <div class="space-y-4">
          <!-- Nombre de la Organización -->
          <div class="space-y-1">
            <label class="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Nombre de la Organización</label>
            <input 
              type="text" 
              [value]="nombreOrganizacion()" 
              (input)="nombreOrganizacion.set($any($event.target).value); saved.set(false)"
              placeholder="ej: ZFlow Solutions"
              class="w-full px-3 py-2 border border-border rounded-input bg-background text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <!-- Identificador Fiscal / RUC / NIT -->
          <div class="space-y-1">
            <label class="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Identificador Fiscal / RUC / NIT</label>
            <input 
              type="text" 
              [value]="identificadorFiscal()" 
              (input)="identificadorFiscal.set($any($event.target).value); saved.set(false)"
              placeholder="ej: 30-12345678-9"
              class="w-full px-3 py-2 border border-border rounded-input bg-background text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <!-- Dirección y Contacto General -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Teléfono de Contacto</label>
              <input 
                type="text" 
                [value]="telefono()" 
                (input)="telefono.set($any($event.target).value); saved.set(false)"
                placeholder="ej: +54 11 1234-5678"
                class="w-full px-3 py-2 border border-border rounded-input bg-background text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Correo Oficial</label>
              <input 
                type="email" 
                [value]="correo()" 
                (input)="correo.set($any($event.target).value); saved.set(false)"
                placeholder="ej: contacto@empresa.com"
                class="w-full px-3 py-2 border border-border rounded-input bg-background text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          <!-- Logotipo de la Empresa (Carga de Archivo / URL) -->
          <div class="space-y-2">
            <label class="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">Logotipo de la Empresa</label>
            
            <div class="flex items-center gap-3 flex-wrap">
              <!-- Hidden Native Input -->
              <input 
                type="file" 
                #fileInput
                (change)="onFileSelected($event)"
                accept="image/*,image/svg+xml"
                class="hidden"
              />
              
              <!-- Custom Upload Button -->
              <button 
                type="button" 
                (click)="fileInput.click()"
                class="px-3 py-2 text-xs font-semibold rounded-button border border-border bg-background hover:bg-gray-100 text-text-primary transition-colors flex items-center gap-1.5 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                Cargar Logo o SVG
              </button>

              @if (logoUrl()) {
                <button 
                  type="button" 
                  (click)="quitarLogo()"
                  class="px-3 py-2 text-xs font-semibold rounded-button bg-danger/10 text-danger hover:bg-danger/20 transition-colors">
                  Quitar Logotipo
                </button>
              }
            </div>


            
            <p class="text-[10px] text-text-secondary">
              Se utilizará para mostrar en el menú lateral principal de la empresa. Recomendamos imágenes livianas o formato SVG.
            </p>
          </div>
        </div>

        <!-- Vista Previa Simple -->
        @if (logoUrl() || nombreOrganizacion()) {
          <div class="bg-background/50 border border-border rounded-card p-4 space-y-2">
            <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Vista Previa en el Menú Lateral</span>
            <div class="flex items-center gap-3 bg-surface border border-border p-3 rounded w-64">
              @if (logoUrl()) {
                <img [src]="logoUrl()" alt="Vista Previa Logo" class="w-8 h-8 object-contain rounded" />
              } @else {
                <div class="w-8 h-8 rounded bg-primary-500 text-white flex items-center justify-center font-bold text-sm">ZF</div>
              }
              <span class="text-sm font-bold text-text-primary">{{ nombreOrganizacion() || 'ZFlow' }}</span>
            </div>
          </div>
        }

        <!-- Acciones -->
        <div class="flex justify-between items-center border-t border-border pt-4">
          <span class="text-xs text-text-secondary">
            @if (saved()) {
              Cambios guardados.
            } @else {
              Existen cambios sin guardar.
            }
          </span>
          <div class="flex gap-2">
            <button 
              type="button" 
              (click)="restablecerValores()"
              class="px-4 py-2 text-xs font-semibold rounded-button border border-border bg-background text-text-secondary hover:bg-gray-100 transition-colors">
              Restablecer
            </button>
            <button 
              type="button" 
              (click)="guardarConfiguracion()"
              class="px-4 py-2 text-xs font-semibold rounded-button bg-primary-500 text-white hover:bg-primary-600 transition-colors shadow-sm">
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ConfiguracionComponent implements OnInit {
  protected nombreOrganizacion = signal('ZFlow Solutions');
  protected identificadorFiscal = signal('');
  protected telefono = signal('');
  protected correo = signal('');
  protected logoUrl = signal('');
  protected saved = signal(true);

  ngOnInit() {
    this.cargarDeLocalStorage();
  }

  private cargarDeLocalStorage() {
    if (typeof window !== 'undefined') {
      const configStr = localStorage.getItem('zflow_config');
      if (configStr) {
        try {
          const config = JSON.parse(configStr);
          this.nombreOrganizacion.set(config.nombreOrganizacion || 'ZFlow Solutions');
          this.identificadorFiscal.set(config.identificadorFiscal || '');
          this.telefono.set(config.telefono || '');
          this.correo.set(config.correo || '');
          this.logoUrl.set(config.logoUrl || '');
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  protected onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        this.logoUrl.set(result);
        this.saved.set(false);
      };
      reader.readAsDataURL(file);
    }
  }

  protected quitarLogo() {
    this.logoUrl.set('');
    this.saved.set(false);
  }

  protected guardarConfiguracion() {
    const config = {
      nombreOrganizacion: this.nombreOrganizacion(),
      identificadorFiscal: this.identificadorFiscal(),
      telefono: this.telefono(),
      correo: this.correo(),
      logoUrl: this.logoUrl(),
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('zflow_config', JSON.stringify(config));
      window.dispatchEvent(new Event('zflow-config-updated'));
    }
    this.saved.set(true);
    alert('Configuración de la organización guardada correctamente.');
  }

  protected restablecerValores() {
    this.nombreOrganizacion.set('ZFlow Solutions');
    this.identificadorFiscal.set('');
    this.telefono.set('');
    this.correo.set('');
    this.logoUrl.set('');
    this.saved.set(false);
  }
}
