import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { rolGuard } from './core/guards/rol.guard';
import { ShellComponent } from './shared/components/shell/shell.component';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
        title: 'Iniciar sesión · ZFlow',
      },
      {
        path: 'registro',
        loadComponent: () => import('./features/auth/registro/registro.component').then(m => m.RegistroComponent),
        title: 'Crear cuenta · ZFlow',
      },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },

  {
    path: '',
    component: ShellComponent,
    canMatch: [authGuard],
    children: [
      {
        path: 'admin',
        canMatch: [rolGuard('ADMIN')],
        children: [
          {
            path: 'dashboard',
            loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent),
            title: 'Admin · ZFlow',
          },
          {
            path: 'reportes',
            loadComponent: () => import('./features/reportes/reportes.component').then(m => m.ReportesComponent),
            title: 'Reportes · ZFlow',
          },
          {
            path: 'politicas',
            children: [
              {
                path: '',
                loadComponent: () => import('./features/admin/politicas/politicas-list.component').then(m => m.PoliticasListComponent),
                title: 'Políticas · ZFlow',
              },
              {
                path: 'nueva',
                loadComponent: () => import('./features/admin/politicas/politica-editor-page.component').then(m => m.PoliticaEditorPageComponent),
                title: 'Nueva política · ZFlow',
              },
              {
                path: ':id/editar',
                loadComponent: () => import('./features/admin/politicas/politica-editor-page.component').then(m => m.PoliticaEditorPageComponent),
                title: 'Editar política · ZFlow',
              },
            ],
          },
          {
            path: 'usuarios',
            loadComponent: () => import('./features/admin/usuarios/usuarios.component').then(m => m.UsuariosComponent),
            title: 'Usuarios · ZFlow',
          },
          {
            path: 'departamentos',
            loadComponent: () => import('./features/admin/departamentos/departamentos.component').then(m => m.DepartamentosComponent),
            title: 'Departamentos · ZFlow',
          },
          {
            path: 'configuracion',
            loadComponent: () => import('./features/admin/configuracion.component').then(m => m.ConfiguracionComponent),
            title: 'Configuración · ZFlow',
          },
          {
            path: 'bitacora',
            loadComponent: () => import('./features/admin/bitacora/bitacora.component').then(m => m.BitacoraComponent),
            title: 'Bitácora · ZFlow',
          },
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
        ],
      },
      {
        path: 'jefe',
        canMatch: [rolGuard('JEFE')],
        children: [
          {
            path: 'dashboard',
            loadComponent: () => import('./features/jefe/jefe-dashboard.component').then(m => m.JefeDashboardComponent),
            title: 'Jefe · ZFlow',
          },
          {
            path: 'reportes',
            loadComponent: () => import('./features/reportes/reportes.component').then(m => m.ReportesComponent),
            title: 'Reportes · ZFlow',
          },
          {
            path: 'tramites',
            loadComponent: () => import('./features/funcionario/tareas/panel-tareas.component').then(m => m.PanelTareasComponent),
            title: 'Trámites del Departamento · ZFlow',
          },
          {
            path: 'estadisticas',
            loadComponent: () => import('./features/jefe/jefe-dashboard.component').then(m => m.JefeDashboardComponent),
            title: 'Estadísticas del Departamento · ZFlow',
          },
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
        ],
      },
      {
        path: 'funcionario',
        canMatch: [rolGuard('FUNCIONARIO')],
        children: [
          {
            path: 'dashboard',
            loadComponent: () => import('./features/funcionario/funcionario-dashboard.component').then(m => m.FuncionarioDashboardComponent),
            title: 'Funcionario · ZFlow',
          },
          {
            path: 'tareas',
            loadComponent: () => import('./features/funcionario/tareas/panel-tareas.component').then(m => m.PanelTareasComponent),
            title: 'Bandeja de Tareas · ZFlow',
          },
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
        ],
      },
      {
        path: 'cliente',
        canMatch: [rolGuard('CLIENTE')],
        children: [
          {
            path: 'dashboard',
            loadComponent: () => import('./features/cliente/cliente-dashboard.component').then(m => m.ClienteDashboardComponent),
            title: 'Cliente · ZFlow',
          },
          {
            path: 'nuevo',
            loadComponent: () => import('./features/cliente/cliente-dashboard.component').then(m => m.ClienteDashboardComponent),
            title: 'Iniciar trámite · ZFlow',
          },
          {
            path: 'solicitudes',
            loadComponent: () => import('./features/cliente/cliente-dashboard.component').then(m => m.ClienteDashboardComponent),
            title: 'Mis Solicitudes · ZFlow',
          },
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
        ],
      },

      // rutas comunes a cualquier autenticado
      {
        path: 'perfil',
        loadComponent: () => import('./features/perfil/perfil.component').then(m => m.PerfilComponent),
        title: 'Mi perfil · ZFlow',
      },
      {
        path: 'notificaciones',
        loadComponent: () => import('./features/notificaciones/notificaciones.component').then(m => m.NotificacionesComponent),
        title: 'Notificaciones · ZFlow',
      },

      // raíz autenticada → redirige al home del rol
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/home-redirect/home-redirect.component').then(m => m.HomeRedirectComponent),
      },
    ],
  },

  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: '404 · ZFlow',
  },
];
