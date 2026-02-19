/* ========================================
   BÚSQUEDA GLOBAL
   Busca en clientes, productos y pedidos
   desde cualquier pantalla
   ======================================== */

import supabase from '../config/supabase.js';

const GlobalSearch = {
  isOpen: false,
  _outsideHandler: null,

  /**
   * Inicializar el buscador global en el navbar
   */
  init() {
    const wrapper = document.getElementById('globalSearchWrapper');
    const btn = document.getElementById('globalSearchBtn');
    const input = document.getElementById('globalSearchInput');
    const results = document.getElementById('globalSearchResults');

    if (!wrapper || !btn || !input || !results) return;

    // Toggle búsqueda
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    });

    // Buscar con debounce
    let timeout;
    input.addEventListener('input', () => {
      clearTimeout(timeout);
      const q = input.value.trim();
      if (q.length < 2) {
        results.classList.remove('open');
        return;
      }
      timeout = setTimeout(() => this.search(q), 300);
    });

    // Cerrar con Escape
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });

    // Navegación con click en resultado
    results.addEventListener('click', (e) => {
      const item = e.target.closest('.search-result-item');
      if (item) {
        const route = item.dataset.route;
        if (route) {
          window.location.hash = route;
          this.close();
        }
      }
    });
  },

  open() {
    const wrapper = document.getElementById('globalSearchWrapper');
    const input = document.getElementById('globalSearchInput');
    if (!wrapper) return;

    this.isOpen = true;
    wrapper.classList.add('open');
    input.focus();

    // Cerrar al click fuera
    setTimeout(() => {
      this._outsideHandler = (e) => {
        if (!wrapper.contains(e.target)) {
          this.close();
        }
      };
      document.addEventListener('click', this._outsideHandler);
    }, 10);
  },

  close() {
    const wrapper = document.getElementById('globalSearchWrapper');
    const input = document.getElementById('globalSearchInput');
    const results = document.getElementById('globalSearchResults');

    if (wrapper) wrapper.classList.remove('open');
    if (input) input.value = '';
    if (results) results.classList.remove('open');

    this.isOpen = false;

    if (this._outsideHandler) {
      document.removeEventListener('click', this._outsideHandler);
      this._outsideHandler = null;
    }
  },

  /**
   * Ejecutar búsqueda en paralelo
   */
  async search(query) {
    const results = document.getElementById('globalSearchResults');
    if (!results) return;

    results.innerHTML = '<div class="search-no-results">Buscando...</div>';
    results.classList.add('open');

    const s = `%${query}%`;

    try {
      const [clientes, productos, pedidos] = await Promise.all([
        supabase
          .from('clientes')
          .select('id, nombre_establecimiento, tipo_cliente, ciudad')
          .or(`nombre_establecimiento.ilike.${s},ciudad.ilike.${s},telefono.ilike.${s},email.ilike.${s}`)
          .limit(5),
        supabase
          .from('productos')
          .select('id, nombre, sku, categoria')
          .or(`nombre.ilike.${s},sku.ilike.${s},categoria.ilike.${s}`)
          .eq('activo', true)
          .limit(5),
        supabase
          .from('pedidos')
          .select('id, numero_pedido, total, estado, cliente:cliente_id(nombre_establecimiento)')
          .or(`numero_pedido::text.ilike.${s}`)
          .limit(5),
      ]);

      const clientesData = clientes.data || [];
      const productosData = productos.data || [];
      const pedidosData = pedidos.data || [];

      if (clientesData.length === 0 && productosData.length === 0 && pedidosData.length === 0) {
        results.innerHTML = `<div class="search-no-results">No se encontraron resultados para "${this._esc(query)}"</div>`;
        return;
      }

      let html = '';

      if (clientesData.length > 0) {
        html += `
          <div class="search-result-group">
            <div class="search-result-group-title">Clientes</div>
            ${clientesData.map(c => `
              <div class="search-result-item" data-route="#/clientes">
                <div class="search-result-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <div class="search-result-info">
                  <div class="search-result-name">${this._esc(c.nombre_establecimiento)}</div>
                  <div class="search-result-meta">${this._esc(c.tipo_cliente || '')} ${c.ciudad ? '· ' + this._esc(c.ciudad) : ''}</div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      if (productosData.length > 0) {
        html += `
          <div class="search-result-group">
            <div class="search-result-group-title">Productos</div>
            ${productosData.map(p => `
              <div class="search-result-item" data-route="#/productos">
                <div class="search-result-icon" style="background:#dcfce7;color:#16a34a;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                </div>
                <div class="search-result-info">
                  <div class="search-result-name">${this._esc(p.nombre)}</div>
                  <div class="search-result-meta">${this._esc(p.sku)} · ${this._esc(p.categoria || '')}</div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      if (pedidosData.length > 0) {
        const moneda = window.App?.organization?.moneda || 'ARS';
        html += `
          <div class="search-result-group">
            <div class="search-result-group-title">Pedidos</div>
            ${pedidosData.map(p => `
              <div class="search-result-item" data-route="#/pedidos">
                <div class="search-result-icon" style="background:#fef3c7;color:#d97706;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                </div>
                <div class="search-result-info">
                  <div class="search-result-name">#${p.numero_pedido} - ${this._esc(p.cliente?.nombre_establecimiento || '')}</div>
                  <div class="search-result-meta">${moneda} ${Number(p.total || 0).toLocaleString('es-AR')} · ${p.estado}</div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      results.innerHTML = html;
    } catch (err) {
      console.error('Error en búsqueda global:', err);
      results.innerHTML = '<div class="search-no-results">Error al buscar</div>';
    }
  },

  _esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};

export default GlobalSearch;
