/* ========================================
   COMPONENTE NAVBAR
   ======================================== */

import Auth from '../auth/auth.js';
import Toast from '../utils/toast.js';
import Sidebar from './sidebar.js';
import Notifications from '../utils/notifications.js';
import GlobalSearch from '../utils/global-search.js';

const Navbar = {
  render() {
    return `
      <header class="navbar" id="navbar">
        <div class="navbar-left">
          <button class="navbar-toggle" id="sidebarToggle" title="Colapsar menú">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <h1 class="navbar-title">Dashboard</h1>
        </div>

        <div class="navbar-right">
          <!-- Búsqueda global -->
          <div class="global-search-wrapper" id="globalSearchWrapper">
            <button class="global-search-btn" id="globalSearchBtn" title="Buscar (Ctrl+K)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
            <input type="text" class="global-search-input" id="globalSearchInput" placeholder="Buscar clientes, productos, pedidos...">
            <div class="global-search-results" id="globalSearchResults"></div>
          </div>

          <div class="notif-wrapper">
            <button class="navbar-icon-btn" id="notifBtn" title="Notificaciones">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span class="notif-badge" id="notifBadge"></span>
            </button>

            <!-- Panel de notificaciones -->
            <div class="notif-panel" id="notifPanel">
              <div class="notif-panel-header">
                <h3>Notificaciones</h3>
                <button class="notif-mark-all" id="notifMarkAll" title="Marcar todas como leídas">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Marcar leídas
                </button>
              </div>
              <div class="notif-list" id="notifList">
                <div class="notif-empty">
                  <div class="loader"><div class="spinner"></div></div>
                </div>
              </div>
            </div>
          </div>

          <button class="navbar-logout" id="logoutBtn" title="Cerrar sesión">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </header>
    `;
  },

  /**
   * Inicializar eventos del navbar
   */
  initEvents() {
    // Toggle sidebar
    const toggleBtn = document.getElementById('sidebarToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (Sidebar.isMobile()) {
          const sidebar = document.getElementById('sidebar');
          if (sidebar && sidebar.classList.contains('open')) {
            Sidebar.close();
          } else {
            Sidebar.open();
          }
        } else {
          const container = document.querySelector('.app-container');
          const sidebar = document.getElementById('sidebar');
          container.classList.toggle('sidebar-collapsed');
          sidebar.classList.toggle('collapsed');
        }
      });
    }

    // Notificaciones
    const notifBtn = document.getElementById('notifBtn');
    if (notifBtn) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        Notifications.toggle();
      });
    }

    const markAllBtn = document.getElementById('notifMarkAll');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        Notifications.markAllAsRead();
      });
    }

    // Inicializar sistema de notificaciones
    Notifications.init();

    // Inicializar búsqueda global
    GlobalSearch.init();

    // Atajo Ctrl+K para búsqueda global
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (GlobalSearch.isOpen) {
          GlobalSearch.close();
        } else {
          GlobalSearch.open();
        }
      }
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          Notifications.destroy();
          await Auth.logout();
          window.location.reload();
        } catch (err) {
          Toast.error('Error al cerrar sesión');
        }
      });
    }
  },
};

export default Navbar;
