/* ========================================
   SISTEMA DE NOTIFICACIONES IN-APP
   Campana en navbar + panel desplegable
   ======================================== */

import supabase from '../config/supabase.js';

const Notifications = {
  // Estado
  notificaciones: [],
  unreadCount: 0,
  isOpen: false,
  pollInterval: null,

  /**
   * Inicializar: cargar notificaciones y configurar polling
   */
  async init() {
    await this.load();
    this.updateBadge();

    // Polling cada 60 segundos para nuevas notificaciones
    this.pollInterval = setInterval(() => this.load(), 60000);
  },

  /**
   * Cargar notificaciones del usuario actual desde Supabase
   */
  async load() {
    try {
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      this.notificaciones = data || [];
      this.unreadCount = this.notificaciones.filter(n => !n.leida).length;
      this.updateBadge();

      // Si el panel está abierto, actualizar contenido
      if (this.isOpen) {
        this.renderList();
      }
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
    }
  },

  /**
   * Actualizar el badge de la campana
   */
  updateBadge() {
    const badge = document.getElementById('notifBadge');
    if (!badge) return;

    if (this.unreadCount > 0) {
      badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
      badge.classList.add('visible');
    } else {
      badge.textContent = '';
      badge.classList.remove('visible');
    }
  },

  /**
   * Toggle del panel de notificaciones
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  },

  /**
   * Abrir panel
   */
  open() {
    this.isOpen = true;
    const panel = document.getElementById('notifPanel');
    if (panel) {
      panel.classList.add('open');
      this.renderList();
    }

    // Cerrar al hacer click fuera
    setTimeout(() => {
      this._outsideClickHandler = (e) => {
        const panel = document.getElementById('notifPanel');
        const btn = document.getElementById('notifBtn');
        if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
          this.close();
        }
      };
      document.addEventListener('click', this._outsideClickHandler);
    }, 10);
  },

  /**
   * Cerrar panel
   */
  close() {
    this.isOpen = false;
    const panel = document.getElementById('notifPanel');
    if (panel) panel.classList.remove('open');

    if (this._outsideClickHandler) {
      document.removeEventListener('click', this._outsideClickHandler);
      this._outsideClickHandler = null;
    }
  },

  /**
   * Renderizar la lista de notificaciones dentro del panel
   */
  renderList() {
    const list = document.getElementById('notifList');
    if (!list) return;

    if (this.notificaciones.length === 0) {
      list.innerHTML = `
        <div class="notif-empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          <p>No hay notificaciones</p>
        </div>
      `;
      return;
    }

    list.innerHTML = this.notificaciones.map(n => {
      const timeAgo = this._timeAgo(n.created_at);
      const icon = this._getIcon(n.tipo);
      return `
        <div class="notif-item ${n.leida ? '' : 'unread'}" data-id="${n.id}" ${n.link_accion ? `data-link="${n.link_accion}"` : ''}>
          <div class="notif-icon ${n.tipo}">${icon}</div>
          <div class="notif-content">
            <div class="notif-title">${this._esc(n.titulo)}</div>
            ${n.mensaje ? `<div class="notif-message">${this._esc(n.mensaje)}</div>` : ''}
            <div class="notif-time">${timeAgo}</div>
          </div>
          ${!n.leida ? '<div class="notif-dot"></div>' : ''}
        </div>
      `;
    }).join('');

    // Eventos: click en notificación → marcar como leída
    list.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', async () => {
        const id = item.dataset.id;
        const link = item.dataset.link;

        // Marcar como leída
        await this.markAsRead(id);

        // Navegar si tiene link
        if (link) {
          window.location.hash = link;
          this.close();
        }
      });
    });
  },

  /**
   * Marcar una notificación como leída
   */
  async markAsRead(id) {
    try {
      await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('id', id);

      const notif = this.notificaciones.find(n => n.id === id);
      if (notif) {
        notif.leida = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.updateBadge();
        this.renderList();
      }
    } catch (err) {
      console.error('Error marcando notificación:', err);
    }
  },

  /**
   * Marcar todas como leídas
   */
  async markAllAsRead() {
    try {
      const unreadIds = this.notificaciones.filter(n => !n.leida).map(n => n.id);
      if (unreadIds.length === 0) return;

      await supabase
        .from('notificaciones')
        .update({ leida: true })
        .in('id', unreadIds);

      this.notificaciones.forEach(n => n.leida = true);
      this.unreadCount = 0;
      this.updateBadge();
      this.renderList();
    } catch (err) {
      console.error('Error marcando todas como leídas:', err);
    }
  },

  /**
   * Icono según tipo de notificación
   */
  _getIcon(tipo) {
    const icons = {
      pedido: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
      stock: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>',
      cliente: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
      alerta: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      sistema: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
    };
    return icons[tipo] || icons.sistema;
  },

  /**
   * Tiempo relativo (hace X minutos/horas/días)
   */
  _timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Justo ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHr < 24) return `Hace ${diffHr}h`;
    if (diffDay < 7) return `Hace ${diffDay} día${diffDay > 1 ? 's' : ''}`;
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  },

  _esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },

  /**
   * Limpiar al hacer logout
   */
  destroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.close();
    this.notificaciones = [];
    this.unreadCount = 0;
  },
};

export default Notifications;
