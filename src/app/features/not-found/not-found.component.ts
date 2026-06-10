import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'zf-not-found',
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="text-center max-w-md">
        <div class="text-6xl font-bold text-primary-500 mb-2">404</div>
        <h1 class="text-xl font-semibold mb-2">Página no encontrada</h1>
        <p class="text-text-secondary mb-6">La ruta que buscás no existe o fue movida.</p>
        <a routerLink="/" class="inline-block bg-primary-500 text-white px-4 py-2 rounded-button hover:bg-primary-600">
          Volver al inicio
        </a>
      </div>
    </div>
  `,
})
export class NotFoundComponent {}
