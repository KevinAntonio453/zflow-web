import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Rol } from '../../../core/models';

interface SidebarItem {
  label: string;
  route: string;
  iconPath: string;
  /** Solo este rol (o roles) ve la entrada; vacío = visible para todos los autenticados del grupo */
  group: 'admin' | 'jefe' | 'funcionario' | 'cliente' | 'common';
}

const ICONS = {
  dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  users: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  building: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  document: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  workflow: 'M4 6h16M4 12h16M4 18h7M15 18l3-3m0 0l3 3m-3-3v6',
  cog: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  folder: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
  chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
} as const;

const ALL_ITEMS: SidebarItem[] = [
  // common
  { label: 'Notificaciones', route: '/notificaciones', iconPath: ICONS.bell,     group: 'common' },
  { label: 'Mi perfil',       route: '/perfil',          iconPath: ICONS.user,     group: 'common' },

  // admin
  { label: 'Dashboard',       route: '/admin/dashboard',        iconPath: ICONS.dashboard, group: 'admin' },
  { label: 'Reportes IA',     route: '/admin/reportes',         iconPath: ICONS.document,  group: 'admin' },
  { label: 'Políticas',       route: '/admin/politicas',        iconPath: ICONS.workflow,  group: 'admin' },
  { label: 'Usuarios',        route: '/admin/usuarios',         iconPath: ICONS.users,     group: 'admin' },
  { label: 'Departamentos',   route: '/admin/departamentos',    iconPath: ICONS.building,  group: 'admin' },
  { label: 'Configuración',   route: '/admin/configuracion',    iconPath: ICONS.cog,       group: 'admin' },
  { label: 'Bitácora',        route: '/admin/bitacora',         iconPath: ICONS.document,  group: 'admin' },

  // jefe
  { label: 'Dashboard',       route: '/jefe/dashboard',         iconPath: ICONS.dashboard, group: 'jefe' },
  { label: 'Reportes IA',     route: '/jefe/reportes',          iconPath: ICONS.document,  group: 'jefe' },
  { label: 'Trámites depto.', route: '/jefe/tramites',          iconPath: ICONS.folder,    group: 'jefe' },
  { label: 'Estadísticas',    route: '/jefe/estadisticas',      iconPath: ICONS.chart,     group: 'jefe' },

  // funcionario
  { label: 'Dashboard',       route: '/funcionario/dashboard',  iconPath: ICONS.dashboard, group: 'funcionario' },
  { label: 'Bandeja tareas',  route: '/funcionario/tareas',     iconPath: ICONS.document,  group: 'funcionario' },

  // cliente
  { label: 'Dashboard',       route: '/cliente/dashboard',      iconPath: ICONS.dashboard, group: 'cliente' },
  { label: 'Iniciar trámite', route: '/cliente/nuevo',          iconPath: ICONS.document,  group: 'cliente' },
  { label: 'Mis solicitudes', route: '/cliente/solicitudes',    iconPath: ICONS.folder,    group: 'cliente' },
];

@Component({
  selector: 'zf-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  host: {
    'role': 'complementary',
    'class': 'h-screen sticky top-0 flex-shrink-0 transition-all duration-200 z-30 border-r border-border bg-surface flex flex-col',
    '[class.w-64]': '!collapsed()',
    '[class.w-16]': 'collapsed()',
    '[class.hidden]': '!mobileOpen()',
    '[class.md:flex]': 'true',
  }
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);

  collapsed = input<boolean>(false);
  private readonly _mobileOpen = signal(false);
  readonly mobileOpen = this._mobileOpen.asReadonly();

  protected logoUrl = signal<string | null>(null);
  protected orgName = signal<string>('ZFlow');

  constructor() {
    this.cargarConfiguracion();
    if (typeof window !== 'undefined') {
      window.addEventListener('zflow-config-updated', () => {
        this.cargarConfiguracion();
      });
    }
  }

  private cargarConfiguracion() {
    if (typeof window !== 'undefined') {
      const configStr = localStorage.getItem('zflow_config');
      if (configStr) {
        try {
          const config = JSON.parse(configStr);
          this.logoUrl.set(config.logoUrl || null);
          this.orgName.set(config.nombreOrganizacion || 'ZFlow');
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  toggleMobile(): void { this._mobileOpen.update(v => !v); }
  closeMobile():  void { this._mobileOpen.set(false); }

  protected readonly items = computed<SidebarItem[]>(() => {
    const rol = this.auth.rol();
    if (!rol) return [];
    const group: SidebarItem['group'] =
      rol === 'ADMIN' ? 'admin' :
      rol === 'JEFE' ? 'jefe' :
      rol === 'FUNCIONARIO' ? 'funcionario' :
      'cliente';
    return ALL_ITEMS.filter(i => i.group === 'common' || i.group === group);
  });
}
