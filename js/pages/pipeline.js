/* ========================================
   PIPELINE KANBAN - Tablero de Oportunidades
   Drag & drop nativo (sin librerías)
   ======================================== */

import supabase from '../config/supabase.js';
import Toast from '../utils/toast.js';
import Notif from '../utils/notif.js';

const ETAPAS = [
  { key: 'contacto_inicial', label: 'Contacto Inicial', prob: 10 },
  { key: 'calificacion', label: 'Calificación', prob: 25 },
  { key: 'presupuesto', label: 'Presupuesto', prob: 50 },
  { key: 'negociacion', label: 'Negociación', prob: 70 },
  { key: 'primer_pedido', label: 'Primer Pedido', prob: 90 },
  { key: 'cliente_activo', label: 'Cliente Activo', prob: 100 },
];

const ALERTA_DIAS_WARN = 5;  // Amarillo: >5 días en la etapa
const ALERTA_DIAS_DANGER = 10; // Rojo: >10 días en la etapa

const PipelinePage = {
  oportunidades: [],
  clientes: [],
  vendedores: [],
  draggedCard: null,

  async render(container) {
    this.container = container;
    const moneda = window.App?.organization?.moneda || 'ARS';

    container.innerHTML = `
      <div class="pipeline-header">
        <div>
          <h1>Pipeline de Ventas</h1>
          <p>Arrastrá las tarjetas entre etapas para actualizar el estado</p>
        </div>
        <div class="pipeline-actions">
          <button class="btn btn-primary" id="btnNuevaOportunidad">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nueva Oportunidad
          </button>
        </div>
      </div>

      <div class="pipeline-summary" id="pipelineSummary"></div>

      <div class="kanban-board" id="kanbanBoard">
        ${ETAPAS.map(e => `
          <div class="kanban-column" data-etapa="${e.key}">
            <div class="kanban-column-header">
              <div class="kanban-column-title">
                <h3>${e.label}</h3>
                <span class="kanban-count" data-count="${e.key}">0</span>
              </div>
              <div class="kanban-column-value" data-value="${e.key}">${moneda} 0</div>
            </div>
            <div class="kanban-cards" data-etapa="${e.key}">
              <div class="kanban-empty">Cargando...</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div id="modalContainer"></div>
    `;

    await Promise.all([
      this.loadClientes(),
      this.loadVendedores(),
    ]);
    await this.loadOportunidades();
    this.initEvents();
  },

  // ========================================
  // CARGA DE DATOS
  // ========================================

  async loadOportunidades() {
    try {
      const orgId = window.App?.organization?.id;
      const { data, error } = await supabase
        .from('pipeline_oportunidades')
        .select('*, cliente:cliente_id(id, nombre_establecimiento), vendedor:vendedor_id(id, nombre)')
        .eq('organizacion_id', orgId)
        .order('fecha_entrada_etapa', { ascending: true });

      if (error) throw error;
      this.oportunidades = data || [];
      this.renderBoard();
      this.renderSummary();
    } catch (err) {
      console.error('Error cargando pipeline:', err);
      Toast.error('Error al cargar el pipeline');
    }
  },

  async loadClientes() {
    try {
      const orgId = window.App?.organization?.id;
      const { data } = await supabase
        .from('clientes')
        .select('id, nombre_establecimiento')
        .eq('organizacion_id', orgId)
        .order('nombre_establecimiento');
      this.clientes = data || [];
    } catch (err) {
      console.error('Error cargando clientes:', err);
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

  renderBoard() {
    const moneda = window.App?.organization?.moneda || 'ARS';

    ETAPAS.forEach(etapa => {
      const cards = this.oportunidades.filter(o => o.etapa === etapa.key);
      const cardsContainer = document.querySelector(`.kanban-cards[data-etapa="${etapa.key}"]`);
      const countBadge = document.querySelector(`[data-count="${etapa.key}"]`);
      const valueBadge = document.querySelector(`[data-value="${etapa.key}"]`);

      if (countBadge) countBadge.textContent = cards.length;

      const totalValor = cards.reduce((sum, o) => sum + Number(o.valor_estimado || 0), 0);
      if (valueBadge) valueBadge.textContent = `${moneda} ${totalValor.toLocaleString('es-AR')}`;

      if (!cardsContainer) return;

      if (cards.length === 0) {
        cardsContainer.innerHTML = '<div class="kanban-empty">Sin oportunidades</div>';
        return;
      }

      cardsContainer.innerHTML = cards.map(o => this.renderCard(o)).join('');
    });
  },

  renderCard(op) {
    const moneda = window.App?.organization?.moneda || 'ARS';
    const dias = this.diasEnEtapa(op);
    let diasClass = '';
    let alertaClass = '';

    if (dias > ALERTA_DIAS_DANGER) {
      diasClass = 'danger';
      alertaClass = 'alerta-roja';
    } else if (dias > ALERTA_DIAS_WARN) {
      diasClass = 'warn';
      alertaClass = 'alerta';
    }

    const pronostico = (Number(op.valor_estimado || 0) * (op.probabilidad_cierre || 0)) / 100;
    const vendedorNombre = op.vendedor?.nombre || '';
    const vendedorInitials = vendedorNombre ? vendedorNombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '';

    let proximaHtml = '';
    if (op.proxima_accion) {
      const vencida = op.fecha_proxima_accion && new Date(op.fecha_proxima_accion) < new Date();
      proximaHtml = `
        <div class="kanban-card-proxima ${vencida ? 'vencida' : ''}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          ${this.esc(op.proxima_accion)}${op.fecha_proxima_accion ? ` (${new Date(op.fecha_proxima_accion).toLocaleDateString('es-AR')})` : ''}
        </div>`;
    }

    return `
      <div class="kanban-card ${alertaClass}" draggable="true" data-id="${op.id}">
        <div class="kanban-card-title">
          <span>${this.esc(op.cliente?.nombre_establecimiento || 'Sin cliente')}</span>
          <div class="card-actions">
            <button title="Editar" class="btn-edit-op" data-id="${op.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button title="Eliminar" class="btn-del-op" data-id="${op.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
        <div class="kanban-card-meta">
          <span class="kanban-card-valor">${moneda} ${Number(op.valor_estimado || 0).toLocaleString('es-AR')}</span>
          <span class="kanban-card-prob">${op.probabilidad_cierre || 0}%</span>
          <span class="kanban-card-dias ${diasClass}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            ${dias}d
          </span>
        </div>
        ${vendedorNombre ? `
        <div class="kanban-card-vendedor">
          <span class="avatar-mini">${vendedorInitials}</span>
          ${this.esc(vendedorNombre)}
        </div>` : ''}
        ${proximaHtml}
      </div>`;
  },

  renderSummary() {
    const moneda = window.App?.organization?.moneda || 'ARS';
    const container = document.getElementById('pipelineSummary');
    if (!container) return;

    const totalOps = this.oportunidades.length;
    const totalValor = this.oportunidades.reduce((sum, o) => sum + Number(o.valor_estimado || 0), 0);
    const pronostico = this.oportunidades.reduce((sum, o) => {
      return sum + (Number(o.valor_estimado || 0) * (o.probabilidad_cierre || 0)) / 100;
    }, 0);
    const conAlerta = this.oportunidades.filter(o => this.diasEnEtapa(o) > ALERTA_DIAS_WARN).length;

    container.innerHTML = `
      <div class="pipeline-summary-card">
        <span class="label">Oportunidades</span>
        <span class="value">${totalOps}</span>
      </div>
      <div class="pipeline-summary-card">
        <span class="label">Valor Total</span>
        <span class="value">${moneda} ${totalValor.toLocaleString('es-AR')}</span>
      </div>
      <div class="pipeline-summary-card">
        <span class="label">Pronóstico Ponderado</span>
        <span class="value pronostico">${moneda} ${pronostico.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
      </div>
      <div class="pipeline-summary-card">
        <span class="label">Con Alerta</span>
        <span class="value" style="color:${conAlerta > 0 ? 'var(--warning)' : 'var(--gray-900)'}">${conAlerta}</span>
      </div>
    `;
  },

  // ========================================
  // HELPERS
  // ========================================

  diasEnEtapa(op) {
    if (!op.fecha_entrada_etapa) return 0;
    return Math.floor((Date.now() - new Date(op.fecha_entrada_etapa)) / 86400000);
  },

  esc(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  getDefaultProb(etapa) {
    const e = ETAPAS.find(et => et.key === etapa);
    return e ? e.prob : 0;
  },

  // ========================================
  // EVENTOS
  // ========================================

  initEvents() {
    // Nueva oportunidad
    document.getElementById('btnNuevaOportunidad')?.addEventListener('click', () => {
      this.openModal();
    });

    // Delegación de eventos en las tarjetas
    document.getElementById('kanbanBoard')?.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-edit-op');
      if (editBtn) {
        e.stopPropagation();
        this.openModalEditar(editBtn.dataset.id);
        return;
      }
      const delBtn = e.target.closest('.btn-del-op');
      if (delBtn) {
        e.stopPropagation();
        this.confirmarEliminar(delBtn.dataset.id);
        return;
      }
    });

    // Drag & Drop
    this.initDragAndDrop();
  },

  initDragAndDrop() {
    const board = document.getElementById('kanbanBoard');
    if (!board) return;

    // Dragstart
    board.addEventListener('dragstart', (e) => {
      const card = e.target.closest('.kanban-card');
      if (!card) return;
      this.draggedCard = card;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.dataset.id);
    });

    // Dragend
    board.addEventListener('dragend', (e) => {
      const card = e.target.closest('.kanban-card');
      if (card) card.classList.remove('dragging');
      this.draggedCard = null;
      document.querySelectorAll('.kanban-cards.drag-over').forEach(el => el.classList.remove('drag-over'));
    });

    // Dragover en las columnas
    board.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const cardsContainer = e.target.closest('.kanban-cards');
      if (cardsContainer) {
        cardsContainer.classList.add('drag-over');
      }
    });

    // Dragleave
    board.addEventListener('dragleave', (e) => {
      const cardsContainer = e.target.closest('.kanban-cards');
      if (cardsContainer && !cardsContainer.contains(e.relatedTarget)) {
        cardsContainer.classList.remove('drag-over');
      }
    });

    // Drop
    board.addEventListener('drop', async (e) => {
      e.preventDefault();
      document.querySelectorAll('.kanban-cards.drag-over').forEach(el => el.classList.remove('drag-over'));

      const cardsContainer = e.target.closest('.kanban-cards');
      if (!cardsContainer) return;

      const nuevaEtapa = cardsContainer.dataset.etapa;
      const opId = e.dataTransfer.getData('text/plain');
      if (!opId || !nuevaEtapa) return;

      const op = this.oportunidades.find(o => o.id === opId);
      if (!op || op.etapa === nuevaEtapa) return;

      // Actualizar en Supabase
      try {
        const { error } = await supabase
          .from('pipeline_oportunidades')
          .update({
            etapa: nuevaEtapa,
            fecha_entrada_etapa: new Date().toISOString(),
            probabilidad_cierre: this.getDefaultProb(nuevaEtapa),
          })
          .eq('id', opId);

        if (error) throw error;

        // Actualizar local
        op.etapa = nuevaEtapa;
        op.fecha_entrada_etapa = new Date().toISOString();
        op.probabilidad_cierre = this.getDefaultProb(nuevaEtapa);

        this.renderBoard();
        this.renderSummary();
        Toast.success(`Movido a: ${ETAPAS.find(e => e.key === nuevaEtapa)?.label}`);

        // Sincronizar estado_lead del cliente cuando avanza a etapas de cierre
        if (['primer_pedido', 'cliente_activo'].includes(nuevaEtapa) && op.cliente_id) {
          await this._syncEstadoLead(op.cliente_id);
        }
      } catch (err) {
        console.error('Error moviendo oportunidad:', err);
        Toast.error('Error al mover la oportunidad');
      }
    });
  },

  // ========================================
  // MODAL CREAR / EDITAR
  // ========================================

  openModal(opData = null) {
    const isEdit = !!opData;
    const o = opData || {};
    const moneda = window.App?.organization?.moneda || 'ARS';

    document.getElementById('modalContainer').innerHTML = `
      <div class="modal-overlay" id="pipelineModal">
        <div class="modal" style="max-width:600px;">
          <div class="modal-header">
            <h2>${isEdit ? 'Editar Oportunidad' : 'Nueva Oportunidad'}</h2>
            <button class="modal-close" id="btnCloseModal">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="modal-body">
            <form id="formOportunidad">
              <div class="form-section">
                <div class="form-section-title">Datos de la oportunidad</div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Cliente *</label>
                    <select class="form-input" name="cliente_id" required>
                      <option value="">Seleccionar cliente...</option>
                      ${this.clientes.map(c => `<option value="${c.id}" ${o.cliente_id === c.id ? 'selected' : ''}>${this.esc(c.nombre_establecimiento)}</option>`).join('')}
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Vendedor</label>
                    <select class="form-input" name="vendedor_id">
                      <option value="">Sin asignar</option>
                      ${this.vendedores.map(v => `<option value="${v.id}" ${o.vendedor_id === v.id ? 'selected' : ''}>${this.esc(v.nombre)}</option>`).join('')}
                    </select>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Etapa</label>
                  <select class="form-input" name="etapa" id="selectEtapa">
                    ${ETAPAS.map(e => `<option value="${e.key}" ${(o.etapa || 'contacto_inicial') === e.key ? 'selected' : ''}>${e.label}</option>`).join('')}
                  </select>
                </div>
                <div class="form-row-prob">
                  <div class="form-group" style="flex:1;">
                    <label class="form-label">Valor estimado (${moneda}) *</label>
                    <input type="number" class="form-input" name="valor_estimado" value="${o.valor_estimado || ''}" required min="0" step="0.01">
                  </div>
                  <div class="form-group" style="flex:1;">
                    <label class="form-label">Probabilidad de cierre (%)</label>
                    <input type="number" class="form-input" name="probabilidad_cierre" id="inputProb" value="${o.probabilidad_cierre ?? this.getDefaultProb(o.etapa || 'contacto_inicial')}" min="0" max="100">
                  </div>
                  <div class="prob-display" id="pronosticoDisplay">${moneda} 0</div>
                </div>
              </div>

              <div class="form-section">
                <div class="form-section-title">Seguimiento</div>
                <div class="form-group">
                  <label class="form-label">Próxima acción</label>
                  <input type="text" class="form-input" name="proxima_accion" value="${this.esc(o.proxima_accion || '')}" placeholder="Ej: Enviar presupuesto, Llamar para seguimiento...">
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha próxima acción</label>
                  <input type="date" class="form-input" name="fecha_proxima_accion" value="${o.fecha_proxima_accion ? o.fecha_proxima_accion.split('T')[0] : ''}" style="max-width:220px;">
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btnCancelModal">Cancelar</button>
            <button class="btn btn-primary" id="btnSaveOportunidad">${isEdit ? 'Guardar Cambios' : 'Crear Oportunidad'}</button>
          </div>
        </div>
      </div>
    `;

    // Eventos modal
    document.getElementById('btnCloseModal').addEventListener('click', () => this.closeModal());
    document.getElementById('btnCancelModal').addEventListener('click', () => this.closeModal());
    document.getElementById('btnSaveOportunidad').addEventListener('click', () => this.saveOportunidad(isEdit ? o.id : null));
    document.getElementById('pipelineModal').addEventListener('click', (e) => {
      if (e.target.id === 'pipelineModal') this.closeModal();
    });

    // Actualizar pronóstico en tiempo real
    const updatePronostico = () => {
      const valor = parseFloat(document.querySelector('[name="valor_estimado"]')?.value) || 0;
      const prob = parseInt(document.getElementById('inputProb')?.value) || 0;
      const pron = (valor * prob) / 100;
      const display = document.getElementById('pronosticoDisplay');
      if (display) display.textContent = `${moneda} ${pron.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
    };

    document.querySelector('[name="valor_estimado"]')?.addEventListener('input', updatePronostico);
    document.getElementById('inputProb')?.addEventListener('input', updatePronostico);

    // Cambiar etapa -> actualizar probabilidad default
    document.getElementById('selectEtapa')?.addEventListener('change', (e) => {
      const prob = this.getDefaultProb(e.target.value);
      const input = document.getElementById('inputProb');
      if (input) input.value = prob;
      updatePronostico();
    });

    updatePronostico();

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
    const op = this.oportunidades.find(o => o.id === id);
    if (!op) return;
    this.openModal(op);
  },

  // ========================================
  // GUARDAR / ELIMINAR
  // ========================================

  async saveOportunidad(editingId = null) {
    const form = document.getElementById('formOportunidad');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const orgId = window.App?.userProfile?.organizacion_id;
    if (!orgId) {
      Toast.error('No se pudo determinar la organización. Recargá la página.');
      return;
    }

    const fd = new FormData(form);
    const etapa = fd.get('etapa');

    const data = {
      organizacion_id: orgId,
      cliente_id: fd.get('cliente_id'),
      vendedor_id: fd.get('vendedor_id') || null,
      etapa: etapa,
      valor_estimado: parseFloat(fd.get('valor_estimado')) || 0,
      probabilidad_cierre: parseInt(fd.get('probabilidad_cierre')) || 0,
      proxima_accion: fd.get('proxima_accion')?.trim() || null,
      fecha_proxima_accion: fd.get('fecha_proxima_accion') || null,
    };

    const btn = document.getElementById('btnSaveOportunidad');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
      if (editingId) {
        const { organizacion_id, ...updateData } = data;
        // Si cambió la etapa, actualizar fecha_entrada_etapa
        const opActual = this.oportunidades.find(o => o.id === editingId);
        if (opActual && opActual.etapa !== etapa) {
          updateData.fecha_entrada_etapa = new Date().toISOString();
        }
        const { error } = await supabase
          .from('pipeline_oportunidades')
          .update(updateData)
          .eq('id', editingId);
        if (error) throw error;
        Toast.success('Oportunidad actualizada');

        // Sincronizar estado_lead si la etapa cambió a una de cierre
        if (opActual && opActual.etapa !== etapa &&
            ['primer_pedido', 'cliente_activo'].includes(etapa) && data.cliente_id) {
          await this._syncEstadoLead(data.cliente_id);
        }
      } else {
        data.fecha_entrada_etapa = new Date().toISOString();
        const { error } = await supabase
          .from('pipeline_oportunidades')
          .insert(data);
        if (error) throw error;
        Toast.success('Oportunidad creada');
        Notif.notifyManagers('info', 'Nueva oportunidad en pipeline', `Valor: ARS ${Number(data.valor_estimado || 0).toLocaleString('es-AR')}`, '#/pipeline');

        // Sincronizar estado_lead si se crea directamente en etapa de cierre
        if (['primer_pedido', 'cliente_activo'].includes(etapa) && data.cliente_id) {
          await this._syncEstadoLead(data.cliente_id);
        }
      }

      this.closeModal();
      await this.loadOportunidades();
    } catch (err) {
      console.error('Error guardando oportunidad:', err);
      Toast.error(err.message || 'Error al guardar');
      btn.disabled = false;
      btn.textContent = editingId ? 'Guardar Cambios' : 'Crear Oportunidad';
    }
  },

  async confirmarEliminar(id) {
    const op = this.oportunidades.find(o => o.id === id);
    if (!op) return;

    document.getElementById('modalContainer').innerHTML = `
      <div class="modal-overlay" id="deleteModal">
        <div class="modal" style="max-width:450px;">
          <div class="modal-header">
            <h2>Eliminar oportunidad</h2>
            <button class="modal-close" id="btnCloseDelete">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="modal-body">
            <p>¿Estás seguro de que querés eliminar la oportunidad de <strong>${this.esc(op.cliente?.nombre_establecimiento || 'este cliente')}</strong>?</p>
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
        const { error } = await supabase.from('pipeline_oportunidades').delete().eq('id', id);
        if (error) throw error;
        Toast.success('Oportunidad eliminada');
        this.closeModal();
        await this.loadOportunidades();
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
  // HELPERS DE SINCRONIZACIÓN
  // ========================================

  async _syncEstadoLead(clienteId) {
    try {
      await supabase
        .from('clientes')
        .update({ estado_lead: 'activo' })
        .eq('id', clienteId);
    } catch (err) {
      // No bloquear el flujo principal
      console.error('Error sincronizando estado_lead:', err);
    }
  },
};

export default PipelinePage;
