/* ========================================
   PÁGINA REPORTES - Análisis en profundidad
   Tabs: Ventas, Vendedores, Morosidad,
   Productos, Clientes Inactivos, Entregas
   ======================================== */

import supabase from '../config/supabase.js';
import Toast from '../utils/toast.js';

const ReportesPage = {
  charts: [],
  activeTab: 'ventas',

  async render(container) {
    this.container = container;

    container.innerHTML = `
      <div class="reportes-header">
        <div>
          <h1>Reportes</h1>
          <p>Análisis detallado de tu negocio</p>
        </div>
        <div class="reportes-controls" style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
          <select id="repPeriodo" class="form-input" style="width:auto;">
            <option value="7">\u00daltimos 7 d\u00edas</option>
            <option value="30" selected>\u00daltimos 30 d\u00edas</option>
            <option value="90">\u00daltimos 90 d\u00edas</option>
            <option value="365">\u00daltimo a\u00f1o</option>
            <option value="0">Todo el historial</option>
          </select>
          <button class="btn btn-export" id="btnExportReportePDF" title="Exportar reporte a PDF">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            PDF
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="reportes-tabs">
        <button class="rep-tab active" data-tab="ventas">Ventas</button>
        <button class="rep-tab" data-tab="vendedores">Vendedores</button>
        <button class="rep-tab" data-tab="productos">Productos</button>
        <button class="rep-tab" data-tab="morosidad">Morosidad</button>
        <button class="rep-tab" data-tab="clientes">Clientes Inactivos</button>
        <button class="rep-tab" data-tab="entregas">Entregas</button>
      </div>

      <!-- Contenido del tab -->
      <div id="repContent" class="reportes-content">
        <div class="loader"><div class="spinner"></div></div>
      </div>
    `;

    // Eventos
    container.querySelectorAll('.rep-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.rep-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeTab = tab.dataset.tab;
        this.loadTab();
      });
    });

    document.getElementById('repPeriodo')?.addEventListener('change', () => this.loadTab());

    document.getElementById('btnExportReportePDF')?.addEventListener('click', () => this.exportPDF());

    await this._loadChartJS();
    await this.loadTab();
  },

  getDias() {
    return parseInt(document.getElementById('repPeriodo')?.value || '30');
  },

  getDesde() {
    const dias = this.getDias();
    if (dias === 0) return null;
    const d = new Date();
    d.setDate(d.getDate() - dias);
    return d.toISOString();
  },

  getMoneda() {
    return window.App?.organization?.moneda || 'ARS';
  },

  fmtMoney(n) {
    return `${this.getMoneda()} ${Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  },

  async loadTab() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    const content = document.getElementById('repContent');
    if (!content) return;
    content.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

    try {
      switch (this.activeTab) {
        case 'ventas': await this.tabVentas(content); break;
        case 'vendedores': await this.tabVendedores(content); break;
        case 'productos': await this.tabProductos(content); break;
        case 'morosidad': await this.tabMorosidad(content); break;
        case 'clientes': await this.tabClientesInactivos(content); break;
        case 'entregas': await this.tabEntregas(content); break;
      }
    } catch (err) {
      console.error('Error reporte:', err);
      content.innerHTML = '<div class="rep-empty">Error al cargar el reporte</div>';
    }
  },

  // ========================================
  // TAB: VENTAS
  // ========================================

  async tabVentas(el) {
    const desde = this.getDesde();
    let query = supabase.from('pedidos').select('id, total, estado, created_at, metodo_pago');
    if (desde) query = query.gte('created_at', desde);
    const { data } = await query.order('created_at');
    const pedidos = data || [];

    const entregados = pedidos.filter(p => p.estado === 'entregado');
    const cancelados = pedidos.filter(p => p.estado === 'cancelado');
    const noCancelados = pedidos.filter(p => p.estado !== 'cancelado');
    const totalVentas = noCancelados.reduce((s, p) => s + Number(p.total || 0), 0);
    const totalEntregado = entregados.reduce((s, p) => s + Number(p.total || 0), 0);
    const ticketProm = noCancelados.length > 0 ? totalVentas / noCancelados.length : 0;
    const tasaCancel = pedidos.length > 0 ? ((cancelados.length / pedidos.length) * 100).toFixed(1) : 0;

    // Agrupar por día (sin cancelados)
    const porDia = {};
    noCancelados.forEach(p => {
      const dia = new Date(p.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
      if (!porDia[dia]) porDia[dia] = { total: 0, count: 0 };
      porDia[dia].total += Number(p.total || 0);
      porDia[dia].count += 1;
    });

    // Agrupar por método de pago (sin cancelados)
    const porPago = {};
    noCancelados.forEach(p => {
      const metodo = p.metodo_pago || 'Sin especificar';
      porPago[metodo] = (porPago[metodo] || 0) + 1;
    });

    el.innerHTML = `
      <div class="rep-kpis">
        <div class="rep-kpi">
          <div class="rep-kpi-label">Total Facturado</div>
          <div class="rep-kpi-value">${this.fmtMoney(totalVentas)}</div>
        </div>
        <div class="rep-kpi">
          <div class="rep-kpi-label">Entregado Efectivo</div>
          <div class="rep-kpi-value green">${this.fmtMoney(totalEntregado)}</div>
        </div>
        <div class="rep-kpi">
          <div class="rep-kpi-label">Ticket Promedio</div>
          <div class="rep-kpi-value">${this.fmtMoney(ticketProm)}</div>
        </div>
        <div class="rep-kpi">
          <div class="rep-kpi-label">Pedidos Activos</div>
          <div class="rep-kpi-value">${noCancelados.length}</div>
        </div>
        <div class="rep-kpi">
          <div class="rep-kpi-label">Tasa Cancelación</div>
          <div class="rep-kpi-value ${Number(tasaCancel) > 10 ? 'red' : ''}">${tasaCancel}%</div>
        </div>
      </div>

      <div class="rep-charts-row">
        <div class="rep-chart-card wide">
          <h3>Evolución de Ventas</h3>
          <div class="rep-chart-body"><canvas id="repChartVentas"></canvas></div>
        </div>
        <div class="rep-chart-card">
          <h3>Métodos de Pago</h3>
          <div class="rep-chart-body"><canvas id="repChartPago"></canvas></div>
        </div>
      </div>

      <div class="rep-section">
        <h3>Detalle Diario</h3>
        <div class="rep-table-wrapper">
          <table class="rep-table">
            <thead><tr><th>Fecha</th><th>Pedidos</th><th>Total</th><th>Promedio</th></tr></thead>
            <tbody>
              ${Object.entries(porDia).reverse().map(([dia, d]) => `
                <tr>
                  <td>${dia}</td>
                  <td>${d.count}</td>
                  <td><strong>${this.fmtMoney(d.total)}</strong></td>
                  <td>${this.fmtMoney(d.total / d.count)}</td>
                </tr>
              `).join('') || '<tr><td colspan="4" class="text-center text-muted">Sin datos</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Chart ventas por día
    if (window.Chart && Object.keys(porDia).length > 0) {
      const ctx = document.getElementById('repChartVentas');
      if (ctx) {
        this.charts.push(new Chart(ctx, {
          type: 'bar',
          data: {
            labels: Object.keys(porDia),
            datasets: [{
              label: 'Ventas',
              data: Object.values(porDia).map(d => d.total),
              backgroundColor: 'rgba(37, 99, 235, 0.7)',
              borderRadius: 4,
            }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { callback: v => this.fmtMoney(v) } } },
          },
        }));
      }
    }

    // Chart métodos de pago
    if (window.Chart && Object.keys(porPago).length > 0) {
      const ctx2 = document.getElementById('repChartPago');
      const colores = ['#2563eb', '#16a34a', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];
      if (ctx2) {
        this.charts.push(new Chart(ctx2, {
          type: 'doughnut',
          data: {
            labels: Object.keys(porPago),
            datasets: [{ data: Object.values(porPago), backgroundColor: colores.slice(0, Object.keys(porPago).length), borderWidth: 2, borderColor: '#fff' }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10 } } },
          },
        }));
      }
    }
  },

  // ========================================
  // TAB: VENDEDORES
  // ========================================

  async tabVendedores(el) {
    const desde = this.getDesde();
    const ahora = new Date();
    const mesActual = ahora.getMonth() + 1;
    const anioActual = ahora.getFullYear();

    // Cargar pedidos + metas del mes actual en paralelo
    let queryPed = supabase.from('pedidos').select('total, estado, vendedor:vendedor_id(id, nombre)');
    if (desde) queryPed = queryPed.gte('created_at', desde);

    const [{ data: pedidosData }, { data: metasData }] = await Promise.all([
      queryPed,
      supabase.from('metas_vendedor')
        .select('vendedor_id, meta_monto, vendedor:vendedor_id(id, nombre)')
        .eq('mes', mesActual)
        .eq('anio', anioActual),
    ]);

    const pedidos = pedidosData || [];
    const metas = metasData || [];

    // Mapa de metas por vendedor_id
    const metaMap = {};
    metas.forEach(m => { metaMap[m.vendedor_id] = m.meta_monto; });

    const porVendedor = {};
    pedidos.forEach(p => {
      const nombre = p.vendedor?.nombre || 'Sin asignar';
      const id = p.vendedor?.id || 'none';
      if (!porVendedor[id]) porVendedor[id] = { id, nombre, total: 0, pedidos: 0, entregados: 0, cancelados: 0 };
      porVendedor[id].total += Number(p.total || 0);
      porVendedor[id].pedidos += 1;
      if (p.estado === 'entregado') porVendedor[id].entregados += 1;
      if (p.estado === 'cancelado') porVendedor[id].cancelados += 1;
    });

    const sorted = Object.values(porVendedor).sort((a, b) => b.total - a.total);

    // Calcular progreso hacia meta
    const conMeta = sorted.map(v => ({
      ...v,
      meta: metaMap[v.id] ? Number(metaMap[v.id]) : null,
      progreso: metaMap[v.id] ? Math.min(100, (v.total / Number(metaMap[v.id])) * 100) : null,
    }));

    const puedeEditarMetas = ['owner', 'admin', 'gerente'].includes(window.App?.user?.rol);

    el.innerHTML = `
      <div class="rep-kpis">
        <div class="rep-kpi">
          <div class="rep-kpi-label">Vendedores Activos</div>
          <div class="rep-kpi-value">${sorted.length}</div>
        </div>
        <div class="rep-kpi">
          <div class="rep-kpi-label">Total Vendido</div>
          <div class="rep-kpi-value">${this.fmtMoney(sorted.reduce((s, v) => s + v.total, 0))}</div>
        </div>
        <div class="rep-kpi">
          <div class="rep-kpi-label">Mejor Vendedor</div>
          <div class="rep-kpi-value" style="font-size:var(--font-size-lg)">${sorted[0]?.nombre || '-'}</div>
        </div>
        <div class="rep-kpi">
          <div class="rep-kpi-label">Metas configuradas</div>
          <div class="rep-kpi-value">${metas.length} / ${sorted.length}</div>
        </div>
      </div>

      <!-- Progreso vs metas (mes actual) -->
      ${conMeta.some(v => v.meta !== null) ? `
      <div class="rep-section">
        <h3>Progreso vs. Meta — ${ahora.toLocaleString('es-AR', { month: 'long', year: 'numeric' })}</h3>
        <div class="metas-grid">
          ${conMeta.filter(v => v.meta !== null).map(v => {
            const pct = v.progreso || 0;
            const color = pct >= 100 ? '#16a34a' : pct >= 70 ? '#2563eb' : pct >= 40 ? '#f59e0b' : '#dc2626';
            return `
              <div class="meta-card">
                <div class="meta-card-header">
                  <strong>${this.esc(v.nombre)}</strong>
                  <span class="meta-pct" style="color:${color}">${pct.toFixed(0)}%</span>
                </div>
                <div class="meta-progress-bar">
                  <div class="meta-progress-fill" style="width:${pct}%;background:${color};"></div>
                </div>
                <div class="meta-card-footer">
                  <span>${this.fmtMoney(v.total)}</span>
                  <span style="color:var(--gray-500)">de ${this.fmtMoney(v.meta)}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      ` : ''}

      <div class="rep-charts-row single">
        <div class="rep-chart-card full">
          <h3>Ventas por Vendedor</h3>
          <div class="rep-chart-body"><canvas id="repChartVendedores"></canvas></div>
        </div>
      </div>

      <div class="rep-section">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
          <h3 style="margin:0;">Detalle por Vendedor</h3>
          ${puedeEditarMetas ? `<button class="btn btn-sm btn-secondary" id="btnGestionarMetas">Gestionar metas mensuales</button>` : ''}
        </div>
        <div class="rep-table-wrapper">
          <table class="rep-table">
            <thead><tr><th>#</th><th>Vendedor</th><th>Total Vendido</th><th>Meta mes</th><th>Pedidos</th><th>Entregados</th><th>Cancelados</th><th>Tasa Éxito</th></tr></thead>
            <tbody>
              ${conMeta.map((v, i) => {
                const tasa = v.pedidos > 0 ? ((v.entregados / v.pedidos) * 100).toFixed(0) : 0;
                return `
                  <tr>
                    <td><span class="rank-badge">${i + 1}</span></td>
                    <td><strong>${this.esc(v.nombre)}</strong></td>
                    <td>${this.fmtMoney(v.total)}</td>
                    <td>${v.meta !== null ? this.fmtMoney(v.meta) : '<span class="text-muted">—</span>'}</td>
                    <td>${v.pedidos}</td>
                    <td class="text-success">${v.entregados}</td>
                    <td class="${v.cancelados > 0 ? 'text-danger' : ''}">${v.cancelados}</td>
                    <td><span class="badge ${Number(tasa) >= 70 ? 'badge-success' : Number(tasa) >= 40 ? 'badge-warning' : 'badge-danger'}">${tasa}%</span></td>
                  </tr>
                `;
              }).join('') || '<tr><td colspan="8" class="text-center text-muted">Sin datos</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Botón gestionar metas
    document.getElementById('btnGestionarMetas')?.addEventListener('click', () => {
      this._openModalMetas(sorted, metaMap, mesActual, anioActual);
    });

    if (window.Chart && sorted.length > 0) {
      const colores = ['#2563eb', '#16a34a', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16'];
      const ctx = document.getElementById('repChartVendedores');
      if (ctx) {
        this.charts.push(new Chart(ctx, {
          type: 'bar',
          data: {
            labels: sorted.map(v => v.nombre),
            datasets: [
              {
                label: 'Total Vendido',
                data: sorted.map(v => v.total),
                backgroundColor: colores.slice(0, sorted.length),
                borderRadius: 6,
                maxBarThickness: 50,
              },
              ...(conMeta.some(v => v.meta !== null) ? [{
                label: 'Meta',
                data: conMeta.map(v => v.meta || 0),
                backgroundColor: 'rgba(0,0,0,0.12)',
                borderRadius: 6,
                maxBarThickness: 50,
              }] : []),
            ],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: { legend: { display: conMeta.some(v => v.meta !== null) } },
            scales: { x: { beginAtZero: true, ticks: { callback: v => this.fmtMoney(v) } } },
          },
        }));
      }
    }
  },

  async _openModalMetas(vendedores, metaMap, mes, anio) {
    const existing = document.getElementById('metasModal');
    if (existing) existing.remove();

    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const orgId = window.App?.organization?.id;

    const container = document.createElement('div');
    container.id = 'metasModal';
    container.className = 'modal-overlay';
    container.innerHTML = `
      <div class="modal" style="max-width:500px;">
        <div class="modal-header">
          <h2>Metas de Vendedores — ${meses[mes - 1]} ${anio}</h2>
          <button class="modal-close" id="btnCloseMetasModal">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="modal-body">
          <p style="font-size:var(--font-size-sm);color:var(--gray-600);margin-bottom:1rem;">
            Definí la meta de ventas mensual para cada vendedor. Se usará para calcular el progreso en este reporte.
          </p>
          ${vendedores.length === 0
            ? '<p class="text-muted text-center">No hay vendedores con pedidos en el período.</p>'
            : vendedores.map(v => `
              <div class="form-row" style="align-items:center;margin-bottom:0.75rem;">
                <label style="flex:1;font-weight:500;">${this.esc(v.nombre)}</label>
                <input type="number" class="form-input meta-input" data-vendedor-id="${v.id}"
                  value="${metaMap[v.id] || ''}" min="0" placeholder="Sin meta"
                  style="width:160px;" step="1000">
              </div>
            `).join('')}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btnCancelMetas">Cancelar</button>
          <button class="btn btn-primary" id="btnGuardarMetas">Guardar metas</button>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    document.getElementById('btnCloseMetasModal').addEventListener('click', () => container.remove());
    document.getElementById('btnCancelMetas').addEventListener('click', () => container.remove());
    container.addEventListener('click', (e) => { if (e.target === container) container.remove(); });

    document.getElementById('btnGuardarMetas').addEventListener('click', async () => {
      const btn = document.getElementById('btnGuardarMetas');
      btn.disabled = true; btn.textContent = 'Guardando...';

      const inputs = container.querySelectorAll('.meta-input');
      const upserts = [];
      inputs.forEach(inp => {
        const vendedorId = inp.dataset.vendedorId;
        const monto = parseFloat(inp.value);
        if (vendedorId && !isNaN(monto) && monto >= 0) {
          upserts.push({
            organizacion_id: orgId,
            vendedor_id: vendedorId,
            mes, anio,
            meta_monto: monto,
          });
        }
      });

      if (upserts.length > 0) {
        const { error } = await supabase.from('metas_vendedor').upsert(upserts, {
          onConflict: 'organizacion_id,vendedor_id,mes,anio',
        });
        if (error) {
          Toast.error('Error al guardar metas');
          btn.disabled = false; btn.textContent = 'Guardar metas';
          return;
        }
      }

      Toast.success('Metas guardadas');
      container.remove();
      // Recargar tab
      this.loadTab();
    });
  },

  // ========================================
  // TAB: PRODUCTOS
  // ========================================

  async tabProductos(el) {
    const desde = this.getDesde();

    // Primero obtenemos los IDs de pedidos del período (excluye cancelados)
    // porque Supabase JS no soporta filtrar por columnas de relaciones embebidas
    let pedidosQuery = supabase.from('pedidos').select('id').neq('estado', 'cancelado');
    if (desde) pedidosQuery = pedidosQuery.gte('created_at', desde);
    const { data: pedidosData } = await pedidosQuery;
    const pedidoIds = (pedidosData || []).map(p => p.id);

    if (pedidoIds.length === 0) {
      el.innerHTML = `
        <div class="rep-kpis">
          <div class="rep-kpi"><div class="rep-kpi-label">Productos Vendidos</div><div class="rep-kpi-value">0</div></div>
          <div class="rep-kpi"><div class="rep-kpi-label">Unidades Totales</div><div class="rep-kpi-value">0</div></div>
          <div class="rep-kpi"><div class="rep-kpi-label">Total Facturado</div><div class="rep-kpi-value">${this.fmtMoney(0)}</div></div>
        </div>
        <div class="rep-empty">Sin ventas en el período seleccionado</div>
      `;
      return;
    }

    const { data } = await supabase
      .from('productos_pedido')
      .select('cantidad, subtotal, producto:producto_id(nombre, categoria, stock_actual, stock_minimo)')
      .in('pedido_id', pedidoIds);
    const lineas = data || [];

    const porProducto = {};
    lineas.forEach(l => {
      const nombre = l.producto?.nombre || 'Desconocido';
      const cat = l.producto?.categoria || 'Sin categoría';
      if (!porProducto[nombre]) porProducto[nombre] = { nombre, categoria: cat, unidades: 0, facturado: 0, pedidos: 0, stock: l.producto?.stock_actual ?? '-', stockMin: l.producto?.stock_minimo ?? 0 };
      porProducto[nombre].unidades += l.cantidad;
      porProducto[nombre].facturado += Number(l.subtotal || 0);
      porProducto[nombre].pedidos += 1;
    });

    const sorted = Object.values(porProducto).sort((a, b) => b.facturado - a.facturado);
    const totalUnidades = sorted.reduce((s, p) => s + p.unidades, 0);
    const totalFacturado = sorted.reduce((s, p) => s + p.facturado, 0);

    // Por categoría
    const porCategoria = {};
    sorted.forEach(p => {
      if (!porCategoria[p.categoria]) porCategoria[p.categoria] = 0;
      porCategoria[p.categoria] += p.facturado;
    });

    el.innerHTML = `
      <div class="rep-kpis">
        <div class="rep-kpi">
          <div class="rep-kpi-label">Productos Vendidos</div>
          <div class="rep-kpi-value">${sorted.length}</div>
        </div>
        <div class="rep-kpi">
          <div class="rep-kpi-label">Unidades Totales</div>
          <div class="rep-kpi-value">${totalUnidades.toLocaleString('es-AR')}</div>
        </div>
        <div class="rep-kpi">
          <div class="rep-kpi-label">Total Facturado</div>
          <div class="rep-kpi-value">${this.fmtMoney(totalFacturado)}</div>
        </div>
      </div>

      <div class="rep-charts-row">
        <div class="rep-chart-card wide">
          <h3>Top 15 Productos por Facturación</h3>
          <div class="rep-chart-body"><canvas id="repChartProds"></canvas></div>
        </div>
        <div class="rep-chart-card">
          <h3>Ventas por Categoría</h3>
          <div class="rep-chart-body"><canvas id="repChartCats"></canvas></div>
        </div>
      </div>

      <div class="rep-section">
        <h3>Detalle de Productos (${sorted.length})</h3>
        <div class="rep-table-wrapper">
          <table class="rep-table">
            <thead><tr><th>#</th><th>Producto</th><th>Categoría</th><th>Unidades</th><th>Facturado</th><th>Pedidos</th><th>Stock</th></tr></thead>
            <tbody>
              ${sorted.map((p, i) => {
                const stockClass = (typeof p.stock === 'number' && p.stockMin > 0 && p.stock <= p.stockMin) ? 'text-danger' : '';
                return `
                  <tr>
                    <td><span class="rank-badge">${i + 1}</span></td>
                    <td><strong>${this.esc(p.nombre)}</strong></td>
                    <td><span class="badge badge-primary">${this.esc(p.categoria)}</span></td>
                    <td>${p.unidades.toLocaleString('es-AR')}</td>
                    <td>${this.fmtMoney(p.facturado)}</td>
                    <td>${p.pedidos}</td>
                    <td class="${stockClass}">${p.stock}</td>
                  </tr>
                `;
              }).join('') || '<tr><td colspan="7" class="text-center text-muted">Sin datos</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (window.Chart) {
      const top15 = sorted.slice(0, 15);
      const ctx = document.getElementById('repChartProds');
      if (ctx && top15.length > 0) {
        this.charts.push(new Chart(ctx, {
          type: 'bar',
          data: {
            labels: top15.map(p => p.nombre.length > 20 ? p.nombre.slice(0, 20) + '…' : p.nombre),
            datasets: [{
              label: 'Facturado',
              data: top15.map(p => p.facturado),
              backgroundColor: 'rgba(37, 99, 235, 0.7)',
              borderRadius: 4,
              maxBarThickness: 40,
            }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, ticks: { callback: v => this.fmtMoney(v) } } },
          },
        }));
      }

      const ctxCat = document.getElementById('repChartCats');
      const catColores = ['#2563eb', '#16a34a', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#dc2626'];
      if (ctxCat && Object.keys(porCategoria).length > 0) {
        this.charts.push(new Chart(ctxCat, {
          type: 'doughnut',
          data: {
            labels: Object.keys(porCategoria),
            datasets: [{ data: Object.values(porCategoria), backgroundColor: catColores.slice(0, Object.keys(porCategoria).length), borderWidth: 2, borderColor: '#fff' }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10 } } },
          },
        }));
      }
    }
  },

  // ========================================
  // TAB: MOROSIDAD
  // ========================================

  async tabMorosidad(el) {
    const { data } = await supabase
      .from('clientes')
      .select('nombre_establecimiento, saldo_pendiente, dias_credito, fecha_ultima_compra, telefono, vendedor:vendedor_asignado_id(nombre)')
      .gt('saldo_pendiente', 0)
      .order('saldo_pendiente', { ascending: false });

    const morosos = data || [];
    const totalDeuda = morosos.reduce((s, c) => s + Number(c.saldo_pendiente || 0), 0);
    const mayorDeuda = morosos[0]?.saldo_pendiente || 0;

    // Categorizar
    const criticos = morosos.filter(c => Number(c.saldo_pendiente) > 50000);
    const altos = morosos.filter(c => { const s = Number(c.saldo_pendiente); return s > 10000 && s <= 50000; });
    const bajos = morosos.filter(c => Number(c.saldo_pendiente) <= 10000);

    el.innerHTML = `
      <div class="rep-kpis">
        <div class="rep-kpi">
          <div class="rep-kpi-label">Deuda Total</div>
          <div class="rep-kpi-value red">${this.fmtMoney(totalDeuda)}</div>
        </div>
        <div class="rep-kpi">
          <div class="rep-kpi-label">Clientes Morosos</div>
          <div class="rep-kpi-value">${morosos.length}</div>
        </div>
        <div class="rep-kpi">
          <div class="rep-kpi-label">Mayor Deuda</div>
          <div class="rep-kpi-value">${this.fmtMoney(mayorDeuda)}</div>
        </div>
        <div class="rep-kpi">
          <div class="rep-kpi-label">Deuda Promedio</div>
          <div class="rep-kpi-value">${this.fmtMoney(morosos.length > 0 ? totalDeuda / morosos.length : 0)}</div>
        </div>
      </div>

      <div class="rep-charts-row single">
        <div class="rep-chart-card full">
          <h3>Distribución de Deuda</h3>
          <div class="rep-chart-body"><canvas id="repChartMora"></canvas></div>
        </div>
      </div>

      <div class="rep-section">
        <h3>Detalle de Morosidad (${morosos.length} clientes)</h3>
        <div class="rep-table-wrapper">
          <table class="rep-table">
            <thead><tr><th>#</th><th>Cliente</th><th>Deuda</th><th>Días Crédito</th><th>Última Compra</th><th>Vendedor</th><th>Teléfono</th></tr></thead>
            <tbody>
              ${morosos.map((c, i) => {
                const diasSinCompra = c.fecha_ultima_compra ? Math.ceil((new Date() - new Date(c.fecha_ultima_compra)) / (1000 * 60 * 60 * 24)) : '-';
                const deudaClass = Number(c.saldo_pendiente) > 50000 ? 'text-danger' : Number(c.saldo_pendiente) > 10000 ? 'text-warning' : '';
                return `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${this.esc(c.nombre_establecimiento)}</strong></td>
                    <td class="${deudaClass}"><strong>${this.fmtMoney(c.saldo_pendiente)}</strong></td>
                    <td>${c.dias_credito || 0}d</td>
                    <td>${diasSinCompra === '-' ? '-' : `hace ${diasSinCompra}d`}</td>
                    <td>${this.esc(c.vendedor?.nombre || '-')}</td>
                    <td>${c.telefono ? `<a href="tel:${c.telefono}">${c.telefono}</a>` : '-'}</td>
                  </tr>
                `;
              }).join('') || '<tr><td colspan="7" class="text-center text-muted">Sin clientes morosos</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (window.Chart && morosos.length > 0) {
      const top10 = morosos.slice(0, 10);
      const ctx = document.getElementById('repChartMora');
      if (ctx) {
        this.charts.push(new Chart(ctx, {
          type: 'bar',
          data: {
            labels: top10.map(c => c.nombre_establecimiento.length > 18 ? c.nombre_establecimiento.slice(0, 18) + '…' : c.nombre_establecimiento),
            datasets: [{
              label: 'Deuda',
              data: top10.map(c => Number(c.saldo_pendiente)),
              backgroundColor: top10.map(c => Number(c.saldo_pendiente) > 50000 ? '#dc2626' : Number(c.saldo_pendiente) > 10000 ? '#f59e0b' : '#3b82f6'),
              borderRadius: 4,
              maxBarThickness: 50,
            }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, ticks: { callback: v => this.fmtMoney(v) } } },
          },
        }));
      }
    }
  },

  // ========================================
  // TAB: CLIENTES INACTIVOS
  // ========================================

  async tabClientesInactivos(el) {
    const { data } = await supabase
      .from('clientes')
      .select('nombre_establecimiento, tipo_cliente, estado_lead, fecha_ultima_compra, saldo_pendiente, scoring, vendedor:vendedor_asignado_id(nombre), telefono, ciudad')
      .order('fecha_ultima_compra', { ascending: true, nullsFirst: true });

    const clientes = data || [];
    const hoy = new Date();

    // Clasificar inactividad
    const inactivos = clientes.map(c => {
      const dias = c.fecha_ultima_compra ? Math.ceil((hoy - new Date(c.fecha_ultima_compra)) / (1000 * 60 * 60 * 24)) : 999;
      return { ...c, diasSinCompra: dias };
    }).filter(c => c.diasSinCompra > 30 || c.estado_lead === 'inactivo' || c.estado_lead === 'en_pausa');

    const sinCompra60 = inactivos.filter(c => c.diasSinCompra > 60).length;
    const sinCompra90 = inactivos.filter(c => c.diasSinCompra > 90).length;
    const nuncaCompro = inactivos.filter(c => c.diasSinCompra >= 999).length;

    el.innerHTML = `
      <div class="rep-kpis">
        <div class="rep-kpi">
          <div class="rep-kpi-label">Inactivos (>30d)</div>
          <div class="rep-kpi-value">${inactivos.length}</div>
        </div>
        <div class="rep-kpi">
          <div class="rep-kpi-label">>60 días</div>
          <div class="rep-kpi-value text-warning">${sinCompra60}</div>
        </div>
        <div class="rep-kpi">
          <div class="rep-kpi-label">>90 días</div>
          <div class="rep-kpi-value red">${sinCompra90}</div>
        </div>
        <div class="rep-kpi">
          <div class="rep-kpi-label">Nunca Compró</div>
          <div class="rep-kpi-value">${nuncaCompro}</div>
        </div>
      </div>

      <div class="rep-section">
        <h3>Clientes Inactivos (${inactivos.length})</h3>
        <div class="rep-table-wrapper">
          <table class="rep-table">
            <thead><tr><th>Cliente</th><th>Tipo</th><th>Estado</th><th>Días Sin Compra</th><th>Última Compra</th><th>Deuda</th><th>Vendedor</th><th>Ciudad</th></tr></thead>
            <tbody>
              ${inactivos.map(c => {
                const diasClass = c.diasSinCompra >= 999 ? 'text-muted' : c.diasSinCompra > 90 ? 'text-danger' : c.diasSinCompra > 60 ? 'text-warning' : '';
                const diasTxt = c.diasSinCompra >= 999 ? 'Nunca' : `${c.diasSinCompra}d`;
                const fechaTxt = c.fecha_ultima_compra ? new Date(c.fecha_ultima_compra).toLocaleDateString('es-AR') : '-';
                return `
                  <tr>
                    <td><strong>${this.esc(c.nombre_establecimiento)}</strong></td>
                    <td><span class="badge badge-primary">${c.tipo_cliente}</span></td>
                    <td><span class="badge badge-${c.estado_lead === 'inactivo' ? 'danger' : c.estado_lead === 'en_pausa' ? 'warning' : 'primary'}">${c.estado_lead}</span></td>
                    <td class="${diasClass}"><strong>${diasTxt}</strong></td>
                    <td>${fechaTxt}</td>
                    <td>${Number(c.saldo_pendiente) > 0 ? this.fmtMoney(c.saldo_pendiente) : '-'}</td>
                    <td>${this.esc(c.vendedor?.nombre || '-')}</td>
                    <td>${this.esc(c.ciudad || '-')}</td>
                  </tr>
                `;
              }).join('') || '<tr><td colspan="8" class="text-center text-muted">Todos los clientes están activos</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ========================================
  // TAB: ENTREGAS (RUTAS)
  // ========================================

  async tabEntregas(el) {
    const desde = this.getDesde();
    let queryRutas = supabase.from('rutas').select('id, nombre, estado, fecha, km_estimados, secuencia_paradas, repartidor:repartidor_id(nombre)');
    if (desde) queryRutas = queryRutas.gte('fecha', desde.split('T')[0]);
    const { data: rutas } = await queryRutas.order('fecha', { ascending: false });

    const rutasData = rutas || [];
    const completadas = rutasData.filter(r => r.estado === 'completada');
    const enCurso = rutasData.filter(r => r.estado === 'en_curso');
    const totalKm = rutasData.reduce((s, r) => s + Number(r.km_estimados || 0), 0);

    // Contar entregas
    let totalParadas = 0, totalEntregadas = 0;
    rutasData.forEach(r => {
      const paradas = r.secuencia_paradas || [];
      totalParadas += paradas.length;
      totalEntregadas += paradas.filter(p => p.entregado).length;
    });

    const tasaEntrega = totalParadas > 0 ? ((totalEntregadas / totalParadas) * 100).toFixed(1) : 0;

    // Por repartidor
    const porRepartidor = {};
    rutasData.forEach(r => {
      const nombre = r.repartidor?.nombre || 'Sin asignar';
      if (!porRepartidor[nombre]) porRepartidor[nombre] = { rutas: 0, entregas: 0, km: 0 };
      porRepartidor[nombre].rutas += 1;
      porRepartidor[nombre].entregas += (r.secuencia_paradas || []).filter(p => p.entregado).length;
      porRepartidor[nombre].km += Number(r.km_estimados || 0);
    });

    el.innerHTML = `
      <div class="rep-kpis">
        <div class="rep-kpi">
          <div class="rep-kpi-label">Total Rutas</div>
          <div class="rep-kpi-value">${rutasData.length}</div>
        </div>
        <div class="rep-kpi">
          <div class="rep-kpi-label">Completadas</div>
          <div class="rep-kpi-value green">${completadas.length}</div>
        </div>
        <div class="rep-kpi">
          <div class="rep-kpi-label">Entregas Realizadas</div>
          <div class="rep-kpi-value">${totalEntregadas}/${totalParadas}</div>
        </div>
        <div class="rep-kpi">
          <div class="rep-kpi-label">Tasa de Entrega</div>
          <div class="rep-kpi-value ${Number(tasaEntrega) >= 80 ? 'green' : Number(tasaEntrega) >= 50 ? '' : 'red'}">${tasaEntrega}%</div>
        </div>
        <div class="rep-kpi">
          <div class="rep-kpi-label">Km Totales</div>
          <div class="rep-kpi-value">${totalKm.toLocaleString('es-AR')} km</div>
        </div>
      </div>

      <div class="rep-section">
        <h3>Rendimiento por Repartidor</h3>
        <div class="rep-table-wrapper">
          <table class="rep-table">
            <thead><tr><th>Repartidor</th><th>Rutas</th><th>Entregas</th><th>Km Recorridos</th></tr></thead>
            <tbody>
              ${Object.entries(porRepartidor).map(([nombre, d]) => `
                <tr>
                  <td><strong>${this.esc(nombre)}</strong></td>
                  <td>${d.rutas}</td>
                  <td>${d.entregas}</td>
                  <td>${d.km.toLocaleString('es-AR')} km</td>
                </tr>
              `).join('') || '<tr><td colspan="4" class="text-center text-muted">Sin datos</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="rep-section">
        <h3>Historial de Rutas (${rutasData.length})</h3>
        <div class="rep-table-wrapper">
          <table class="rep-table">
            <thead><tr><th>Fecha</th><th>Ruta</th><th>Repartidor</th><th>Estado</th><th>Paradas</th><th>Entregas</th><th>Km</th></tr></thead>
            <tbody>
              ${rutasData.map(r => {
                const paradas = r.secuencia_paradas || [];
                const entregadas = paradas.filter(p => p.entregado).length;
                const estadoClass = r.estado === 'completada' ? 'badge-success' : r.estado === 'en_curso' ? 'badge-primary' : 'badge-warning';
                const estadoLabel = r.estado === 'completada' ? 'Completada' : r.estado === 'en_curso' ? 'En Curso' : 'Pendiente';
                return `
                  <tr>
                    <td>${new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</td>
                    <td><strong>${this.esc(r.nombre)}</strong></td>
                    <td>${this.esc(r.repartidor?.nombre || '-')}</td>
                    <td><span class="badge ${estadoClass}">${estadoLabel}</span></td>
                    <td>${paradas.length}</td>
                    <td>${entregadas}/${paradas.length}</td>
                    <td>${r.km_estimados || '-'}</td>
                  </tr>
                `;
              }).join('') || '<tr><td colspan="7" class="text-center text-muted">Sin rutas</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ========================================
  // EXPORTAR PDF
  // ========================================

  async _loadJsPDF() {
    if (window.jspdf) return;
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
    const cdnUrls = [
      'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js',
    ];
    for (const url of cdnUrls) {
      try {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = url;
          script.onload = () => { if (window.jspdf) resolve(); else reject(); };
          script.onerror = () => { script.remove(); reject(); };
          document.head.appendChild(script);
        });
        return;
      } catch { console.warn(`jsPDF no cargó desde ${url}`); }
    }
    throw new Error('No se pudo cargar jsPDF');
  },

  async exportPDF() {
    const btn = document.getElementById('btnExportReportePDF');
    if (btn) { btn.disabled = true; btn.classList.add('btn-loading'); }

    try {
      await this._loadJsPDF();
    } catch {
      Toast.error('No se pudo cargar la librería PDF. Verificá tu conexión.');
      if (btn) { btn.disabled = false; btn.classList.remove('btn-loading'); }
      return;
    }

    if (!window.jspdf?.jsPDF) {
      Toast.error('Librería PDF no disponible. Recargá la página.');
      if (btn) { btn.disabled = false; btn.classList.remove('btn-loading'); }
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const orgName = window.App?.organization?.nombre || 'Distribuidora';
    const tabName = this.activeTab.charAt(0).toUpperCase() + this.activeTab.slice(1);
    const periodoSelect = document.getElementById('repPeriodo');
    const periodoText = periodoSelect?.options[periodoSelect.selectedIndex]?.text || '';

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(orgName, 14, 20);

    doc.setFontSize(14);
    doc.text(`Reporte: ${tabName}`, 14, 30);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${periodoText}`, 14, 38);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`, 14, 44);

    // Separator
    let y = 50;
    doc.setDrawColor(200);
    doc.line(14, y, 196, y);
    y += 8;

    // KPIs
    const kpis = this.container?.querySelectorAll('.rep-kpi');
    if (kpis?.length) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Indicadores Clave', 14, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      kpis.forEach(kpi => {
        const label = kpi.querySelector('.rep-kpi-label')?.textContent || '';
        const value = kpi.querySelector('.rep-kpi-value')?.textContent || '';
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(`${label}: ${value}`, 18, y);
        y += 6;
      });
      y += 4;
    }

    // Tables
    const tables = this.container?.querySelectorAll('.rep-table');
    if (tables?.length) {
      tables.forEach(table => {
        const section = table.closest('.rep-section');
        const title = section?.querySelector('h3')?.textContent || '';

        if (y > 250) { doc.addPage(); y = 20; }

        if (title) {
          doc.setDrawColor(200);
          doc.line(14, y, 196, y);
          y += 8;
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(title, 14, y);
          y += 8;
        }

        // Header row
        const ths = table.querySelectorAll('thead th');
        const headers = Array.from(ths).map(th => th.textContent.trim());
        const colCount = headers.length;
        const colWidth = Math.min(180 / colCount, 40);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        headers.forEach((h, i) => {
          doc.text(h.substring(0, 18), 14 + i * colWidth, y, { maxWidth: colWidth - 2 });
        });
        y += 3;
        doc.setDrawColor(180);
        doc.line(14, y, 196, y);
        y += 5;

        // Data rows
        doc.setFont('helvetica', 'normal');
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
          if (y > 275) { doc.addPage(); y = 20; }
          const cells = row.querySelectorAll('td');
          cells.forEach((cell, i) => {
            if (i < colCount) {
              const text = cell.textContent.trim().substring(0, 25);
              doc.text(text, 14 + i * colWidth, y, { maxWidth: colWidth - 2 });
            }
          });
          y += 5;
        });
        y += 4;
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`${orgName} - Reporte ${tabName} - Página ${i}/${pageCount}`, 105, 290, { align: 'center' });
      doc.setTextColor(0);
    }

    doc.save(`reporte_${this.activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
    Toast.success('PDF descargado');

    if (btn) { btn.disabled = false; btn.classList.remove('btn-loading'); }
  },

  // ========================================
  // UTILIDADES
  // ========================================

  async _loadChartJS() {
    if (window.Chart) return;
    const existing = document.querySelector('script[src*="chart"]');
    if (existing) {
      return new Promise((resolve, reject) => {
        const check = setInterval(() => { if (window.Chart) { clearInterval(check); resolve(); } }, 100);
        setTimeout(() => { clearInterval(check); if (window.Chart) resolve(); else reject(new Error('Timeout')); }, 8000);
      });
    }
    const urls = [
      'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.7/chart.umd.min.js',
    ];
    for (const url of urls) {
      try {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = url;
          script.onload = () => { if (window.Chart) resolve(); else reject(); };
          script.onerror = () => { script.remove(); reject(); };
          document.head.appendChild(script);
        });
        return;
      } catch { console.warn(`Chart.js no cargó desde ${url}`); }
    }
    Toast.error('No se pudo cargar Chart.js');
  },

  esc(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
};

export default ReportesPage;
