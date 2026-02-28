/* ========================================
   COMPONENTE SIDEBAR
   ======================================== */

import Permissions from '../utils/permissions.js';

const Sidebar = {
  _esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  _safeUrl(url) {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      return (parsed.protocol === 'https:' || parsed.protocol === 'http:') ? url : null;
    } catch {
      return null;
    }
  },

  render(userProfile, organization) {
    const initials = userProfile
      ? (userProfile.nombre || '').split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2) || '??'
      : '??';

    const rolLabels = {
      owner: 'Propietario',
      admin: 'Administrador',
      gerente: 'Gerente de Ventas',
      vendedor: 'Vendedor',
      repartidor: 'Repartidor',
      administrativo: 'Administrativo',
    };

    // Nombre de la organización (branding dinámico)
    const orgName = this._esc(organization?.nombre || 'CRM Distribuidora');
    const orgLogo = this._safeUrl(organization?.logo_url);

    return `
      <div class="sidebar-backdrop" id="sidebarBackdrop"></div>
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-logo">
          ${orgLogo
            ? `<img src="${this._esc(orgLogo)}" alt="${orgName}" style="max-height:32px;border-radius:4px;">`
            : ''
          }
          <h2>${orgName}</h2>
        </div>

        <nav class="sidebar-nav">
          ${this.buildNav(userProfile)}
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="sidebar-user-avatar">${this._esc(initials)}</div>
            <div class="sidebar-user-info">
              <div class="sidebar-user-name">${this._esc(userProfile?.nombre || 'Usuario')}</div>
              <div class="sidebar-user-role">${rolLabels[userProfile?.rol] || 'Sin rol'}</div>
            </div>
          </div>
        </div>
      </aside>
    `;
  },

  /**
   * Construir la navegación filtrada por permisos del rol
   */
  buildNav(userProfile) {
    const visibleRoutes = Permissions.getVisibleRoutes();

    const allLinks = [
      { section: 'Principal', items: [
        { route: 'dashboard', label: 'Dashboard', icon: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>' },
        { route: 'pipeline', label: 'Pipeline', icon: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>' },
      ]},
      { section: 'Gestión', items: [
        { route: 'clientes', label: 'Clientes', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>' },
        { route: 'productos', label: 'Productos', icon: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>' },
        { route: 'pedidos', label: 'Pedidos', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>' },
      ]},
      { section: 'Logística', items: [
        { route: 'rutas', label: 'Rutas', icon: '<circle cx="12" cy="10" r="3"></circle><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"></path>' },
      ]},
      { section: 'Análisis', items: [
        { route: 'reportes', label: 'Reportes', icon: '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>' },
      ]},
      { section: 'Sistema', items: [
        { route: 'configuracion', label: 'Configuración', icon: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>' },
      ]},
    ];

    let html = '';
    for (const group of allLinks) {
      const visibleItems = group.items.filter(item => visibleRoutes.includes(item.route));
      if (visibleItems.length === 0) continue;

      html += `<div class="sidebar-section"><div class="sidebar-section-title">${group.section}</div></div>`;
      for (const item of visibleItems) {
        const isActive = item.route === 'dashboard' ? 'active' : '';
        html += `
          <a class="sidebar-link ${isActive}" data-route="${item.route}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${item.icon}</svg>
            <span>${item.label}</span>
          </a>`;
      }
    }
    return html;
  },

  /**
   * Detectar si estamos en vista mobile
   */
  isMobile() {
    return window.innerWidth <= 768;
  },

  /**
   * Abrir sidebar en mobile
   */
  open() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.add('open');
    if (backdrop) backdrop.classList.add('visible');
    document.body.classList.add('sidebar-open');
  },

  /**
   * Cerrar sidebar en mobile
   */
  close() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('visible');
    document.body.classList.remove('sidebar-open');
  },

  /**
   * Inicializar eventos del sidebar
   */
  initEvents() {
    // Click en links de navegación
    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const route = link.dataset.route;
        if (route) {
          window.location.hash = `#/${route}`;
          // Cerrar sidebar en mobile al navegar
          if (this.isMobile()) {
            this.close();
          }
        }
      });
    });

    // Click en backdrop cierra el sidebar
    const backdrop = document.getElementById('sidebarBackdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => this.close());
    }
  },
};

export default Sidebar;
