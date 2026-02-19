/* ========================================
   PÁGINA LOGÍSTICA - FASE 6
   CRUD de Rutas + Mapa Leaflet
   + Asignación de pedidos a rutas
   + Seguimiento de entregas
   ======================================== */

import supabase from '../config/supabase.js';
import Toast from '../utils/toast.js';

const ESTADOS_RUTA = {
  pendiente:  { label: 'Pendiente',  color: '#f59e0b' },
  en_curso:   { label: 'En Curso',   color: '#3b82f6' },
  completada: { label: 'Completada', color: '#16a34a' },
};

const LogisticaPage = {
  rutas: [],
  repartidores: [],
  pedidosSinRuta: [],

  async render(container) {
    this.container = container;

    container.innerHTML = `
      <div class="logi-header">
        <div>
          <h1>Logística y Rutas</h1>
          <p>Planificación de rutas de reparto y seguimiento de entregas</p>
        </div>
        <div class="logi-header-actions">
          <button class="btn btn-primary" id="btnNuevaRuta">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nueva Ruta
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="logi-filters">
        <select id="filterEstadoRuta">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_curso">En Curso</option>
          <option value="completada">Completada</option>
        </select>
        <input type="date" id="filterFechaRuta" />
      </div>

      <!-- Vista principal: lista + mapa -->
      <div class="logi-main">
        <div class="logi-lista-panel">
          <div id="rutasLista" class="logi-rutas-lista">
            <div class="loader"><div class="spinner"></div></div>
          </div>
        </div>
        <div class="logi-mapa-panel">
          <div id="mapaContainer" class="logi-mapa"></div>
        </div>
      </div>

      <div id="modalContainer"></div>
    `;

    await Promise.all([
      this.loadRepartidores(),
      this.loadPedidosSinRuta(),
    ]);

    await this.loadRutas();
    await this._loadLeaflet();
    this._initMap();
    this.initEvents();
  },

  // ========================================
  // CARGA DE DATOS
  // ========================================

  async loadRutas() {
    try {
      let query = supabase
        .from('rutas')
        .select('*, repartidor:repartidor_id(id, nombre)')
        .order('fecha', { ascending: false });

      const filtroEstado = document.getElementById('filterEstadoRuta')?.value;
      if (filtroEstado) query = query.eq('estado', filtroEstado);

      const filtroFecha = document.getElementById('filterFechaRuta')?.value;
      if (filtroFecha) query = query.eq('fecha', filtroFecha);

      const { data, error } = await query;
      if (error) throw error;

      this.rutas = data || [];
      this.renderLista();
      this._renderMarkers();
    } catch (err) {
      console.error('Error cargando rutas:', err);
      Toast.error('Error al cargar rutas');
    }
  },

  async loadRepartidores() {
    try {
      const { data } = await supabase
        .from('usuarios')
        .select('id, nombre')
        .in('rol', ['repartidor', 'vendedor', 'gerente', 'admin', 'owner'])
        .eq('activo', true);
      this.repartidores = data || [];
    } catch (err) {
      console.error('Error cargando repartidores:', err);
    }
  },

  async loadPedidosSinRuta() {
    try {
      const { data } = await supabase
        .from('pedidos')
        .select('id, numero_pedido, total, estado, fecha_entrega_programada, cliente_id, cliente:cliente_id(nombre_establecimiento, direccion_completa, ubicacion_gps)')
        .in('estado', ['pendiente', 'en_preparacion'])
        .is('ruta_id', null)
        .order('fecha_entrega_programada');
      this.pedidosSinRuta = data || [];
    } catch (err) {
      console.error('Error cargando pedidos sin ruta:', err);
    }
  },

  // ========================================
  // RENDERIZADO DE LISTA
  // ========================================

  renderLista() {
    const container = document.getElementById('rutasLista');
    if (!container) return;

    if (this.rutas.length === 0) {
      container.innerHTML = `
        <div class="logi-empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <h3>No hay rutas</h3>
          <p>Creá una ruta con el botón "Nueva Ruta"</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.rutas.map(r => {
      const paradas = r.secuencia_paradas || [];
      const completadas = paradas.filter(p => p.entregado).length;
      const estadoInfo = ESTADOS_RUTA[r.estado] || ESTADOS_RUTA.pendiente;

      return `
        <div class="logi-ruta-card ${r.estado}" data-id="${r.id}">
          <div class="logi-ruta-card-header">
            <div>
              <h4>${this.esc(r.nombre)}</h4>
              <span class="logi-ruta-fecha">${r.fecha ? new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-AR') : '-'}</span>
            </div>
            <span class="logi-estado-badge" style="background:${estadoInfo.color}15;color:${estadoInfo.color};border:1px solid ${estadoInfo.color}40;">
              ${estadoInfo.label}
            </span>
          </div>
          <div class="logi-ruta-card-body">
            <div class="logi-ruta-meta">
              <span title="Repartidor">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                ${this.esc(r.repartidor?.nombre || 'Sin asignar')}
              </span>
              <span title="Vehículo">${this.esc(r.vehiculo || '-')}</span>
            </div>
            <div class="logi-ruta-progress">
              <div class="logi-progress-bar">
                <div class="logi-progress-fill" style="width:${paradas.length ? (completadas / paradas.length * 100) : 0}%"></div>
              </div>
              <span class="logi-progress-text">${completadas}/${paradas.length} entregas</span>
            </div>
            ${r.km_estimados ? `<span class="logi-km">${r.km_estimados} km</span>` : ''}
          </div>
          <div class="logi-ruta-card-actions">
            <button class="btn btn-sm btn-secondary btn-ver-ruta" data-id="${r.id}">Ver detalle</button>
            <button class="btn btn-sm btn-danger btn-eliminar-ruta" data-id="${r.id}" title="Eliminar">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  // ========================================
  // EVENTOS
  // ========================================

  initEvents() {
    document.getElementById('btnNuevaRuta')?.addEventListener('click', () => this.openModal());

    document.getElementById('filterEstadoRuta')?.addEventListener('change', () => this.loadRutas());
    document.getElementById('filterFechaRuta')?.addEventListener('change', () => this.loadRutas());

    document.getElementById('rutasLista')?.addEventListener('click', (e) => {
      const btnVer = e.target.closest('.btn-ver-ruta');
      if (btnVer) { this.openDetalle(btnVer.dataset.id); return; }

      const btnDel = e.target.closest('.btn-eliminar-ruta');
      if (btnDel) { this.confirmarEliminar(btnDel.dataset.id); return; }

      // Click en la card: centrar mapa en paradas
      const card = e.target.closest('.logi-ruta-card');
      if (card) this._focusRuta(card.dataset.id);
    });
  },

  // ========================================
  // MODAL NUEVA/EDITAR RUTA
  // ========================================

  openModal(ruta = null) {
    const isEdit = !!ruta;
    const hoy = new Date().toISOString().split('T')[0];

    document.getElementById('modalContainer').innerHTML = `
      <div class="modal-overlay" id="rutaModal">
        <div class="modal" style="max-width:600px;">
          <div class="modal-header">
            <h2>${isEdit ? 'Editar Ruta' : 'Nueva Ruta'}</h2>
            <button class="modal-close" id="btnCloseModal">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="modal-body">
            <form id="formRuta">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Nombre de la ruta *</label>
                  <input type="text" class="form-input" name="nombre" required placeholder="Ej: Norte - Camión 03" value="${isEdit ? this.esc(ruta.nombre) : ''}">
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha *</label>
                  <input type="date" class="form-input" name="fecha" required value="${isEdit ? ruta.fecha : hoy}">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Repartidor</label>
                  <select class="form-input" name="repartidor_id">
                    <option value="">Sin asignar</option>
                    ${this.repartidores.map(r => `<option value="${r.id}" ${isEdit && ruta.repartidor_id === r.id ? 'selected' : ''}>${this.esc(r.nombre)}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Vehículo</label>
                  <input type="text" class="form-input" name="vehiculo" placeholder="Ej: Camión Iveco" value="${isEdit ? this.esc(ruta.vehiculo || '') : ''}">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Hora de salida</label>
                  <input type="time" class="form-input" name="hora_salida" value="${isEdit && ruta.hora_salida ? ruta.hora_salida : '08:00'}">
                </div>
                <div class="form-group">
                  <label class="form-label">Km estimados</label>
                  <input type="number" class="form-input" name="km_estimados" step="0.1" min="0" placeholder="0" value="${isEdit && ruta.km_estimados ? ruta.km_estimados : ''}">
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btnCancelModal">Cancelar</button>
            <button class="btn btn-primary" id="btnSaveRuta">${isEdit ? 'Guardar' : 'Crear Ruta'}</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnCloseModal').addEventListener('click', () => this.closeModal());
    document.getElementById('btnCancelModal').addEventListener('click', () => this.closeModal());
    document.getElementById('rutaModal').addEventListener('click', (e) => {
      if (e.target.id === 'rutaModal') this.closeModal();
    });
    document.getElementById('btnSaveRuta').addEventListener('click', () => this.saveRuta(ruta?.id));

    this._escHandler = (e) => { if (e.key === 'Escape') this.closeModal(); };
    document.addEventListener('keydown', this._escHandler);
  },

  async saveRuta(editId = null) {
    const form = document.getElementById('formRuta');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const fd = new FormData(form);
    const orgId = window.App?.userProfile?.organizacion_id;
    if (!orgId) { Toast.error('No se pudo determinar la organización.'); return; }

    const data = {
      nombre: fd.get('nombre').trim(),
      fecha: fd.get('fecha'),
      repartidor_id: fd.get('repartidor_id') || null,
      vehiculo: fd.get('vehiculo')?.trim() || null,
      hora_salida: fd.get('hora_salida') || null,
      km_estimados: fd.get('km_estimados') ? parseFloat(fd.get('km_estimados')) : null,
    };

    const btn = document.getElementById('btnSaveRuta');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
      if (editId) {
        const { error } = await supabase.from('rutas').update(data).eq('id', editId);
        if (error) throw error;
        Toast.success('Ruta actualizada');
      } else {
        data.organizacion_id = orgId;
        data.secuencia_paradas = [];
        const { error } = await supabase.from('rutas').insert(data);
        if (error) throw error;
        Toast.success('Ruta creada');
      }
      this.closeModal();
      this.loadRutas();
    } catch (err) {
      console.error('Error guardando ruta:', err);
      Toast.error(err.message || 'Error al guardar ruta');
      btn.disabled = false;
      btn.textContent = editId ? 'Guardar' : 'Crear Ruta';
    }
  },

  // ========================================
  // DETALLE DE RUTA + GESTIÓN DE PARADAS
  // ========================================

  async openDetalle(id) {
    const ruta = this.rutas.find(r => r.id === id);
    if (!ruta) return;

    // Recargar pedidos sin ruta
    await this.loadPedidosSinRuta();

    const paradas = ruta.secuencia_paradas || [];
    const estadoInfo = ESTADOS_RUTA[ruta.estado] || ESTADOS_RUTA.pendiente;
    const moneda = window.App?.organization?.moneda || 'ARS';

    document.getElementById('modalContainer').innerHTML = `
      <div class="modal-overlay" id="detalleRutaModal">
        <div class="modal" style="max-width:900px;">
          <div class="modal-header">
            <h2>${this.esc(ruta.nombre)}</h2>
            <button class="modal-close" id="btnCloseDetalle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="modal-body">
            <!-- Info de la ruta -->
            <div class="logi-detalle-info">
              <div class="logi-detalle-meta">
                <span><strong>Fecha:</strong> ${ruta.fecha ? new Date(ruta.fecha + 'T00:00:00').toLocaleDateString('es-AR') : '-'}</span>
                <span><strong>Repartidor:</strong> ${this.esc(ruta.repartidor?.nombre || 'Sin asignar')}</span>
                <span><strong>Vehículo:</strong> ${this.esc(ruta.vehiculo || '-')}</span>
                <span><strong>Salida:</strong> ${ruta.hora_salida || '-'}</span>
                ${ruta.km_estimados ? `<span><strong>Km:</strong> ${ruta.km_estimados}</span>` : ''}
              </div>

              <!-- Cambiar estado -->
              <div class="logi-detalle-estado">
                <label class="form-label">Estado:</label>
                <div class="estado-selector" id="estadoRutaSelector">
                  ${Object.entries(ESTADOS_RUTA).map(([key, val]) => `
                    <button type="button" class="${key === ruta.estado ? 'active' : ''}" data-estado="${key}">${val.label}</button>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Agregar pedidos a la ruta -->
            <div class="form-section">
              <div class="form-section-title">Agregar pedidos a la ruta</div>
              <div id="pedidosSinRutaList" class="logi-pedidos-disponibles">
                ${this.pedidosSinRuta.length === 0
                  ? '<p class="text-muted text-center" style="padding:0.75rem;">No hay pedidos pendientes sin ruta asignada</p>'
                  : this.pedidosSinRuta.map(p => `
                    <div class="logi-pedido-item" data-id="${p.id}">
                      <div>
                        <strong>#${p.numero_pedido}</strong> — ${this.esc(p.cliente?.nombre_establecimiento || '-')}
                        <br><small>${this.esc(p.cliente?.direccion_completa || 'Sin dirección')} · ${moneda} ${Number(p.total).toLocaleString('es-AR')}</small>
                      </div>
                      <button class="btn btn-sm btn-primary btn-agregar-parada" data-pedido-id="${p.id}" data-cliente-id="${p.cliente_id || ''}" data-numero="${p.numero_pedido}" data-cliente="${this.esc(p.cliente?.nombre_establecimiento || '')}" data-direccion="${this.esc(p.cliente?.direccion_completa || '')}" data-gps="${p.cliente?.ubicacion_gps || ''}">
                        + Agregar
                      </button>
                    </div>
                  `).join('')}
              </div>
            </div>

            <!-- Paradas actuales -->
            <div class="form-section">
              <div class="form-section-title">Paradas (${paradas.length})</div>
              <div id="paradasList" class="logi-paradas-list">
                ${this._renderParadas(paradas)}
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btnCerrarDetalle">Cerrar</button>
            <button class="btn btn-export" id="btnImprimirRuta" title="Imprimir hoja de ruta">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              Imprimir
            </button>
            <button class="btn btn-secondary" id="btnEditarRuta">Editar datos</button>
          </div>
        </div>
      </div>
    `;

    // Eventos
    document.getElementById('btnCloseDetalle').addEventListener('click', () => this.closeModal());
    document.getElementById('btnCerrarDetalle').addEventListener('click', () => this.closeModal());
    document.getElementById('detalleRutaModal').addEventListener('click', (e) => {
      if (e.target.id === 'detalleRutaModal') this.closeModal();
    });

    document.getElementById('btnImprimirRuta').addEventListener('click', () => {
      this.imprimirHojaRuta(ruta);
    });

    document.getElementById('btnEditarRuta').addEventListener('click', () => {
      this.closeModal();
      this.openModal(ruta);
    });

    // Cambiar estado de la ruta
    document.getElementById('estadoRutaSelector').addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const nuevoEstado = btn.dataset.estado;
      if (nuevoEstado === ruta.estado) return;

      try {
        const { error } = await supabase.from('rutas').update({ estado: nuevoEstado }).eq('id', ruta.id);
        if (error) throw error;
        ruta.estado = nuevoEstado;
        document.querySelectorAll('#estadoRutaSelector button').forEach(b => {
          b.classList.toggle('active', b.dataset.estado === nuevoEstado);
        });
        Toast.success(`Estado cambiado a: ${ESTADOS_RUTA[nuevoEstado].label}`);
        this.loadRutas();
      } catch (err) {
        Toast.error('Error al cambiar estado');
      }
    });

    // Agregar parada
    document.getElementById('pedidosSinRutaList').addEventListener('click', async (e) => {
      const btn = e.target.closest('.btn-agregar-parada');
      if (!btn) return;

      const parada = {
        pedido_id: btn.dataset.pedidoId,
        cliente_id: btn.dataset.clienteId || null,
        numero_pedido: btn.dataset.numero,
        cliente: btn.dataset.cliente,
        direccion: btn.dataset.direccion,
        gps: btn.dataset.gps,
        entregado: false,
        hora_entrega: null,
        nota: '',
      };

      ruta.secuencia_paradas = ruta.secuencia_paradas || [];
      ruta.secuencia_paradas.push(parada);

      try {
        // Actualizar secuencia en la ruta
        const { error: errRuta } = await supabase.from('rutas').update({ secuencia_paradas: ruta.secuencia_paradas }).eq('id', ruta.id);
        if (errRuta) throw errRuta;

        // Asignar ruta_id al pedido
        const { error: errPed } = await supabase.from('pedidos').update({ ruta_id: ruta.id }).eq('id', parada.pedido_id);
        if (errPed) throw errPed;

        Toast.success(`Pedido #${parada.numero_pedido} agregado a la ruta`);

        // Quitar de la lista disponible
        btn.closest('.logi-pedido-item')?.remove();

        // Re-renderizar paradas
        document.getElementById('paradasList').innerHTML = this._renderParadas(ruta.secuencia_paradas);
        this._bindParadaEvents(ruta);
        this.loadRutas();
      } catch (err) {
        console.error(err);
        Toast.error('Error al agregar parada');
        ruta.secuencia_paradas.pop();
      }
    });

    // Bind eventos de paradas existentes
    this._bindParadaEvents(ruta);

    this._escHandler = (e) => { if (e.key === 'Escape') this.closeModal(); };
    document.addEventListener('keydown', this._escHandler);
  },

  _renderParadas(paradas) {
    if (!paradas || paradas.length === 0) {
      return '<p class="text-muted text-center" style="padding:0.75rem;">Sin paradas. Agregá pedidos desde la lista de arriba.</p>';
    }

    return paradas.map((p, i) => `
      <div class="logi-parada ${p.entregado ? 'entregado' : ''}" data-index="${i}">
        <div class="logi-parada-num">${i + 1}</div>
        <div class="logi-parada-info">
          <strong>#${p.numero_pedido}</strong> — ${this.esc(p.cliente)}
          <br><small>${this.esc(p.direccion || 'Sin dirección')}</small>
          ${p.hora_entrega ? `<br><small class="text-success">Entregado: ${p.hora_entrega}</small>` : ''}
          ${p.nota ? `<br><small class="text-muted">Nota: ${this.esc(p.nota)}</small>` : ''}
        </div>
        <div class="logi-parada-actions">
          ${!p.entregado ? `
            <button class="btn btn-sm btn-primary btn-marcar-entregado" data-index="${i}" title="Marcar entregado">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
          ` : '<span class="logi-check-done">&#10003;</span>'}
          <button class="btn btn-sm btn-danger btn-quitar-parada" data-index="${i}" title="Quitar">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
    `).join('');
  },

  _bindParadaEvents(ruta) {
    const container = document.getElementById('paradasList');
    if (!container) return;

    // Quitar listeners anteriores clonando el nodo
    const newContainer = container.cloneNode(true);
    container.parentNode.replaceChild(newContainer, container);

    newContainer.addEventListener('click', async (e) => {
      // Marcar como entregado
      const btnEntregado = e.target.closest('.btn-marcar-entregado');
      if (btnEntregado) {
        const idx = parseInt(btnEntregado.dataset.index);
        ruta.secuencia_paradas[idx].entregado = true;
        ruta.secuencia_paradas[idx].hora_entrega = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

        try {
          const { error } = await supabase.from('rutas').update({ secuencia_paradas: ruta.secuencia_paradas }).eq('id', ruta.id);
          if (error) throw error;

          // Actualizar estado del pedido a "entregado"
          const paradaActual = ruta.secuencia_paradas[idx];
          await supabase.from('pedidos').update({
            estado: 'entregado',
            fecha_entrega_real: new Date().toISOString(),
          }).eq('id', paradaActual.pedido_id);

          // Actualizar fecha_ultima_compra del cliente
          if (paradaActual.cliente_id) {
            await supabase
              .from('clientes')
              .update({ fecha_ultima_compra: new Date().toISOString() })
              .eq('id', paradaActual.cliente_id);
          }

          Toast.success(`Pedido #${paradaActual.numero_pedido} marcado como entregado`);
          newContainer.innerHTML = this._renderParadas(ruta.secuencia_paradas);
          this._bindParadaEvents(ruta);
          this.loadRutas();
        } catch (err) {
          Toast.error('Error al marcar entrega');
        }
        return;
      }

      // Quitar parada
      const btnQuitar = e.target.closest('.btn-quitar-parada');
      if (btnQuitar) {
        const idx = parseInt(btnQuitar.dataset.index);
        const parada = ruta.secuencia_paradas[idx];
        ruta.secuencia_paradas.splice(idx, 1);

        try {
          const { error: errRuta } = await supabase.from('rutas').update({ secuencia_paradas: ruta.secuencia_paradas }).eq('id', ruta.id);
          if (errRuta) throw errRuta;

          // Quitar ruta_id del pedido
          await supabase.from('pedidos').update({ ruta_id: null }).eq('id', parada.pedido_id);

          Toast.success(`Parada #${parada.numero_pedido} quitada`);
          newContainer.innerHTML = this._renderParadas(ruta.secuencia_paradas);
          this._bindParadaEvents(ruta);
          this.loadRutas();
        } catch (err) {
          Toast.error('Error al quitar parada');
          ruta.secuencia_paradas.splice(idx, 0, parada);
        }
        return;
      }
    });
  },

  // ========================================
  // ELIMINAR RUTA
  // ========================================

  async confirmarEliminar(id) {
    const ruta = this.rutas.find(r => r.id === id);
    if (!ruta) return;

    document.getElementById('modalContainer').innerHTML = `
      <div class="modal-overlay" id="deleteRutaModal">
        <div class="modal" style="max-width:450px;">
          <div class="modal-header">
            <h2>Eliminar ruta</h2>
            <button class="modal-close" id="btnCloseDelete">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="modal-body">
            <p>¿Estás seguro de que querés eliminar la ruta <strong>${this.esc(ruta.nombre)}</strong>?</p>
            <p style="color:var(--gray-500);font-size:var(--font-size-sm);margin-top:0.5rem;">Los pedidos asignados volverán a quedar sin ruta.</p>
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
    document.getElementById('deleteRutaModal').addEventListener('click', (e) => {
      if (e.target.id === 'deleteRutaModal') this.closeModal();
    });

    document.getElementById('btnConfirmDelete').addEventListener('click', async () => {
      try {
        // Liberar pedidos de esta ruta
        const paradas = ruta.secuencia_paradas || [];
        for (const p of paradas) {
          await supabase.from('pedidos').update({ ruta_id: null }).eq('id', p.pedido_id);
        }
        const { error } = await supabase.from('rutas').delete().eq('id', id);
        if (error) throw error;
        Toast.success('Ruta eliminada');
        this.closeModal();
        this.loadRutas();
      } catch (err) {
        Toast.error(err.message || 'Error al eliminar');
      }
    });
  },

  closeModal() {
    document.getElementById('modalContainer').innerHTML = '';
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }
  },

  // ========================================
  // MAPA CON LEAFLET
  // ========================================

  async _loadLeaflet() {
    if (window.L) return;

    // CSS de Leaflet
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.css';
      document.head.appendChild(link);
    }

    // JS de Leaflet
    const existing = document.querySelector('script[src*="leaflet"]');
    if (existing) {
      return new Promise((resolve) => {
        const check = setInterval(() => {
          if (window.L) { clearInterval(check); resolve(); }
        }, 100);
        setTimeout(() => { clearInterval(check); resolve(); }, 8000);
      });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js';
      script.onload = () => {
        if (window.L) resolve();
        else reject(new Error('Leaflet no se inicializó'));
      };
      script.onerror = () => { script.remove(); reject(new Error('Error cargando Leaflet')); };
      document.head.appendChild(script);
    });
  },

  _initMap() {
    if (!window.L) {
      const el = document.getElementById('mapaContainer');
      if (el) el.innerHTML = '<div class="text-center text-muted" style="padding:2rem;">No se pudo cargar el mapa</div>';
      return;
    }

    // Buenos Aires como centro por defecto
    this.map = L.map('mapaContainer').setView([-34.6037, -58.3816], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(this.map);

    this.markersLayer = L.layerGroup().addTo(this.map);

    // Fix para que el mapa se renderice bien dentro del contenedor
    setTimeout(() => { this.map.invalidateSize(); }, 200);
  },

  _renderMarkers() {
    if (!this.map || !this.markersLayer) return;
    this.markersLayer.clearLayers();

    const colores = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
    const bounds = [];

    this.rutas.forEach((ruta, ri) => {
      const paradas = ruta.secuencia_paradas || [];
      const color = colores[ri % colores.length];

      paradas.forEach((p, pi) => {
        if (!p.gps) return;
        const coords = this._parseGPS(p.gps);
        if (!coords) return;

        bounds.push(coords);

        const icon = L.divIcon({
          className: 'logi-marker',
          html: `<div style="background:${color};color:white;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);">${pi + 1}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker(coords, { icon }).addTo(this.markersLayer);
        marker.bindPopup(`
          <strong>${this.esc(ruta.nombre)}</strong><br>
          Parada ${pi + 1}: #${p.numero_pedido}<br>
          ${this.esc(p.cliente)}<br>
          <small>${this.esc(p.direccion || '')}</small>
          ${p.entregado ? '<br><span style="color:#16a34a;">&#10003; Entregado</span>' : ''}
        `);
      });
    });

    if (bounds.length > 0) {
      this.map.fitBounds(bounds, { padding: [30, 30] });
    }
  },

  _focusRuta(rutaId) {
    const ruta = this.rutas.find(r => r.id === rutaId);
    if (!ruta || !this.map) return;

    const paradas = ruta.secuencia_paradas || [];
    const coords = paradas
      .filter(p => p.gps)
      .map(p => this._parseGPS(p.gps))
      .filter(Boolean);

    if (coords.length > 0) {
      this.map.fitBounds(coords, { padding: [30, 30], maxZoom: 15 });
    }
  },

  _parseGPS(gps) {
    if (!gps) return null;
    // Soporta formatos: "-34.6037,-58.3816" o "-34.6037, -58.3816"
    const parts = gps.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return [parts[0], parts[1]];
    }
    return null;
  },

  esc(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // ========================================
  // HOJA DE RUTA IMPRIMIBLE
  // ========================================

  imprimirHojaRuta(ruta) {
    const org = window.App?.organization;
    const paradas = ruta.secuencia_paradas || [];
    const moneda = org?.moneda || 'ARS';
    const fecha = ruta.fecha
      ? new Date(ruta.fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : '—';

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Hoja de Ruta — ${this.esc(ruta.nombre)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
    .org-name { font-size: 18px; font-weight: bold; }
    .ruta-title { font-size: 22px; font-weight: bold; }
    .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
    .meta-item { background: #f5f5f5; border-radius: 4px; padding: 8px 10px; }
    .meta-label { font-size: 10px; text-transform: uppercase; color: #666; margin-bottom: 2px; }
    .meta-value { font-weight: bold; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    thead th { background: #111; color: #fff; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
    tbody tr { border-bottom: 1px solid #ddd; }
    tbody tr:nth-child(even) { background: #f9f9f9; }
    td { padding: 10px; vertical-align: top; }
    .num { font-weight: bold; font-size: 16px; color: #444; text-align: center; width: 36px; }
    .cliente { font-weight: bold; }
    .dir { color: #555; font-size: 12px; margin-top: 2px; }
    .check { width: 60px; text-align: center; }
    .check-box { display: inline-block; width: 20px; height: 20px; border: 2px solid #333; border-radius: 3px; }
    .check-box.done { background: #16a34a; border-color: #16a34a; position: relative; }
    .check-box.done::after { content: "✓"; position: absolute; color: white; font-weight: bold; top: -2px; left: 3px; }
    .hora { font-size: 11px; color: #555; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #ccc; display: flex; justify-content: space-between; font-size: 11px; color: #888; }
    .firma-box { border: 1px solid #aaa; border-radius: 4px; padding: 8px 16px; margin-top: 24px; }
    .firma-label { font-size: 11px; color: #666; margin-bottom: 32px; }
    .firma-line { border-top: 1px solid #333; padding-top: 4px; font-size: 11px; color: #444; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="org-name">${this.esc(org?.nombre || 'Distribuidora')}</div>
      <div style="font-size:12px;color:#555;margin-top:4px;">Hoja de Ruta de Entrega</div>
    </div>
    <div style="text-align:right;">
      <div class="ruta-title">${this.esc(ruta.nombre)}</div>
      <div style="font-size:12px;color:#555;margin-top:4px;">Impreso: ${new Date().toLocaleString('es-AR')}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <div class="meta-label">Fecha</div>
      <div class="meta-value" style="font-size:12px;">${fecha}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Repartidor</div>
      <div class="meta-value">${this.esc(ruta.repartidor?.nombre || '—')}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Vehículo</div>
      <div class="meta-value">${this.esc(ruta.vehiculo || '—')}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Salida / Km estimados</div>
      <div class="meta-value">${ruta.hora_salida || '—'} ${ruta.km_estimados ? `· ${ruta.km_estimados} km` : ''}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:40px;">#</th>
        <th>Cliente / Dirección</th>
        <th style="width:80px;">Pedido</th>
        <th style="width:70px;">Hora llegada</th>
        <th class="check">Entregado</th>
        <th style="width:120px;">Firma cliente</th>
      </tr>
    </thead>
    <tbody>
      ${paradas.length === 0
        ? `<tr><td colspan="6" style="text-align:center;padding:24px;color:#888;">Sin paradas asignadas</td></tr>`
        : paradas.map((p, i) => `
          <tr>
            <td class="num">${i + 1}</td>
            <td>
              <div class="cliente">${this.esc(p.cliente || '—')}</div>
              <div class="dir">${this.esc(p.direccion || 'Sin dirección registrada')}</div>
            </td>
            <td><strong>#${p.numero_pedido}</strong></td>
            <td>
              ${p.entregado && p.hora_entrega
                ? `<span class="hora">${p.hora_entrega}</span>`
                : `<span style="color:#aaa;font-size:11px;">— : —</span>`}
            </td>
            <td class="check">
              <span class="check-box ${p.entregado ? 'done' : ''}"></span>
            </td>
            <td style="border-bottom:1px solid #aaa;padding-bottom:0;vertical-align:bottom;font-size:10px;color:#aaa;">firma</td>
          </tr>
        `).join('')}
    </tbody>
  </table>

  <div class="firma-box" style="margin-top:28px;">
    <div class="firma-label">Firma y aclaración del repartidor</div>
    <div class="firma-line">${this.esc(ruta.repartidor?.nombre || 'Repartidor')}</div>
  </div>

  <div class="footer">
    <span>${this.esc(org?.nombre || '')} — Sistema CRM</span>
    <span>Paradas: ${paradas.length} · Entregadas: ${paradas.filter(p => p.entregado).length}</span>
  </div>

  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };<\/script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      Toast.error('Habilitá las ventanas emergentes para imprimir');
      return;
    }
    win.document.write(html);
    win.document.close();
  },
};

export default LogisticaPage;
