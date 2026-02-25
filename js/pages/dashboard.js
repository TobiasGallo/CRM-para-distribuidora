/* ========================================
   PÁGINA DASHBOARD - FASE 5
   Métricas en tiempo real + Gráficos Chart.js
   + Reportes: ventas por vendedor, morosidad,
   top clientes, top productos, conversión pipeline
   ======================================== */

import supabase from '../config/supabase.js';
import Toast from '../utils/toast.js';

const DashboardPage = {
  charts: [],

  async render(container) {
    this.container = container;
    const orgName = window.App?.organization?.nombre || 'tu distribuidora';

    container.innerHTML = `
      <div class="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Resumen general de ${orgName}</p>
        </div>
        <div class="dash-period-selector">
          <select id="dashPeriodo">
            <option value="7">Últimos 7 días</option>
            <option value="30" selected>Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
            <option value="365">Último año</option>
          </select>
        </div>
      </div>

      <!-- KPIs principales -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-info">
            <h3>Ventas del Período</h3>
            <div class="stat-value" id="statVentas">-</div>
            <div class="stat-sub" id="statVentasSub"></div>
          </div>
          <div class="stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-info">
            <h3>Pedidos</h3>
            <div class="stat-value" id="statPedidos">-</div>
            <div class="stat-sub" id="statPedidosSub"></div>
          </div>
          <div class="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-info">
            <h3>Clientes Activos</h3>
            <div class="stat-value" id="statClientes">-</div>
            <div class="stat-sub" id="statClientesSub"></div>
          </div>
          <div class="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-info">
            <h3>Morosidad</h3>
            <div class="stat-value" id="statMorosidad">-</div>
            <div class="stat-sub" id="statMorosidadSub"></div>
          </div>
          <div class="stat-icon red">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
        </div>
      </div>

      <!-- Gráficos fila 1 -->
      <div class="dash-charts-row">
        <div class="dash-chart-card wide">
          <div class="dash-chart-header">
            <h3>Ventas por Período</h3>
          </div>
          <div class="dash-chart-body">
            <canvas id="chartVentas"></canvas>
          </div>
        </div>
        <div class="dash-chart-card">
          <div class="dash-chart-header">
            <h3>Pedidos por Estado</h3>
          </div>
          <div class="dash-chart-body">
            <canvas id="chartEstados"></canvas>
          </div>
        </div>
      </div>

      <!-- Gráficos fila 2 -->
      <div class="dash-charts-row">
        <div class="dash-chart-card">
          <div class="dash-chart-header">
            <h3>Ventas por Vendedor</h3>
          </div>
          <div class="dash-chart-body">
            <canvas id="chartVendedores"></canvas>
          </div>
        </div>
        <div class="dash-chart-card">
          <div class="dash-chart-header">
            <h3>Conversión Pipeline</h3>
          </div>
          <div class="dash-chart-body">
            <canvas id="chartPipeline"></canvas>
          </div>
        </div>
      </div>

      <!-- Tablas de ranking -->
      <div class="dash-charts-row">
        <div class="dash-chart-card">
          <div class="dash-chart-header">
            <h3>Top 10 Clientes</h3>
          </div>
          <div class="dash-chart-body no-padding">
            <table class="dash-ranking-table">
              <thead><tr><th>#</th><th>Cliente</th><th>Total</th><th>Pedidos</th></tr></thead>
              <tbody id="topClientes">
                <tr><td colspan="4" class="text-center text-muted">Cargando...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="dash-chart-card">
          <div class="dash-chart-header">
            <h3>Top 10 Productos</h3>
          </div>
          <div class="dash-chart-body no-padding">
            <table class="dash-ranking-table">
              <thead><tr><th>#</th><th>Producto</th><th>Unidades</th><th>Facturado</th></tr></thead>
              <tbody id="topProductos">
                <tr><td colspan="4" class="text-center text-muted">Cargando...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Widget Stock Bajo -->
      <div class="dash-charts-row single" id="stockBajoWidget" style="display:none;">
        <div class="dash-chart-card full">
          <div class="dash-chart-header" style="justify-content:space-between;">
            <h3 style="display:flex;align-items:center;gap:0.5rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
              Productos con stock crítico
              <span id="stockBadgeCount" class="tab-count-badge" style="background:var(--danger);color:white;"></span>
            </h3>
            <a href="#/productos" class="btn btn-sm btn-secondary" style="font-size:var(--font-size-xs);">Ver todos los productos →</a>
          </div>
          <div class="dash-chart-body no-padding">
            <div id="dashStockBajo"></div>
          </div>
        </div>
      </div>

      <!-- Cierre de caja / Cobros del día -->
      <div class="dash-charts-row single">
        <div class="dash-chart-card full">
          <div class="dash-chart-header" style="justify-content:space-between;">
            <h3 style="display:flex;align-items:center;gap:0.5rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              Cobros de hoy
              <span id="cierreCajaBadge" class="tab-count-badge" style="background:var(--success);color:white;display:none;"></span>
            </h3>
            <a href="#/clientes" class="btn btn-sm btn-secondary" style="font-size:var(--font-size-xs);">Ver cobros por cliente →</a>
          </div>
          <div class="dash-chart-body no-padding">
            <div id="dashCierreCaja">
              <div class="text-center text-muted" style="padding:1rem;">Cargando...</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Alertas -->
      <div class="dash-charts-row single">
        <div class="dash-chart-card full">
          <div class="dash-chart-header">
            <h3>Alertas</h3>
          </div>
          <div class="dash-chart-body no-padding">
            <div id="dashAlertas" class="dash-alertas">
              <div class="text-center text-muted" style="padding:1rem;">Cargando...</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Evento cambio de período
    document.getElementById('dashPeriodo')?.addEventListener('change', () => {
      this.loadAll();
    });

    await this._loadChartJS();
    await this.loadAll();
  },

  getDias() {
    return parseInt(document.getElementById('dashPeriodo')?.value || '30');
  },

  getDesde() {
    const dias = this.getDias();
    const d = new Date();
    d.setDate(d.getDate() - dias);
    return d.toISOString();
  },

  async loadAll() {
    // Destruir charts anteriores
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    await Promise.all([
      this.loadKPIs(),
      this.loadChartVentas(),
      this.loadChartEstados(),
      this.loadChartVendedores(),
      this.loadChartPipeline(),
      this.loadTopClientes(),
      this.loadTopProductos(),
      this.loadStockBajo(),
      this.loadCierreCaja(),
      this.loadAlertas(),
    ]);
  },

  // ========================================
  // CARGA LAZY DE CHART.JS
  // ========================================

  async _loadChartJS() {
    if (window.Chart) return;

    const existing = document.querySelector('script[src*="chart"]');
    if (existing) {
      return new Promise((resolve, reject) => {
        const check = setInterval(() => {
          if (window.Chart) { clearInterval(check); resolve(); }
        }, 100);
        setTimeout(() => {
          clearInterval(check);
          if (window.Chart) resolve();
          else reject(new Error('Timeout esperando Chart.js'));
        }, 8000);
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
          script.onload = () => {
            if (window.Chart) resolve();
            else reject(new Error('Chart.js no se inicializó'));
          };
          script.onerror = () => { script.remove(); reject(new Error('Error de red')); };
          document.head.appendChild(script);
        });
        return;
      } catch {
        console.warn(`Chart.js no cargó desde ${url}`);
      }
    }

    Toast.error('No se pudo cargar Chart.js. Verificá tu conexión.');
  },

  // ========================================
  // KPIs PRINCIPALES
  // ========================================

  async loadKPIs() {
    try {
      const moneda = window.App?.organization?.moneda || 'ARS';
      const orgId = window.App?.organization?.id;
      const desde = this.getDesde();

      const [pedidosPeriodo, totalClientes, morosos, pedidosPendientes] = await Promise.all([
        supabase.from('pedidos').select('id, total, estado').gte('created_at', desde).eq('organizacion_id', orgId),
        supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('estado_lead', 'activo').eq('organizacion_id', orgId),
        supabase.from('clientes').select('saldo_pendiente').gt('saldo_pendiente', 0).eq('organizacion_id', orgId),
        supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente').eq('organizacion_id', orgId),
      ]);

      const pedidos = pedidosPeriodo.data || [];
      const ventasTotal = pedidos.reduce((s, p) => s + Number(p.total || 0), 0);
      const entregados = pedidos.filter(p => p.estado === 'entregado').length;
      const ticketPromedio = pedidos.length > 0 ? ventasTotal / pedidos.length : 0;

      const el = (id) => document.getElementById(id);
      el('statVentas').textContent = `${moneda} ${ventasTotal.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;
      el('statVentasSub').textContent = `Ticket promedio: ${moneda} ${ticketPromedio.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

      el('statPedidos').textContent = pedidos.length;
      el('statPedidosSub').textContent = `${entregados} entregados · ${pedidosPendientes.count ?? 0} pendientes`;

      el('statClientes').textContent = totalClientes.count ?? 0;
      el('statClientesSub').textContent = `Total activos`;

      const totalMorosidad = (morosos.data || []).reduce((s, c) => s + Number(c.saldo_pendiente || 0), 0);
      const cantMorosos = (morosos.data || []).length;
      el('statMorosidad').textContent = `${moneda} ${totalMorosidad.toLocaleString('es-AR')}`;
      el('statMorosidadSub').textContent = `${cantMorosos} cliente${cantMorosos !== 1 ? 's' : ''} con deuda`;
    } catch (err) {
      console.error('Error KPIs:', err);
    }
  },

  // ========================================
  // GRÁFICO: VENTAS POR PERÍODO (línea)
  // ========================================

  async loadChartVentas() {
    if (!window.Chart) return;
    try {
      const orgId = window.App?.organization?.id;
      const desde = this.getDesde();
      const { data } = await supabase
        .from('pedidos')
        .select('created_at, total')
        .gte('created_at', desde)
        .eq('organizacion_id', orgId)
        .order('created_at');

      const pedidos = data || [];
      // Agrupar por día
      const porDia = {};
      pedidos.forEach(p => {
        const dia = new Date(p.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
        porDia[dia] = (porDia[dia] || 0) + Number(p.total || 0);
      });

      const labels = Object.keys(porDia);
      const valores = Object.values(porDia);

      const ctx = document.getElementById('chartVentas');
      if (!ctx) return;

      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Ventas',
            data: valores,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: labels.length > 30 ? 0 : 3,
            pointHoverRadius: 5,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (v) => {
                  const moneda = window.App?.organization?.moneda || '$';
                  return `${moneda} ${v.toLocaleString('es-AR')}`;
                },
              },
            },
          },
        },
      });
      this.charts.push(chart);
    } catch (err) {
      console.error('Error chart ventas:', err);
    }
  },

  // ========================================
  // GRÁFICO: PEDIDOS POR ESTADO (dona)
  // ========================================

  async loadChartEstados() {
    if (!window.Chart) return;
    try {
      const orgId = window.App?.organization?.id;
      const desde = this.getDesde();
      const query = supabase.from('pedidos').select('estado').eq('organizacion_id', orgId);
      const { data } = desde ? await query.gte('created_at', desde) : await query;
      const pedidos = data || [];

      const conteo = {};
      const labelsMap = {
        pendiente: 'Pendiente',
        en_preparacion: 'En Preparación',
        en_ruta: 'En Ruta',
        entregado: 'Entregado',
        cancelado: 'Cancelado',
        con_incidencia: 'Con Incidencia',
      };
      const coloresMap = {
        pendiente: '#f59e0b',
        en_preparacion: '#3b82f6',
        en_ruta: '#8b5cf6',
        entregado: '#16a34a',
        cancelado: '#6b7280',
        con_incidencia: '#dc2626',
      };

      pedidos.forEach(p => {
        conteo[p.estado] = (conteo[p.estado] || 0) + 1;
      });

      const labels = Object.keys(conteo).map(k => labelsMap[k] || k);
      const valores = Object.values(conteo);
      const colores = Object.keys(conteo).map(k => coloresMap[k] || '#9ca3af');

      const ctx = document.getElementById('chartEstados');
      if (!ctx) return;

      const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: valores,
            backgroundColor: colores,
            borderWidth: 2,
            borderColor: '#fff',
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12 } },
          },
        },
      });
      this.charts.push(chart);
    } catch (err) {
      console.error('Error chart estados:', err);
    }
  },

  // ========================================
  // GRÁFICO: VENTAS POR VENDEDOR (barras)
  // ========================================

  async loadChartVendedores() {
    if (!window.Chart) return;
    try {
      const orgId = window.App?.organization?.id;
      const desde = this.getDesde();
      const { data } = await supabase
        .from('pedidos')
        .select('total, vendedor:vendedor_id(nombre)')
        .gte('created_at', desde)
        .eq('organizacion_id', orgId);

      const pedidos = data || [];
      const porVendedor = {};
      pedidos.forEach(p => {
        const nombre = p.vendedor?.nombre || 'Sin asignar';
        porVendedor[nombre] = (porVendedor[nombre] || 0) + Number(p.total || 0);
      });

      // Ordenar de mayor a menor
      const sorted = Object.entries(porVendedor).sort((a, b) => b[1] - a[1]);
      const labels = sorted.map(s => s[0]);
      const valores = sorted.map(s => s[1]);

      const colores = ['#2563eb', '#16a34a', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16'];

      const ctx = document.getElementById('chartVendedores');
      if (!ctx) return;

      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Ventas',
            data: valores,
            backgroundColor: colores.slice(0, labels.length),
            borderRadius: 6,
            maxBarThickness: 50,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                callback: (v) => {
                  const moneda = window.App?.organization?.moneda || '$';
                  return `${moneda} ${v.toLocaleString('es-AR')}`;
                },
              },
            },
          },
        },
      });
      this.charts.push(chart);
    } catch (err) {
      console.error('Error chart vendedores:', err);
    }
  },

  // ========================================
  // GRÁFICO: CONVERSIÓN PIPELINE (embudo)
  // ========================================

  async loadChartPipeline() {
    if (!window.Chart) return;
    try {
      const orgId = window.App?.organization?.id;
      const { data } = await supabase.from('pipeline_oportunidades').select('etapa').eq('organizacion_id', orgId);
      const ops = data || [];

      const etapas = [
        { key: 'contacto_inicial', label: 'Contacto Inicial' },
        { key: 'calificacion', label: 'Calificación' },
        { key: 'presupuesto', label: 'Presupuesto' },
        { key: 'negociacion', label: 'Negociación' },
        { key: 'primer_pedido', label: 'Primer Pedido' },
        { key: 'cliente_activo', label: 'Cliente Activo' },
      ];

      const conteo = {};
      ops.forEach(o => { conteo[o.etapa] = (conteo[o.etapa] || 0) + 1; });

      const labels = etapas.map(e => e.label);
      const valores = etapas.map(e => conteo[e.key] || 0);
      const colores = ['#3b82f6', '#06b6d4', '#f59e0b', '#f97316', '#8b5cf6', '#16a34a'];

      const ctx = document.getElementById('chartPipeline');
      if (!ctx) return;

      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Oportunidades',
            data: valores,
            backgroundColor: colores,
            borderRadius: 6,
            maxBarThickness: 50,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
          },
        },
      });
      this.charts.push(chart);
    } catch (err) {
      console.error('Error chart pipeline:', err);
    }
  },

  // ========================================
  // TOP 10 CLIENTES
  // ========================================

  async loadTopClientes() {
    try {
      const moneda = window.App?.organization?.moneda || 'ARS';
      const orgId = window.App?.organization?.id;
      const desde = this.getDesde();

      const { data } = await supabase
        .from('pedidos')
        .select('total, cliente:cliente_id(nombre_establecimiento)')
        .gte('created_at', desde)
        .eq('organizacion_id', orgId);

      const pedidos = data || [];
      const porCliente = {};
      pedidos.forEach(p => {
        const nombre = p.cliente?.nombre_establecimiento || 'Desconocido';
        if (!porCliente[nombre]) porCliente[nombre] = { total: 0, cantidad: 0 };
        porCliente[nombre].total += Number(p.total || 0);
        porCliente[nombre].cantidad += 1;
      });

      const sorted = Object.entries(porCliente)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 10);

      const tbody = document.getElementById('topClientes');
      if (!tbody) return;

      if (sorted.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Sin datos en el período</td></tr>';
        return;
      }

      tbody.innerHTML = sorted.map(([nombre, d], i) => `
        <tr>
          <td><span class="rank-badge">${i + 1}</span></td>
          <td>${this.esc(nombre)}</td>
          <td><strong>${moneda} ${d.total.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</strong></td>
          <td>${d.cantidad}</td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Error top clientes:', err);
    }
  },

  // ========================================
  // TOP 10 PRODUCTOS
  // ========================================

  async loadTopProductos() {
    try {
      const moneda = window.App?.organization?.moneda || 'ARS';
      const desde = this.getDesde();

      // Traer productos_pedido con pedido para filtrar por fecha
      const { data } = await supabase
        .from('productos_pedido')
        .select('cantidad, subtotal, producto:producto_id(nombre), pedido:pedido_id(created_at)')
        .gte('pedido.created_at', desde);

      // Filtrar los que no matchearon el join (pedido fuera de rango)
      const lineas = (data || []).filter(l => l.pedido !== null);

      const porProducto = {};
      lineas.forEach(l => {
        const nombre = l.producto?.nombre || 'Desconocido';
        if (!porProducto[nombre]) porProducto[nombre] = { unidades: 0, facturado: 0 };
        porProducto[nombre].unidades += l.cantidad;
        porProducto[nombre].facturado += Number(l.subtotal || 0);
      });

      const sorted = Object.entries(porProducto)
        .sort((a, b) => b[1].facturado - a[1].facturado)
        .slice(0, 10);

      const tbody = document.getElementById('topProductos');
      if (!tbody) return;

      if (sorted.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Sin datos en el período</td></tr>';
        return;
      }

      tbody.innerHTML = sorted.map(([nombre, d], i) => `
        <tr>
          <td><span class="rank-badge">${i + 1}</span></td>
          <td>${this.esc(nombre)}</td>
          <td>${d.unidades.toLocaleString('es-AR')}</td>
          <td><strong>${moneda} ${d.facturado.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</strong></td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Error top productos:', err);
    }
  },

  // ========================================
  // STOCK BAJO
  // ========================================

  async loadStockBajo() {
    try {
      const orgId = window.App?.organization?.id;
      const { data } = await supabase
        .from('productos')
        .select('id, nombre, sku, categoria, stock_actual, stock_minimo, unidad_medida')
        .eq('activo', true)
        .eq('organizacion_id', orgId)
        .or('stock_actual.eq.0,and(stock_minimo.gt.0,stock_actual.lte.stock_minimo)')
        .order('stock_actual', { ascending: true })
        .limit(20);

      const productos = data || [];
      const widget = document.getElementById('stockBajoWidget');
      const container = document.getElementById('dashStockBajo');
      const badge = document.getElementById('stockBadgeCount');

      if (!widget || !container) return;

      if (productos.length === 0) {
        widget.style.display = 'none';
        return;
      }

      widget.style.display = '';
      if (badge) badge.textContent = productos.length;

      const sinStock = productos.filter(p => p.stock_actual === 0);
      const stockBajo = productos.filter(p => p.stock_actual > 0);

      container.innerHTML = `
        <div class="stock-critico-grid">
          ${sinStock.length > 0 ? `
            <div class="stock-critico-group">
              <div class="stock-critico-group-label danger">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                Sin stock (${sinStock.length})
              </div>
              ${sinStock.map(p => `
                <div class="stock-critico-item sin-stock">
                  <div class="stock-item-nombre">
                    <strong>${this.esc(p.nombre)}</strong>
                    ${p.sku ? `<small>${this.esc(p.sku)}</small>` : ''}
                  </div>
                  <div class="stock-item-badge stock-badge-cero">0 ${p.unidad_medida || 'uds'}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${stockBajo.length > 0 ? `
            <div class="stock-critico-group">
              <div class="stock-critico-group-label warning">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                Stock bajo (${stockBajo.length})
              </div>
              ${stockBajo.map(p => `
                <div class="stock-critico-item stock-bajo">
                  <div class="stock-item-nombre">
                    <strong>${this.esc(p.nombre)}</strong>
                    ${p.sku ? `<small>${this.esc(p.sku)}</small>` : ''}
                  </div>
                  <div class="stock-item-badge stock-badge-bajo">${p.stock_actual} / mín ${p.stock_minimo} ${p.unidad_medida || 'uds'}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    } catch (err) {
      console.error('Error cargando stock bajo:', err);
    }
  },

  // ALERTAS
  // ========================================

  async loadAlertas() {
    try {
      const orgId = window.App?.organization?.id;
      const alertas = [];

      // 1. Stock bajo
      const { data: stockBajo } = await supabase
        .from('productos')
        .select('nombre, stock_actual, stock_minimo')
        .eq('activo', true)
        .eq('organizacion_id', orgId);

      (stockBajo || []).forEach(p => {
        if (p.stock_minimo > 0 && p.stock_actual <= p.stock_minimo) {
          alertas.push({
            tipo: 'danger',
            icono: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>`,
            texto: `Stock bajo: <strong>${p.nombre}</strong> — ${p.stock_actual} unidades (mínimo: ${p.stock_minimo})`,
          });
        }
      });

      // 2. Productos por vencer (próximos 15 días)
      const hoy = new Date();
      const en15 = new Date();
      en15.setDate(en15.getDate() + 15);
      const { data: porVencer } = await supabase
        .from('productos')
        .select('nombre, fecha_vencimiento')
        .eq('activo', true)
        .eq('organizacion_id', orgId)
        .not('fecha_vencimiento', 'is', null)
        .lte('fecha_vencimiento', en15.toISOString().split('T')[0]);

      (porVencer || []).forEach(p => {
        const vence = new Date(p.fecha_vencimiento);
        const diasRestantes = Math.ceil((vence - hoy) / (1000 * 60 * 60 * 24));
        if (diasRestantes < 0) {
          alertas.push({ tipo: 'danger', icono: '⏰', texto: `<strong>${p.nombre}</strong> — VENCIDO hace ${Math.abs(diasRestantes)} días` });
        } else {
          alertas.push({ tipo: 'warning', icono: '⏰', texto: `<strong>${p.nombre}</strong> — vence en ${diasRestantes} días` });
        }
      });

      // 3. Clientes morosos
      const { data: morosos } = await supabase
        .from('clientes')
        .select('nombre_establecimiento, saldo_pendiente')
        .gt('saldo_pendiente', 0)
        .eq('organizacion_id', orgId)
        .order('saldo_pendiente', { ascending: false })
        .limit(5);

      const moneda = window.App?.organization?.moneda || 'ARS';
      (morosos || []).forEach(c => {
        alertas.push({
          tipo: 'warning',
          icono: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
          texto: `Deuda: <strong>${c.nombre_establecimiento}</strong> — ${moneda} ${Number(c.saldo_pendiente).toLocaleString('es-AR')}`,
        });
      });

      // 4. Pedidos pendientes hace más de 3 días
      const hace3 = new Date();
      hace3.setDate(hace3.getDate() - 3);
      const { data: pedidosViejos } = await supabase
        .from('pedidos')
        .select('numero_pedido, created_at')
        .eq('estado', 'pendiente')
        .eq('organizacion_id', orgId)
        .lte('created_at', hace3.toISOString());

      (pedidosViejos || []).forEach(p => {
        const dias = Math.ceil((hoy - new Date(p.created_at)) / (1000 * 60 * 60 * 24));
        alertas.push({
          tipo: 'warning',
          icono: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
          texto: `Pedido <strong>#${p.numero_pedido}</strong> pendiente hace ${dias} días`,
        });
      });

      const container = document.getElementById('dashAlertas');
      if (!container) return;

      if (alertas.length === 0) {
        container.innerHTML = '<div class="dash-alerta-empty">Sin alertas activas</div>';
        return;
      }

      container.innerHTML = alertas.map(a => `
        <div class="dash-alerta ${a.tipo}">
          <span class="dash-alerta-icon">${a.icono}</span>
          <span>${a.texto}</span>
        </div>
      `).join('');
    } catch (err) {
      console.error('Error alertas:', err);
    }
  },

  // ========================================
  // CIERRE DE CAJA / COBROS DEL DÍA
  // ========================================

  async loadCierreCaja() {
    try {
      const moneda = window.App?.organization?.moneda || 'ARS';
      const orgId = window.App?.organization?.id;
      const hoy = new Date();
      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
      const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1).toISOString();

      const { data } = await supabase
        .from('cobros')
        .select('monto, metodo_pago')
        .eq('organizacion_id', orgId)
        .gte('created_at', inicioHoy)
        .lt('created_at', finHoy);

      const container = document.getElementById('dashCierreCaja');
      const badge = document.getElementById('cierreCajaBadge');
      if (!container) return;

      const cobros = data || [];

      if (cobros.length === 0) {
        container.innerHTML = '<div class="text-center text-muted" style="padding:1.5rem;">Sin cobros registrados hoy</div>';
        return;
      }

      if (badge) { badge.textContent = cobros.length; badge.style.display = ''; }

      const metodoLabel = {
        efectivo: 'Efectivo', transferencia: 'Transferencia', cheque: 'Cheque',
        debito: 'Débito', credito: 'Crédito', otro: 'Otro',
      };

      const porMetodo = {};
      let totalDia = 0;
      cobros.forEach(c => {
        const m = c.metodo_pago || 'otro';
        if (!porMetodo[m]) porMetodo[m] = { total: 0, cantidad: 0 };
        porMetodo[m].total += Number(c.monto);
        porMetodo[m].cantidad += 1;
        totalDia += Number(c.monto);
      });

      const rows = Object.entries(porMetodo)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([metodo, d]) => `
          <div class="cierre-caja-row">
            <span class="cierre-caja-metodo">${metodoLabel[metodo] || metodo}</span>
            <span class="cierre-caja-count">${d.cantidad} cobro${d.cantidad !== 1 ? 's' : ''}</span>
            <span class="cierre-caja-monto">${moneda} ${d.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
          </div>`).join('');

      container.innerHTML = `
        <div class="cierre-caja-total">
          <span>Total cobrado hoy (${cobros.length} cobro${cobros.length !== 1 ? 's' : ''})</span>
          <strong>${moneda} ${totalDia.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
        </div>
        <div class="cierre-caja-detalle">${rows}</div>
      `;
    } catch (err) {
      console.error('Error cierre de caja:', err);
    }
  },

  esc(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
};

export default DashboardPage;
