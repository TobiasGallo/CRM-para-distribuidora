/* ========================================
   PÁGINA PRODUCTOS - CRUD COMPLETO
   Stock, categorías, listas de precios
   ======================================== */

import supabase from '../config/supabase.js';
import Toast from '../utils/toast.js';
import Permissions from '../utils/permissions.js';
import CSV from '../utils/csv.js';
import Validate from '../utils/validate.js';
import ImportCSV from '../utils/import-csv.js';
import Notif from '../utils/notif.js';

const ITEMS_PER_PAGE = 20;

const ProductosPage = {
  productos: [],
  listasPrecios: [],
  categorias: [],
  totalCount: 0,
  currentPage: 0,
  filters: { search: '', categoria: '', stock: '', precioMin: '', precioMax: '', activo: '' },
  sortField: 'created_at',
  sortAsc: false,
  editingId: null,

  async render(container) {
    this.container = container;

    container.innerHTML = `
      <div class="productos-header">
        <div>
          <h1>Productos</h1>
          <p>Cat\u00e1logo de productos de tu distribuidora</p>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button class="btn btn-export" id="btnExportProductos" title="Exportar a CSV">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            CSV
          </button>
          ${Permissions.can('crear', 'productos') ? `
          <button class="btn btn-export" id="btnImportProductos" title="Importar desde CSV">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Importar
          </button>
          <button class="btn btn-export" id="btnActualizarPrecios" title="Actualizar precios en lote">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            Precios
          </button>
          <button class="btn btn-primary" id="btnNuevoProducto">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nuevo Producto
          </button>` : ''}
        </div>
      </div>

      <div class="productos-filters">
        <div class="productos-search">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" class="form-input" id="searchProductos" placeholder="Buscar por nombre, SKU, categor\u00eda...">
        </div>
        <select id="filterCategoria">
          <option value="">Todas las categor\u00edas</option>
        </select>
        <select id="filterStock">
          <option value="">Todo el stock</option>
          <option value="bajo">Stock bajo</option>
          <option value="sin">Sin stock</option>
          <option value="vencimiento">Pr\u00f3ximo a vencer</option>
        </select>
        <button class="advanced-filters-toggle" id="advFiltersToggleProd">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line></svg>
          Avanzados <span class="toggle-arrow">▼</span>
        </button>
      </div>

      <div class="advanced-filters-panel" id="advFiltersPanelProd">
        <div class="adv-filters-grid">
          <div class="adv-filter-group">
            <label>Precio mínimo</label>
            <input type="number" class="form-input" id="filterPrecioMin" min="0" placeholder="0">
          </div>
          <div class="adv-filter-group">
            <label>Precio máximo</label>
            <input type="number" class="form-input" id="filterPrecioMax" min="0" placeholder="Sin límite">
          </div>
          <div class="adv-filter-group">
            <label>Estado</label>
            <select id="filterActivoProd">
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>
        <div class="adv-filters-actions">
          <button class="btn btn-sm" id="btnApplyAdvFiltersProd">Aplicar</button>
          <button class="btn btn-sm btn-ghost" id="btnClearAdvFiltersProd">Limpiar filtros</button>
          <div class="filter-presets-wrapper">
            <select id="filterPresetSelectProd">
              <option value="">Filtros guardados...</option>
            </select>
            <button class="btn btn-sm btn-ghost" id="btnSavePresetProd">Guardar</button>
          </div>
        </div>
      </div>

      <div class="active-filters-badges" id="activeFiltersBadgesProd"></div>

      <div class="productos-count" id="productosCount"></div>

      <div class="card">
        <div class="productos-table-wrapper">
          <table class="productos-table">
            <thead>
              <tr>
                <th class="th-sortable" data-sort="nombre">Producto <span class="sort-icon">\u2195</span></th>
                <th class="th-sortable" data-sort="categoria">Categor\u00eda <span class="sort-icon">\u2195</span></th>
                <th class="th-sortable" data-sort="precio_base">Precio Base <span class="sort-icon">\u2195</span></th>
                <th class="th-sortable" data-sort="stock_actual">Stock <span class="sort-icon">\u2195</span></th>
                <th class="th-sortable" data-sort="fecha_vencimiento">Vencimiento <span class="sort-icon">\u2195</span></th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="productosTableBody">
              <tr><td colspan="7"><div class="loader"><div class="spinner"></div></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="paginacion" id="paginacionProd"></div>
      <div id="modalContainer"></div>
    `;

    await this.loadListasPrecios();
    this._restoreFilters();
    await this.loadProductos();
    this.loadCategorias();
    this.initEvents();
  },

  // ========================================
  // CARGA DE DATOS
  // ========================================

  async loadProductos() {
    sessionStorage.setItem('crm_filters_productos', JSON.stringify(this.filters));
    try {
      const orgId = window.App?.organization?.id;
      // El filtro "bajo" requiere comparación columna-a-columna (stock_actual <= stock_minimo)
      // que Supabase JS no soporta vía cliente. Se carga todo con stock_minimo > 0
      // y se filtra client-side, con paginación también client-side.
      if (this.filters.stock === 'bajo') {
        let query = supabase.from('productos').select('*').eq('organizacion_id', orgId).gt('stock_minimo', 0);
        if (this.filters.search) {
          const s = `%${this.filters.search}%`;
          query = query.or(`nombre.ilike.${s},sku.ilike.${s},categoria.ilike.${s},proveedor.ilike.${s}`);
        }
        if (this.filters.categoria) query = query.eq('categoria', this.filters.categoria);
        if (this.filters.activo === 'true') query = query.eq('activo', true);
        else if (this.filters.activo === 'false') query = query.eq('activo', false);
        query = query.order(this.sortField, { ascending: this.sortAsc });
        const { data, error } = await query;
        if (error) throw error;
        const todos = (data || []).filter(p => p.stock_actual <= p.stock_minimo);
        this.totalCount = todos.length;
        const from = this.currentPage * ITEMS_PER_PAGE;
        this.productos = todos.slice(from, from + ITEMS_PER_PAGE);
        this.renderTable();
        this.renderPagination();
        this.renderCount();
        return;
      }

      let query = supabase
        .from('productos')
        .select('*', { count: 'exact' })
        .eq('organizacion_id', orgId);

      if (this.filters.search) {
        const s = `%${this.filters.search}%`;
        query = query.or(`nombre.ilike.${s},sku.ilike.${s},categoria.ilike.${s},proveedor.ilike.${s}`);
      }
      if (this.filters.categoria) {
        query = query.eq('categoria', this.filters.categoria);
      }
      if (this.filters.stock === 'sin') {
        query = query.eq('stock_actual', 0);
      } else if (this.filters.stock === 'vencimiento') {
        const in30 = new Date();
        in30.setDate(in30.getDate() + 30);
        query = query.lte('fecha_vencimiento', in30.toISOString().split('T')[0]).gte('fecha_vencimiento', new Date().toISOString().split('T')[0]);
      }
      // Filtros avanzados
      if (this.filters.precioMin) {
        query = query.gte('precio_base', parseFloat(this.filters.precioMin));
      }
      if (this.filters.precioMax) {
        query = query.lte('precio_base', parseFloat(this.filters.precioMax));
      }
      if (this.filters.activo === 'true') {
        query = query.eq('activo', true);
      } else if (this.filters.activo === 'false') {
        query = query.eq('activo', false);
      }

      const from = this.currentPage * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.order(this.sortField, { ascending: this.sortAsc }).range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      this.productos = data || [];
      this.totalCount = count || 0;
      this.renderTable();
      this.renderPagination();
      this.renderCount();
    } catch (err) {
      console.error('Error cargando productos:', err);
      Toast.error('Error al cargar productos');
    }
  },

  async loadListasPrecios() {
    try {
      const orgId = window.App?.organization?.id;
      const { data } = await supabase
        .from('listas_precios')
        .select('id, nombre')
        .eq('organizacion_id', orgId)
        .eq('activa', true);
      this.listasPrecios = data || [];
    } catch (err) {
      console.error('Error cargando listas:', err);
    }
  },

  async loadCategorias() {
    // Obtener categorías únicas de los productos existentes
    try {
      const orgId = window.App?.organization?.id;
      const { data } = await supabase
        .from('productos')
        .select('categoria')
        .eq('organizacion_id', orgId);

      if (data) {
        const cats = [...new Set(data.map(p => p.categoria).filter(Boolean))].sort();
        this.categorias = cats;
        const select = document.getElementById('filterCategoria');
        if (select) {
          select.innerHTML = '<option value="">Todas las categor\u00edas</option>' +
            cats.map(c => `<option value="${c}">${c}</option>`).join('');
        }
      }
    } catch (err) {
      console.error('Error cargando categorías:', err);
    }
  },

  // ========================================
  // RENDERIZADO
  // ========================================

  renderTable() {
    const tbody = document.getElementById('productosTableBody');
    if (!tbody) return;
    const moneda = window.App?.organization?.moneda || 'ARS';

    if (this.productos.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="7">
          <div class="productos-empty">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
            <h3>No hay productos</h3>
            <p>Cre\u00e1 tu primer producto con el bot\u00f3n "Nuevo Producto"</p>
          </div>
        </td></tr>`;
      return;
    }

    tbody.innerHTML = this.productos.map(p => `
      <tr>
        <td>
          <div class="producto-nombre-cell">
            <div class="producto-thumb">
              ${p.imagen_url
                ? `<img src="${p.imagen_url}" alt="${this.esc(p.nombre)}">`
                : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>`
              }
            </div>
            <div>
              <div class="nombre">${this.esc(p.nombre)}</div>
              <div class="sku">${p.sku}</div>
            </div>
          </div>
        </td>
        <td><span class="badge-categoria">${this.esc(p.categoria)}</span></td>
        <td>${moneda} ${Number(p.precio_base).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
        <td>${this.renderStock(p)}</td>
        <td>${this.renderVencimiento(p.fecha_vencimiento)}</td>
        <td>
          <span class="toggle-activo ${p.activo ? 'activo' : 'inactivo'}">
            <span class="dot"></span> ${p.activo ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td>
          <div class="table-actions">
            ${Permissions.can('editar', 'productos') ? `
            <button title="Ajustar stock" class="btn-stock-prod" data-id="${p.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line><circle cx="12" cy="12" r="10"></circle></svg>
            </button>
            <button title="Editar" class="btn-editar-prod" data-id="${p.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>` : ''}
            ${Permissions.can('eliminar', 'productos') ? `
            <button title="Eliminar" class="btn-eliminar-prod" data-id="${p.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  },

  renderStock(p) {
    const { stock_actual, stock_minimo } = p;
    if (stock_actual === 0) {
      return `<span class="stock-badge stock-sin">Sin stock</span>`;
    }
    if (stock_minimo > 0 && stock_actual <= stock_minimo) {
      return `<span class="stock-badge stock-bajo">${stock_actual} uds (bajo)</span>`;
    }
    if (stock_minimo > 0 && stock_actual <= stock_minimo * 1.5) {
      return `<span class="stock-badge stock-bajo">${stock_actual} uds</span>`;
    }
    return `<span class="stock-badge stock-ok">${stock_actual} uds</span>`;
  },

  renderVencimiento(fecha) {
    if (!fecha) return '<span class="vencimiento-ok">-</span>';
    const venc = new Date(fecha);
    const hoy = new Date();
    const diff = Math.ceil((venc - hoy) / 86400000);
    const formatted = venc.toLocaleDateString('es-AR');

    if (diff < 0) return `<span class="vencimiento-proximo">Vencido (${formatted})</span>`;
    if (diff <= 30) return `<span class="vencimiento-proximo">${formatted} (${diff}d)</span>`;
    return `<span class="vencimiento-ok">${formatted}</span>`;
  },

  renderPagination() {
    const container = document.getElementById('paginacionProd');
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
    const el = document.getElementById('productosCount');
    if (!el) return;
    const from = this.currentPage * ITEMS_PER_PAGE + 1;
    const to = Math.min(from + ITEMS_PER_PAGE - 1, this.totalCount);
    el.textContent = this.totalCount > 0 ? `Mostrando ${from}-${to} de ${this.totalCount} productos` : 'Sin resultados';
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
    const toggle = document.getElementById('advFiltersToggleProd');
    const panel = document.getElementById('advFiltersPanelProd');
    if (toggle && panel) {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        panel.classList.toggle('open');
      });
    }

    document.getElementById('btnApplyAdvFiltersProd')?.addEventListener('click', () => {
      this.filters.precioMin = document.getElementById('filterPrecioMin')?.value || '';
      this.filters.precioMax = document.getElementById('filterPrecioMax')?.value || '';
      this.filters.activo = document.getElementById('filterActivoProd')?.value || '';
      this.currentPage = 0;
      this.loadProductos();
      this._renderFilterBadges();
    });

    document.getElementById('btnClearAdvFiltersProd')?.addEventListener('click', () => {
      this.filters = { search: this.filters.search, categoria: this.filters.categoria, stock: this.filters.stock, precioMin: '', precioMax: '', activo: '' };
      ['filterPrecioMin', 'filterPrecioMax', 'filterActivoProd'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      this.currentPage = 0;
      this.loadProductos();
      this._renderFilterBadges();
    });

    document.getElementById('btnSavePresetProd')?.addEventListener('click', () => {
      const name = prompt('Nombre del filtro:');
      if (!name) return;
      const presets = JSON.parse(localStorage.getItem('crm_filter_presets_productos') || '[]');
      presets.push({ name, filters: { ...this.filters } });
      localStorage.setItem('crm_filter_presets_productos', JSON.stringify(presets));
      this._loadPresets();
    });

    document.getElementById('filterPresetSelectProd')?.addEventListener('change', (e) => {
      const presets = JSON.parse(localStorage.getItem('crm_filter_presets_productos') || '[]');
      const preset = presets[e.target.value];
      if (!preset) return;
      this.filters = { ...preset.filters };
      const el = (id) => document.getElementById(id);
      if (el('searchProductos')) el('searchProductos').value = this.filters.search || '';
      if (el('filterCategoria')) el('filterCategoria').value = this.filters.categoria || '';
      if (el('filterStock')) el('filterStock').value = this.filters.stock || '';
      if (el('filterPrecioMin')) el('filterPrecioMin').value = this.filters.precioMin || '';
      if (el('filterPrecioMax')) el('filterPrecioMax').value = this.filters.precioMax || '';
      if (el('filterActivoProd')) el('filterActivoProd').value = this.filters.activo || '';
      this.currentPage = 0;
      this.loadProductos();
      this._renderFilterBadges();
    });

    this._loadPresets();
  },

  _loadPresets() {
    const select = document.getElementById('filterPresetSelectProd');
    if (!select) return;
    const presets = JSON.parse(localStorage.getItem('crm_filter_presets_productos') || '[]');
    select.innerHTML = '<option value="">Filtros guardados...</option>';
    presets.forEach((p, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = p.name;
      select.appendChild(opt);
    });
  },

  _renderFilterBadges() {
    const container = document.getElementById('activeFiltersBadgesProd');
    if (!container) return;
    const badges = [];
    if (this.filters.precioMin) badges.push({ key: 'precioMin', label: `Precio ≥ ${this.filters.precioMin}` });
    if (this.filters.precioMax) badges.push({ key: 'precioMax', label: `Precio ≤ ${this.filters.precioMax}` });
    if (this.filters.activo === 'true') badges.push({ key: 'activo', label: 'Solo activos' });
    if (this.filters.activo === 'false') badges.push({ key: 'activo', label: 'Solo inactivos' });
    container.innerHTML = badges.map(b =>
      `<span class="filter-badge">${b.label} <button data-clear="${b.key}">&times;</button></span>`
    ).join('');
    container.querySelectorAll('button[data-clear]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.clear;
        this.filters[key] = '';
        const inputMap = { precioMin: 'filterPrecioMin', precioMax: 'filterPrecioMax', activo: 'filterActivoProd' };
        const el = document.getElementById(inputMap[key]);
        if (el) el.value = '';
        this.currentPage = 0;
        this.loadProductos();
        this._renderFilterBadges();
      });
    });
  },

  // ========================================
  // EVENTOS
  // ========================================

  initEvents() {
    document.getElementById('btnNuevoProducto')?.addEventListener('click', () => {
      this.editingId = null;
      this.openModal();
    });

    document.getElementById('btnExportProductos')?.addEventListener('click', () => this.exportCSV());
    document.getElementById('btnActualizarPrecios')?.addEventListener('click', () => this.openModalActualizarPrecios());

    document.getElementById('btnImportProductos')?.addEventListener('click', () => ImportCSV.open('productos'));
    if (this._importDoneHandler) window.removeEventListener('crm:import-done', this._importDoneHandler);
    this._importDoneHandler = (e) => {
      if (e.detail?.tipo === 'productos') { this.currentPage = 0; this.loadProductos(); }
    };
    window.addEventListener('crm:import-done', this._importDoneHandler);

    let searchTimeout;
    document.getElementById('searchProductos')?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.filters.search = e.target.value;
        this.currentPage = 0;
        this.loadProductos();
      }, 350);
    });

    document.getElementById('filterCategoria')?.addEventListener('change', (e) => {
      this.filters.categoria = e.target.value;
      this.currentPage = 0;
      this.loadProductos();
    });

    document.getElementById('filterStock')?.addEventListener('change', (e) => {
      this.filters.stock = e.target.value;
      this.currentPage = 0;
      this.loadProductos();
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
        this.loadProductos();
      });
    });
    this.updateSortHeaders();

    // Filtros avanzados
    this._initAdvancedFilters();

    document.getElementById('productosTableBody')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.classList.contains('btn-stock-prod')) this.openModalAjusteStock(id);
      if (btn.classList.contains('btn-editar-prod')) this.openModalEditar(id);
      if (btn.classList.contains('btn-eliminar-prod')) this.confirmarEliminar(id);
    });

    document.getElementById('paginacionProd')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn || btn.disabled) return;
      if (btn.classList.contains('pag-prev')) this.currentPage--;
      else if (btn.classList.contains('pag-next')) this.currentPage++;
      else if (btn.classList.contains('pag-num')) this.currentPage = parseInt(btn.dataset.page);
      this.loadProductos();
    });
  },

  // ========================================
  // EXPORTAR CSV
  // ========================================

  async exportCSV() {
    try {
      Toast.success('Exportando productos...');
      const orgId = window.App?.organization?.id;
      let query = supabase.from('productos').select('*').eq('organizacion_id', orgId);

      if (this.filters.search) {
        const s = `%${this.filters.search}%`;
        query = query.or(`nombre.ilike.${s},sku.ilike.${s},categoria.ilike.${s},proveedor.ilike.${s}`);
      }
      if (this.filters.categoria) query = query.eq('categoria', this.filters.categoria);
      if (this.filters.stock === 'bajo') query = query.gt('stock_minimo', 0);
      if (this.filters.stock === 'sin') query = query.lte('stock_actual', 0);

      const { data, error } = await query.order('nombre');
      if (error) throw error;

      // "bajo" requiere filtro client-side (comparación columna-a-columna no soportada en Supabase JS)
      const rawData = this.filters.stock === 'bajo'
        ? (data || []).filter(p => p.stock_actual <= p.stock_minimo)
        : (data || []);

      if (rawData.length === 0) {
        Toast.warning('No hay productos para exportar');
        return;
      }

      const moneda = window.App?.organization?.moneda || 'ARS';
      CSV.export(rawData, [
        { key: 'sku', label: 'SKU' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'categoria', label: 'Categoría' },
        { key: 'formato_presentacion', label: 'Formato' },
        { label: `Precio Base (${moneda})`, format: r => r.precio_base || 0 },
        { key: 'stock_actual', label: 'Stock Actual' },
        { key: 'stock_minimo', label: 'Stock Mínimo' },
        { key: 'proveedor', label: 'Proveedor' },
        { key: 'fecha_vencimiento', label: 'Vencimiento' },
        { label: 'Estado', format: r => r.activo ? 'Activo' : 'Inactivo' },
      ], 'productos');

      Toast.success(`${rawData.length} productos exportados`);
    } catch (err) {
      console.error('Error exportando CSV:', err);
      Toast.error('Error al exportar');
    }
  },

  // ========================================
  // MODAL CREAR / EDITAR
  // ========================================

  async openModal(prodData = null) {
    const isEdit = !!prodData;
    const p = prodData || {};
    const moneda = window.App?.organization?.moneda || 'ARS';

    // Si editando, cargar precios por lista + historial de precios
    let preciosLista = [];
    let historial = [];
    if (isEdit && p.id) {
      const [{ data: pl }, { data: hist }] = await Promise.all([
        supabase.from('precios_por_lista').select('lista_precios_id, precio').eq('producto_id', p.id),
        supabase.from('historial_precios')
          .select('precio_anterior, precio_nuevo, changed_at, changed_by:changed_by(nombre)')
          .eq('producto_id', p.id)
          .order('changed_at', { ascending: false })
          .limit(10),
      ]);
      preciosLista = pl || [];
      historial = hist || [];
    }

    document.getElementById('modalContainer').innerHTML = `
      <div class="modal-overlay" id="productoModal">
        <div class="modal">
          <div class="modal-header">
            <h2>${isEdit ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <button class="modal-close" id="btnCloseModal">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="modal-body">
            <form id="formProducto">
              <div class="form-section">
                <div class="form-section-title">Informaci\u00f3n b\u00e1sica</div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">SKU *</label>
                    <input type="text" class="form-input" name="sku" value="${this.esc(p.sku || '')}" required placeholder="Ej: LAC-001">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Nombre *</label>
                    <input type="text" class="form-input" name="nombre" value="${this.esc(p.nombre || '')}" required>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Descripci\u00f3n</label>
                  <textarea class="form-input" name="descripcion" rows="2">${this.esc(p.descripcion || '')}</textarea>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Categor\u00eda *</label>
                    <input type="text" class="form-input" name="categoria" value="${this.esc(p.categoria || '')}" required placeholder="Ej: L\u00e1cteos, Conservas..." list="catList">
                    <datalist id="catList">
                      ${this.categorias.map(c => `<option value="${c}">`).join('')}
                    </datalist>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Formato / Presentaci\u00f3n</label>
                    <input type="text" class="form-input" name="formato_presentacion" value="${this.esc(p.formato_presentacion || '')}" placeholder="Ej: Caja x12, Kg, Litro">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Proveedor</label>
                    <input type="text" class="form-input" name="proveedor" value="${this.esc(p.proveedor || '')}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Temp. almacenamiento</label>
                    <input type="text" class="form-input" name="temperatura_almacenamiento" value="${this.esc(p.temperatura_almacenamiento || '')}" placeholder="Ej: 2-8\u00b0C">
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">URL de imagen</label>
                  <input type="url" class="form-input" name="imagen_url" value="${p.imagen_url || ''}" placeholder="https://...">
                </div>
                <label class="form-check" style="margin-top:0.5rem;">
                  <input type="checkbox" name="activo" ${p.activo !== false ? 'checked' : ''}>
                  Producto activo (visible en el cat\u00e1logo)
                </label>
              </div>

              <div class="form-section">
                <div class="form-section-title">Precio y Stock</div>
                <div class="form-row-3">
                  <div class="form-group">
                    <label class="form-label">Precio base (${moneda}) *</label>
                    <input type="number" class="form-input" name="precio_base" value="${p.precio_base || ''}" required min="0" step="0.01">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Stock actual</label>
                    <input type="number" class="form-input" name="stock_actual" value="${p.stock_actual || 0}" min="0">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Stock m\u00ednimo</label>
                    <input type="number" class="form-input" name="stock_minimo" value="${p.stock_minimo || 0}" min="0">
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha de vencimiento</label>
                  <input type="date" class="form-input" name="fecha_vencimiento" value="${p.fecha_vencimiento || ''}" style="max-width:220px;">
                </div>
              </div>

              ${this.listasPrecios.length > 0 ? `
              <div class="form-section">
                <div class="form-section-title">Precios por Lista</div>
                <p style="font-size:var(--font-size-sm);color:var(--gray-500);margin-bottom:0.5rem;">Si no complet\u00e1s un precio, se usa el precio base.</p>
                <div class="precios-lista-grid">
                  ${this.listasPrecios.map(l => {
                    const precioActual = preciosLista.find(pl => pl.lista_precios_id === l.id);
                    return `
                      <div class="precio-lista-row">
                        <span class="lista-nombre">${this.esc(l.nombre)}</span>
                        <input type="number" class="form-input" name="precio_lista_${l.id}" value="${precioActual ? precioActual.precio : ''}" min="0" step="0.01" placeholder="Precio base">
                      </div>`;
                  }).join('')}
                </div>
              </div>` : ''}
              ${isEdit && historial.length > 0 ? `
              <div class="form-section">
                <div class="form-section-title">Historial de precios</div>
                <div class="historial-precios-list">
                  ${historial.map(h => {
                    const m = window.App?.organization?.moneda || 'ARS';
                    const fecha = new Date(h.changed_at).toLocaleDateString('es-AR');
                    const hora = new Date(h.changed_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                    const subio = Number(h.precio_nuevo) > Number(h.precio_anterior);
                    return `
                      <div class="historial-precio-row">
                        <span class="historial-fecha">${fecha} ${hora}</span>
                        <span class="historial-cambio ${subio ? 'sube' : 'baja'}">
                          ${m} ${Number(h.precio_anterior).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          → ${m} ${Number(h.precio_nuevo).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          <span class="historial-arrow">${subio ? '▲' : '▼'}</span>
                        </span>
                        ${h.changed_by?.nombre ? `<span class="historial-usuario">${this.esc(h.changed_by.nombre)}</span>` : ''}
                      </div>`;
                  }).join('')}
                </div>
              </div>` : ''}
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btnCancelModal">Cancelar</button>
            <button class="btn btn-primary" id="btnSaveProducto">${isEdit ? 'Guardar Cambios' : 'Crear Producto'}</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnCloseModal').addEventListener('click', () => this.closeModal());
    document.getElementById('btnCancelModal').addEventListener('click', () => this.closeModal());
    document.getElementById('btnSaveProducto').addEventListener('click', () => this.saveProducto());

    // Validación en tiempo real
    Validate.bindRealtime(document.getElementById('formProducto'), {
      sku: { required: true, minLength: 2, label: 'SKU' },
      nombre: { required: true, minLength: 2, label: 'Nombre' },
      categoria: { required: true, label: 'Categoría' },
      precio_base: { required: true, type: 'number', min: 0, label: 'Precio base' },
    });

    document.getElementById('productoModal').addEventListener('click', (e) => {
      if (e.target.id === 'productoModal') this.closeModal();
    });
    this._escHandler = (e) => { if (e.key === 'Escape') this.closeModal(); };
    document.addEventListener('keydown', this._escHandler);
  },

  closeModal() {
    const mc = document.getElementById('modalContainer');
    if (mc) mc.innerHTML = '';
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }
  },

  async openModalEditar(id) {
    const prod = this.productos.find(p => p.id === id);
    if (!prod) return;
    this.editingId = id;
    this.openModal(prod);
  },

  // ========================================
  // GUARDAR / ELIMINAR
  // ========================================

  async saveProducto() {
    const form = document.getElementById('formProducto');
    const rules = {
      sku: { required: true, minLength: 2, label: 'SKU' },
      nombre: { required: true, minLength: 2, label: 'Nombre' },
      categoria: { required: true, label: 'Categoría' },
      precio_base: { required: true, type: 'number', min: 0, label: 'Precio base' },
    };
    if (!Validate.form(form, rules)) return;

    const fd = new FormData(form);
    const orgId = window.App?.userProfile?.organizacion_id;
    if (!orgId) {
      Toast.error('No se pudo determinar la organización. Recargá la página.');
      return;
    }

    const data = {
      organizacion_id: orgId,
      sku: fd.get('sku').trim(),
      nombre: fd.get('nombre').trim(),
      descripcion: fd.get('descripcion')?.trim() || null,
      categoria: fd.get('categoria').trim(),
      formato_presentacion: fd.get('formato_presentacion')?.trim() || null,
      proveedor: fd.get('proveedor')?.trim() || null,
      temperatura_almacenamiento: fd.get('temperatura_almacenamiento')?.trim() || null,
      imagen_url: fd.get('imagen_url')?.trim() || null,
      activo: form.querySelector('[name="activo"]').checked,
      precio_base: parseFloat(fd.get('precio_base')) || 0,
      stock_actual: parseInt(fd.get('stock_actual')) || 0,
      stock_minimo: parseInt(fd.get('stock_minimo')) || 0,
      fecha_vencimiento: fd.get('fecha_vencimiento') || null,
    };

    const btn = document.getElementById('btnSaveProducto');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
      let productoId = this.editingId;

      if (this.editingId) {
        const prodActual = this.productos.find(p => p.id === this.editingId);
        const { organizacion_id, ...updateData } = data;
        const { error } = await supabase.from('productos').update(updateData).eq('id', this.editingId);
        if (error) throw error;
        // Registrar cambio de precio si hubo diferencia
        if (prodActual && Number(prodActual.precio_base) !== data.precio_base) {
          await supabase.from('historial_precios').insert({
            organizacion_id,
            producto_id: this.editingId,
            precio_anterior: prodActual.precio_base,
            precio_nuevo: data.precio_base,
            changed_by: window.App?.userProfile?.id || null,
          });
        }
      } else {
        const { data: inserted, error } = await supabase.from('productos').insert(data).select('id').single();
        if (error) throw error;
        productoId = inserted.id;
      }

      // Guardar precios por lista
      await this.savePreciosLista(productoId, fd);

      Toast.success(this.editingId ? 'Producto actualizado' : 'Producto creado');
      this.closeModal();
      this.loadProductos();
      this.loadCategorias();
    } catch (err) {
      console.error('Error guardando producto:', err);
      Toast.error(err.message || 'Error al guardar');
      btn.disabled = false;
      btn.textContent = this.editingId ? 'Guardar Cambios' : 'Crear Producto';
    }
  },

  async savePreciosLista(productoId, fd) {
    for (const lista of this.listasPrecios) {
      const precio = parseFloat(fd.get(`precio_lista_${lista.id}`));

      if (isNaN(precio) || precio <= 0) {
        // Eliminar si existía
        await supabase.from('precios_por_lista')
          .delete()
          .eq('producto_id', productoId)
          .eq('lista_precios_id', lista.id);
      } else {
        // Upsert
        const orgId = window.App?.userProfile?.organizacion_id;
        const { error } = await supabase.from('precios_por_lista')
          .upsert({
            producto_id: productoId,
            lista_precios_id: lista.id,
            precio: precio,
            organizacion_id: orgId,
          }, { onConflict: 'producto_id,lista_precios_id' });
        if (error) console.error('Error guardando precio lista:', error);
      }
    }
  },

  async confirmarEliminar(id) {
    const prod = this.productos.find(p => p.id === id);
    if (!prod) return;

    document.getElementById('modalContainer').innerHTML = `
      <div class="modal-overlay" id="deleteModal">
        <div class="modal" style="max-width:450px;">
          <div class="modal-header">
            <h2>Eliminar producto</h2>
            <button class="modal-close" id="btnCloseDelete">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="modal-body">
            <p>\u00bfEst\u00e1s seguro de que quer\u00e9s eliminar <strong>${this.esc(prod.nombre)}</strong> (${prod.sku})?</p>
            <p style="color:var(--gray-500);font-size:var(--font-size-sm);margin-top:0.5rem;">Se eliminar\u00e1n tambi\u00e9n sus precios por lista.</p>
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
        const { error } = await supabase.from('productos').delete().eq('id', id);
        if (error) throw error;
        Toast.success('Producto eliminado');
        this.closeModal();
        this.loadProductos();
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
  // AJUSTE MANUAL DE STOCK
  // ========================================

  openModalAjusteStock(id) {
    const prod = this.productos.find(p => p.id === id);
    if (!prod) return;

    const existing = document.getElementById('ajusteStockModal');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'ajusteStockModal';
    container.className = 'modal-overlay';
    container.innerHTML = `
      <div class="modal" style="max-width:420px;">
        <div class="modal-header">
          <h2>Ajustar Stock</h2>
          <button class="modal-close" id="btnCloseAjuste">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom:0.75rem;font-weight:500;">${this.esc(prod.nombre)}</p>
          <div class="info-box" style="padding:0.5rem 1rem;background:var(--gray-100);border-radius:var(--radius-md);margin-bottom:1rem;font-size:var(--font-size-sm);">
            Stock actual: <strong>${prod.stock_actual} ${prod.unidad_medida || 'uds'}</strong>
          </div>
          <div class="form-group">
            <label class="form-label">Tipo de ajuste</label>
            <div style="display:flex;gap:0.5rem;">
              <label style="flex:1;cursor:pointer;">
                <input type="radio" name="tipoAjuste" value="entrada" checked style="margin-right:0.25rem;"> Entrada (+)
              </label>
              <label style="flex:1;cursor:pointer;">
                <input type="radio" name="tipoAjuste" value="salida" style="margin-right:0.25rem;"> Salida (-)
              </label>
              <label style="flex:1;cursor:pointer;">
                <input type="radio" name="tipoAjuste" value="absoluto" style="margin-right:0.25rem;"> Fijar stock
              </label>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Cantidad</label>
            <input type="number" class="form-input" id="ajusteCantidad" min="0" value="0" placeholder="0">
          </div>
          <div class="form-group" id="ajusteNuevoStockPreview" style="font-size:var(--font-size-sm);color:var(--gray-600);"></div>
          <div class="form-group">
            <label class="form-label">Motivo (opcional)</label>
            <input type="text" class="form-input" id="ajusteMotivo" placeholder="Ej: recepción mercadería, inventario, merma...">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btnCancelAjuste">Cancelar</button>
          <button class="btn btn-primary" id="btnConfirmAjuste">Guardar ajuste</button>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    const calcPreview = () => {
      const tipo = container.querySelector('[name="tipoAjuste"]:checked')?.value || 'entrada';
      const cant = parseInt(document.getElementById('ajusteCantidad')?.value) || 0;
      let nuevo;
      if (tipo === 'entrada') nuevo = prod.stock_actual + cant;
      else if (tipo === 'salida') nuevo = Math.max(0, prod.stock_actual - cant);
      else nuevo = cant;
      document.getElementById('ajusteNuevoStockPreview').textContent =
        `Nuevo stock resultante: ${nuevo} ${prod.unidad_medida || 'uds'}`;
    };

    container.querySelectorAll('[name="tipoAjuste"]').forEach(r => r.addEventListener('change', calcPreview));
    document.getElementById('ajusteCantidad').addEventListener('input', calcPreview);
    calcPreview();

    document.getElementById('btnCloseAjuste').addEventListener('click', () => container.remove());
    document.getElementById('btnCancelAjuste').addEventListener('click', () => container.remove());
    container.addEventListener('click', (e) => { if (e.target === container) container.remove(); });

    document.getElementById('btnConfirmAjuste').addEventListener('click', async () => {
      const tipo = container.querySelector('[name="tipoAjuste"]:checked')?.value || 'entrada';
      const cant = parseInt(document.getElementById('ajusteCantidad')?.value) || 0;
      const motivo = document.getElementById('ajusteMotivo')?.value.trim() || null;
      await this.saveAjusteStock(prod, tipo, cant, motivo);
      container.remove();
    });
  },

  // ========================================
  // PERSISTENCIA DE FILTROS
  // ========================================

  _restoreFilters() {
    const saved = sessionStorage.getItem('crm_filters_productos');
    if (saved) {
      try { this.filters = { ...this.filters, ...JSON.parse(saved) }; } catch {}
    }
    const el = (id) => document.getElementById(id);
    if (el('searchProductos')) el('searchProductos').value = this.filters.search || '';
    if (el('filterCategoria')) el('filterCategoria').value = this.filters.categoria || '';
    if (el('filterStock')) el('filterStock').value = this.filters.stock || '';
    if (el('filterPrecioMin')) el('filterPrecioMin').value = this.filters.precioMin || '';
    if (el('filterPrecioMax')) el('filterPrecioMax').value = this.filters.precioMax || '';
    if (el('filterActivoProd')) el('filterActivoProd').value = this.filters.activo || '';
  },

  // ========================================
  // ACTUALIZACIÓN MASIVA DE PRECIOS
  // ========================================

  async openModalActualizarPrecios() {
    const cats = this.categorias;
    const container = document.createElement('div');
    container.id = 'actualizarPreciosModal';
    container.className = 'modal-overlay';
    container.innerHTML = `
      <div class="modal" style="max-width:480px;">
        <div class="modal-header">
          <h2>Actualizar precios en lote</h2>
          <button class="modal-close" id="btnClosePreciosModal">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Aplicar a</label>
            <select class="form-input" id="precioFiltroCategoria">
              <option value="">Todos los productos activos</option>
              ${cats.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tipo de ajuste</label>
            <select class="form-input" id="precioTipoAjuste">
              <option value="pct_aumento">% de aumento (sumar %)</option>
              <option value="pct_descuento">% de descuento (restar %)</option>
              <option value="fijo_suma">Valor fijo — sumar</option>
              <option value="fijo_resta">Valor fijo — restar</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" id="precioValorLabel">Porcentaje (%)</label>
            <input type="number" class="form-input" id="precioValor" min="0.01" step="0.01" placeholder="Ej: 10">
          </div>
          <div id="precioPreview" class="precio-preview-box"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btnCancelPreciosModal">Cancelar</button>
          <button class="btn btn-primary" id="btnConfirmPreciosModal">Aplicar cambios</button>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    const moneda = window.App?.organization?.moneda || 'ARS';

    const updateLabel = () => {
      const tipo = document.getElementById('precioTipoAjuste')?.value;
      const label = document.getElementById('precioValorLabel');
      if (label) label.textContent = tipo?.startsWith('pct') ? 'Porcentaje (%)' : `Valor fijo (${moneda})`;
    };

    const updatePreview = async () => {
      const cat = document.getElementById('precioFiltroCategoria')?.value;
      const preview = document.getElementById('precioPreview');
      if (!preview) return;
      const orgId = window.App?.organization?.id;
      let q = supabase.from('productos').select('id', { count: 'exact', head: true }).eq('activo', true).eq('organizacion_id', orgId);
      if (cat) q = q.eq('categoria', cat);
      const { count } = await q;
      preview.textContent = `Se actualizarán ${count ?? 0} producto${count !== 1 ? 's' : ''}.`;
    };

    document.getElementById('precioTipoAjuste').addEventListener('change', updateLabel);
    document.getElementById('precioFiltroCategoria').addEventListener('change', updatePreview);
    updatePreview();

    document.getElementById('btnClosePreciosModal').addEventListener('click', () => container.remove());
    document.getElementById('btnCancelPreciosModal').addEventListener('click', () => container.remove());
    container.addEventListener('click', (e) => { if (e.target === container) container.remove(); });

    document.getElementById('btnConfirmPreciosModal').addEventListener('click', async () => {
      const cat = document.getElementById('precioFiltroCategoria')?.value;
      const tipo = document.getElementById('precioTipoAjuste')?.value;
      const valor = parseFloat(document.getElementById('precioValor')?.value);

      if (!valor || valor <= 0) {
        Toast.error('Ingresá un valor mayor a 0');
        return;
      }

      const btn = document.getElementById('btnConfirmPreciosModal');
      btn.disabled = true;
      btn.textContent = 'Aplicando...';

      try {
        const orgId = window.App?.organization?.id;
        let q = supabase.from('productos').select('id, precio_base').eq('activo', true).eq('organizacion_id', orgId);
        if (cat) q = q.eq('categoria', cat);
        const { data: prods, error } = await q;
        if (error) throw error;

        const calcNuevo = (precio) => {
          const p = Number(precio);
          let nuevo;
          switch (tipo) {
            case 'pct_aumento':   nuevo = p * (1 + valor / 100); break;
            case 'pct_descuento': nuevo = p * (1 - Math.min(valor, 100) / 100); break;
            case 'fijo_suma':     nuevo = p + valor; break;
            case 'fijo_resta':    nuevo = Math.max(0, p - valor); break;
            default:              nuevo = p;
          }
          return Math.round(nuevo * 100) / 100;
        };

        const updates = prods.map(p => ({ id: p.id, precio_base: calcNuevo(p.precio_base) }));
        const { error: upsertErr } = await supabase.from('productos').upsert(updates);
        if (upsertErr) throw upsertErr;

        // Registrar historial de precios para cada producto afectado
        const orgId = window.App?.userProfile?.organizacion_id;
        const userId = window.App?.userProfile?.id;
        const historial = prods
          .map(p => {
            const nuevo = calcNuevo(p.precio_base);
            if (nuevo === Number(p.precio_base)) return null;
            return {
              producto_id: p.id,
              organizacion_id: orgId,
              precio_anterior: Number(p.precio_base),
              precio_nuevo: nuevo,
              motivo: 'Actualización masiva',
              changed_by: userId,
            };
          })
          .filter(Boolean);
        if (historial.length > 0) {
          await supabase.from('historial_precios').insert(historial);
        }

        Toast.success(`${updates.length} producto${updates.length !== 1 ? 's' : ''} actualizado${updates.length !== 1 ? 's' : ''}`);
        container.remove();
        this.loadProductos();
      } catch (err) {
        console.error('Error actualizando precios:', err);
        Toast.error(err.message || 'Error al actualizar precios');
        btn.disabled = false;
        btn.textContent = 'Aplicar cambios';
      }
    });
  },

  async saveAjusteStock(prod, tipo, cantidad, motivo) {
    let nuevoStock;
    if (tipo === 'entrada') nuevoStock = prod.stock_actual + cantidad;
    else if (tipo === 'salida') nuevoStock = Math.max(0, prod.stock_actual - cantidad);
    else nuevoStock = cantidad; // absoluto

    const { error } = await supabase
      .from('productos')
      .update({ stock_actual: nuevoStock })
      .eq('id', prod.id);

    if (error) { Toast.error('Error al ajustar el stock'); return; }

    // Actualizar dato local para reflejar cambio sin recargar
    prod.stock_actual = nuevoStock;
    this.renderTable();

    const tipoLabel = tipo === 'entrada' ? 'Entrada' : tipo === 'salida' ? 'Salida' : 'Stock fijado';
    Toast.success(`${tipoLabel}: stock actualizado a ${nuevoStock} ${prod.unidad_medida || 'uds'}${motivo ? ` (${motivo})` : ''}`);

    // Notificar si el nuevo stock quedó por debajo del mínimo
    if (prod.stock_minimo > 0 && nuevoStock <= prod.stock_minimo) {
      Notif.notifyManagers('warning', `Stock bajo: ${prod.nombre}`,
        `Stock actual: ${nuevoStock} ${prod.unidad_medida || 'uds'} (mínimo: ${prod.stock_minimo})`, '#/productos');
    }
  },
};

export default ProductosPage;
