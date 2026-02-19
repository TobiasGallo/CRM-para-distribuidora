/* ========================================
   PÁGINA CLIENTES - CRUD COMPLETO
   Multi-tenant: RLS filtra automáticamente
   ======================================== */

import supabase from '../config/supabase.js';
import Toast from '../utils/toast.js';
import Permissions from '../utils/permissions.js';
import CSV from '../utils/csv.js';
import Validate from '../utils/validate.js';
import ImportCSV from '../utils/import-csv.js';

const ITEMS_PER_PAGE = 15;

const ClientesPage = {
  // Estado local
  clientes: [],
  vendedores: [],
  listasPrecios: [],
  totalCount: 0,
  currentPage: 0,
  filters: { search: '', tipo: '', estado: '', fechaDesde: '', fechaHasta: '', scoringMin: '', scoringMax: '', vendedor: '' },
  sortField: 'created_at',
  sortAsc: false,
  editingId: null, // null = crear nuevo, uuid = editando

  async render(container) {
    this.container = container;

    container.innerHTML = `
      <div class="clientes-header">
        <div>
          <h1>Clientes</h1>
          <p>Gestion\u00e1 tus clientes y prospectos</p>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button class="btn btn-export" id="btnExportClientes" title="Exportar a CSV">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            CSV
          </button>
          ${Permissions.can('crear', 'clientes') ? `
          <button class="btn btn-export" id="btnImportClientes" title="Importar desde CSV">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line><line x1="12" y1="3" x2="12" y2="15" style="stroke-dasharray:4"></line></svg>
            Importar
          </button>
          <button class="btn btn-primary" id="btnNuevoCliente">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nuevo Cliente
          </button>` : ''}
        </div>
      </div>

      <!-- Filtros -->
      <div class="clientes-filters">
        <div class="clientes-search">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" class="form-input" id="searchClientes" placeholder="Buscar por nombre, ciudad, tel\u00e9fono...">
        </div>
        <select id="filterTipo">
          <option value="">Todos los tipos</option>
          <option value="horeca">HORECA</option>
          <option value="supermercado">Supermercado</option>
          <option value="tienda">Tienda</option>
          <option value="mayorista">Mayorista</option>
        </select>
        <select id="filterEstado">
          <option value="">Todos los estados</option>
          <option value="prospecto">Prospecto</option>
          <option value="negociacion">Negociaci\u00f3n</option>
          <option value="activo">Activo</option>
          <option value="en_pausa">En Pausa</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <button class="advanced-filters-toggle" id="advFiltersToggle">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line></svg>
          Avanzados <span class="toggle-arrow">▼</span>
        </button>
      </div>

      <div class="advanced-filters-panel" id="advFiltersPanel">
        <div class="adv-filters-grid">
          <div class="adv-filter-group">
            <label>Última compra desde</label>
            <input type="date" class="form-input" id="filterFechaDesde">
          </div>
          <div class="adv-filter-group">
            <label>Última compra hasta</label>
            <input type="date" class="form-input" id="filterFechaHasta">
          </div>
          <div class="adv-filter-group">
            <label>Scoring mínimo</label>
            <input type="number" class="form-input" id="filterScoringMin" min="0" max="100" placeholder="0">
          </div>
          <div class="adv-filter-group">
            <label>Scoring máximo</label>
            <input type="number" class="form-input" id="filterScoringMax" min="0" max="100" placeholder="100">
          </div>
          <div class="adv-filter-group">
            <label>Vendedor asignado</label>
            <select id="filterVendedor">
              <option value="">Todos</option>
            </select>
          </div>
        </div>
        <div class="adv-filters-actions">
          <button class="btn btn-sm" id="btnApplyAdvFilters">Aplicar</button>
          <button class="btn btn-sm btn-ghost" id="btnClearAdvFilters">Limpiar filtros</button>
          <div class="filter-presets-wrapper">
            <select id="filterPresetSelect">
              <option value="">Filtros guardados...</option>
            </select>
            <button class="btn btn-sm btn-ghost" id="btnSavePreset">Guardar</button>
          </div>
        </div>
      </div>

      <div class="active-filters-badges" id="activeFiltersBadges"></div>

      <div class="clientes-count" id="clientesCount"></div>

      <!-- Tabla -->
      <div class="card">
        <div class="clientes-table-wrapper">
          <table class="clientes-table">
            <thead>
              <tr>
                <th class="th-sortable" data-sort="nombre_establecimiento">Cliente <span class="sort-icon">\u2195</span></th>
                <th class="th-sortable" data-sort="tipo_cliente">Tipo <span class="sort-icon">\u2195</span></th>
                <th class="th-sortable" data-sort="estado_lead">Estado <span class="sort-icon">\u2195</span></th>
                <th>Tel\u00e9fono</th>
                <th class="th-sortable" data-sort="saldo_pendiente">Cr\u00e9dito <span class="sort-icon">\u2195</span></th>
                <th class="th-sortable" data-sort="scoring">Scoring <span class="sort-icon">\u2195</span></th>
                <th></th>
              </tr>
            </thead>
            <tbody id="clientesTableBody">
              <tr><td colspan="7"><div class="loader"><div class="spinner"></div></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="paginacion" id="paginacion"></div>

      <!-- Contenedor para modales -->
      <div id="modalContainer"></div>
    `;

    // Cargar datos auxiliares y clientes
    await Promise.all([
      this.loadVendedores(),
      this.loadListasPrecios(),
    ]);
    this._restoreFilters();
    await this.loadClientes();
    this.initEvents();
  },

  // ========================================
  // CARGA DE DATOS
  // ========================================

  async loadClientes() {
    sessionStorage.setItem('crm_filters_clientes', JSON.stringify(this.filters));
    try {
      let query = supabase
        .from('clientes')
        .select('*, vendedor:vendedor_asignado_id(id, nombre), lista:lista_precios_id(id, nombre)', { count: 'exact' });

      // Aplicar filtros
      if (this.filters.search) {
        const s = `%${this.filters.search}%`;
        query = query.or(`nombre_establecimiento.ilike.${s},ciudad.ilike.${s},telefono.ilike.${s},email.ilike.${s}`);
      }
      if (this.filters.tipo) {
        query = query.eq('tipo_cliente', this.filters.tipo);
      }
      if (this.filters.estado) {
        query = query.eq('estado_lead', this.filters.estado);
      }
      // Filtros avanzados
      if (this.filters.fechaDesde) {
        query = query.gte('fecha_ultima_compra', this.filters.fechaDesde);
      }
      if (this.filters.fechaHasta) {
        query = query.lte('fecha_ultima_compra', this.filters.fechaHasta);
      }
      if (this.filters.scoringMin) {
        query = query.gte('scoring', parseInt(this.filters.scoringMin));
      }
      if (this.filters.scoringMax) {
        query = query.lte('scoring', parseInt(this.filters.scoringMax));
      }
      if (this.filters.vendedor) {
        query = query.eq('vendedor_asignado_id', this.filters.vendedor);
      }

      // Paginación
      const from = this.currentPage * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      query = query.order(this.sortField, { ascending: this.sortAsc }).range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      this.clientes = data || [];
      this.totalCount = count || 0;

      this.renderTable();
      this.renderPagination();
      this.renderCount();
    } catch (err) {
      console.error('Error cargando clientes:', err);
      Toast.error('Error al cargar clientes');
    }
  },

  async loadVendedores() {
    try {
      const { data } = await supabase
        .from('usuarios')
        .select('id, nombre')
        .in('rol', ['vendedor', 'gerente', 'admin', 'owner'])
        .eq('activo', true);
      this.vendedores = data || [];
    } catch (err) {
      console.error('Error cargando vendedores:', err);
    }
  },

  async loadListasPrecios() {
    try {
      const { data } = await supabase
        .from('listas_precios')
        .select('id, nombre')
        .eq('activa', true);
      this.listasPrecios = data || [];
    } catch (err) {
      console.error('Error cargando listas de precios:', err);
    }
  },

  // ========================================
  // RENDERIZADO
  // ========================================

  renderTable() {
    const tbody = document.getElementById('clientesTableBody');
    if (!tbody) return;

    if (this.clientes.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="clientes-empty">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <h3>No hay clientes</h3>
              <p>Cre\u00e1 tu primer cliente con el bot\u00f3n "Nuevo Cliente"</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.clientes.map(c => `
      <tr data-id="${c.id}">
        <td>
          <div class="cliente-nombre-cell">
            <div class="cliente-avatar">${this.getInitials(c.nombre_establecimiento)}</div>
            <div>
              <div class="nombre">${this.escapeHtml(c.nombre_establecimiento)}</div>
              <div class="ciudad">${c.ciudad || ''}</div>
            </div>
          </div>
        </td>
        <td><span class="badge-tipo ${c.tipo_cliente}">${this.tipoLabel(c.tipo_cliente)}</span></td>
        <td><span class="badge-estado ${c.estado_lead}">${this.estadoLabel(c.estado_lead)}</span></td>
        <td>${c.telefono || '-'}</td>
        <td>${this.renderSemaforo(c)}</td>
        <td>${this.renderScoring(c.scoring)}</td>
        <td>
          <div class="table-actions">
            <button title="Ver ficha" class="btn-ver" data-id="${c.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
            ${Permissions.can('editar', 'clientes') ? `
            <button title="Editar" class="btn-editar" data-id="${c.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>` : ''}
            ${Permissions.can('eliminar', 'clientes') ? `
            <button title="Eliminar" class="btn-eliminar" data-id="${c.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  },

  renderPagination() {
    const container = document.getElementById('paginacion');
    if (!container) return;

    const totalPages = Math.ceil(this.totalCount / ITEMS_PER_PAGE);
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

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
    const el = document.getElementById('clientesCount');
    if (!el) return;
    const from = this.currentPage * ITEMS_PER_PAGE + 1;
    const to = Math.min(from + ITEMS_PER_PAGE - 1, this.totalCount);
    el.textContent = this.totalCount > 0
      ? `Mostrando ${from}-${to} de ${this.totalCount} clientes`
      : 'Sin resultados';
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
    // Toggle panel
    const toggle = document.getElementById('advFiltersToggle');
    const panel = document.getElementById('advFiltersPanel');
    if (toggle && panel) {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        panel.classList.toggle('open');
      });
    }

    // Poblar vendedores en el select avanzado
    const vendSelect = document.getElementById('filterVendedor');
    if (vendSelect && this.vendedores.length) {
      this.vendedores.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = v.nombre;
        vendSelect.appendChild(opt);
      });
    }

    // Aplicar
    document.getElementById('btnApplyAdvFilters')?.addEventListener('click', () => {
      this.filters.fechaDesde = document.getElementById('filterFechaDesde')?.value || '';
      this.filters.fechaHasta = document.getElementById('filterFechaHasta')?.value || '';
      this.filters.scoringMin = document.getElementById('filterScoringMin')?.value || '';
      this.filters.scoringMax = document.getElementById('filterScoringMax')?.value || '';
      this.filters.vendedor = document.getElementById('filterVendedor')?.value || '';
      this.currentPage = 0;
      this.loadClientes();
      this._renderFilterBadges();
    });

    // Limpiar
    document.getElementById('btnClearAdvFilters')?.addEventListener('click', () => {
      this.filters = { search: this.filters.search, tipo: this.filters.tipo, estado: this.filters.estado, fechaDesde: '', fechaHasta: '', scoringMin: '', scoringMax: '', vendedor: '' };
      ['filterFechaDesde', 'filterFechaHasta', 'filterScoringMin', 'filterScoringMax', 'filterVendedor'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      this.currentPage = 0;
      this.loadClientes();
      this._renderFilterBadges();
    });

    // Guardar preset
    document.getElementById('btnSavePreset')?.addEventListener('click', () => {
      const name = prompt('Nombre del filtro:');
      if (!name) return;
      const presets = JSON.parse(localStorage.getItem('crm_filter_presets_clientes') || '[]');
      presets.push({ name, filters: { ...this.filters } });
      localStorage.setItem('crm_filter_presets_clientes', JSON.stringify(presets));
      this._loadPresets();
    });

    // Cargar preset
    document.getElementById('filterPresetSelect')?.addEventListener('change', (e) => {
      const presets = JSON.parse(localStorage.getItem('crm_filter_presets_clientes') || '[]');
      const preset = presets[e.target.value];
      if (!preset) return;
      this.filters = { ...preset.filters };
      // Sync UI
      const el = (id) => document.getElementById(id);
      if (el('searchClientes')) el('searchClientes').value = this.filters.search || '';
      if (el('filterTipo')) el('filterTipo').value = this.filters.tipo || '';
      if (el('filterEstado')) el('filterEstado').value = this.filters.estado || '';
      if (el('filterFechaDesde')) el('filterFechaDesde').value = this.filters.fechaDesde || '';
      if (el('filterFechaHasta')) el('filterFechaHasta').value = this.filters.fechaHasta || '';
      if (el('filterScoringMin')) el('filterScoringMin').value = this.filters.scoringMin || '';
      if (el('filterScoringMax')) el('filterScoringMax').value = this.filters.scoringMax || '';
      if (el('filterVendedor')) el('filterVendedor').value = this.filters.vendedor || '';
      this.currentPage = 0;
      this.loadClientes();
      this._renderFilterBadges();
    });

    this._loadPresets();
  },

  _loadPresets() {
    const select = document.getElementById('filterPresetSelect');
    if (!select) return;
    const presets = JSON.parse(localStorage.getItem('crm_filter_presets_clientes') || '[]');
    select.innerHTML = '<option value="">Filtros guardados...</option>';
    presets.forEach((p, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = p.name;
      select.appendChild(opt);
    });
  },

  _renderFilterBadges() {
    const container = document.getElementById('activeFiltersBadges');
    if (!container) return;
    const badges = [];
    if (this.filters.fechaDesde) badges.push({ key: 'fechaDesde', label: `Desde: ${this.filters.fechaDesde}` });
    if (this.filters.fechaHasta) badges.push({ key: 'fechaHasta', label: `Hasta: ${this.filters.fechaHasta}` });
    if (this.filters.scoringMin) badges.push({ key: 'scoringMin', label: `Scoring ≥ ${this.filters.scoringMin}` });
    if (this.filters.scoringMax) badges.push({ key: 'scoringMax', label: `Scoring ≤ ${this.filters.scoringMax}` });
    if (this.filters.vendedor) {
      const v = this.vendedores.find(v => v.id === this.filters.vendedor);
      badges.push({ key: 'vendedor', label: `Vendedor: ${v?.nombre || '...'}` });
    }
    container.innerHTML = badges.map(b =>
      `<span class="filter-badge">${b.label} <button data-clear="${b.key}">&times;</button></span>`
    ).join('');
    container.querySelectorAll('button[data-clear]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.clear;
        this.filters[key] = '';
        const inputMap = { fechaDesde: 'filterFechaDesde', fechaHasta: 'filterFechaHasta', scoringMin: 'filterScoringMin', scoringMax: 'filterScoringMax', vendedor: 'filterVendedor' };
        const el = document.getElementById(inputMap[key]);
        if (el) el.value = '';
        this.currentPage = 0;
        this.loadClientes();
        this._renderFilterBadges();
      });
    });
  },

  // ========================================
  // HELPERS DE RENDERIZADO
  // ========================================

  getInitials(name) {
    if (!name) return '??';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  tipoLabel(tipo) {
    const labels = { horeca: 'HORECA', supermercado: 'Supermercado', tienda: 'Tienda', mayorista: 'Mayorista' };
    return labels[tipo] || tipo;
  },

  estadoLabel(estado) {
    const labels = { prospecto: 'Prospecto', negociacion: 'Negociaci\u00f3n', activo: 'Activo', en_pausa: 'En Pausa', inactivo: 'Inactivo' };
    return labels[estado] || estado;
  },

  renderSemaforo(cliente) {
    const saldo = Number(cliente.saldo_pendiente || 0);
    if (saldo <= 0) {
      return `<span class="semaforo semaforo-verde"><span class="semaforo-dot"></span> Al d\u00eda</span>`;
    }
    // Tiene deuda: calcular días vencidos desde que expiró el crédito
    const diasCredito = Number(cliente.dias_credito || 30);
    if (!cliente.fecha_ultima_compra) {
      return `<span class="semaforo semaforo-rojo"><span class="semaforo-dot"></span> Moroso</span>`;
    }
    const fechaVence = new Date(cliente.fecha_ultima_compra);
    fechaVence.setDate(fechaVence.getDate() + diasCredito);
    const diasVencido = Math.floor((Date.now() - fechaVence) / 86400000);

    if (diasVencido <= 0) {
      return `<span class="semaforo semaforo-verde"><span class="semaforo-dot"></span> Al d\u00eda</span>`;
    }
    if (diasVencido <= 7) {
      return `<span class="semaforo semaforo-amarillo"><span class="semaforo-dot"></span> Vencido</span>`;
    }
    return `<span class="semaforo semaforo-rojo"><span class="semaforo-dot"></span> Moroso</span>`;
  },

  renderScoring(score) {
    let html = '<div class="scoring-stars">';
    for (let i = 1; i <= 5; i++) {
      html += i <= (score || 0)
        ? '<span class="star-filled">&#9733;</span>'
        : '<span>&#9733;</span>';
    }
    html += '</div>';
    return html;
  },

  getSemaforoClass(cliente) {
    const saldo = Number(cliente.saldo_pendiente || 0);
    if (saldo <= 0) return 'verde';
    const diasCredito = Number(cliente.dias_credito || 30);
    if (!cliente.fecha_ultima_compra) return 'rojo';
    const fechaVence = new Date(cliente.fecha_ultima_compra);
    fechaVence.setDate(fechaVence.getDate() + diasCredito);
    const diasVencido = Math.floor((Date.now() - fechaVence) / 86400000);
    if (diasVencido <= 0) return 'verde';
    if (diasVencido <= 7) return 'amarillo';
    return 'rojo';
  },

  getSemaforoText(clase) {
    const texts = { verde: 'Al d\u00eda - puede comprar sin l\u00edmites', amarillo: 'Factura vencida < 7 d\u00edas', rojo: 'Morosidad > 7 d\u00edas - bloqueado' };
    return texts[clase] || '';
  },

  // ========================================
  // EVENTOS
  // ========================================

  initEvents() {
    // Nuevo cliente
    document.getElementById('btnNuevoCliente')?.addEventListener('click', () => {
      this.editingId = null;
      this.openModal();
    });

    // Exportar CSV
    document.getElementById('btnExportClientes')?.addEventListener('click', () => this.exportCSV());

    // Importar CSV
    document.getElementById('btnImportClientes')?.addEventListener('click', () => ImportCSV.open('clientes'));
    window.addEventListener('crm:import-done', (e) => {
      if (e.detail?.tipo === 'clientes') { this.currentPage = 0; this.loadClientes(); }
    }, { once: true });

    // Búsqueda con debounce
    let searchTimeout;
    document.getElementById('searchClientes')?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.filters.search = e.target.value;
        this.currentPage = 0;
        this.loadClientes();
      }, 350);
    });

    // Filtro tipo
    document.getElementById('filterTipo')?.addEventListener('change', (e) => {
      this.filters.tipo = e.target.value;
      this.currentPage = 0;
      this.loadClientes();
    });

    // Filtro estado
    document.getElementById('filterEstado')?.addEventListener('change', (e) => {
      this.filters.estado = e.target.value;
      this.currentPage = 0;
      this.loadClientes();
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
        this.loadClientes();
      });
    });
    this.updateSortHeaders();

    // Filtros avanzados
    this._initAdvancedFilters();

    // Delegación de eventos en la tabla
    document.getElementById('clientesTableBody')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) {
        // Click en la fila = ver ficha
        const row = e.target.closest('tr[data-id]');
        if (row) this.openFicha(row.dataset.id);
        return;
      }

      const id = btn.dataset.id;
      if (btn.classList.contains('btn-ver')) this.openFicha(id);
      if (btn.classList.contains('btn-editar')) this.openModalEditar(id);
      if (btn.classList.contains('btn-eliminar')) this.confirmarEliminar(id);
    });

    // Paginación
    document.getElementById('paginacion')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn || btn.disabled) return;

      if (btn.classList.contains('pag-prev')) {
        this.currentPage--;
      } else if (btn.classList.contains('pag-next')) {
        this.currentPage++;
      } else if (btn.classList.contains('pag-num')) {
        this.currentPage = parseInt(btn.dataset.page);
      }
      this.loadClientes();
    });
  },

  // ========================================
  // EXPORTAR CSV
  // ========================================

  async exportCSV() {
    try {
      Toast.success('Exportando clientes...');
      // Cargar TODOS los clientes (sin paginación) con los filtros actuales
      let query = supabase
        .from('clientes')
        .select('*, vendedor:vendedor_asignado_id(nombre), lista:lista_precios_id(nombre)');

      if (this.filters.search) {
        const s = `%${this.filters.search}%`;
        query = query.or(`nombre_establecimiento.ilike.${s},ciudad.ilike.${s},telefono.ilike.${s},email.ilike.${s}`);
      }
      if (this.filters.tipo) query = query.eq('tipo_cliente', this.filters.tipo);
      if (this.filters.estado) query = query.eq('estado_lead', this.filters.estado);

      const { data, error } = await query.order('nombre_establecimiento');
      if (error) throw error;

      if (!data || data.length === 0) {
        Toast.warning('No hay clientes para exportar');
        return;
      }

      const moneda = window.App?.organization?.moneda || 'ARS';
      CSV.export(data, [
        { key: 'nombre_establecimiento', label: 'Nombre' },
        { key: 'razon_social', label: 'Razón Social' },
        { key: 'tipo_cliente', label: 'Tipo' },
        { key: 'estado_lead', label: 'Estado' },
        { key: 'telefono', label: 'Teléfono' },
        { key: 'email', label: 'Email' },
        { key: 'direccion_completa', label: 'Dirección' },
        { key: 'ciudad', label: 'Ciudad' },
        { key: 'provincia', label: 'Provincia' },
        { key: 'vendedor.nombre', label: 'Vendedor' },
        { key: 'lista.nombre', label: 'Lista de Precios' },
        { label: `Línea Crédito (${moneda})`, format: r => r.linea_credito || 0 },
        { label: `Saldo Pendiente (${moneda})`, format: r => r.saldo_pendiente || 0 },
        { key: 'scoring', label: 'Scoring' },
        { key: 'dias_reparto', label: 'Días Reparto' },
      ], 'clientes');

      Toast.success(`${data.length} clientes exportados`);
    } catch (err) {
      console.error('Error exportando CSV:', err);
      Toast.error('Error al exportar');
    }
  },

  // ========================================
  // MODAL CREAR / EDITAR
  // ========================================

  openModal(clienteData = null) {
    const isEdit = !!clienteData;
    const c = clienteData || {};
    const moneda = window.App?.organization?.moneda || 'ARS';

    const diasRepartoOptions = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const diasActuales = c.dias_reparto || [];

    document.getElementById('modalContainer').innerHTML = `
      <div class="modal-overlay" id="clienteModal">
        <div class="modal">
          <div class="modal-header">
            <h2>${isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            <button class="modal-close" id="btnCloseModal">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="modal-body">
            <form id="formCliente">
              <!-- DATOS PRINCIPALES -->
              <div class="form-section">
                <div class="form-section-title">Datos principales</div>
                <div class="form-group">
                  <label class="form-label">Nombre del establecimiento *</label>
                  <input type="text" class="form-input" name="nombre_establecimiento" value="${this.escapeHtml(c.nombre_establecimiento || '')}" required>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Raz\u00f3n social</label>
                    <input type="text" class="form-input" name="razon_social" value="${this.escapeHtml(c.razon_social || '')}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Tipo de cliente *</label>
                    <select class="form-input" name="tipo_cliente" required>
                      <option value="">Seleccionar...</option>
                      <option value="horeca" ${c.tipo_cliente === 'horeca' ? 'selected' : ''}>HORECA</option>
                      <option value="supermercado" ${c.tipo_cliente === 'supermercado' ? 'selected' : ''}>Supermercado</option>
                      <option value="tienda" ${c.tipo_cliente === 'tienda' ? 'selected' : ''}>Tienda</option>
                      <option value="mayorista" ${c.tipo_cliente === 'mayorista' ? 'selected' : ''}>Mayorista</option>
                    </select>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Estado</label>
                    <select class="form-input" name="estado_lead">
                      <option value="prospecto" ${c.estado_lead === 'prospecto' || !c.estado_lead ? 'selected' : ''}>Prospecto</option>
                      <option value="negociacion" ${c.estado_lead === 'negociacion' ? 'selected' : ''}>Negociaci\u00f3n</option>
                      <option value="activo" ${c.estado_lead === 'activo' ? 'selected' : ''}>Activo</option>
                      <option value="en_pausa" ${c.estado_lead === 'en_pausa' ? 'selected' : ''}>En Pausa</option>
                      <option value="inactivo" ${c.estado_lead === 'inactivo' ? 'selected' : ''}>Inactivo</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Vendedor asignado</label>
                    <select class="form-input" name="vendedor_asignado_id">
                      <option value="">Sin asignar</option>
                      ${this.vendedores.map(v => `<option value="${v.id}" ${c.vendedor_asignado_id === v.id ? 'selected' : ''}>${this.escapeHtml(v.nombre)}</option>`).join('')}
                    </select>
                  </div>
                </div>
              </div>

              <!-- CONTACTO -->
              <div class="form-section">
                <div class="form-section-title">Contacto</div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Tel\u00e9fono</label>
                    <input type="tel" class="form-input" name="telefono" value="${c.telefono || ''}" placeholder="+54 9 11 1234-5678">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" name="email" value="${c.email || ''}">
                  </div>
                </div>
              </div>

              <!-- UBICACIÓN -->
              <div class="form-section">
                <div class="form-section-title">Ubicaci\u00f3n</div>
                <div class="form-group">
                  <label class="form-label">Direcci\u00f3n completa</label>
                  <input type="text" class="form-input" name="direccion_completa" value="${this.escapeHtml(c.direccion_completa || '')}">
                </div>
                <div class="form-row-3">
                  <div class="form-group">
                    <label class="form-label">Ciudad</label>
                    <input type="text" class="form-input" name="ciudad" value="${this.escapeHtml(c.ciudad || '')}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Provincia</label>
                    <input type="text" class="form-input" name="provincia" value="${this.escapeHtml(c.provincia || '')}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">C\u00f3digo Postal</label>
                    <input type="text" class="form-input" name="codigo_postal" value="${c.codigo_postal || ''}">
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Ubicaci\u00f3n GPS (lat,lng)</label>
                  <input type="text" class="form-input" name="ubicacion_gps" value="${c.ubicacion_gps || ''}" placeholder="-34.6037,-58.3816">
                </div>
              </div>

              <!-- LOGÍSTICA -->
              <div class="form-section">
                <div class="form-section-title">Log\u00edstica</div>
                <div class="form-group">
                  <label class="form-label">D\u00edas de reparto</label>
                  <div style="display:flex;flex-wrap:wrap;gap:0.75rem;">
                    ${diasRepartoOptions.map(d => `
                      <label class="form-check">
                        <input type="checkbox" name="dias_reparto" value="${d}" ${diasActuales.includes(d) ? 'checked' : ''}>
                        ${d.charAt(0).toUpperCase() + d.slice(1)}
                      </label>
                    `).join('')}
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Ventana horaria inicio</label>
                    <input type="time" class="form-input" name="ventana_horaria_inicio" value="${c.ventana_horaria_inicio || ''}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Ventana horaria fin</label>
                    <input type="time" class="form-input" name="ventana_horaria_fin" value="${c.ventana_horaria_fin || ''}">
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">D\u00eda de visita del vendedor</label>
                  <input type="text" class="form-input" name="dia_visita_vendedor" value="${this.escapeHtml(c.dia_visita_vendedor || '')}" placeholder="Ej: Lunes y Jueves">
                </div>
                <div style="display:flex;gap:1.5rem;flex-wrap:wrap;margin-top:0.5rem;">
                  <label class="form-check">
                    <input type="checkbox" name="tiene_camara_frio" ${c.tiene_camara_frio ? 'checked' : ''}>
                    Tiene c\u00e1mara de fr\u00edo
                  </label>
                  <label class="form-check">
                    <input type="checkbox" name="requiere_congelado" ${c.requiere_congelado ? 'checked' : ''}>
                    Requiere congelado
                  </label>
                  <label class="form-check">
                    <input type="checkbox" name="requiere_seco" ${c.requiere_seco ? 'checked' : ''}>
                    Requiere seco
                  </label>
                </div>
                <div class="form-group" style="margin-top:0.75rem;">
                  <label class="form-label">Observaciones de entrega</label>
                  <textarea class="form-input" name="observaciones_entrega" rows="2" placeholder="Ej: Entrar por el port\u00f3n trasero...">${this.escapeHtml(c.observaciones_entrega || '')}</textarea>
                </div>
              </div>

              <!-- FINANCIERO -->
              <div class="form-section">
                <div class="form-section-title">Financiero</div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Lista de precios</label>
                    <select class="form-input" name="lista_precios_id">
                      <option value="">Sin lista</option>
                      ${this.listasPrecios.map(l => `<option value="${l.id}" ${c.lista_precios_id === l.id ? 'selected' : ''}>${this.escapeHtml(l.nombre)}</option>`).join('')}
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">M\u00e9todo de pago preferido</label>
                    <select class="form-input" name="metodo_pago_preferido">
                      <option value="">Seleccionar...</option>
                      <option value="transferencia" ${c.metodo_pago_preferido === 'transferencia' ? 'selected' : ''}>Transferencia</option>
                      <option value="efectivo" ${c.metodo_pago_preferido === 'efectivo' ? 'selected' : ''}>Efectivo</option>
                      <option value="recibo_domiciliado" ${c.metodo_pago_preferido === 'recibo_domiciliado' ? 'selected' : ''}>Recibo domiciliado</option>
                      <option value="tarjeta" ${c.metodo_pago_preferido === 'tarjeta' ? 'selected' : ''}>Tarjeta</option>
                    </select>
                  </div>
                </div>
                <div class="form-row-3">
                  <div class="form-group">
                    <label class="form-label">L\u00ednea de cr\u00e9dito (${moneda})</label>
                    <input type="number" class="form-input" name="linea_credito" value="${c.linea_credito || 0}" min="0" step="0.01">
                  </div>
                  <div class="form-group">
                    <label class="form-label">D\u00edas de cr\u00e9dito</label>
                    <input type="number" class="form-input" name="dias_credito" value="${c.dias_credito || 0}" min="0">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Saldo pendiente (${moneda})</label>
                    <input type="number" class="form-input" name="saldo_pendiente" value="${c.saldo_pendiente || 0}" min="0" step="0.01">
                  </div>
                </div>
              </div>

              <!-- SCORING -->
              <div class="form-section">
                <div class="form-section-title">Scoring</div>
                <div class="form-group">
                  <label class="form-label">Calificaci\u00f3n (0-5)</label>
                  <select class="form-input" name="scoring" style="max-width:120px;">
                    ${[0,1,2,3,4,5].map(i => `<option value="${i}" ${(c.scoring || 0) === i ? 'selected' : ''}>${i} ${'★'.repeat(i)}</option>`).join('')}
                  </select>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btnCancelModal">Cancelar</button>
            <button class="btn btn-primary" id="btnSaveCliente">${isEdit ? 'Guardar Cambios' : 'Crear Cliente'}</button>
          </div>
        </div>
      </div>
    `;

    // Eventos del modal
    document.getElementById('btnCloseModal').addEventListener('click', () => this.closeModal());
    document.getElementById('btnCancelModal').addEventListener('click', () => this.closeModal());
    document.getElementById('btnSaveCliente').addEventListener('click', () => this.saveCliente());

    // Validación en tiempo real
    const clienteRules = {
      nombre_establecimiento: { required: true, minLength: 2, label: 'Nombre' },
      tipo_cliente: { required: true, label: 'Tipo de cliente' },
      email: { type: 'email', label: 'Email' },
      telefono: { type: 'phone', label: 'Teléfono' },
    };
    Validate.bindRealtime(document.getElementById('formCliente'), clienteRules);

    // Cerrar al hacer click fuera
    document.getElementById('clienteModal').addEventListener('click', (e) => {
      if (e.target.id === 'clienteModal') this.closeModal();
    });

    // Cerrar con Escape
    this._escHandler = (e) => { if (e.key === 'Escape') this.closeModal(); };
    document.addEventListener('keydown', this._escHandler);
  },

  closeModal() {
    document.getElementById('modalContainer').innerHTML = '';
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }
  },

  async openModalEditar(id) {
    const cliente = this.clientes.find(c => c.id === id);
    if (!cliente) return;
    this.editingId = id;
    this.openModal(cliente);
  },

  // ========================================
  // GUARDAR / ELIMINAR
  // ========================================

  async saveCliente() {
    const form = document.getElementById('formCliente');

    // Validación inline
    const rules = {
      nombre_establecimiento: { required: true, minLength: 2, label: 'Nombre' },
      tipo_cliente: { required: true, label: 'Tipo de cliente' },
      email: { type: 'email', label: 'Email' },
      telefono: { type: 'phone', label: 'Teléfono' },
    };
    if (!Validate.form(form, rules)) return;

    const formData = new FormData(form);

    // Construir objeto
    const orgId = window.App?.userProfile?.organizacion_id;
    if (!orgId) {
      Toast.error('No se pudo determinar la organización. Recargá la página.');
      return;
    }

    const data = {
      organizacion_id: orgId,
      nombre_establecimiento: formData.get('nombre_establecimiento').trim(),
      razon_social: formData.get('razon_social')?.trim() || null,
      tipo_cliente: formData.get('tipo_cliente'),
      estado_lead: formData.get('estado_lead'),
      telefono: formData.get('telefono')?.trim() || null,
      email: formData.get('email')?.trim() || null,
      direccion_completa: formData.get('direccion_completa')?.trim() || null,
      ciudad: formData.get('ciudad')?.trim() || null,
      provincia: formData.get('provincia')?.trim() || null,
      codigo_postal: formData.get('codigo_postal')?.trim() || null,
      ubicacion_gps: formData.get('ubicacion_gps')?.trim() || null,
      dias_reparto: formData.getAll('dias_reparto'),
      ventana_horaria_inicio: formData.get('ventana_horaria_inicio') || null,
      ventana_horaria_fin: formData.get('ventana_horaria_fin') || null,
      dia_visita_vendedor: formData.get('dia_visita_vendedor')?.trim() || null,
      tiene_camara_frio: form.querySelector('[name="tiene_camara_frio"]').checked,
      requiere_congelado: form.querySelector('[name="requiere_congelado"]').checked,
      requiere_seco: form.querySelector('[name="requiere_seco"]').checked,
      observaciones_entrega: formData.get('observaciones_entrega')?.trim() || null,
      lista_precios_id: formData.get('lista_precios_id') || null,
      metodo_pago_preferido: formData.get('metodo_pago_preferido') || null,
      linea_credito: parseFloat(formData.get('linea_credito')) || 0,
      dias_credito: parseInt(formData.get('dias_credito')) || 0,
      saldo_pendiente: parseFloat(formData.get('saldo_pendiente')) || 0,
      vendedor_asignado_id: formData.get('vendedor_asignado_id') || null,
      scoring: parseInt(formData.get('scoring')) || 0,
    };

    const btn = document.getElementById('btnSaveCliente');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
      if (this.editingId) {
        // EDITAR - no enviar organizacion_id en update
        const { organizacion_id, ...updateData } = data;
        const { error } = await supabase
          .from('clientes')
          .update(updateData)
          .eq('id', this.editingId);
        if (error) throw error;
        Toast.success('Cliente actualizado');
      } else {
        // CREAR
        const { error } = await supabase
          .from('clientes')
          .insert(data);
        if (error) throw error;
        Toast.success('Cliente creado');
      }

      this.closeModal();
      this.loadClientes();
    } catch (err) {
      console.error('Error guardando cliente:', err);
      Toast.error(err.message || 'Error al guardar');
      btn.disabled = false;
      btn.textContent = this.editingId ? 'Guardar Cambios' : 'Crear Cliente';
    }
  },

  async confirmarEliminar(id) {
    const cliente = this.clientes.find(c => c.id === id);
    if (!cliente) return;

    document.getElementById('modalContainer').innerHTML = `
      <div class="modal-overlay" id="deleteModal">
        <div class="modal" style="max-width:450px;">
          <div class="modal-header">
            <h2>Eliminar cliente</h2>
            <button class="modal-close" id="btnCloseDelete">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="modal-body">
            <p>\u00bfEst\u00e1s seguro de que quer\u00e9s eliminar a <strong>${this.escapeHtml(cliente.nombre_establecimiento)}</strong>?</p>
            <p style="color:var(--gray-500);font-size:var(--font-size-sm);margin-top:0.5rem;">Esta acci\u00f3n no se puede deshacer. Se eliminar\u00e1n tambi\u00e9n los pedidos, interacciones y oportunidades asociadas.</p>
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
        const { error } = await supabase.from('clientes').delete().eq('id', id);
        if (error) throw error;
        Toast.success('Cliente eliminado');
        this.closeModal();
        this.loadClientes();
      } catch (err) {
        console.error('Error eliminando cliente:', err);
        Toast.error(err.message || 'Error al eliminar');
      }
    });

    document.getElementById('deleteModal').addEventListener('click', (e) => {
      if (e.target.id === 'deleteModal') this.closeModal();
    });
  },

  // ========================================
  // FICHA DEL CLIENTE (Vista Detalle)
  // ========================================

  async openFicha(id) {
    const cliente = this.clientes.find(c => c.id === id);
    if (!cliente) return;

    this._fichaClienteId = id;
    this._fichaCliente = cliente;
    const moneda = window.App?.organization?.moneda || 'ARS';
    const semaforoClass = this.getSemaforoClass(cliente);
    const semaforoText = this.getSemaforoText(semaforoClass);
    const metodoPagoLabels = { transferencia: 'Transferencia', efectivo: 'Efectivo', recibo_domiciliado: 'Recibo domiciliado', tarjeta: 'Tarjeta' };

    document.getElementById('modalContainer').innerHTML = `
      <div class="modal-overlay" id="fichaModal">
        <div class="modal" style="max-width:900px;">
          <div class="modal-header">
            <h2>Ficha — ${this.escapeHtml(cliente.nombre_establecimiento)}</h2>
            <button class="modal-close" id="btnCloseFicha">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="modal-body">
            <!-- Tabs internos -->
            <div class="modal-inner-tabs">
              <button class="modal-inner-tab active" data-ficha-tab="datos">Datos</button>
              <button class="modal-inner-tab" data-ficha-tab="cobros">
                Cobros
                <span class="tab-count-badge" id="cobrosTabBadge" style="display:none"></span>
              </button>
              <button class="modal-inner-tab" data-ficha-tab="interacciones">
                Timeline
                <span class="tab-count-badge" id="interacTabBadge" style="display:none"></span>
              </button>
              <button class="modal-inner-tab" data-ficha-tab="notas">Notas</button>
              <button class="modal-inner-tab" data-ficha-tab="pedidos">
                Pedidos
                <span class="tab-count-badge" id="pedidosTabBadge" style="display:none"></span>
              </button>
            </div>

            <!-- Panel Datos -->
            <div class="ficha-tab-panel active" id="panelDatos">
            <div class="cliente-detalle">
              <!-- Cabecera -->
              <div class="cliente-ficha-header">
                <div class="cliente-ficha-info">
                  <div class="cliente-ficha-avatar">${this.getInitials(cliente.nombre_establecimiento)}</div>
                  <div class="cliente-ficha-nombre">
                    <h2>${this.escapeHtml(cliente.nombre_establecimiento)}</h2>
                    <div class="meta">
                      <span class="badge-tipo ${cliente.tipo_cliente}">${this.tipoLabel(cliente.tipo_cliente)}</span>
                      <span class="badge-estado ${cliente.estado_lead}">${this.estadoLabel(cliente.estado_lead)}</span>
                      ${this.renderScoring(cliente.scoring)}
                    </div>
                  </div>
                </div>
                <div class="acciones-rapidas">
                  ${cliente.telefono ? `
                    <a class="btn-accion whatsapp" href="https://wa.me/${cliente.telefono.replace(/[^0-9]/g, '')}" target="_blank">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.558 4.142 1.535 5.883L0 24l6.305-1.654A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82c-1.98 0-3.865-.53-5.526-1.483l-.396-.235-4.108 1.077 1.097-4.006-.258-.41A9.786 9.786 0 012.18 12c0-5.422 4.398-9.82 9.82-9.82 5.422 0 9.82 4.398 9.82 9.82 0 5.422-4.398 9.82-9.82 9.82z"/></svg>
                      WhatsApp
                    </a>
                    <a class="btn-accion llamar" href="tel:${cliente.telefono}">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      Llamar
                    </a>
                  ` : ''}
                  ${cliente.email ? `
                    <a class="btn-accion email" href="mailto:${cliente.email}">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      Email
                    </a>
                  ` : ''}
                  ${cliente.ubicacion_gps ? `
                    <a class="btn-accion maps" href="https://www.google.com/maps/search/?api=1&query=${cliente.ubicacion_gps}" target="_blank">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="3"></circle><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"></path></svg>
                      Mapa
                    </a>
                  ` : ''}
                </div>
              </div>

              <!-- Semáforo -->
              <div class="semaforo-grande ${semaforoClass}">
                <span class="semaforo-dot"></span>
                ${semaforoText}
              </div>

              <!-- Grid de información -->
              <div class="ficha-grid">
                <!-- Datos generales -->
                <div class="ficha-section">
                  <div class="ficha-section-header">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    Datos Generales
                  </div>
                  <div class="ficha-section-body">
                    <div class="ficha-field"><span class="label">Raz\u00f3n Social</span><span class="value">${cliente.razon_social || '-'}</span></div>
                    <div class="ficha-field"><span class="label">Tel\u00e9fono</span><span class="value">${cliente.telefono || '-'}</span></div>
                    <div class="ficha-field"><span class="label">Email</span><span class="value">${cliente.email || '-'}</span></div>
                    <div class="ficha-field"><span class="label">Direcci\u00f3n</span><span class="value">${cliente.direccion_completa || '-'}</span></div>
                    <div class="ficha-field"><span class="label">Ciudad</span><span class="value">${cliente.ciudad || '-'}</span></div>
                    <div class="ficha-field"><span class="label">Provincia</span><span class="value">${cliente.provincia || '-'}</span></div>
                    <div class="ficha-field"><span class="label">Vendedor</span><span class="value">${cliente.vendedor?.nombre || 'Sin asignar'}</span></div>
                  </div>
                </div>

                <!-- Logística -->
                <div class="ficha-section">
                  <div class="ficha-section-header">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                    Log\u00edstica
                  </div>
                  <div class="ficha-section-body">
                    <div class="ficha-field"><span class="label">D\u00edas de reparto</span><span class="value">${(cliente.dias_reparto || []).map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ') || '-'}</span></div>
                    <div class="ficha-field"><span class="label">Ventana horaria</span><span class="value">${cliente.ventana_horaria_inicio && cliente.ventana_horaria_fin ? `${cliente.ventana_horaria_inicio} - ${cliente.ventana_horaria_fin}` : '-'}</span></div>
                    <div class="ficha-field"><span class="label">Visita vendedor</span><span class="value">${cliente.dia_visita_vendedor || '-'}</span></div>
                    <div class="ficha-field"><span class="label">C\u00e1mara de fr\u00edo</span><span class="value">${cliente.tiene_camara_frio ? 'S\u00ed' : 'No'}</span></div>
                    <div class="ficha-field"><span class="label">Req. congelado</span><span class="value">${cliente.requiere_congelado ? 'S\u00ed' : 'No'}</span></div>
                    <div class="ficha-field"><span class="label">Req. seco</span><span class="value">${cliente.requiere_seco ? 'S\u00ed' : 'No'}</span></div>
                    ${cliente.observaciones_entrega ? `<div class="ficha-field" style="flex-direction:column;gap:0.25rem;"><span class="label">Observaciones</span><span class="value" style="text-align:left;">${this.escapeHtml(cliente.observaciones_entrega)}</span></div>` : ''}
                  </div>
                </div>

                <!-- Financiero -->
                <div class="ficha-section">
                  <div class="ficha-section-header">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    Financiero
                  </div>
                  <div class="ficha-section-body">
                    <div class="ficha-field"><span class="label">Lista de precios</span><span class="value">${cliente.lista?.nombre || 'Sin asignar'}</span></div>
                    <div class="ficha-field"><span class="label">L\u00ednea de cr\u00e9dito</span><span class="value">${moneda} ${Number(cliente.linea_credito || 0).toLocaleString('es-AR')}</span></div>
                    <div class="ficha-field"><span class="label">D\u00edas de cr\u00e9dito</span><span class="value">${cliente.dias_credito || 0} d\u00edas</span></div>
                    <div class="ficha-field"><span class="label">Saldo pendiente</span><span class="value">${moneda} ${Number(cliente.saldo_pendiente || 0).toLocaleString('es-AR')}</span></div>
                    <div class="ficha-field"><span class="label">M\u00e9todo de pago</span><span class="value">${metodoPagoLabels[cliente.metodo_pago_preferido] || '-'}</span></div>
                    <div class="ficha-field"><span class="label">\u00daltima compra</span><span class="value">${cliente.fecha_ultima_compra ? new Date(cliente.fecha_ultima_compra).toLocaleDateString('es-AR') : 'Sin compras'}</span></div>
                  </div>
                </div>

                <!-- Métricas -->
                <div class="ficha-section">
                  <div class="ficha-section-header">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                    M\u00e9tricas
                  </div>
                  <div class="ficha-section-body">
                    <div class="ficha-field"><span class="label">Scoring</span><span class="value">${this.renderScoring(cliente.scoring)}</span></div>
                    <div class="ficha-field"><span class="label">Cliente desde</span><span class="value">${new Date(cliente.created_at).toLocaleDateString('es-AR')}</span></div>
                    <div class="ficha-field"><span class="label">\u00daltima actualizaci\u00f3n</span><span class="value">${new Date(cliente.updated_at).toLocaleDateString('es-AR')}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
            </div><!-- /cliente-detalle -->
            </div><!-- /panelDatos -->

            <!-- Panel Cobros -->
            <div class="ficha-tab-panel" id="panelCobros">
              <div class="cobros-saldo-box ${Number(cliente.saldo_pendiente) > 0 ? 'deuda' : 'saldo-ok'}" id="cobrosBoxSaldo">
                <span class="saldo-label">Saldo pendiente actual</span>
                <span class="saldo-valor" id="cobrosValorSaldo">${moneda} ${Number(cliente.saldo_pendiente || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div class="cobros-list" id="cobrosList">
                <div class="text-center text-muted" style="padding:1rem">Cargando cobros...</div>
              </div>
              ${Permissions.can('crear', 'clientes') ? `
              <button class="btn btn-primary" id="btnNuevoCobro" style="width:100%">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Registrar pago
              </button>` : ''}
            </div>

            <!-- Panel Interacciones -->
            <div class="ficha-tab-panel" id="panelInteracciones">
              <div class="timeline-list" id="timelineList">
                <div class="text-center text-muted" style="padding:1rem">Cargando timeline...</div>
              </div>
              <button class="btn btn-primary" id="btnNuevaInteraccion" style="width:100%">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Nueva interacción
              </button>
            </div>

            <!-- Panel Notas -->
            <div class="ficha-tab-panel" id="panelNotas">
              <div style="padding:0.5rem 0 0.75rem;">
                <label class="form-label" style="font-size:var(--font-size-sm);color:var(--gray-600);">Notas internas del equipo (no visibles al cliente)</label>
                <textarea id="notasInternasTextarea" class="form-input" rows="8" placeholder="Escribí observaciones, acuerdos, detalles importantes sobre este cliente..." style="resize:vertical;">${this.escapeHtml(cliente.notas_internas || '')}</textarea>
              </div>
              <button class="btn btn-primary" id="btnGuardarNotas" style="width:100%">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Guardar notas
              </button>
            </div>

            <!-- Panel Pedidos -->
            <div class="ficha-tab-panel" id="panelPedidos">
              <div style="margin-bottom:0.5rem;display:flex;gap:0.5rem;align-items:center;">
                <select id="filtroPedidosEstado" class="form-input" style="width:auto;font-size:var(--font-size-sm);">
                  <option value="">Todos los estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="en_preparacion">En preparación</option>
                  <option value="en_ruta">En ruta</option>
                  <option value="entregado">Entregado</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="con_incidencia">Con incidencia</option>
                </select>
              </div>
              <div class="ficha-pedidos-list" id="fichasPedidosList">
                <div class="text-center text-muted" style="padding:1.5rem">Cargando pedidos...</div>
              </div>
            </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" id="btnCloseFichaFooter">Cerrar</button>
            <button class="btn btn-primary" id="btnEditarDesdeFicha" data-id="${cliente.id}">Editar</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnCloseFicha').addEventListener('click', () => this.closeModal());
    document.getElementById('btnCloseFichaFooter').addEventListener('click', () => this.closeModal());
    document.getElementById('btnEditarDesdeFicha').addEventListener('click', () => {
      this.closeModal();
      this.openModalEditar(cliente.id);
    });

    document.getElementById('fichaModal').addEventListener('click', (e) => {
      if (e.target.id === 'fichaModal') this.closeModal();
    });

    this._escHandler = (e) => { if (e.key === 'Escape') this.closeModal(); };
    document.addEventListener('keydown', this._escHandler);

    // Tabs internos
    document.querySelectorAll('.modal-inner-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.modal-inner-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.ficha-tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panelId = 'panel' + tab.dataset.fichaTab.charAt(0).toUpperCase() + tab.dataset.fichaTab.slice(1);
        document.getElementById(panelId)?.classList.add('active');
        if (tab.dataset.fichaTab === 'cobros' && !this._cobrosLoaded) {
          this.loadCobros(cliente.id);
        }
        if (tab.dataset.fichaTab === 'interacciones' && !this._interaccionesLoaded) {
          this.loadInteracciones(cliente.id);
        }
        if (tab.dataset.fichaTab === 'pedidos' && !this._pedidosLoaded) {
          this.loadFichaPedidos(cliente.id);
        }
      });
    });

    document.getElementById('btnNuevoCobro')?.addEventListener('click', () => this.openModalCobro(cliente.id));
    document.getElementById('btnNuevaInteraccion')?.addEventListener('click', () => this.openModalInteraccion(cliente.id));
    document.getElementById('btnGuardarNotas')?.addEventListener('click', () => this.saveNotasInternas(cliente.id));

    this._cobrosLoaded = false;
    this._interaccionesLoaded = false;
    this._pedidosLoaded = false;

    document.getElementById('filtroPedidosEstado')?.addEventListener('change', () => {
      this.loadFichaPedidos(cliente.id);
    });
  },
  // ========================================
  // COBROS
  // ========================================

  async loadCobros(clienteId) {
    this._cobrosLoaded = true;
    const list = document.getElementById('cobrosList');
    if (!list) return;

    const moneda = window.App?.organization?.moneda || 'ARS';
    const { data, error } = await supabase
      .from('cobros')
      .select('*, usuario:usuario_id(nombre), pedido:pedido_id(numero_pedido)')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false });

    if (error) {
      list.innerHTML = '<div class="text-center text-muted" style="padding:1rem">Error al cargar cobros</div>';
      return;
    }

    const cobros = data || [];

    // Actualizar badge
    const badge = document.getElementById('cobrosTabBadge');
    if (badge && cobros.length > 0) { badge.textContent = cobros.length; badge.style.display = ''; }

    if (cobros.length === 0) {
      list.innerHTML = `<div class="text-center text-muted" style="padding:1.5rem">Sin cobros registrados</div>`;
      return;
    }

    const metodosLabels = { efectivo: 'Efectivo', transferencia: 'Transferencia', cheque: 'Cheque', tarjeta: 'Tarjeta', otro: 'Otro' };
    list.innerHTML = cobros.map(c => `
      <div class="cobro-item">
        <span class="cobro-fecha">${new Date(c.created_at).toLocaleDateString('es-AR')}</span>
        <span class="cobro-metodo">${metodosLabels[c.metodo] || c.metodo}</span>
        <span class="cobro-ref">${c.pedido ? `<span class="cobro-pedido-link">#${c.pedido.numero_pedido}</span> ` : ''}${this.escapeHtml(c.referencia || c.notas || '—')}</span>
        <span class="cobro-monto">+${moneda} ${Number(c.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
      </div>
    `).join('');
  },

  async openModalCobro(clienteId) {
    const moneda = window.App?.organization?.moneda || 'ARS';

    // Cargar pedidos con saldo pendiente del cliente para vincular
    let pedidoOptions = '<option value="">Sin vincular</option>';
    try {
      const { data: pedsPendientes } = await supabase
        .from('pedidos')
        .select('id, numero_pedido, total, estado')
        .eq('cliente_id', clienteId)
        .in('estado', ['pendiente', 'en_preparacion', 'en_ruta', 'entregado', 'con_incidencia'])
        .order('created_at', { ascending: false })
        .limit(20);
      if (pedsPendientes?.length) {
        pedidoOptions += pedsPendientes.map(p =>
          `<option value="${p.id}">#${p.numero_pedido} — ${this.escapeHtml(p.estado)} — ${moneda} ${Number(p.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</option>`
        ).join('');
      }
    } catch (_) { /* sin pedidos disponibles */ }

    const container = document.createElement('div');
    container.id = 'modalCobro';
    container.className = 'modal-overlay';
    container.innerHTML = `
      <div class="modal" style="max-width:420px;">
        <div class="modal-header">
          <h2>Registrar Pago</h2>
          <button class="modal-close" id="btnCloseCobroModal">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="modal-body">
          <form id="formCobro">
            <div class="form-group">
              <label class="form-label">Monto (${moneda}) *</label>
              <input type="number" class="form-input" name="monto" min="0.01" step="0.01" placeholder="0.00" required>
            </div>
            <div class="form-group">
              <label class="form-label">Método de pago *</label>
              <select class="form-input" name="metodo" required>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="cheque">Cheque</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Pedido vinculado <span style="color:var(--gray-400);font-size:var(--font-size-xs)">(opcional)</span></label>
              <select class="form-input" name="pedido_id">
                ${pedidoOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Referencia (nro. cheque, transferencia, etc.)</label>
              <input type="text" class="form-input" name="referencia" placeholder="Opcional">
            </div>
            <div class="form-group">
              <label class="form-label">Notas</label>
              <textarea class="form-input" name="notas" rows="2" placeholder="Notas opcionales"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btnCancelCobro">Cancelar</button>
          <button class="btn btn-primary" id="btnSaveCobro">Registrar pago</button>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    const close = () => container.remove();
    document.getElementById('btnCloseCobroModal').addEventListener('click', close);
    document.getElementById('btnCancelCobro').addEventListener('click', close);
    container.addEventListener('click', (e) => { if (e.target === container) close(); });

    document.getElementById('btnSaveCobro').addEventListener('click', async () => {
      const btn = document.getElementById('btnSaveCobro');
      const form = document.getElementById('formCobro');
      const monto = parseFloat(form.monto.value);
      if (!monto || monto <= 0) { Toast.error('Ingresá un monto válido'); return; }

      btn.disabled = true; btn.textContent = 'Guardando...';
      await this.saveCobro(clienteId, {
        monto,
        metodo: form.metodo.value,
        pedido_id: form.pedido_id.value || null,
        referencia: form.referencia.value.trim() || null,
        notas: form.notas.value.trim() || null,
      });
      close();
    });
  },

  async saveCobro(clienteId, data) {
    const orgId = window.App?.organization?.id;
    const userId = (await supabase.auth.getUser())?.data?.user?.id;

    const { error: insertErr } = await supabase.from('cobros').insert({
      organizacion_id: orgId,
      cliente_id: clienteId,
      usuario_id: userId,
      monto: data.monto,
      metodo: data.metodo,
      pedido_id: data.pedido_id || null,
      referencia: data.referencia,
      notas: data.notas,
    });

    if (insertErr) { Toast.error('Error al registrar el cobro'); return; }

    // Actualizar saldo_pendiente del cliente
    const clienteActual = this.clientes.find(c => c.id === clienteId);
    const nuevoSaldo = Math.max(0, Number(clienteActual?.saldo_pendiente || 0) - data.monto);
    await supabase.from('clientes').update({ saldo_pendiente: nuevoSaldo }).eq('id', clienteId);

    Toast.success(`Pago de ${data.monto.toLocaleString('es-AR')} registrado`);

    // Actualizar estado local
    if (clienteActual) clienteActual.saldo_pendiente = nuevoSaldo;

    // Refrescar UI de la ficha
    const saldoEl = document.getElementById('cobrosValorSaldo');
    const moneda = window.App?.organization?.moneda || 'ARS';
    if (saldoEl) saldoEl.textContent = `${moneda} ${nuevoSaldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    const box = document.getElementById('cobrosBoxSaldo');
    if (box) {
      box.classList.toggle('deuda', nuevoSaldo > 0);
      box.classList.toggle('saldo-ok', nuevoSaldo <= 0);
    }

    this._cobrosLoaded = false;
    this.loadCobros(clienteId);
    this.loadClientes(); // refrescar tabla
  },

  // ========================================
  // TIMELINE DE INTERACCIONES
  // ========================================

  async loadInteracciones(clienteId) {
    this._interaccionesLoaded = true;
    const list = document.getElementById('timelineList');
    if (!list) return;

    const { data, error } = await supabase
      .from('interacciones')
      .select('*, usuario:usuario_id(nombre)')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      list.innerHTML = '<div class="text-center text-muted" style="padding:1rem">Error al cargar el timeline</div>';
      return;
    }

    const items = data || [];

    const badge = document.getElementById('interacTabBadge');
    if (badge && items.length > 0) { badge.textContent = items.length; badge.style.display = ''; }

    if (items.length === 0) {
      list.innerHTML = `<div class="text-center text-muted" style="padding:1.5rem">Sin interacciones registradas</div>`;
      return;
    }

    const tipoLabel = { llamada: 'Llamada', whatsapp: 'WhatsApp', email: 'Email', visita: 'Visita', nota: 'Nota', incidencia: 'Incidencia' };
    list.innerHTML = items.map(i => `
      <div class="timeline-item tipo-${i.tipo}">
        <div class="timeline-item-header">
          <span class="timeline-tipo-badge">${tipoLabel[i.tipo] || i.tipo}</span>
          ${i.usuario?.nombre ? `<span class="timeline-item-usuario">${this.escapeHtml(i.usuario.nombre)}</span>` : ''}
          ${i.duracion ? `<span class="text-muted" style="font-size:var(--font-size-xs)">${i.duracion} min</span>` : ''}
          <span class="timeline-item-fecha">${new Date(i.created_at).toLocaleDateString('es-AR')} ${new Date(i.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        ${i.contenido ? `<div class="timeline-item-contenido">${this.escapeHtml(i.contenido)}</div>` : ''}
        ${i.resultado ? `<div class="timeline-item-resultado">→ ${this.escapeHtml(i.resultado)}</div>` : ''}
      </div>
    `).join('');
  },

  openModalInteraccion(clienteId) {
    const container = document.createElement('div');
    container.id = 'modalInteraccion';
    container.className = 'modal-overlay';
    container.innerHTML = `
      <div class="modal" style="max-width:460px;">
        <div class="modal-header">
          <h2>Nueva Interacción</h2>
          <button class="modal-close" id="btnCloseInteracModal">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="modal-body">
          <form id="formInteraccion">
            <div class="form-group">
              <label class="form-label">Tipo *</label>
              <select class="form-input" name="tipo" required id="interacTipo">
                <option value="nota">Nota</option>
                <option value="llamada">Llamada</option>
                <option value="visita">Visita</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="incidencia">Incidencia</option>
              </select>
            </div>
            <div class="form-group" id="duracionGroup" style="display:none">
              <label class="form-label">Duración (minutos)</label>
              <input type="number" class="form-input" name="duracion" min="1" placeholder="Ej: 5">
            </div>
            <div class="form-group">
              <label class="form-label">Contenido *</label>
              <textarea class="form-input" name="contenido" rows="3" placeholder="Descripción de la interacción..." required></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Resultado</label>
              <input type="text" class="form-input" name="resultado" placeholder="Ej: Pidió presupuesto, lllamar mañana...">
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btnCancelInterac">Cancelar</button>
          <button class="btn btn-primary" id="btnSaveInterac">Guardar</button>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    // Mostrar duración solo para llamadas
    document.getElementById('interacTipo').addEventListener('change', (e) => {
      document.getElementById('duracionGroup').style.display = e.target.value === 'llamada' ? '' : 'none';
    });

    const close = () => container.remove();
    document.getElementById('btnCloseInteracModal').addEventListener('click', close);
    document.getElementById('btnCancelInterac').addEventListener('click', close);
    container.addEventListener('click', (e) => { if (e.target === container) close(); });

    document.getElementById('btnSaveInterac').addEventListener('click', async () => {
      const btn = document.getElementById('btnSaveInterac');
      const form = document.getElementById('formInteraccion');
      const contenido = form.contenido.value.trim();
      if (!contenido) { Toast.error('El contenido es obligatorio'); return; }

      btn.disabled = true; btn.textContent = 'Guardando...';
      await this.saveInteraccion(clienteId, {
        tipo: form.tipo.value,
        contenido,
        resultado: form.resultado.value.trim() || null,
        duracion: form.duracion ? parseInt(form.duracion.value) || null : null,
      });
      close();
    });
  },

  async saveInteraccion(clienteId, data) {
    const orgId = window.App?.organization?.id;
    const userId = (await supabase.auth.getUser())?.data?.user?.id;

    const { error } = await supabase.from('interacciones').insert({
      organizacion_id: orgId,
      cliente_id: clienteId,
      usuario_id: userId,
      tipo: data.tipo,
      contenido: data.contenido,
      resultado: data.resultado,
      duracion: data.duracion,
    });

    if (error) { Toast.error('Error al guardar la interacción'); return; }

    Toast.success('Interacción registrada');
    this._interaccionesLoaded = false;
    this.loadInteracciones(clienteId);
  },

  // ========================================
  // NOTAS INTERNAS
  // ========================================

  async saveNotasInternas(clienteId) {
    const textarea = document.getElementById('notasInternasTextarea');
    const btn = document.getElementById('btnGuardarNotas');
    if (!textarea || !btn) return;

    const notas = textarea.value.trim();
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    const { error } = await supabase
      .from('clientes')
      .update({ notas_internas: notas || null })
      .eq('id', clienteId);

    btn.disabled = false;
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Guardar notas`;

    if (error) { Toast.error('Error al guardar notas'); return; }

    // Actualizar dato local para que no se pierda si se reabre la ficha
    const clienteLocal = this.clientes.find(c => c.id === clienteId);
    if (clienteLocal) clienteLocal.notas_internas = notas || null;

    Toast.success('Notas guardadas');
  },

  // ========================================
  // PEDIDOS DEL CLIENTE (ficha)
  // ========================================

  async loadFichaPedidos(clienteId) {
    this._pedidosLoaded = true;
    const list = document.getElementById('fichasPedidosList');
    if (!list) return;

    const moneda = window.App?.organization?.moneda || 'ARS';
    const estado = document.getElementById('filtroPedidosEstado')?.value || '';

    let query = supabase
      .from('pedidos')
      .select('id, numero_pedido, estado, total, created_at, fecha_entrega_programada, vendedor:vendedor_id(nombre)')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (estado) query = query.eq('estado', estado);

    const { data, error } = await query;

    if (error) {
      list.innerHTML = '<div class="text-center text-muted" style="padding:1rem">Error al cargar pedidos</div>';
      return;
    }

    const pedidos = data || [];

    // Actualizar badge
    const badge = document.getElementById('pedidosTabBadge');
    if (badge) {
      badge.textContent = pedidos.length;
      badge.style.display = pedidos.length > 0 ? '' : 'none';
    }

    if (pedidos.length === 0) {
      list.innerHTML = `
        <div class="text-center text-muted" style="padding:2rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:.4;margin-bottom:.5rem;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          <p>Sin pedidos${estado ? ' con ese estado' : ''}</p>
        </div>`;
      return;
    }

    const estadoLabels = {
      pendiente: 'Pendiente', en_preparacion: 'En preparación', en_ruta: 'En ruta',
      entregado: 'Entregado', cancelado: 'Cancelado', con_incidencia: 'Con incidencia',
    };

    list.innerHTML = `
      <div class="ficha-pedidos-tabla">
        ${pedidos.map(p => `
          <div class="ficha-pedido-row">
            <div class="ficha-pedido-num">#${p.numero_pedido}</div>
            <div class="ficha-pedido-info">
              <div class="ficha-pedido-fecha">${new Date(p.created_at).toLocaleDateString('es-AR')}</div>
              <span class="badge-estado-pedido ${p.estado}" style="font-size:10px;padding:2px 7px;">
                <span class="dot"></span>${estadoLabels[p.estado] || p.estado}
              </span>
            </div>
            <div class="ficha-pedido-vendedor">${this.escapeHtml(p.vendedor?.nombre || '—')}</div>
            <div class="ficha-pedido-total"><strong>${moneda} ${Number(p.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong></div>
          </div>
        `).join('')}
      </div>
      <div style="font-size:var(--font-size-xs);color:var(--gray-400);text-align:right;margin-top:0.5rem;">
        ${pedidos.length} pedido${pedidos.length !== 1 ? 's' : ''}${pedidos.length === 50 ? ' (mostrando los últimos 50)' : ''}
      </div>
    `;
  },

  // ========================================
  // PERSISTENCIA DE FILTROS
  // ========================================

  _restoreFilters() {
    const saved = sessionStorage.getItem('crm_filters_clientes');
    if (saved) {
      try { this.filters = { ...this.filters, ...JSON.parse(saved) }; } catch {}
    }
    const el = (id) => document.getElementById(id);
    if (el('searchClientes')) el('searchClientes').value = this.filters.search || '';
    if (el('filterTipo')) el('filterTipo').value = this.filters.tipo || '';
    if (el('filterEstado')) el('filterEstado').value = this.filters.estado || '';
    if (el('filterFechaDesde')) el('filterFechaDesde').value = this.filters.fechaDesde || '';
    if (el('filterFechaHasta')) el('filterFechaHasta').value = this.filters.fechaHasta || '';
    if (el('filterScoringMin')) el('filterScoringMin').value = this.filters.scoringMin || '';
    if (el('filterScoringMax')) el('filterScoringMax').value = this.filters.scoringMax || '';
  },

};

export default ClientesPage;
