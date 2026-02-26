/* ========================================
   PÁGINA PEDIDOS - CRUD COMPLETO
   Crear pedidos, cambiar estados, detalle
   ======================================== */

import supabase from '../config/supabase.js';
import Toast from '../utils/toast.js';
import Permissions from '../utils/permissions.js';
import CSV from '../utils/csv.js';
import Notif from '../utils/notif.js';

const ITEMS_PER_PAGE = 15;

const PedidosPage = {
  pedidos: [],
  clientes: [],
  productos: [],
  vendedores: [],
  totalCount: 0,
  currentPage: 0,
  filters: { search: '', estado: '', fechaDesde: '', fechaHasta: '', vendedor: '', totalMin: '', totalMax: '' },
  sortField: 'created_at',
  sortAsc: false,
  // Estado del formulario de nuevo pedido
  lineas: [], // { producto_id, nombre, sku, cantidad, precio_unitario, subtotal }
  preciosLista: {}, // { producto_id: precio } — precios de la lista del cliente seleccionado

  async render(container) {
    this.container = container;

    container.innerHTML = `
      <div class="pedidos-header">
        <div>
          <h1>Pedidos</h1>
          <p>Gesti\u00f3n de pedidos de tu distribuidora</p>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button class="btn btn-export" id="btnExportPedidos" title="Exportar a CSV">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            CSV
          </button>
          <button class="btn btn-export" id="btnVerDevoluciones" title="Ver todas las devoluciones">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 .49-3.51"></path></svg>
            Devoluciones
          </button>
          ${Permissions.can('crear', 'pedidos') ? `
          <button class="btn btn-primary" id="btnNuevoPedido">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nuevo Pedido
          </button>` : ''}
        </div>
      </div>

      <div class="pedidos-filters">
        <div class="pedidos-search">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" class="form-input" id="searchPedidos" placeholder="Buscar por n\u00famero, cliente...">
        </div>
        <select id="filterEstadoPedido">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_preparacion">En Preparaci\u00f3n</option>
          <option value="en_ruta">En Ruta</option>
          <option value="entregado">Entregado</option>
          <option value="cancelado">Cancelado</option>
          <option value="con_incidencia">Con Incidencia</option>
        </select>
        <button class="advanced-filters-toggle" id="advFiltersTogglePed">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line></svg>
          Avanzados <span class="toggle-arrow">▼</span>
        </button>
      </div>

      <div class="advanced-filters-panel" id="advFiltersPanelPed">
        <div class="adv-filters-grid">
          <div class="adv-filter-group">
            <label>Fecha desde</label>
            <input type="date" class="form-input" id="filterFechaDesdePed">
          </div>
          <div class="adv-filter-group">
            <label>Fecha hasta</label>
            <input type="date" class="form-input" id="filterFechaHastaPed">
          </div>
          <div class="adv-filter-group">
            <label>Vendedor</label>
            <select id="filterVendedorPed">
              <option value="">Todos</option>
            </select>
          </div>
          <div class="adv-filter-group">
            <label>Total mínimo</label>
            <input type="number" class="form-input" id="filterTotalMin" min="0" placeholder="0">
          </div>
          <div class="adv-filter-group">
            <label>Total máximo</label>
            <input type="number" class="form-input" id="filterTotalMax" min="0" placeholder="Sin límite">
          </div>
        </div>
        <div class="adv-filters-actions">
          <button class="btn btn-sm" id="btnApplyAdvFiltersPed">Aplicar</button>
          <button class="btn btn-sm btn-ghost" id="btnClearAdvFiltersPed">Limpiar filtros</button>
          <div class="filter-presets-wrapper">
            <select id="filterPresetSelectPed">
              <option value="">Filtros guardados...</option>
            </select>
            <button class="btn btn-sm btn-ghost" id="btnSavePresetPed">Guardar</button>
          </div>
        </div>
      </div>

      <div class="active-filters-badges" id="activeFiltersBadgesPed"></div>

      <div class="pedidos-count" id="pedidosCount"></div>

      <div class="card">
        <div class="pedidos-table-wrapper">
          <table class="pedidos-table">
            <thead>
              <tr>
                <th class="th-sortable" data-sort="numero_pedido"># Pedido <span class="sort-icon">\u2195</span></th>
                <th>Cliente</th>
                <th>Vendedor</th>
                <th class="th-sortable" data-sort="estado">Estado <span class="sort-icon">\u2195</span></th>
                <th class="th-sortable" data-sort="total">Total <span class="sort-icon">\u2195</span></th>
                <th class="th-sortable" data-sort="created_at">Fecha <span class="sort-icon">\u2195</span></th>
                <th class="th-sortable" data-sort="fecha_entrega_programada">Entrega <span class="sort-icon">\u2195</span></th>
                <th></th>
              </tr>
            </thead>
            <tbody id="pedidosTableBody">
              <tr><td colspan="8"><div class="loader"><div class="spinner"></div></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="paginacion" id="paginacionPed"></div>
      <div id="modalContainer"></div>
    `;

    await Promise.all([
      this.loadClientes(),
      this.loadProductosDisponibles(),
      this.loadVendedores(),
    ]);
    this._restoreFilters();
    await this.loadPedidos();
    this.initEvents();
  },

  // ========================================
  // CARGA DE DATOS
  // ========================================

  async loadPedidos() {
    sessionStorage.setItem('crm_filters_pedidos', JSON.stringify(this.filters));
    try {
      const orgId = window.App?.organization?.id;
      let query = supabase
        .from('pedidos')
        .select('*, cliente:cliente_id(id, nombre_establecimiento), vendedor:vendedor_id(id, nombre)', { count: 'exact' })
        .eq('organizacion_id', orgId);

      if (this.filters.estado) {
        query = query.eq('estado', this.filters.estado);
      }
      if (this.filters.search) {
        const num = parseInt(this.filters.search);
        if (!isNaN(num)) {
          query = query.eq('numero_pedido', num);
        } else {
          // Buscar por nombre de cliente (two-step: traer IDs de clientes que coincidan)
          const { data: clienteMatch } = await supabase
            .from('clientes')
            .select('id')
            .eq('organizacion_id', orgId)
            .ilike('nombre_establecimiento', `%${this.filters.search}%`);
          const ids = (clienteMatch || []).map(c => c.id);
          if (ids.length > 0) {
            query = query.in('cliente_id', ids);
          } else {
            // Sin coincidencias: no traer resultados
            query = query.eq('id', '00000000-0000-0000-0000-000000000000');
          }
        }
      }
      // Filtros avanzados
      if (this.filters.fechaDesde) {
        query = query.gte('created_at', this.filters.fechaDesde);
      }
      if (this.filters.fechaHasta) {
        query = query.lte('created_at', this.filters.fechaHasta + 'T23:59:59');
      }
      if (this.filters.vendedor) {
        query = query.eq('vendedor_id', this.filters.vendedor);
      }
      if (this.filters.totalMin) {
        query = query.gte('total', parseFloat(this.filters.totalMin));
      }
      if (this.filters.totalMax) {
        query = query.lte('total', parseFloat(this.filters.totalMax));
      }

      const from = this.currentPage * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.order(this.sortField, { ascending: this.sortAsc }).range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      this.pedidos = data || [];
      this.totalCount = count || 0;
      this.renderTable();
      this.renderPagination();
      this.renderCount();
    } catch (err) {
      console.error('Error cargando pedidos:', err);
      Toast.error('Error al cargar pedidos');
    }
  },

  async loadClientes() {
    try {
      const orgId = window.App?.organization?.id;
      const { data } = await supabase
        .from('clientes')
        .select('id, nombre_establecimiento, lista_precios_id, saldo_pendiente, linea_credito, dias_credito, metodo_pago_preferido')
        .eq('organizacion_id', orgId)
        .in('estado_lead', ['activo', 'negociacion', 'prospecto'])
        .order('nombre_establecimiento');
      this.clientes = data || [];
    } catch (err) {
      console.error('Error cargando clientes:', err);
    }
  },

  async loadProductosDisponibles() {
    try {
      const orgId = window.App?.organization?.id;
      const { data } = await supabase
        .from('productos')
        .select('id, sku, nombre, precio_base, stock_actual')
        .eq('organizacion_id', orgId)
        .eq('activo', true)
        .order('nombre');
      this.productos = data || [];
    } catch (err) {
      console.error('Error cargando productos:', err);
    }
  },

  async loadVendedores() {
    try {
      const orgId = window.App?.organization?.id;
      const { data } = await supabase
        .from('usuarios')
        .select('id, nombre')
        .eq('organizacion_id', orgId)
        .in('rol', ['vendedor', 'gerente', 'admin', 'owner'])
        .eq('activo', true);
      this.vendedores = data || [];
    } catch (err) {
      console.error('Error cargando vendedores:', err);
    }
  },

  // ========================================
  // RENDERIZADO
  // ========================================

  renderTable() {
    const tbody = document.getElementById('pedidosTableBody');
    if (!tbody) return;
    const moneda = window.App?.organization?.moneda || 'ARS';

    if (this.pedidos.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="8">
          <div class="pedidos-empty">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            <h3>No hay pedidos</h3>
            <p>Cre\u00e1 tu primer pedido con el bot\u00f3n "Nuevo Pedido"</p>
          </div>
        </td></tr>`;
      return;
    }

    tbody.innerHTML = this.pedidos.map(p => `
      <tr data-id="${p.id}">
        <td><span class="pedido-numero">#${p.numero_pedido}</span></td>
        <td>${this.esc(p.cliente?.nombre_establecimiento || '-')}</td>
        <td>${this.esc(p.vendedor?.nombre || '-')}</td>
        <td><span class="badge-estado-pedido ${p.estado}"><span class="dot"></span>${this.estadoLabel(p.estado)}</span></td>
        <td><strong>${moneda} ${Number(p.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong></td>
        <td>${new Date(p.created_at).toLocaleDateString('es-AR')}</td>
        <td>${p.fecha_entrega_programada ? new Date(p.fecha_entrega_programada).toLocaleDateString('es-AR') : '-'}</td>
        <td>
          <div class="table-actions">
            <button title="Ver detalle" class="btn-ver-ped" data-id="${p.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
            ${Permissions.can('eliminar', 'pedidos') ? `
            <button title="Eliminar" class="btn-eliminar-ped" data-id="${p.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  },

  estadoLabel(estado) {
    const labels = {
      pendiente: 'Pendiente',
      en_preparacion: 'En Preparaci\u00f3n',
      en_ruta: 'En Ruta',
      entregado: 'Entregado',
      cancelado: 'Cancelado',
      con_incidencia: 'Con Incidencia',
    };
    return labels[estado] || estado;
  },

  renderPagination() {
    const container = document.getElementById('paginacionPed');
    if (!container) return;
    const totalPages = Math.ceil(this.totalCount / ITEMS_PER_PAGE);
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    let html = `<button class="pag-prev" ${this.currentPage === 0 ? 'disabled' : ''}>&laquo; Anterior</button>`;
    for (let i = 0; i < totalPages; i++) {
      if (totalPages > 7 && Math.abs(i - this.currentPage) > 2 && i !== 0 && i !== totalPages - 1) {
        if (i === 1 || i === totalPages - 2) html += `<span class="paginacion-info">...</span>`;
        continue;
      }
      html += `<button class="pag-num ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i + 1}</button>`;
    }
    html += `<button class="pag-next" ${this.currentPage === totalPages - 1 ? 'disabled' : ''}>Siguiente &raquo;</button>`;
    container.innerHTML = html;
  },

  renderCount() {
    const el = document.getElementById('pedidosCount');
    if (!el) return;
    const from = this.currentPage * ITEMS_PER_PAGE + 1;
    const to = Math.min(from + ITEMS_PER_PAGE - 1, this.totalCount);
    el.textContent = this.totalCount > 0 ? `Mostrando ${from}-${to} de ${this.totalCount} pedidos` : 'Sin resultados';
  },

  esc(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  updateSortHeaders() {
    if (!this.container) return;
    this.container.querySelectorAll('.th-sortable').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      const icon = th.querySelector('.sort-icon');
      if (th.dataset.sort === this.sortField) {
        th.classList.add(this.sortAsc ? 'sort-asc' : 'sort-desc');
        if (icon) icon.textContent = this.sortAsc ? '\u2191' : '\u2193';
      } else {
        if (icon) icon.textContent = '\u2195';
      }
    });
  },

  // ========================================
  // FILTROS AVANZADOS
  // ========================================

  _initAdvancedFilters() {
    const toggle = document.getElementById('advFiltersTogglePed');
    const panel = document.getElementById('advFiltersPanelPed');
    if (toggle && panel) {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        panel.classList.toggle('open');
      });
    }

    // Poblar vendedores
    const vendSelect = document.getElementById('filterVendedorPed');
    if (vendSelect && this.vendedores.length) {
      this.vendedores.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = v.nombre;
        vendSelect.appendChild(opt);
      });
      // Restaurar valor guardado (las options no existían cuando _restoreFilters() corrió)
      if (this.filters.vendedor) vendSelect.value = this.filters.vendedor;
    }
    // Renderizar badges de filtros activos al inicializar (no solo al aplicar)
    this._renderFilterBadges();

    document.getElementById('btnApplyAdvFiltersPed')?.addEventListener('click', () => {
      this.filters.fechaDesde = document.getElementById('filterFechaDesdePed')?.value || '';
      this.filters.fechaHasta = document.getElementById('filterFechaHastaPed')?.value || '';
      this.filters.vendedor = document.getElementById('filterVendedorPed')?.value || '';
      this.filters.totalMin = document.getElementById('filterTotalMin')?.value || '';
      this.filters.totalMax = document.getElementById('filterTotalMax')?.value || '';
      this.currentPage = 0;
      this.loadPedidos();
      this._renderFilterBadges();
    });

    document.getElementById('btnClearAdvFiltersPed')?.addEventListener('click', () => {
      this.filters = { search: this.filters.search, estado: this.filters.estado, fechaDesde: '', fechaHasta: '', vendedor: '', totalMin: '', totalMax: '' };
      ['filterFechaDesdePed', 'filterFechaHastaPed', 'filterVendedorPed', 'filterTotalMin', 'filterTotalMax'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      this.currentPage = 0;
      this.loadPedidos();
      this._renderFilterBadges();
    });

    document.getElementById('btnSavePresetPed')?.addEventListener('click', () => {
      const name = prompt('Nombre del filtro:');
      if (!name) return;
      const presets = JSON.parse(localStorage.getItem('crm_filter_presets_pedidos') || '[]');
      presets.push({ name, filters: { ...this.filters } });
      localStorage.setItem('crm_filter_presets_pedidos', JSON.stringify(presets));
      this._loadPresets();
    });

    document.getElementById('filterPresetSelectPed')?.addEventListener('change', (e) => {
      const presets = JSON.parse(localStorage.getItem('crm_filter_presets_pedidos') || '[]');
      const preset = presets[e.target.value];
      if (!preset) return;
      this.filters = { ...preset.filters };
      const el = (id) => document.getElementById(id);
      if (el('searchPedidos')) el('searchPedidos').value = this.filters.search || '';
      if (el('filterEstadoPedido')) el('filterEstadoPedido').value = this.filters.estado || '';
      if (el('filterFechaDesdePed')) el('filterFechaDesdePed').value = this.filters.fechaDesde || '';
      if (el('filterFechaHastaPed')) el('filterFechaHastaPed').value = this.filters.fechaHasta || '';
      if (el('filterVendedorPed')) el('filterVendedorPed').value = this.filters.vendedor || '';
      if (el('filterTotalMin')) el('filterTotalMin').value = this.filters.totalMin || '';
      if (el('filterTotalMax')) el('filterTotalMax').value = this.filters.totalMax || '';
      this.currentPage = 0;
      this.loadPedidos();
      this._renderFilterBadges();
    });

    this._loadPresets();
  },

  _loadPresets() {
    const select = document.getElementById('filterPresetSelectPed');
    if (!select) return;
    const presets = JSON.parse(localStorage.getItem('crm_filter_presets_pedidos') || '[]');
    select.innerHTML = '<option value="">Filtros guardados...</option>';
    presets.forEach((p, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = p.name;
      select.appendChild(opt);
    });
  },

  _renderFilterBadges() {
    const container = document.getElementById('activeFiltersBadgesPed');
    if (!container) return;
    const badges = [];
    if (this.filters.fechaDesde) badges.push({ key: 'fechaDesde', label: `Desde: ${this.filters.fechaDesde}` });
    if (this.filters.fechaHasta) badges.push({ key: 'fechaHasta', label: `Hasta: ${this.filters.fechaHasta}` });
    if (this.filters.vendedor) {
      const v = this.vendedores.find(v => v.id === this.filters.vendedor);
      badges.push({ key: 'vendedor', label: `Vendedor: ${v?.nombre || '...'}` });
    }
    if (this.filters.totalMin) badges.push({ key: 'totalMin', label: `Total ≥ ${this.filters.totalMin}` });
    if (this.filters.totalMax) badges.push({ key: 'totalMax', label: `Total ≤ ${this.filters.totalMax}` });
    container.innerHTML = badges.map(b =>
      `<span class="filter-badge">${b.label} <button data-clear="${b.key}">&times;</button></span>`
    ).join('');
    container.querySelectorAll('button[data-clear]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.clear;
        this.filters[key] = '';
        const inputMap = { fechaDesde: 'filterFechaDesdePed', fechaHasta: 'filterFechaHastaPed', vendedor: 'filterVendedorPed', totalMin: 'filterTotalMin', totalMax: 'filterTotalMax' };
        const el = document.getElementById(inputMap[key]);
        if (el) el.value = '';
        this.currentPage = 0;
        this.loadPedidos();
        this._renderFilterBadges();
      });
    });
  },

  // ========================================
  // EVENTOS
  // ========================================

  initEvents() {
    document.getElementById('btnNuevoPedido')?.addEventListener('click', () => {
      this.lineas = [];
      this._clienteCredito = null;
      this.openModalNuevoPedido();
    });

    document.getElementById('btnExportPedidos')?.addEventListener('click', () => this.exportCSV());
    document.getElementById('btnVerDevoluciones')?.addEventListener('click', () => this.openModalDevoluciones());

    let searchTimeout;
    document.getElementById('searchPedidos')?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.filters.search = e.target.value;
        this.currentPage = 0;
        this.loadPedidos();
      }, 350);
    });

    document.getElementById('filterEstadoPedido')?.addEventListener('change', (e) => {
      this.filters.estado = e.target.value;
      this.currentPage = 0;
      this.loadPedidos();
    });

    // Ordenar por columna
    this.container.querySelectorAll('.th-sortable').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.sort;
        if (this.sortField === field) {
          this.sortAsc = !this.sortAsc;
        } else {
          this.sortField = field;
          this.sortAsc = true;
        }
        this.currentPage = 0;
        this.updateSortHeaders();
        this.loadPedidos();
      });
    });
    this.updateSortHeaders();

    // Filtros avanzados
    this._initAdvancedFilters();

    document.getElementById('pedidosTableBody')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) {
        const row = e.target.closest('tr[data-id]');
        if (row) this.openDetalle(row.dataset.id);
        return;
      }
      const id = btn.dataset.id;
      if (btn.classList.contains('btn-ver-ped')) this.openDetalle(id);
      if (btn.classList.contains('btn-eliminar-ped')) this.confirmarEliminar(id);
    });

    document.getElementById('paginacionPed')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn || btn.disabled) return;
      if (btn.classList.contains('pag-prev')) this.currentPage--;
      else if (btn.classList.contains('pag-next')) this.currentPage++;
      else if (btn.classList.contains('pag-num')) this.currentPage = parseInt(btn.dataset.page);
      this.loadPedidos();
    });
  },

  // ========================================
  // EXPORTAR CSV
  // ========================================

  async exportCSV() {
    try {
      Toast.success('Exportando pedidos...');
      const orgId = window.App?.organization?.id;
      let query = supabase
        .from('pedidos')
        .select('*, cliente:cliente_id(nombre_establecimiento), vendedor:vendedor_id(nombre)')
        .eq('organizacion_id', orgId);

      if (this.filters.search) {
        const num = parseInt(this.filters.search);
        if (!isNaN(num)) {
          query = query.eq('numero_pedido', num);
        } else {
          // Búsqueda por nombre de cliente (two-step igual que loadPedidos)
          const { data: clienteMatch } = await supabase
            .from('clientes')
            .select('id')
            .eq('organizacion_id', orgId)
            .ilike('nombre_establecimiento', `%${this.filters.search}%`);
          const ids = (clienteMatch || []).map(c => c.id);
          if (ids.length > 0) {
            query = query.in('cliente_id', ids);
          } else {
            query = query.eq('id', '00000000-0000-0000-0000-000000000000');
          }
        }
      }
      if (this.filters.estado) query = query.eq('estado', this.filters.estado);
      if (this.filters.fechaDesde) query = query.gte('created_at', this.filters.fechaDesde);
      if (this.filters.fechaHasta) query = query.lte('created_at', this.filters.fechaHasta + 'T23:59:59');
      if (this.filters.vendedor) query = query.eq('vendedor_id', this.filters.vendedor);
      if (this.filters.totalMin) query = query.gte('total', parseFloat(this.filters.totalMin));
      if (this.filters.totalMax) query = query.lte('total', parseFloat(this.filters.totalMax));

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      if (!data || data.length === 0) {
        Toast.warning('No hay pedidos para exportar');
        return;
      }

      const moneda = window.App?.organization?.moneda || 'ARS';
      const estadoLabels = {
        pendiente: 'Pendiente', en_preparacion: 'En Preparación', en_ruta: 'En Ruta',
        entregado: 'Entregado', cancelado: 'Cancelado', con_incidencia: 'Con Incidencia',
      };

      CSV.export(data, [
        { key: 'numero_pedido', label: '# Pedido' },
        { label: 'Cliente', format: r => r.cliente?.nombre_establecimiento || '' },
        { label: 'Vendedor', format: r => r.vendedor?.nombre || '' },
        { label: 'Estado', format: r => estadoLabels[r.estado] || r.estado },
        { label: `Total (${moneda})`, format: r => r.total || 0 },
        { key: 'metodo_pago', label: 'Método de Pago' },
        { label: 'Fecha Creación', format: r => r.created_at ? new Date(r.created_at).toLocaleDateString('es-AR') : '' },
        { label: 'Fecha Entrega Programada', format: r => r.fecha_entrega_programada ? new Date(r.fecha_entrega_programada).toLocaleDateString('es-AR') : '' },
        { label: 'Fecha Entrega Real', format: r => r.fecha_entrega_real ? new Date(r.fecha_entrega_real).toLocaleDateString('es-AR') : '' },
        { key: 'observaciones', label: 'Observaciones' },
      ], 'pedidos');

      Toast.success(`${data.length} pedidos exportados`);
    } catch (err) {
      console.error('Error exportando CSV:', err);
      Toast.error('Error al exportar');
    }
  },

  // ========================================
  // MODAL NUEVO PEDIDO
  // ========================================

  openModalNuevoPedido() {
    const moneda = window.App?.organization?.moneda || 'ARS';

    document.getElementById('modalContainer').innerHTML = `
      <div class="modal-overlay" id="pedidoModal">
        <div class="modal" style="max-width:800px;">
          <div class="modal-header">
            <h2>Nuevo Pedido</h2>
            <button class="modal-close" id="btnCloseModal">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="modal-body">
            <form id="formPedido">
              <div class="form-section">
                <div class="form-section-title">Datos del pedido</div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Cliente *</label>
                    <select class="form-input" name="cliente_id" id="selectClientePedido" required>
                      <option value="">Seleccionar cliente...</option>
                      ${this.clientes.map(c => `<option value="${c.id}" data-lista="${c.lista_precios_id || ''}" data-saldo="${c.saldo_pendiente || 0}" data-linea="${c.linea_credito || 0}" data-dias="${c.dias_credito || 0}" data-metodo="${c.metodo_pago_preferido || ''}">${this.esc(c.nombre_establecimiento)}</option>`).join('')}
                    </select>
                    <div id="creditoInfoBox" style="display:none;margin-top:0.4rem;"></div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Vendedor</label>
                    <select class="form-input" name="vendedor_id">
                      <option value="">Sin asignar</option>
                      ${this.vendedores.map(v => `<option value="${v.id}">${this.esc(v.nombre)}</option>`).join('')}
                    </select>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Fecha de entrega programada</label>
                    <input type="date" class="form-input" name="fecha_entrega_programada">
                  </div>
                  <div class="form-group">
                    <label class="form-label">M\u00e9todo de pago</label>
                    <select class="form-input" name="metodo_pago">
                      <option value="">Seleccionar...</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="recibo_domiciliado">Recibo domiciliado</option>
                      <option value="tarjeta">Tarjeta</option>
                    </select>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Observaciones</label>
                  <textarea class="form-input" name="observaciones" rows="2" placeholder="Notas sobre el pedido..."></textarea>
                </div>
              </div>

              <div class="form-section">
                <div class="form-section-title">Productos del pedido</div>
                <div id="frecuentesBox" class="frecuentes-box" style="display:none;">
                  <div class="frecuentes-label">Frecuentes de este cliente:</div>
                  <div class="frecuentes-chips" id="frecuentesChips"></div>
                </div>
                <div class="producto-selector">
                  <div class="producto-selector-header">
                    <input type="text" id="buscarProductoPedido" placeholder="Buscar producto para agregar...">
                    <button type="button" class="btn btn-sm btn-secondary" id="btnMostrarProductos">Agregar</button>
                  </div>
                  <div class="producto-dropdown hidden" id="productoDropdown"></div>
                  <div class="productos-seleccionados" id="lineasPedido">
                    <div style="padding:1rem;text-align:center;color:var(--gray-400);font-size:var(--font-size-sm);">
                      Agreg\u00e1 productos usando el buscador de arriba
                    </div>
                  </div>
                </div>
                <div class="descuento-bar">
                  <span class="descuento-label">Descuento:</span>
                  <div class="descuento-controls">
                    <select id="descuentoTipo" class="form-input descuento-tipo-select">
                      <option value="porcentaje">%</option>
                      <option value="monto">${moneda}</option>
                    </select>
                    <input type="number" id="descuentoValor" class="form-input descuento-input" min="0" step="0.01" placeholder="0" value="0">
                    <span class="descuento-resultado" id="descuentoResultado"></span>
                  </div>
                </div>
                <div class="pedido-total-bar">
                  <span class="total-label">Total:</span>
                  <span class="total-value" id="pedidoTotal">${moneda} 0.00</span>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btnCancelModal">Cancelar</button>
            <button class="btn btn-primary" id="btnSavePedido">Crear Pedido</button>
          </div>
        </div>
      </div>
    `;

    // Eventos
    document.getElementById('btnCloseModal').addEventListener('click', () => this.closeModal());
    document.getElementById('btnCancelModal').addEventListener('click', () => this.closeModal());
    document.getElementById('btnSavePedido').addEventListener('click', () => this.savePedido());
    document.getElementById('pedidoModal').addEventListener('click', (e) => {
      if (e.target.id === 'pedidoModal') this.closeModal();
    });

    // Aviso de crédito y productos frecuentes al seleccionar cliente
    document.getElementById('selectClientePedido')?.addEventListener('change', (e) => {
      const opt = e.target.selectedOptions[0];
      this._clienteCredito = opt ? {
        saldo: parseFloat(opt.dataset.saldo) || 0,
        linea: parseFloat(opt.dataset.linea) || 0,
        dias: parseInt(opt.dataset.dias) || 0,
      } : null;
      this.updateTotal();
      const clienteId = e.target.value;
      const listaId = opt?.dataset.lista || '';
      // Pre-llenar método de pago preferido del cliente
      const metodoPago = opt?.dataset.metodo || '';
      const selectMetodo = document.querySelector('[name="metodo_pago"]');
      if (selectMetodo && metodoPago) selectMetodo.value = metodoPago;
      // Cargar precios de la lista del cliente (y productos frecuentes)
      this.preciosLista = {};
      if (clienteId) {
        this.loadProductosFrecuentes(clienteId);
        if (listaId) this.loadPreciosPorLista(listaId);
      } else {
        const box = document.getElementById('frecuentesBox');
        if (box) box.style.display = 'none';
      }
    });

    // Buscador de productos
    const buscador = document.getElementById('buscarProductoPedido');
    const dropdown = document.getElementById('productoDropdown');

    document.getElementById('btnMostrarProductos').addEventListener('click', () => {
      this.renderDropdownProductos('');
      dropdown.classList.toggle('hidden');
    });

    buscador.addEventListener('input', (e) => {
      this.renderDropdownProductos(e.target.value);
      dropdown.classList.remove('hidden');
    });

    buscador.addEventListener('focus', () => {
      this.renderDropdownProductos(buscador.value);
      dropdown.classList.remove('hidden');
    });

    dropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.producto-dropdown-item');
      if (!item) return;
      this.agregarLinea(item.dataset.id);
      dropdown.classList.add('hidden');
      buscador.value = '';
    });

    // Descuento
    const descuentoTipo = document.getElementById('descuentoTipo');
    const descuentoValor = document.getElementById('descuentoValor');
    const onDescuentoChange = () => this.updateTotal();
    descuentoTipo?.addEventListener('change', onDescuentoChange);
    descuentoValor?.addEventListener('input', onDescuentoChange);

    this._escHandler = (e) => { if (e.key === 'Escape') this.closeModal(); };
    document.addEventListener('keydown', this._escHandler);
  },

  renderDropdownProductos(search) {
    const dropdown = document.getElementById('productoDropdown');
    if (!dropdown) return;
    const moneda = window.App?.organization?.moneda || 'ARS';
    const lineasIds = this.lineas.map(l => l.producto_id);
    let filtered = this.productos.filter(p => !lineasIds.includes(p.id));

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.nombre.toLowerCase().includes(s) || (p.sku || '').toLowerCase().includes(s)
      );
    }

    if (filtered.length === 0) {
      dropdown.innerHTML = '<div style="padding:0.75rem;text-align:center;color:var(--gray-400);font-size:var(--font-size-sm);">No hay productos disponibles</div>';
      return;
    }

    dropdown.innerHTML = filtered.slice(0, 20).map(p => {
      const precio = this.preciosLista[p.id] ?? p.precio_base;
      const tieneEspecial = this.preciosLista[p.id] !== undefined;
      return `
        <div class="producto-dropdown-item" data-id="${p.id}">
          <div class="prod-info">${this.esc(p.nombre)} <small>(${p.sku})</small></div>
          <div class="prod-precio${tieneEspecial ? ' precio-lista' : ''}">
            ${moneda} ${Number(precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            ${tieneEspecial ? '<small style="color:var(--primary);font-weight:600;margin-left:4px;">★ lista</small>' : ''}
          </div>
        </div>`;
    }).join('');
  },

  agregarLinea(productoId) {
    const prod = this.productos.find(p => p.id === productoId);
    if (!prod) return;

    // Usar precio de la lista del cliente si existe, sino precio base
    const precio = this.preciosLista[prod.id] ?? prod.precio_base;

    this.lineas.push({
      producto_id: prod.id,
      nombre: prod.nombre,
      sku: prod.sku,
      cantidad: 1,
      precio_unitario: precio,
      subtotal: precio,
    });

    this.renderLineas();
  },

  renderLineas() {
    const container = document.getElementById('lineasPedido');
    if (!container) return;
    const moneda = window.App?.organization?.moneda || 'ARS';

    if (this.lineas.length === 0) {
      container.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--gray-400);font-size:var(--font-size-sm);">Agreg\u00e1 productos usando el buscador de arriba</div>';
      this.updateTotal();
      return;
    }

    container.innerHTML = this.lineas.map((l, i) => `
      <div class="producto-linea" data-index="${i}">
        <div class="producto-nombre-linea">${this.esc(l.nombre)} <small>${l.sku}</small></div>
        <input type="number" class="linea-cantidad" value="${l.cantidad}" min="1" data-index="${i}">
        <input type="number" class="linea-precio" value="${l.precio_unitario}" min="0" step="0.01" data-index="${i}">
        <div class="subtotal-linea">${moneda} ${Number(l.subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
        <button type="button" class="btn-remove-prod" data-index="${i}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    `).join('');

    // Eventos de las líneas
    container.querySelectorAll('.linea-cantidad').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index);
        this.lineas[idx].cantidad = parseInt(e.target.value) || 1;
        this.lineas[idx].subtotal = this.lineas[idx].cantidad * this.lineas[idx].precio_unitario;
        this.renderLineas();
      });
    });

    container.querySelectorAll('.linea-precio').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index);
        this.lineas[idx].precio_unitario = parseFloat(e.target.value) || 0;
        this.lineas[idx].subtotal = this.lineas[idx].cantidad * this.lineas[idx].precio_unitario;
        this.renderLineas();
      });
    });

    container.querySelectorAll('.btn-remove-prod').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index);
        this.lineas.splice(idx, 1);
        this.renderLineas();
      });
    });

    this.updateTotal();
  },

  updateTotal() {
    const moneda = window.App?.organization?.moneda || 'ARS';
    const subtotalBruto = this.lineas.reduce((sum, l) => sum + l.subtotal, 0);

    // Calcular descuento
    const descTipo = document.getElementById('descuentoTipo')?.value || 'porcentaje';
    const descValor = parseFloat(document.getElementById('descuentoValor')?.value) || 0;
    let descMonto = 0;
    if (descValor > 0) {
      descMonto = descTipo === 'porcentaje'
        ? subtotalBruto * Math.min(descValor, 100) / 100
        : Math.min(descValor, subtotalBruto);
    }
    const total = Math.max(0, subtotalBruto - descMonto);

    // Mostrar resultado del descuento
    const descRes = document.getElementById('descuentoResultado');
    if (descRes) {
      descRes.textContent = descMonto > 0
        ? `− ${moneda} ${descMonto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
        : '';
    }

    const el = document.getElementById('pedidoTotal');
    if (el) el.textContent = `${moneda} ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

    // Aviso de crédito
    const creditoBox = document.getElementById('creditoInfoBox');
    if (!creditoBox) return;
    const cc = this._clienteCredito;
    if (!cc || cc.linea === 0) { creditoBox.style.display = 'none'; return; }

    const totalConDeuda = cc.saldo + total;
    const disponible = cc.linea - cc.saldo;
    const supera = totalConDeuda > cc.linea;

    creditoBox.style.display = '';
    creditoBox.innerHTML = `
      <div style="font-size:var(--font-size-xs);padding:0.5rem 0.75rem;border-radius:var(--radius-sm);border-left:3px solid ${supera ? 'var(--danger)' : 'var(--success)'};background:${supera ? 'var(--danger-light, #fef2f2)' : 'var(--success-light, #f0fdf4)'};">
        <div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;">
          <span>Saldo pendiente: <strong>${moneda} ${cc.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong></span>
          <span>Línea de crédito: <strong>${moneda} ${cc.linea.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong></span>
          <span style="color:${disponible >= 0 ? 'var(--success)' : 'var(--danger)'};">Disponible: <strong>${moneda} ${disponible.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong></span>
        </div>
        ${supera ? `<div style="margin-top:0.3rem;color:var(--danger);font-weight:600;">⚠ Este pedido (${moneda} ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}) supera la línea de crédito disponible</div>` : ''}
        ${cc.dias > 0 ? `<div style="margin-top:0.2rem;color:var(--gray-500);">Días de crédito: ${cc.dias} días</div>` : ''}
      </div>
    `;
  },

  closeModal() {
    const mc = document.getElementById('modalContainer');
    if (mc) mc.innerHTML = '';
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }
  },

  // ========================================
  // GUARDAR PEDIDO
  // ========================================

  async savePedido() {
    const form = document.getElementById('formPedido');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    if (this.lineas.length === 0) {
      Toast.warning('Agreg\u00e1 al menos un producto al pedido');
      return;
    }

    const fd = new FormData(form);
    const subtotalBruto = this.lineas.reduce((sum, l) => sum + l.subtotal, 0);

    // Descuento
    const descTipo = document.getElementById('descuentoTipo')?.value || 'porcentaje';
    const descValor = parseFloat(document.getElementById('descuentoValor')?.value) || 0;
    let descMonto = 0;
    if (descValor > 0) {
      descMonto = descTipo === 'porcentaje'
        ? subtotalBruto * Math.min(descValor, 100) / 100
        : Math.min(descValor, subtotalBruto);
    }
    const total = Math.max(0, subtotalBruto - descMonto);

    const orgId = window.App?.userProfile?.organizacion_id;
    if (!orgId) {
      Toast.error('No se pudo determinar la organización. Recargá la página.');
      return;
    }

    const pedidoData = {
      organizacion_id: orgId,
      cliente_id: fd.get('cliente_id'),
      vendedor_id: fd.get('vendedor_id') || null,
      fecha_entrega_programada: fd.get('fecha_entrega_programada') || null,
      metodo_pago: fd.get('metodo_pago') || null,
      observaciones: fd.get('observaciones')?.trim() || null,
      total: total,
      descuento_tipo: descTipo,
      descuento_valor: descValor,
      descuento_monto: descMonto,
      estado: 'pendiente',
    };

    const btn = document.getElementById('btnSavePedido');
    btn.disabled = true;
    btn.textContent = 'Creando...';

    try {
      // 1. Crear el pedido
      const { data: pedido, error: errPedido } = await supabase
        .from('pedidos')
        .insert(pedidoData)
        .select('id, numero_pedido')
        .single();
      if (errPedido) throw errPedido;

      // 2. Crear las líneas de productos
      const lineasData = this.lineas.map(l => ({
        organizacion_id: orgId,
        pedido_id: pedido.id,
        producto_id: l.producto_id,
        cantidad: l.cantidad,
        precio_unitario: l.precio_unitario,
        subtotal: l.subtotal,
      }));

      const { error: errLineas } = await supabase
        .from('productos_pedido')
        .insert(lineasData);
      if (errLineas) throw errLineas;

      // 3. Actualizar saldo_pendiente del cliente (leer fresh de DB para evitar race condition)
      const clienteId = pedidoData.cliente_id;
      if (clienteId && total > 0) {
        const { data: cd } = await supabase
          .from('clientes').select('saldo_pendiente').eq('id', clienteId).single();
        await supabase
          .from('clientes')
          .update({ saldo_pendiente: Number(cd?.saldo_pendiente || 0) + total })
          .eq('id', clienteId);
      }

      Toast.success('Pedido creado correctamente');
      // Notificar a managers del nuevo pedido
      const clienteNombre = this.clientes.find(c => c.id === pedidoData.cliente_id)?.nombre_establecimiento || '';
      const moneda = window.App?.organization?.moneda || 'ARS';
      Notif.notifyManagers('info', `Nuevo pedido #${pedido.numero_pedido}`,
        `${clienteNombre} · ${moneda} ${total.toLocaleString('es-AR')}`, '#/pedidos');
      this.closeModal();
      this.loadPedidos();
    } catch (err) {
      console.error('Error creando pedido:', err);
      Toast.error(err.message || 'Error al crear pedido');
      btn.disabled = false;
      btn.textContent = 'Crear Pedido';
    }
  },

  // ========================================
  // DETALLE DEL PEDIDO
  // ========================================

  async openDetalle(id) {
    const pedido = this.pedidos.find(p => p.id === id);
    if (!pedido) return;

    const moneda = window.App?.organization?.moneda || 'ARS';

    // Cargar líneas del pedido
    let lineasOriginales = [];
    try {
      const { data } = await supabase
        .from('productos_pedido')
        .select('*, producto:producto_id(id, nombre, sku, precio_base)')
        .eq('pedido_id', id);
      lineasOriginales = data || [];
    } catch (err) {
      console.error('Error cargando detalle:', err);
    }

    // Clonar líneas para edición
    this.detalleLineas = lineasOriginales.map(l => ({
      id: l.id,
      producto_id: l.producto_id,
      nombre: l.producto?.nombre || '-',
      sku: l.producto?.sku || '',
      cantidad: l.cantidad,
      precio_unitario: l.precio_unitario,
      subtotal: l.subtotal,
    }));

    const fechaEntrega = pedido.fecha_entrega_programada
      ? new Date(pedido.fecha_entrega_programada).toISOString().split('T')[0]
      : '';

    const todosEstados = ['pendiente', 'en_preparacion', 'en_ruta', 'entregado', 'cancelado', 'con_incidencia'];
    const esRepartidor = Permissions.getCurrentRole() === 'repartidor';
    const estados = esRepartidor ? ['en_ruta', 'entregado'] : todosEstados;

    document.getElementById('modalContainer').innerHTML = `
      <div class="modal-overlay" id="detalleModal">
        <div class="modal" style="max-width:800px;">
          <div class="modal-header">
            <h2>Pedido #${pedido.numero_pedido}</h2>
            <button class="modal-close" id="btnCloseDetalle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="modal-body">
            <!-- Estado -->
            <div class="form-section">
              <div class="form-section-title">Cambiar estado</div>
              <div class="estado-selector" id="estadoSelector">
                ${estados.map(e => `
                  <button type="button" class="${e === pedido.estado ? 'active' : ''}" data-estado="${e}">${this.estadoLabel(e)}</button>
                `).join('')}
              </div>
            </div>

            <!-- Info no editable -->
            <div class="pedido-detalle-meta">
              <div class="pedido-meta-card">
                <div class="label">Cliente</div>
                <div class="value">${this.esc(pedido.cliente?.nombre_establecimiento || '-')}</div>
              </div>
              <div class="pedido-meta-card">
                <div class="label">Fecha creaci\u00f3n</div>
                <div class="value">${new Date(pedido.created_at).toLocaleString('es-AR')}</div>
              </div>
              <div class="pedido-meta-card" id="metaEstadoActual">
                <div class="label">Estado actual</div>
                <div class="value"><span class="badge-estado-pedido ${pedido.estado}"><span class="dot"></span>${this.estadoLabel(pedido.estado)}</span></div>
              </div>
            </div>

            <!-- Campos editables -->
            <div class="form-section">
              <div class="form-section-title">Datos del pedido</div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Vendedor</label>
                  <select class="form-input" id="editVendedor">
                    <option value="">Sin asignar</option>
                    ${this.vendedores.map(v => `<option value="${v.id}" ${pedido.vendedor_id === v.id ? 'selected' : ''}>${this.esc(v.nombre)}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Entrega programada</label>
                  <input type="date" class="form-input" id="editFechaEntrega" value="${fechaEntrega}">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">M\u00e9todo de pago</label>
                  <select class="form-input" id="editMetodoPago">
                    <option value="">Seleccionar...</option>
                    <option value="transferencia" ${pedido.metodo_pago === 'transferencia' ? 'selected' : ''}>Transferencia</option>
                    <option value="efectivo" ${pedido.metodo_pago === 'efectivo' ? 'selected' : ''}>Efectivo</option>
                    <option value="recibo_domiciliado" ${pedido.metodo_pago === 'recibo_domiciliado' ? 'selected' : ''}>Recibo domiciliado</option>
                    <option value="tarjeta" ${pedido.metodo_pago === 'tarjeta' ? 'selected' : ''}>Tarjeta</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Observaciones</label>
                  <input type="text" class="form-input" id="editObservaciones" value="${this.esc(pedido.observaciones || '')}" placeholder="Notas...">
                </div>
              </div>
            </div>

            <!-- Productos editables -->
            <div class="form-section">
              <div class="form-section-title">Productos</div>
              <div class="producto-selector">
                <div class="producto-selector-header">
                  <input type="text" id="buscarProductoDetalle" placeholder="Buscar producto para agregar...">
                  <button type="button" class="btn btn-sm btn-secondary" id="btnMostrarProdDetalle">Agregar</button>
                </div>
                <div class="producto-dropdown hidden" id="productoDropdownDetalle"></div>
                <div class="productos-seleccionados" id="lineasDetalle"></div>
              </div>
              <div class="descuento-bar">
                <span class="descuento-label">Descuento:</span>
                <div class="descuento-controls">
                  <select id="editDescuentoTipo" class="form-input descuento-tipo-select">
                    <option value="porcentaje" ${(pedido.descuento_tipo || 'porcentaje') === 'porcentaje' ? 'selected' : ''}>%</option>
                    <option value="monto" ${pedido.descuento_tipo === 'monto' ? 'selected' : ''}>${moneda}</option>
                  </select>
                  <input type="number" id="editDescuentoValor" class="form-input descuento-input" min="0" step="0.01" placeholder="0" value="${pedido.descuento_valor || 0}">
                  <span class="descuento-resultado" id="editDescuentoResultado"></span>
                </div>
              </div>
              <div class="pedido-total-bar">
                <span class="total-label">Total:</span>
                <span class="total-value" id="detalleTotal">${moneda} 0.00</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btnCerrarDetalle">Cerrar</button>
            ${Permissions.can('crear', 'pedidos') ? `
            <button class="btn btn-secondary" id="btnDuplicarPedido" title="Crear nuevo pedido con los mismos productos">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              Duplicar
            </button>` : ''}
            ${pedido.estado === 'entregado' && Permissions.can('crear', 'pedidos') ? `
            <button class="btn btn-secondary" id="btnRegistrarDevolucion" style="color:var(--warning);" title="Registrar devolución parcial o total">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 .49-3.51"></path></svg>
              Devolver
            </button>` : ''}
            <button class="btn btn-primary" id="btnGuardarCambios">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              Guardar Cambios
            </button>
            <button class="btn btn-primary" id="btnDescargarPDF" data-id="${pedido.id}">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              PDF
            </button>
            <button class="btn btn-secondary" id="btnImprimirRemito" title="Imprimir remito de entrega (sin precios)">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              Remito
            </button>
            <button class="btn btn-whatsapp" id="btnCompartirWA" title="Compartir resumen por WhatsApp">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
              WhatsApp
            </button>
          </div>
        </div>
      </div>
    `;

    // Renderizar líneas editables
    this.renderDetalleLineas();

    // Eventos cerrar
    document.getElementById('btnCloseDetalle').addEventListener('click', () => this.closeModal());
    document.getElementById('btnCerrarDetalle').addEventListener('click', () => this.closeModal());
    document.getElementById('detalleModal').addEventListener('click', (e) => {
      if (e.target.id === 'detalleModal') this.closeModal();
    });

    // Cambiar estado
    document.getElementById('estadoSelector').addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const nuevoEstado = btn.dataset.estado;
      if (nuevoEstado === pedido.estado) return;
      if (esRepartidor && !['en_ruta', 'entregado'].includes(nuevoEstado)) return;

      try {
        const updateData = { estado: nuevoEstado };
        if (nuevoEstado === 'entregado') {
          updateData.fecha_entrega_real = new Date().toISOString();
        }

        const { error } = await supabase.from('pedidos').update(updateData).eq('id', pedido.id);
        if (error) throw error;

        // Al entregar: actualizar fecha_ultima_compra del cliente, descontar stock y notificar
        if (nuevoEstado === 'entregado' && pedido.cliente_id) {
          await supabase
            .from('clientes')
            .update({ fecha_ultima_compra: new Date().toISOString() })
            .eq('id', pedido.cliente_id);

          // Descontar stock_actual de cada producto del pedido
          const { data: lineasPedido } = await supabase
            .from('productos_pedido')
            .select('producto_id, cantidad')
            .eq('pedido_id', pedido.id);
          if (lineasPedido?.length) {
            for (const linea of lineasPedido) {
              const { data: prod } = await supabase
                .from('productos')
                .select('stock_actual')
                .eq('id', linea.producto_id)
                .single();
              if (prod) {
                await supabase
                  .from('productos')
                  .update({ stock_actual: Math.max(0, Number(prod.stock_actual) - linea.cantidad) })
                  .eq('id', linea.producto_id);
              }
            }
          }

          const monedaEnt = window.App?.organization?.moneda || 'ARS';
          Notif.notifyManagers('success', `Pedido #${pedido.numero_pedido} entregado`,
            `${pedido.cliente?.nombre_establecimiento || ''} · ${monedaEnt} ${Number(pedido.total).toLocaleString('es-AR')}`, '#/pedidos');
        }

        // Al cancelar: descontar saldo_pendiente del cliente (nunca por debajo de 0)
        if (nuevoEstado === 'cancelado' && pedido.cliente_id && Number(pedido.total) > 0) {
          const { data: cd } = await supabase
            .from('clientes').select('saldo_pendiente').eq('id', pedido.cliente_id).single();
          const nuevoSaldo = Math.max(0, Number(cd?.saldo_pendiente || 0) - Number(pedido.total));
          await supabase.from('clientes').update({ saldo_pendiente: nuevoSaldo }).eq('id', pedido.cliente_id);
          // Notificar cancelación a managers
          const moneda = window.App?.organization?.moneda || 'ARS';
          Notif.notifyManagers('warning', `Pedido #${pedido.numero_pedido} cancelado`,
            `${pedido.cliente?.nombre_establecimiento || ''} · ${moneda} ${Number(pedido.total).toLocaleString('es-AR')}`, '#/pedidos');
        }

        Toast.success(`Estado cambiado a: ${this.estadoLabel(nuevoEstado)}`);
        pedido.estado = nuevoEstado;

        document.querySelectorAll('#estadoSelector button').forEach(b => {
          b.classList.toggle('active', b.dataset.estado === nuevoEstado);
        });

        const metaEstado = document.getElementById('metaEstadoActual');
        if (metaEstado) {
          metaEstado.querySelector('.value').innerHTML = `<span class="badge-estado-pedido ${nuevoEstado}"><span class="dot"></span>${this.estadoLabel(nuevoEstado)}</span>`;
        }

        this.loadPedidos();
      } catch (err) {
        Toast.error('Error al cambiar estado');
      }
    });

    // Buscador de productos en detalle
    const buscador = document.getElementById('buscarProductoDetalle');
    const dropdown = document.getElementById('productoDropdownDetalle');

    document.getElementById('btnMostrarProdDetalle').addEventListener('click', () => {
      this.renderDropdownDetalle('');
      dropdown.classList.toggle('hidden');
    });

    buscador.addEventListener('input', (e) => {
      this.renderDropdownDetalle(e.target.value);
      dropdown.classList.remove('hidden');
    });

    buscador.addEventListener('focus', () => {
      this.renderDropdownDetalle(buscador.value);
      dropdown.classList.remove('hidden');
    });

    dropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.producto-dropdown-item');
      if (!item) return;
      this.agregarLineaDetalle(item.dataset.id);
      dropdown.classList.add('hidden');
      buscador.value = '';
    });

    // Descuento en detalle
    document.getElementById('editDescuentoTipo')?.addEventListener('change', () => this.updateDetalleTotal());
    document.getElementById('editDescuentoValor')?.addEventListener('input', () => this.updateDetalleTotal());

    // Guardar cambios
    document.getElementById('btnGuardarCambios').addEventListener('click', () => {
      this.guardarCambiosPedido(pedido);
    });

    // Duplicar pedido
    document.getElementById('btnDuplicarPedido')?.addEventListener('click', () => {
      this.duplicarPedido(pedido, this.detalleLineas);
    });

    // Devolver pedido
    document.getElementById('btnRegistrarDevolucion')?.addEventListener('click', () => {
      this.openModalDevolucion(pedido, this.detalleLineas);
    });

    // Descargar PDF (usa las líneas actuales del detalle)
    document.getElementById('btnDescargarPDF').addEventListener('click', async () => {
      const pdfBtn = document.getElementById('btnDescargarPDF');
      const originalText = pdfBtn.innerHTML;
      pdfBtn.disabled = true;
      pdfBtn.innerHTML = `<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div>`;
      // Convertir detalleLineas al formato que espera generarPDF
      const lineasPDF = this.detalleLineas.map(l => ({
        producto: { nombre: l.nombre, sku: l.sku },
        cantidad: l.cantidad,
        precio_unitario: l.precio_unitario,
        subtotal: l.subtotal,
      }));
      await this.generarPDF(pedido, lineasPDF);
      pdfBtn.disabled = false;
      pdfBtn.innerHTML = originalText;
    });

    // Remito de entrega
    document.getElementById('btnImprimirRemito')?.addEventListener('click', () => {
      this.imprimirRemito(pedido, this.detalleLineas);
    });

    // Compartir por WhatsApp
    document.getElementById('btnCompartirWA')?.addEventListener('click', () => {
      this.compartirWhatsApp(pedido, this.detalleLineas);
    });

    this._escHandler = (e) => { if (e.key === 'Escape') this.closeModal(); };
    document.addEventListener('keydown', this._escHandler);
  },

  async loadPreciosPorLista(listaId) {
    if (!listaId) return;
    try {
      const { data } = await supabase
        .from('precios_por_lista')
        .select('producto_id, precio')
        .eq('lista_precios_id', listaId);
      this.preciosLista = {};
      (data || []).forEach(r => { this.preciosLista[r.producto_id] = Number(r.precio); });
      // Refrescar dropdown si está abierto
      const buscador = document.getElementById('buscarProductoPedido');
      if (buscador) this.renderDropdownProductos(buscador.value);
    } catch (err) {
      console.error('Error cargando precios por lista:', err);
    }
  },

  async loadProductosFrecuentes(clienteId) {
    const box = document.getElementById('frecuentesBox');
    const chips = document.getElementById('frecuentesChips');
    if (!box || !chips) return;

    chips.innerHTML = '<div class="frecuentes-loading">Cargando...</div>';
    box.style.display = 'block';

    try {
      // Últimos 8 pedidos del cliente
      const orgId = window.App?.organization?.id;
      const { data: pedidosRecientes } = await supabase
        .from('pedidos')
        .select('id')
        .eq('organizacion_id', orgId)
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false })
        .limit(8);

      const pedidoIds = (pedidosRecientes || []).map(p => p.id);
      if (!pedidoIds.length) {
        box.style.display = 'none';
        return;
      }

      // Productos de esos pedidos
      const { data: lineas } = await supabase
        .from('productos_pedido')
        .select('producto_id, precio_unitario, producto:producto_id(id, nombre, sku)')
        .in('pedido_id', pedidoIds);

      if (!lineas?.length) {
        box.style.display = 'none';
        return;
      }

      // Deduplicar por producto_id, quedar con el precio más reciente
      const seen = new Map();
      for (const l of lineas) {
        if (!seen.has(l.producto_id) && l.producto) {
          seen.set(l.producto_id, { ...l.producto, precio_unitario: l.precio_unitario });
        }
      }
      const frecuentes = [...seen.values()].slice(0, 5);

      chips.innerHTML = frecuentes.map(p => `
        <button type="button" class="frecuente-chip" data-id="${p.id}" data-precio="${p.precio_unitario}" title="${this.esc(p.sku || '')}">
          ${this.esc(p.nombre)}
        </button>
      `).join('');

      chips.querySelectorAll('.frecuente-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          this.agregarLinea(btn.dataset.id);
        });
      });
    } catch (err) {
      box.style.display = 'none';
    }
  },

  compartirWhatsApp(pedido, lineas) {
    const moneda = window.App?.organization?.moneda || 'ARS';
    const org = window.App?.organization?.nombre || 'Distribuidora';
    const cliente = pedido.cliente?.nombre_establecimiento || '-';
    const fecha = pedido.created_at ? new Date(pedido.created_at).toLocaleDateString('es-AR') : '-';
    const entrega = pedido.fecha_entrega_programada
      ? new Date(pedido.fecha_entrega_programada).toLocaleDateString('es-AR')
      : 'Sin fecha';

    const lineasTxt = lineas.map(l =>
      `  • ${l.nombre} x${l.cantidad} = ${moneda} ${Number(l.subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
    ).join('\n');

    const total = lineas.reduce((s, l) => s + Number(l.subtotal), 0);

    const msg = [
      `*${org}* — Pedido #${pedido.numero_pedido}`,
      `Cliente: ${cliente}`,
      `Fecha: ${fecha}`,
      `Entrega estimada: ${entrega}`,
      ``,
      `*Detalle:*`,
      lineasTxt,
      ``,
      `*Total: ${moneda} ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}*`,
      `Estado: ${this.estadoLabel(pedido.estado)}`,
    ].join('\n');

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  },

  // ========================================
  // EDICIÓN DE LÍNEAS EN DETALLE
  // ========================================

  renderDetalleLineas() {
    const old = document.getElementById('lineasDetalle');
    if (!old) return;

    // Reemplazar el nodo para limpiar listeners previos sin perder el slot en el DOM
    const container = old.cloneNode(false);
    old.parentNode.replaceChild(container, old);

    const moneda = window.App?.organization?.moneda || 'ARS';

    if (this.detalleLineas.length === 0) {
      container.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--gray-400);font-size:var(--font-size-sm);">Sin productos. Agregá productos con el buscador.</div>';
      this.updateDetalleTotal();
      return;
    }

    container.innerHTML = this.detalleLineas.map((l, i) => `
      <div class="producto-linea" data-index="${i}">
        <div class="producto-nombre-linea">${this.esc(l.nombre)} <small>${l.sku || ''}</small></div>
        <input type="number" class="linea-cantidad-det" value="${l.cantidad}" min="1" data-index="${i}">
        <input type="number" class="linea-precio-det" value="${l.precio_unitario}" min="0" step="0.01" data-index="${i}">
        <div class="subtotal-linea" data-index="${i}">${moneda} ${Number(l.subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
        <button type="button" class="btn-remove-prod-det" data-index="${i}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    `).join('');

    // Delegación: un solo listener de input — actualiza solo el subtotal de la fila
    // sin reconstruir el DOM, para que el input no pierda el foco
    container.addEventListener('input', (e) => {
      const input = e.target;
      if (!input.dataset.index) return;
      const idx = parseInt(input.dataset.index);
      if (input.classList.contains('linea-cantidad-det')) {
        this.detalleLineas[idx].cantidad = parseInt(input.value) || 1;
      } else if (input.classList.contains('linea-precio-det')) {
        this.detalleLineas[idx].precio_unitario = parseFloat(input.value) || 0;
      } else return;
      this.detalleLineas[idx].subtotal = this.detalleLineas[idx].cantidad * this.detalleLineas[idx].precio_unitario;
      const subtotalEl = container.querySelector(`.subtotal-linea[data-index="${idx}"]`);
      if (subtotalEl) {
        subtotalEl.textContent = `${moneda} ${Number(this.detalleLineas[idx].subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
      }
      this.updateDetalleTotal();
    });

    // Click en eliminar línea: sí reconstruye (acción discreta, no hay input activo)
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-remove-prod-det');
      if (!btn) return;
      const idx = parseInt(btn.dataset.index);
      this.detalleLineas.splice(idx, 1);
      this.renderDetalleLineas();
    });

    this.updateDetalleTotal();
  },

  updateDetalleTotal() {
    const moneda = window.App?.organization?.moneda || 'ARS';
    const subtotalBruto = this.detalleLineas.reduce((sum, l) => sum + l.subtotal, 0);

    const descTipo = document.getElementById('editDescuentoTipo')?.value || 'porcentaje';
    const descValor = parseFloat(document.getElementById('editDescuentoValor')?.value) || 0;
    let descMonto = 0;
    if (descValor > 0) {
      descMonto = descTipo === 'porcentaje'
        ? subtotalBruto * Math.min(descValor, 100) / 100
        : Math.min(descValor, subtotalBruto);
    }
    const total = Math.max(0, subtotalBruto - descMonto);

    const descRes = document.getElementById('editDescuentoResultado');
    if (descRes) {
      descRes.textContent = descMonto > 0
        ? `− ${moneda} ${descMonto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
        : '';
    }

    const el = document.getElementById('detalleTotal');
    if (el) el.textContent = `${moneda} ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  },

  renderDropdownDetalle(search) {
    const dropdown = document.getElementById('productoDropdownDetalle');
    if (!dropdown) return;
    const moneda = window.App?.organization?.moneda || 'ARS';
    const lineasIds = this.detalleLineas.map(l => l.producto_id);
    let filtered = this.productos.filter(p => !lineasIds.includes(p.id));

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.nombre.toLowerCase().includes(s) || (p.sku || '').toLowerCase().includes(s)
      );
    }

    if (filtered.length === 0) {
      dropdown.innerHTML = '<div style="padding:0.75rem;text-align:center;color:var(--gray-400);font-size:var(--font-size-sm);">No hay productos disponibles</div>';
      return;
    }

    dropdown.innerHTML = filtered.slice(0, 20).map(p => `
      <div class="producto-dropdown-item" data-id="${p.id}">
        <div class="prod-info">${this.esc(p.nombre)} <small>(${p.sku})</small></div>
        <div class="prod-precio">${moneda} ${Number(p.precio_base).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
      </div>
    `).join('');
  },

  agregarLineaDetalle(productoId) {
    const prod = this.productos.find(p => p.id === productoId);
    if (!prod) return;

    this.detalleLineas.push({
      id: null, // nuevo, no tiene id en productos_pedido todavía
      producto_id: prod.id,
      nombre: prod.nombre,
      sku: prod.sku,
      cantidad: 1,
      precio_unitario: prod.precio_base,
      subtotal: prod.precio_base,
    });

    this.renderDetalleLineas();
  },

  async guardarCambiosPedido(pedido) {
    if (this.detalleLineas.length === 0) {
      Toast.warning('El pedido debe tener al menos un producto');
      return;
    }

    const btn = document.getElementById('btnGuardarCambios');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    const orgId = window.App?.userProfile?.organizacion_id;
    const subtotalBruto = this.detalleLineas.reduce((sum, l) => sum + l.subtotal, 0);

    const descTipo = document.getElementById('editDescuentoTipo')?.value || 'porcentaje';
    const descValor = parseFloat(document.getElementById('editDescuentoValor')?.value) || 0;
    let descMonto = 0;
    if (descValor > 0) {
      descMonto = descTipo === 'porcentaje'
        ? subtotalBruto * Math.min(descValor, 100) / 100
        : Math.min(descValor, subtotalBruto);
    }
    const nuevoTotal = Math.max(0, subtotalBruto - descMonto);

    try {
      // 1. Actualizar datos del pedido
      const updateData = {
        vendedor_id: document.getElementById('editVendedor').value || null,
        fecha_entrega_programada: document.getElementById('editFechaEntrega').value || null,
        metodo_pago: document.getElementById('editMetodoPago').value || null,
        observaciones: document.getElementById('editObservaciones').value.trim() || null,
        total: nuevoTotal,
        descuento_tipo: descTipo,
        descuento_valor: descValor,
        descuento_monto: descMonto,
      };

      const { error: errPedido } = await supabase
        .from('pedidos')
        .update(updateData)
        .eq('id', pedido.id);
      if (errPedido) throw errPedido;

      // 2. Reemplazar líneas: eliminar las viejas e insertar las nuevas
      // Si era entregado, leer cantidades originales ANTES de borrar (para ajustar stock luego)
      let lineasOriginalesDB = [];
      if (pedido.estado === 'entregado') {
        const { data: linOrig } = await supabase
          .from('productos_pedido')
          .select('producto_id, cantidad')
          .eq('pedido_id', pedido.id);
        lineasOriginalesDB = linOrig || [];
      }

      const { error: errDel } = await supabase
        .from('productos_pedido')
        .delete()
        .eq('pedido_id', pedido.id);
      if (errDel) throw errDel;

      const nuevasLineas = this.detalleLineas.map(l => ({
        organizacion_id: orgId,
        pedido_id: pedido.id,
        producto_id: l.producto_id,
        cantidad: l.cantidad,
        precio_unitario: l.precio_unitario,
        subtotal: l.subtotal,
      }));

      const { error: errInsert } = await supabase
        .from('productos_pedido')
        .insert(nuevasLineas);
      if (errInsert) throw errInsert;

      // Ajustar stock_actual por diferencia si el pedido era entregado
      if (pedido.estado === 'entregado' && lineasOriginalesDB.length) {
        const mapOrig = {};
        lineasOriginalesDB.forEach(l => { mapOrig[l.producto_id] = (mapOrig[l.producto_id] || 0) + l.cantidad; });
        const mapNueva = {};
        this.detalleLineas.forEach(l => { mapNueva[l.producto_id] = (mapNueva[l.producto_id] || 0) + l.cantidad; });
        const prodIds = new Set([...Object.keys(mapOrig), ...Object.keys(mapNueva)]);
        for (const prodId of prodIds) {
          const cantOrig = mapOrig[prodId] || 0;
          const cantNueva = mapNueva[prodId] || 0;
          const stockDiff = cantNueva - cantOrig; // + = más unidades → sacar más stock; - = menos → devolver
          if (stockDiff !== 0) {
            const { data: prod } = await supabase.from('productos').select('stock_actual').eq('id', prodId).single();
            if (prod) {
              await supabase.from('productos')
                .update({ stock_actual: Math.max(0, Number(prod.stock_actual) - stockDiff) })
                .eq('id', prodId);
            }
          }
        }
      }

      // 3. Ajustar saldo_pendiente del cliente por la diferencia de totales
      // Solo si el pedido no estaba cancelado (los cancelados ya tienen saldo descontado)
      const totalAnterior = Number(pedido.total || 0);
      const diff = nuevoTotal - totalAnterior;
      if (pedido.cliente_id && diff !== 0 && pedido.estado !== 'cancelado') {
        const { data: cd } = await supabase
          .from('clientes').select('saldo_pendiente').eq('id', pedido.cliente_id).single();
        const nuevoSaldo = Math.max(0, Number(cd?.saldo_pendiente || 0) + diff);
        await supabase.from('clientes').update({ saldo_pendiente: nuevoSaldo }).eq('id', pedido.cliente_id);
      }

      Toast.success('Pedido actualizado');
      this.closeModal();
      this.loadPedidos();
    } catch (err) {
      console.error('Error guardando cambios:', err);
      Toast.error(err.message || 'Error al guardar cambios');
      btn.disabled = false;
      btn.textContent = 'Guardar Cambios';
    }
  },

  // ========================================
  // GENERAR PDF
  // ========================================

  async _loadJsPDF() {
    if (window.jspdf) return;

    // Si ya hay un script cargando, esperar
    const existing = document.querySelector('script[src*="jspdf"]');
    if (existing) {
      return new Promise((resolve, reject) => {
        const check = setInterval(() => {
          if (window.jspdf) { clearInterval(check); resolve(); }
        }, 100);
        setTimeout(() => {
          clearInterval(check);
          if (window.jspdf) resolve();
          else reject(new Error('Timeout esperando jsPDF'));
        }, 8000);
      });
    }

    // Intentar cargar desde CDN
    const cdnUrls = [
      'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js',
    ];

    for (const url of cdnUrls) {
      try {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = url;
          script.onload = () => {
            if (window.jspdf) resolve();
            else reject(new Error('jsPDF no se inicializó'));
          };
          script.onerror = () => {
            script.remove();
            reject(new Error('Error de red'));
          };
          document.head.appendChild(script);
        });
        return; // éxito
      } catch {
        console.warn(`jsPDF no cargó desde ${url}, intentando siguiente...`);
      }
    }

    throw new Error('No se pudo cargar jsPDF desde ningún CDN');
  },

  async generarPDF(pedido, lineas) {
    try {
      await this._loadJsPDF();
    } catch (err) {
      console.error('Error cargando jsPDF:', err);
      Toast.error('No se pudo cargar la librería de PDF. Verificá tu conexión a internet.');
      return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      Toast.error('La librería de PDF no se cargó correctamente. Recargá la página e intentá de nuevo.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const moneda = window.App?.organization?.moneda || 'ARS';
    const orgName = window.App?.organization?.nombre || 'Distribuidora';

    // Encabezado
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(orgName, 14, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Pedido #${pedido.numero_pedido}`, 14, 30);
    doc.text(`Fecha: ${new Date(pedido.created_at).toLocaleDateString('es-AR')}`, 14, 37);
    doc.text(`Cliente: ${pedido.cliente?.nombre_establecimiento || '-'}`, 14, 44);
    doc.text(`Vendedor: ${pedido.vendedor?.nombre || '-'}`, 14, 51);

    if (pedido.fecha_entrega_programada) {
      doc.text(`Entrega: ${new Date(pedido.fecha_entrega_programada).toLocaleDateString('es-AR')}`, 14, 58);
    }

    // Línea separadora
    let y = 65;
    doc.setDrawColor(200);
    doc.line(14, y, 196, y);
    y += 8;

    // Tabla de productos
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Producto', 14, y);
    doc.text('Cant.', 110, y);
    doc.text('P. Unit.', 135, y);
    doc.text('Subtotal', 170, y);
    y += 3;
    doc.line(14, y, 196, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    lineas.forEach(l => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(l.producto?.nombre || '-', 14, y, { maxWidth: 90 });
      doc.text(String(l.cantidad), 110, y);
      doc.text(`${moneda} ${Number(l.precio_unitario).toFixed(2)}`, 135, y);
      doc.text(`${moneda} ${Number(l.subtotal).toFixed(2)}`, 170, y);
      y += 7;
    });

    // Total
    y += 3;
    doc.line(14, y, 196, y);
    y += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: ${moneda} ${Number(pedido.total).toFixed(2)}`, 170, y, { align: 'right' });

    // Observaciones
    if (pedido.observaciones) {
      y += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Observaciones: ${pedido.observaciones}`, 14, y, { maxWidth: 180 });
    }

    doc.save(`Pedido_${pedido.numero_pedido}.pdf`);
    Toast.success('PDF descargado');
  },

  // ========================================
  // ELIMINAR
  // ========================================

  async confirmarEliminar(id) {
    const pedido = this.pedidos.find(p => p.id === id);
    if (!pedido) return;

    document.getElementById('modalContainer').innerHTML = `
      <div class="modal-overlay" id="deleteModal">
        <div class="modal" style="max-width:450px;">
          <div class="modal-header">
            <h2>Eliminar pedido</h2>
            <button class="modal-close" id="btnCloseDelete">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="modal-body">
            <p>\u00bfEst\u00e1s seguro de que quer\u00e9s eliminar el <strong>Pedido #${pedido.numero_pedido}</strong>?</p>
            <p style="color:var(--gray-500);font-size:var(--font-size-sm);margin-top:0.5rem;">Se eliminar\u00e1n todos los productos asociados al pedido.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btnCancelDelete">Cancelar</button>
            <button class="btn btn-danger" id="btnConfirmDelete">Eliminar</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnCloseDelete').addEventListener('click', () => this.closeModal());
    document.getElementById('btnCancelDelete').addEventListener('click', () => this.closeModal());
    document.getElementById('btnConfirmDelete').addEventListener('click', async () => {
      try {
        // Primero eliminar líneas, luego el pedido
        await supabase.from('productos_pedido').delete().eq('pedido_id', id);
        const { error } = await supabase.from('pedidos').delete().eq('id', id);
        if (error) throw error;

        // Si el pedido no estaba cancelado, descontar su total del saldo_pendiente del cliente
        if (pedido.cliente_id && Number(pedido.total) > 0 && pedido.estado !== 'cancelado') {
          const { data: cd } = await supabase
            .from('clientes').select('saldo_pendiente').eq('id', pedido.cliente_id).single();
          const nuevoSaldo = Math.max(0, Number(cd?.saldo_pendiente || 0) - Number(pedido.total));
          await supabase.from('clientes').update({ saldo_pendiente: nuevoSaldo }).eq('id', pedido.cliente_id);
        }

        Toast.success('Pedido eliminado');
        this.closeModal();
        this.loadPedidos();
      } catch (err) {
        console.error('Error:', err);
        Toast.error(err.message || 'Error al eliminar');
      }
    });
    document.getElementById('deleteModal').addEventListener('click', (e) => {
      if (e.target.id === 'deleteModal') this.closeModal();
    });
  },

  // ========================================
  // DUPLICAR PEDIDO
  // ========================================

  async duplicarPedido(pedidoOriginal, lineas) {
    if (!lineas || lineas.length === 0) {
      Toast.error('El pedido no tiene productos para duplicar');
      return;
    }

    const btn = document.getElementById('btnDuplicarPedido');
    if (btn) { btn.disabled = true; btn.textContent = 'Duplicando...'; }

    try {
      const orgId = window.App?.organization?.id;
      const userId = (await supabase.auth.getUser())?.data?.user?.id;

      // Obtener próximo número de pedido
      const { data: ultimos } = await supabase
        .from('pedidos')
        .select('numero_pedido')
        .eq('organizacion_id', orgId)
        .order('numero_pedido', { ascending: false })
        .limit(1);
      const numeroPedido = ((ultimos?.[0]?.numero_pedido || 0) + 1);

      // Crear nuevo pedido (sin fecha_entrega_programada, estado pendiente)
      const { data: nuevoPedido, error: errPedido } = await supabase
        .from('pedidos')
        .insert({
          organizacion_id: orgId,
          numero_pedido: numeroPedido,
          cliente_id: pedidoOriginal.cliente_id || pedidoOriginal.cliente?.id,
          vendedor_id: userId,
          estado: 'pendiente',
          metodo_pago: pedidoOriginal.metodo_pago || null,
          observaciones: `Duplicado de #${pedidoOriginal.numero_pedido}`,
          total: lineas.reduce((s, l) => s + Number(l.subtotal), 0),
        })
        .select('id')
        .single();

      if (errPedido) throw errPedido;

      // Insertar líneas
      const lineasNuevas = lineas.map(l => ({
        organizacion_id: orgId,
        pedido_id: nuevoPedido.id,
        producto_id: l.producto_id,
        cantidad: l.cantidad,
        precio_unitario: l.precio_unitario,
        subtotal: l.subtotal,
      }));

      const { error: errLineas } = await supabase.from('productos_pedido').insert(lineasNuevas);
      if (errLineas) throw errLineas;

      // Actualizar saldo_pendiente del cliente (leer fresh para evitar race condition)
      const clienteIdDup = pedidoOriginal.cliente_id || pedidoOriginal.cliente?.id;
      const totalDup = lineas.reduce((s, l) => s + Number(l.subtotal), 0);
      if (clienteIdDup && totalDup > 0) {
        const { data: cd } = await supabase
          .from('clientes').select('saldo_pendiente').eq('id', clienteIdDup).single();
        await supabase.from('clientes')
          .update({ saldo_pendiente: Number(cd?.saldo_pendiente || 0) + totalDup })
          .eq('id', clienteIdDup);
      }

      Toast.success(`Pedido #${numeroPedido} creado (duplicado de #${pedidoOriginal.numero_pedido})`);
      this.closeModal();
      this.loadPedidos();
    } catch (err) {
      console.error('Error al duplicar pedido:', err);
      Toast.error('Error al duplicar el pedido');
      if (btn) { btn.disabled = false; btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Duplicar`; }
    }
  },

  // ========================================
  // DEVOLUCIONES / NCR
  // ========================================

  openModalDevolucion(pedido, lineas) {
    if (!lineas || lineas.length === 0) {
      Toast.error('El pedido no tiene productos para devolver');
      return;
    }

    const existing = document.getElementById('devolucionModal');
    if (existing) existing.remove();

    const moneda = window.App?.organization?.moneda || 'ARS';

    const container = document.createElement('div');
    container.id = 'devolucionModal';
    container.className = 'modal-overlay';
    container.innerHTML = `
      <div class="modal" style="max-width:580px;">
        <div class="modal-header">
          <h2>Registrar Devolución — Pedido #${pedido.numero_pedido}</h2>
          <button class="modal-close" id="btnCloseDev">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="modal-body">
          <p style="font-size:var(--font-size-sm);color:var(--gray-600);margin-bottom:1rem;">
            Seleccioná los productos a devolver e indicá la cantidad. Se generará una nota de crédito que reduce el saldo pendiente del cliente.
          </p>
          <div id="devLineas">
            ${lineas.map((l, i) => `
              <div class="form-row" style="align-items:center;gap:0.5rem;margin-bottom:0.5rem;" data-index="${i}">
                <div style="flex:1;font-size:var(--font-size-sm);">
                  <strong>${this.esc(l.nombre)}</strong><br>
                  <small style="color:var(--gray-500);">${moneda} ${Number(l.precio_unitario).toLocaleString('es-AR', { minimumFractionDigits: 2 })} × max ${l.cantidad}</small>
                </div>
                <input type="number" class="form-input dev-cant-input" data-index="${i}"
                  data-precio="${l.precio_unitario}" data-max="${l.cantidad}" data-prodid="${l.producto_id}"
                  min="0" max="${l.cantidad}" value="0" style="width:80px;">
              </div>
            `).join('')}
          </div>
          <div style="margin-top:0.75rem;padding:0.5rem 1rem;background:var(--gray-100);border-radius:var(--radius-md);font-size:var(--font-size-sm);">
            Total nota de crédito: <strong id="devTotal">${moneda} 0.00</strong>
          </div>
          <div class="form-group" style="margin-top:1rem;">
            <label class="form-label">Motivo de devolución</label>
            <input type="text" class="form-input" id="devMotivo" placeholder="Ej: producto en mal estado, error de pedido...">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btnCancelDev">Cancelar</button>
          <button class="btn btn-primary" id="btnConfirmDev">Registrar devolución</button>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    const updateTotal = () => {
      let total = 0;
      container.querySelectorAll('.dev-cant-input').forEach(inp => {
        const cant = parseInt(inp.value) || 0;
        const precio = parseFloat(inp.dataset.precio) || 0;
        total += cant * precio;
      });
      document.getElementById('devTotal').textContent =
        `${moneda} ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    };

    container.querySelectorAll('.dev-cant-input').forEach(inp => {
      inp.addEventListener('input', () => {
        const max = parseInt(inp.dataset.max) || 0;
        if (parseInt(inp.value) > max) inp.value = max;
        if (parseInt(inp.value) < 0) inp.value = 0;
        updateTotal();
      });
    });

    document.getElementById('btnCloseDev').addEventListener('click', () => container.remove());
    document.getElementById('btnCancelDev').addEventListener('click', () => container.remove());
    container.addEventListener('click', (e) => { if (e.target === container) container.remove(); });

    document.getElementById('btnConfirmDev').addEventListener('click', async () => {
      const lineasDev = [];
      container.querySelectorAll('.dev-cant-input').forEach((inp, i) => {
        const cant = parseInt(inp.value) || 0;
        if (cant > 0) {
          lineasDev.push({
            producto_id: inp.dataset.prodid,
            cantidad: cant,
            precio_unitario: parseFloat(inp.dataset.precio) || 0,
            subtotal: cant * (parseFloat(inp.dataset.precio) || 0),
          });
        }
      });

      if (lineasDev.length === 0) {
        Toast.error('Seleccioná al menos un producto para devolver');
        return;
      }

      const motivo = document.getElementById('devMotivo')?.value.trim() || null;
      const montoTotal = lineasDev.reduce((s, l) => s + l.subtotal, 0);

      const btn = document.getElementById('btnConfirmDev');
      btn.disabled = true;
      btn.textContent = 'Registrando...';

      await this.saveDevolucion(pedido, lineasDev, motivo, montoTotal);
      container.remove();
    });
  },

  async saveDevolucion(pedido, lineasDev, motivo, montoTotal) {
    try {
      const orgId = window.App?.organization?.id;
      const userId = (await supabase.auth.getUser())?.data?.user?.id;
      const clienteId = pedido.cliente_id || pedido.cliente?.id;

      // 1. Crear devolución (pendiente de aprobación por un manager)
      const { data: devData, error: errDev } = await supabase
        .from('devoluciones')
        .insert({
          organizacion_id: orgId,
          pedido_id: pedido.id,
          cliente_id: clienteId,
          usuario_id: userId,
          motivo: motivo || null,
          monto_total: montoTotal,
          estado: 'pendiente',
        })
        .select('id')
        .single();

      if (errDev) throw errDev;

      // 2. Insertar líneas
      const lineasConDev = lineasDev.map(l => ({ ...l, devolucion_id: devData.id }));
      const { error: errLineas } = await supabase.from('devoluciones_lineas').insert(lineasConDev);
      if (errLineas) throw errLineas;

      // Nota: saldo_pendiente y estado del pedido se ajustan cuando un manager aprueba la devolución

      const moneda = window.App?.organization?.moneda || 'ARS';
      Toast.success(`Devolución enviada a revisión — NCR ${moneda} ${montoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`);
      Notif.notifyManagers('warning', `Devolución pendiente — Pedido #${pedido.numero_pedido}`,
        `${pedido.cliente?.nombre_establecimiento || ''} · NCR ${moneda} ${montoTotal.toLocaleString('es-AR')}`, '#/pedidos');
      this.closeModal();
      this.loadPedidos();
    } catch (err) {
      console.error('Error al registrar devolución:', err);
      Toast.error('Error al registrar la devolución');
    }
  },

  // ========================================
  // LISTADO GLOBAL DE DEVOLUCIONES
  // ========================================

  async openModalDevoluciones() {
    const container = document.createElement('div');
    container.id = 'devolucionesModal';
    container.className = 'modal-overlay';
    container.innerHTML = `
      <div class="modal" style="max-width:900px;">
        <div class="modal-header">
          <h2>Devoluciones registradas</h2>
          <button class="modal-close" id="btnCloseDevModal">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="modal-body" style="padding:0;">
          <div id="devolucionesList" style="min-height:120px;">
            <div class="loader"><div class="spinner"></div></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    document.getElementById('btnCloseDevModal').addEventListener('click', () => container.remove());
    container.addEventListener('click', (e) => { if (e.target === container) container.remove(); });

    const esManager = ['owner', 'admin', 'gerente'].includes(window.App?.userProfile?.rol);
    const estadoClass = { pendiente: 'warning', aprobada: 'success', rechazada: 'danger' };
    const estadoLabel = { pendiente: 'Pendiente', aprobada: 'Aprobada', rechazada: 'Rechazada' };

    const cargarDevoluciones = async () => {
      const listEl = document.getElementById('devolucionesList');
      if (!listEl) return;
      listEl.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

      try {
        const orgId = window.App?.organization?.id;
        const { data, error } = await supabase
          .from('devoluciones')
          .select(`
            id, motivo, estado, monto_total, created_at,
            pedido:pedido_id(id, numero_pedido, estado, cliente:cliente_id(id, nombre_establecimiento)),
            lineas:devoluciones_lineas(cantidad, motivo_linea, producto:producto_id(nombre))
          `)
          .eq('organizacion_id', orgId)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        const devs = data || [];

        if (devs.length === 0) {
          listEl.innerHTML = '<div class="text-center text-muted" style="padding:2rem;">No hay devoluciones registradas</div>';
          return;
        }

        const thAcciones = esManager
          ? `<th style="padding:0.6rem 1rem;text-align:left;font-size:var(--font-size-xs);font-weight:600;color:var(--gray-600);text-transform:uppercase;">Acciones</th>`
          : '';

        listEl.innerHTML = `
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:var(--gray-50);border-bottom:2px solid var(--gray-200);">
                <th style="padding:0.6rem 1rem;text-align:left;font-size:var(--font-size-xs);font-weight:600;color:var(--gray-600);text-transform:uppercase;">Fecha</th>
                <th style="padding:0.6rem 1rem;text-align:left;font-size:var(--font-size-xs);font-weight:600;color:var(--gray-600);text-transform:uppercase;">Pedido</th>
                <th style="padding:0.6rem 1rem;text-align:left;font-size:var(--font-size-xs);font-weight:600;color:var(--gray-600);text-transform:uppercase;">Cliente</th>
                <th style="padding:0.6rem 1rem;text-align:left;font-size:var(--font-size-xs);font-weight:600;color:var(--gray-600);text-transform:uppercase;">Productos</th>
                <th style="padding:0.6rem 1rem;text-align:left;font-size:var(--font-size-xs);font-weight:600;color:var(--gray-600);text-transform:uppercase;">Motivo</th>
                <th style="padding:0.6rem 1rem;text-align:left;font-size:var(--font-size-xs);font-weight:600;color:var(--gray-600);text-transform:uppercase;">Estado</th>
                ${thAcciones}
              </tr>
            </thead>
            <tbody>
              ${devs.map(d => {
                const fecha = new Date(d.created_at).toLocaleDateString('es-AR');
                const nroPedido = d.pedido?.numero_pedido ? `#${d.pedido.numero_pedido}` : '-';
                const cliente = d.pedido?.cliente?.nombre_establecimiento || '-';
                const productos = (d.lineas || []).map(l => `${l.producto?.nombre || '?'} (×${l.cantidad})`).join(', ') || '-';
                const color = estadoClass[d.estado] || 'info';
                const tdAcciones = esManager ? `
                  <td style="padding:0.65rem 1rem;white-space:nowrap;">
                    ${d.estado === 'pendiente' ? `
                      <button class="btn btn-sm btn-primary btn-aprobar-dev"
                        data-id="${d.id}"
                        data-pedido-id="${d.pedido?.id || ''}"
                        data-cliente-id="${d.pedido?.cliente?.id || ''}"
                        data-monto="${d.monto_total || 0}"
                        data-pedido-estado="${d.pedido?.estado || ''}">
                        Aprobar
                      </button>
                      <button class="btn btn-sm btn-danger btn-rechazar-dev" data-id="${d.id}" style="margin-left:4px;">Rechazar</button>
                    ` : '—'}
                  </td>` : '';
                return `
                  <tr style="border-bottom:1px solid var(--gray-100);">
                    <td style="padding:0.65rem 1rem;font-size:var(--font-size-sm);white-space:nowrap;">${fecha}</td>
                    <td style="padding:0.65rem 1rem;font-size:var(--font-size-sm);font-weight:600;">${nroPedido}</td>
                    <td style="padding:0.65rem 1rem;font-size:var(--font-size-sm);">${this.esc(cliente)}</td>
                    <td style="padding:0.65rem 1rem;font-size:var(--font-size-sm);max-width:220px;">${this.esc(productos)}</td>
                    <td style="padding:0.65rem 1rem;font-size:var(--font-size-sm);max-width:160px;">${this.esc(d.motivo || '-')}</td>
                    <td style="padding:0.65rem 1rem;">
                      <span class="badge-estado-pedido ${color}" style="display:inline-flex;align-items:center;gap:4px;">
                        <span class="dot"></span>${estadoLabel[d.estado] || d.estado}
                      </span>
                    </td>
                    ${tdAcciones}
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        `;
      } catch (err) {
        console.error('Error cargando devoluciones:', err);
        const listEl = document.getElementById('devolucionesList');
        if (listEl) listEl.innerHTML = '<div class="text-center text-muted" style="padding:2rem;">Error al cargar devoluciones</div>';
      }
    };

    // Delegación de eventos para aprobar/rechazar
    container.addEventListener('click', async (e) => {
      const btnAprobar = e.target.closest('.btn-aprobar-dev');
      if (btnAprobar) {
        btnAprobar.disabled = true;
        btnAprobar.textContent = '...';
        const { id, pedidoId, clienteId, monto, pedidoEstado } = btnAprobar.dataset;
        await this._aprobarDevolucion(id, pedidoId, clienteId, parseFloat(monto), pedidoEstado);
        await cargarDevoluciones();
        return;
      }
      const btnRechazar = e.target.closest('.btn-rechazar-dev');
      if (btnRechazar) {
        btnRechazar.disabled = true;
        btnRechazar.textContent = '...';
        await this._rechazarDevolucion(btnRechazar.dataset.id);
        await cargarDevoluciones();
        return;
      }
    });

    await cargarDevoluciones();
  },

  async _aprobarDevolucion(devId, pedidoId, clienteId, monto, pedidoEstado) {
    try {
      const { error } = await supabase.from('devoluciones').update({ estado: 'aprobada' }).eq('id', devId);
      if (error) throw error;

      // Reducir saldo_pendiente del cliente (nota de crédito)
      if (clienteId && monto > 0) {
        const { data: cd } = await supabase.from('clientes').select('saldo_pendiente').eq('id', clienteId).single();
        const nuevoSaldo = Math.max(0, Number(cd?.saldo_pendiente || 0) - monto);
        await supabase.from('clientes').update({ saldo_pendiente: nuevoSaldo }).eq('id', clienteId);
      }

      // Cambiar pedido a con_incidencia si estaba entregado
      if (pedidoId && pedidoEstado === 'entregado') {
        await supabase.from('pedidos').update({ estado: 'con_incidencia' }).eq('id', pedidoId);
      }

      // Restaurar stock_actual de los productos devueltos
      const { data: lineasDev } = await supabase
        .from('devoluciones_lineas')
        .select('producto_id, cantidad')
        .eq('devolucion_id', devId);
      if (lineasDev?.length) {
        for (const linea of lineasDev) {
          const { data: prod } = await supabase
            .from('productos')
            .select('stock_actual')
            .eq('id', linea.producto_id)
            .single();
          if (prod) {
            await supabase
              .from('productos')
              .update({ stock_actual: Number(prod.stock_actual) + linea.cantidad })
              .eq('id', linea.producto_id);
          }
        }
      }

      Toast.success('Devolución aprobada');
    } catch (err) {
      console.error('Error aprobando devolución:', err);
      Toast.error('Error al aprobar la devolución');
    }
  },

  async _rechazarDevolucion(devId) {
    try {
      const { error } = await supabase.from('devoluciones').update({ estado: 'rechazada' }).eq('id', devId);
      if (error) throw error;
      Toast.success('Devolución rechazada');
    } catch (err) {
      console.error('Error rechazando devolución:', err);
      Toast.error('Error al rechazar la devolución');
    }
  },

  // ========================================
  // REMITO DE ENTREGA (sin precios)
  // ========================================

  imprimirRemito(pedido, lineas) {
    const org = window.App?.organization?.nombre || 'Distribuidora';
    const cliente = pedido.cliente?.razon_social || pedido.cliente?.nombre_establecimiento || pedido.cliente?.nombre || '-';
    const domicilio = pedido.cliente?.domicilio_entrega || pedido.domicilio_entrega || '';
    const fecha = pedido.created_at ? new Date(pedido.created_at).toLocaleDateString('es-AR') : '-';
    const entrega = pedido.fecha_entrega_programada
      ? new Date(pedido.fecha_entrega_programada).toLocaleDateString('es-AR')
      : 'Sin fecha programada';

    const lineasHTML = lineas.map((l, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${this.esc(l.sku || '')}</td>
        <td>${this.esc(l.nombre)}</td>
        <td style="text-align:center;">${l.cantidad}</td>
        <td>${this.esc(l.unidad_medida || 'uds')}</td>
        <td></td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Remito #${pedido.numero_pedido}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 15mm 20mm; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 12px; }
    .header-org h1 { font-size: 20px; margin-bottom: 4px; }
    .header-num { text-align: right; }
    .header-num h2 { font-size: 16px; color: #333; margin-bottom: 4px; }
    .section { border: 1px solid #ccc; border-radius: 4px; padding: 10px 14px; margin-bottom: 14px; }
    .section-title { font-size: 10px; text-transform: uppercase; color: #888; margin-bottom: 6px; letter-spacing: 0.5px; }
    .section p { font-size: 13px; margin-bottom: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f0f0f0; padding: 7px 8px; text-align: left; font-size: 11px; border-bottom: 2px solid #999; }
    td { padding: 7px 8px; border-bottom: 1px solid #e0e0e0; font-size: 12px; }
    td:last-child { width: 60px; }
    .firma-section { display: flex; gap: 32px; margin-top: 48px; }
    .firma-box { flex: 1; border-top: 1px solid #555; padding-top: 8px; text-align: center; font-size: 11px; color: #555; }
    @media print { @page { margin: 12mm; } button { display: none !important; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-org">
      <h1>${this.esc(org)}</h1>
      <p style="color:#666;">REMITO DE ENTREGA</p>
    </div>
    <div class="header-num">
      <h2>Remito #${pedido.numero_pedido}</h2>
      <p>Fecha pedido: ${fecha}</p>
      <p>Entrega: ${entrega}</p>
      ${pedido.estado ? `<p>Estado: ${this.estadoLabel(pedido.estado)}</p>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Datos del cliente</div>
    <p><strong>${this.esc(cliente)}</strong></p>
    ${domicilio ? `<p>${this.esc(domicilio)}</p>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>SKU</th>
        <th>Producto</th>
        <th style="text-align:center;">Cantidad</th>
        <th>Unidad</th>
        <th>Recibido conforme</th>
      </tr>
    </thead>
    <tbody>${lineasHTML}</tbody>
  </table>

  ${pedido.notas ? `<div class="section"><div class="section-title">Observaciones</div><p>${this.esc(pedido.notas)}</p></div>` : ''}

  <div class="firma-section">
    <div class="firma-box">Firma y aclaración del receptor</div>
    <div class="firma-box">DNI del receptor</div>
    <div class="firma-box">Firma del repartidor</div>
  </div>

  <script>window.onload = () => window.print();<\/script>
</body>
</html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
    else Toast.error('Bloqueaste las ventanas emergentes. Habilitá los popups para esta página.');
  },

  // ========================================
  // PERSISTENCIA DE FILTROS
  // ========================================

  _restoreFilters() {
    const saved = sessionStorage.getItem('crm_filters_pedidos');
    if (saved) {
      try { this.filters = { ...this.filters, ...JSON.parse(saved) }; } catch {}
    }
    const el = (id) => document.getElementById(id);
    if (el('searchPedidos')) el('searchPedidos').value = this.filters.search || '';
    if (el('filterEstadoPedido')) el('filterEstadoPedido').value = this.filters.estado || '';
    if (el('filterFechaDesdePed')) el('filterFechaDesdePed').value = this.filters.fechaDesde || '';
    if (el('filterFechaHastaPed')) el('filterFechaHastaPed').value = this.filters.fechaHasta || '';
    if (el('filterTotalMin')) el('filterTotalMin').value = this.filters.totalMin || '';
    if (el('filterTotalMax')) el('filterTotalMax').value = this.filters.totalMax || '';
    if (el('filterVendedorPed')) el('filterVendedorPed').value = this.filters.vendedor || '';
  },
};

export default PedidosPage;
