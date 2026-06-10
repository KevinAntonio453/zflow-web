import { Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AvatarComponent } from '../avatar/avatar.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({
  selector: 'zf-topbar',
  imports: [AvatarComponent, ThemeToggleComponent, NotificationBellComponent],
  templateUrl: './topbar.component.html',
})
export class TopbarComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  /** Lo emite el shell cuando el usuario clickea el burger (mobile). */
  toggleSidebar = output<void>();
  /** Lo emite el shell cuando el usuario clickea el "plegar" (desktop). */
  toggleCollapse = output<void>();

  collapsed = input<boolean>(false);

  protected readonly user  = this.auth.user;
  protected readonly rol   = this.auth.rol;

  onLogout(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
