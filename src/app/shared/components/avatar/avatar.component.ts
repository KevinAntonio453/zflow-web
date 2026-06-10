import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'zf-avatar',
  template: `
    <div
      [class]="containerClass()"
      [attr.aria-label]="'Avatar de ' + nombre()"
      role="img"
    >
      {{ initials() }}
    </div>
  `,
})
export class AvatarComponent {
  nombre = input.required<string>();
  size   = input<'sm' | 'md' | 'lg'>('md');

  protected readonly initials = computed(() => {
    const parts = (this.nombre() ?? '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0]!.substring(0, 2).toUpperCase();
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  });

  protected containerClass(): string {
    const base = 'rounded-full bg-primary-500 text-white flex items-center justify-center font-semibold select-none';
    switch (this.size()) {
      case 'sm': return `${base} h-6 w-6 text-xs`;
      case 'md': return `${base} h-9 w-9 text-sm`;
      case 'lg': return `${base} h-12 w-12 text-base`;
    }
  }
}
