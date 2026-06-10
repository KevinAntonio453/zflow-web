import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'zf-shell',
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="flex min-h-screen bg-background">
      <zf-sidebar
        [collapsed]="collapsed()"
        (mobileOpen)="false"
      />

      <div class="flex-1 flex flex-col min-w-0">
        <zf-topbar
          [collapsed]="collapsed()"
          (toggleCollapse)="toggleCollapse()"
        />

        <main class="flex-1 p-4 md:p-6 overflow-x-hidden">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class ShellComponent {
  protected readonly collapsed = signal(false);

  protected toggleCollapse(): void {
    this.collapsed.update(v => !v);
  }
}
