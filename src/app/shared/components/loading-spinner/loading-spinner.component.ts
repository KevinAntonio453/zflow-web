import { Component, input } from '@angular/core';

@Component({
  selector: 'zf-loading-spinner',
  template: `
    <div
      class="flex items-center justify-center"
      [class.p-2]="size() === 'sm'"
      [class.p-4]="size() === 'md'"
      [class.p-8]="size() === 'lg'"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        [class]="svgClass()"
        aria-hidden="true"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <span class="sr-only">Cargando...</span>
    </div>
  `,
})
export class LoadingSpinnerComponent {
  size = input<'sm' | 'md' | 'lg'>('md');

  protected svgClass(): string {
    switch (this.size()) {
      case 'sm': return 'h-4 w-4 text-primary-500';
      case 'md': return 'h-8 w-8 text-primary-500';
      case 'lg': return 'h-12 w-12 text-primary-500';
    }
  }
}
