/* ========================================
   ROUTER SPA - Navegación sin recargar
   ======================================== */

import Permissions from './permissions.js';

const Router = {
  routes: {},
  currentRoute: null,
  contentElement: null,

  /**
   * Inicializar el router
   */
  init(contentSelector) {
    this.contentElement = document.querySelector(contentSelector);

    // Escuchar cambios en el hash
    window.addEventListener('hashchange', () => this.handleRoute());

    // Ruta inicial
    this.handleRoute();
  },

  /**
   * Registrar una ruta
   * @param {string} path - Nombre de la ruta (ej: 'dashboard', 'clientes')
   * @param {Function} handler - Función que retorna el HTML de la página
   */
  register(path, handler) {
    this.routes[path] = handler;
  },

  /**
   * Navegar a una ruta
   */
  navigate(path) {
    window.location.hash = `#/${path}`;
  },

  /**
   * Manejar el cambio de ruta
   */
  async handleRoute() {
    const hash = window.location.hash.slice(2) || 'dashboard'; // quitar #/
    const route = hash.split('?')[0]; // ignorar query params

    if (this.routes[route]) {
      // Guard de permisos: verificar que el rol actual puede ver esta ruta
      if (window.App?.userProfile && !Permissions.canSeeRoute(route)) {
        this.contentElement.innerHTML = `
          <div class="card">
            <div class="card-body text-center">
              <h2>Acceso denegado</h2>
              <p class="text-muted">No tenés permiso para acceder a esta sección.</p>
              <button class="btn btn-primary" onclick="window.location.hash='#/dashboard'">
                Volver al inicio
              </button>
            </div>
          </div>
        `;
        return;
      }

      this.currentRoute = route;

      // Actualizar link activo en sidebar
      document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.toggle('active', link.dataset.route === route);
      });

      // Actualizar título en navbar
      const titleEl = document.querySelector('.navbar-title');
      if (titleEl) {
        titleEl.textContent = this.getRouteTitle(route);
      }

      // Renderizar la página
      try {
        await this.routes[route](this.contentElement);
      } catch (err) {
        console.error('Error al cargar ruta:', err);
        this.contentElement.innerHTML = `
          <div class="card">
            <div class="card-body text-center">
              <h2>Error al cargar la página</h2>
              <p class="text-muted">${err.message}</p>
            </div>
          </div>
        `;
      }
    } else {
      // 404
      this.contentElement.innerHTML = `
        <div class="card">
          <div class="card-body text-center">
            <h2>Página no encontrada</h2>
            <p class="text-muted">La ruta "${route}" no existe.</p>
            <button class="btn btn-primary" onclick="window.location.hash='#/dashboard'">
              Volver al inicio
            </button>
          </div>
        </div>
      `;
    }
  },

  /**
   * Obtener título legible de la ruta
   */
  getRouteTitle(route) {
    const titles = {
      dashboard: 'Dashboard',
      clientes: 'Clientes',
      productos: 'Productos',
      pedidos: 'Pedidos',
      pipeline: 'Pipeline',
      rutas: 'Rutas',
      reportes: 'Reportes',
      configuracion: 'Configuración',
    };
    return titles[route] || route;
  },
};

export default Router;
