/* ========================================
   PÁGINA CONFIGURACIÓN
   Datos org, usuarios, listas de precios
   ======================================== */

import supabase from '../config/supabase.js';
import Auth from '../auth/auth.js';
import Toast from '../utils/toast.js';
import Permissions from '../utils/permissions.js';

const ConfiguracionPage = {
  activeTab: 'organizacion',
  usuarios: [],
  listasPrecios: [],

  async render(container) {
    this.container = container;

    if (!Permissions.can('ver', 'configuracion')) {
      container.innerHTML = `
        <div class="card" style="text-align:center;padding:3rem;">
          <h2>Acceso restringido</h2>
          <p style="color:var(--gray-500);margin-top:0.5rem;">No tenés permisos para acceder a esta sección.</p>
        </div>`;
      return;
    }

    const canListasPrecios = Permissions.can('listas_precios', 'configuracion');

    container.innerHTML = `
      <div class="config-header">
        <div>
          <h1>Configuración</h1>
          <p>Administrá tu organización, usuarios y preferencias</p>
        </div>
      </div>

      <div class="config-tabs">
        <button class="config-tab active" data-tab="organizacion">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          Organización
        </button>
        <button class="config-tab" data-tab="usuarios">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          Usuarios
        </button>
        ${canListasPrecios ? `
        <button class="config-tab" data-tab="listas">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          Listas de Precios
        </button>` : ''}
        <button class="config-tab" data-tab="perfil">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          Mi Perfil
        </button>
      </div>

      <div class="config-content" id="configContent">
        <div class="loader"><div class="spinner"></div></div>
      </div>

      <div id="modalContainer"></div>
    `;

    this.initTabEvents();
    await this.loadTab('organizacion');
  },

  initTabEvents() {
    this.container.querySelector('.config-tabs')?.addEventListener('click', (e) => {
      const tab = e.target.closest('.config-tab');
      if (!tab) return;
      const tabName = tab.dataset.tab;
      this.container.querySelectorAll('.config-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      this.loadTab(tabName);
    });
  },

  async loadTab(tab) {
    this.activeTab = tab;
    const content = document.getElementById('configContent');
    if (!content) return;

    content.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

    switch (tab) {
      case 'organizacion': await this.renderOrgTab(content); break;
      case 'usuarios': await this.renderUsuariosTab(content); break;
      case 'listas': await this.renderListasTab(content); break;
      case 'perfil': await this.renderPerfilTab(content); break;
    }
  },

  // ========================================
  // TAB: ORGANIZACIÓN
  // ========================================

  async renderOrgTab(content) {
    const org = window.App?.organization || {};

    content.innerHTML = `
      <div class="config-section">
        <form id="formOrg">
          <div class="form-section">
            <div class="form-section-title">Datos de la empresa</div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nombre *</label>
                <input type="text" class="form-input" name="nombre" value="${this.esc(org.nombre || '')}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Slug (URL)</label>
                <input type="text" class="form-input" name="slug" value="${this.esc(org.slug || '')}" disabled>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Razón social</label>
                <input type="text" class="form-input" name="razon_social" value="${this.esc(org.razon_social || '')}">
              </div>
              <div class="form-group">
                <label class="form-label">CUIT</label>
                <input type="text" class="form-input" name="cuit" value="${this.esc(org.cuit || '')}" placeholder="XX-XXXXXXXX-X">
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title">Contacto</div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Teléfono</label>
                <input type="tel" class="form-input" name="telefono" value="${org.telefono || ''}">
              </div>
              <div class="form-group">
                <label class="form-label">Email de contacto</label>
                <input type="email" class="form-input" name="email_contacto" value="${org.email_contacto || ''}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Dirección</label>
                <input type="text" class="form-input" name="direccion" value="${this.esc(org.direccion || '')}">
              </div>
              <div class="form-group">
                <label class="form-label">Sitio web</label>
                <input type="url" class="form-input" name="sitio_web" value="${org.sitio_web || ''}" placeholder="https://...">
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title">Personalización</div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Color primario</label>
                <div class="color-picker-row">
                  <input type="color" name="color_primario" value="${org.color_primario || '#2563eb'}" class="form-color">
                  <input type="text" class="form-input" value="${org.color_primario || '#2563eb'}" id="colorPrimarioText" style="max-width:120px;">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Color secundario</label>
                <div class="color-picker-row">
                  <input type="color" name="color_secundario" value="${org.color_secundario || '#1e40af'}" class="form-color">
                  <input type="text" class="form-input" value="${org.color_secundario || '#1e40af'}" id="colorSecundarioText" style="max-width:120px;">
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">URL del logo</label>
                <input type="url" class="form-input" name="logo_url" value="${org.logo_url || ''}" placeholder="https://...">
              </div>
              <div class="form-group">
                <label class="form-label">URL del favicon</label>
                <input type="url" class="form-input" name="favicon_url" value="${org.favicon_url || ''}" placeholder="https://...">
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title">Preferencias</div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Moneda</label>
                <select class="form-input" name="moneda">
                  <option value="ARS" ${org.moneda === 'ARS' ? 'selected' : ''}>ARS - Peso Argentino</option>
                  <option value="USD" ${org.moneda === 'USD' ? 'selected' : ''}>USD - Dólar</option>
                  <option value="EUR" ${org.moneda === 'EUR' ? 'selected' : ''}>EUR - Euro</option>
                  <option value="CLP" ${org.moneda === 'CLP' ? 'selected' : ''}>CLP - Peso Chileno</option>
                  <option value="MXN" ${org.moneda === 'MXN' ? 'selected' : ''}>MXN - Peso Mexicano</option>
                  <option value="COP" ${org.moneda === 'COP' ? 'selected' : ''}>COP - Peso Colombiano</option>
                  <option value="UYU" ${org.moneda === 'UYU' ? 'selected' : ''}>UYU - Peso Uruguayo</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Zona horaria</label>
                <select class="form-input" name="zona_horaria">
                  <option value="America/Argentina/Buenos_Aires" ${org.zona_horaria === 'America/Argentina/Buenos_Aires' ? 'selected' : ''}>Argentina (Buenos Aires)</option>
                  <option value="America/Santiago" ${org.zona_horaria === 'America/Santiago' ? 'selected' : ''}>Chile (Santiago)</option>
                  <option value="America/Mexico_City" ${org.zona_horaria === 'America/Mexico_City' ? 'selected' : ''}>México (CDMX)</option>
                  <option value="America/Bogota" ${org.zona_horaria === 'America/Bogota' ? 'selected' : ''}>Colombia (Bogotá)</option>
                  <option value="America/Montevideo" ${org.zona_horaria === 'America/Montevideo' ? 'selected' : ''}>Uruguay (Montevideo)</option>
                </select>
              </div>
            </div>
          </div>

          <div class="config-actions">
            <button type="submit" class="btn btn-primary" id="btnSaveOrg">Guardar cambios</button>
          </div>
        </form>
      </div>

      ${['owner', 'admin'].includes(window.App?.userProfile?.rol) ? `
      <div class="config-section" style="margin-top:1.5rem;">
        <div class="form-section">
          <div class="form-section-title">Exportar datos</div>
          <p style="font-size:var(--font-size-sm);color:var(--gray-600);margin-bottom:1rem;">
            Descargá un backup completo de todos los datos de tu organización en formato CSV. Incluye clientes, productos, pedidos, cobros e interacciones.
          </p>
          <button class="btn btn-export" id="btnExportarDatos">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Exportar todos los datos (ZIP)
          </button>
          <p style="font-size:var(--font-size-xs);color:var(--gray-400);margin-top:0.5rem;">Solo disponible para owner y admin.</p>
        </div>
      </div>
      ` : ''}
    `;

    // Sincronizar color pickers con text inputs
    const colorPrimario = content.querySelector('[name="color_primario"]');
    const colorPrimarioText = document.getElementById('colorPrimarioText');
    const colorSecundario = content.querySelector('[name="color_secundario"]');
    const colorSecundarioText = document.getElementById('colorSecundarioText');

    colorPrimario?.addEventListener('input', (e) => { colorPrimarioText.value = e.target.value; });
    colorPrimarioText?.addEventListener('input', (e) => { if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) colorPrimario.value = e.target.value; });
    colorSecundario?.addEventListener('input', (e) => { colorSecundarioText.value = e.target.value; });
    colorSecundarioText?.addEventListener('input', (e) => { if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) colorSecundario.value = e.target.value; });

    // Submit
    document.getElementById('formOrg')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveOrganization();
    });

    // Export datos
    document.getElementById('btnExportarDatos')?.addEventListener('click', () => this.exportarDatos());
  },

  async saveOrganization() {
    const form = document.getElementById('formOrg');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const fd = new FormData(form);
    const orgId = window.App?.organization?.id;
    if (!orgId) { Toast.error('Error: organización no encontrada'); return; }

    const btn = document.getElementById('btnSaveOrg');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
      const data = {
        nombre: fd.get('nombre').trim(),
        razon_social: fd.get('razon_social')?.trim() || null,
        cuit: fd.get('cuit')?.trim() || null,
        telefono: fd.get('telefono')?.trim() || null,
        email_contacto: fd.get('email_contacto')?.trim() || null,
        direccion: fd.get('direccion')?.trim() || null,
        sitio_web: fd.get('sitio_web')?.trim() || null,
        color_primario: fd.get('color_primario'),
        color_secundario: fd.get('color_secundario'),
        logo_url: fd.get('logo_url')?.trim() || null,
        favicon_url: fd.get('favicon_url')?.trim() || null,
        moneda: fd.get('moneda'),
        zona_horaria: fd.get('zona_horaria'),
      };

      const { error } = await supabase
        .from('organizaciones')
        .update(data)
        .eq('id', orgId);
      if (error) throw error;

      // Actualizar cache global
      window.App.organization = { ...window.App.organization, ...data };
      Auth._organization = window.App.organization;
      window.App.applyBranding();

      // Actualizar sidebar nombre
      const sidebarTitle = document.querySelector('.sidebar-logo h2');
      if (sidebarTitle) sidebarTitle.textContent = data.nombre;

      Toast.success('Configuración guardada');
    } catch (err) {
      console.error('Error guardando org:', err);
      Toast.error(err.message || 'Error al guardar');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Guardar cambios';
    }
  },

  // ========================================
  // TAB: USUARIOS
  // ========================================

  async renderUsuariosTab(content) {
    try {
      const orgId = window.App?.organization?.id;
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('organizacion_id', orgId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      this.usuarios = data || [];
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      Toast.error('Error al cargar usuarios');
      this.usuarios = [];
    }

    const rolLabels = {
      owner: 'Propietario', admin: 'Administrador', gerente: 'Gerente',
      vendedor: 'Vendedor', repartidor: 'Repartidor', administrativo: 'Administrativo',
    };

    const currentUserId = window.App?.userProfile?.id;

    content.innerHTML = `
      <div class="config-section">
        <div class="config-section-header">
          <h3>Usuarios de la organización</h3>
          <button class="btn btn-primary btn-sm" id="btnInvitarUsuario">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Invitar usuario
          </button>
        </div>

        <div class="usuarios-list">
          ${this.usuarios.map(u => `
            <div class="usuario-card ${!u.activo ? 'inactivo' : ''}">
              <div class="usuario-avatar">${(u.nombre || '?').split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2) || '?'}</div>
              <div class="usuario-info">
                <div class="usuario-nombre">
                  ${this.esc(u.nombre)}
                  ${u.id === currentUserId ? '<span class="badge-you">Vos</span>' : ''}
                </div>
                <div class="usuario-email">${this.esc(u.email)}</div>
              </div>
              <div class="usuario-rol">
                <span class="badge-rol ${u.rol}">${rolLabels[u.rol] || u.rol}</span>
              </div>
              <div class="usuario-estado">
                <span class="badge-estado-user ${u.activo ? 'activo' : 'inactivo'}">${u.activo ? 'Activo' : 'Inactivo'}</span>
              </div>
              <div class="usuario-actions">
                ${u.id !== currentUserId && u.rol !== 'owner' ? `
                  <button class="btn-icon btn-edit-user" data-id="${u.id}" title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button class="btn-icon btn-toggle-user" data-id="${u.id}" data-activo="${u.activo}" title="${u.activo ? 'Desactivar' : 'Activar'}">
                    ${u.activo
                      ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>'
                      : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>'
                    }
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="config-info-box">
          <strong>¿Cómo agregar usuarios?</strong> Hacé clic en "Invitar usuario", completá el email y rol,
          y compartí el link generado. El usuario lo abre y completa su registro automáticamente en tu organización.
        </div>
      </div>
    `;

    // Eventos
    document.getElementById('btnInvitarUsuario')?.addEventListener('click', () => this.openInviteModal());

    content.querySelectorAll('.btn-edit-user').forEach(btn => {
      btn.addEventListener('click', () => this.openEditUserModal(btn.dataset.id));
    });

    content.querySelectorAll('.btn-toggle-user').forEach(btn => {
      btn.addEventListener('click', () => this.toggleUserActive(btn.dataset.id, btn.dataset.activo === 'true'));
    });
  },

  async toggleUserActive(userId, currentlyActive) {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ activo: !currentlyActive })
        .eq('id', userId);
      if (error) throw error;
      Toast.success(currentlyActive ? 'Usuario desactivado' : 'Usuario activado');
      await this.loadTab('usuarios');
    } catch (err) {
      Toast.error(err.message || 'Error al cambiar estado');
    }
  },

  openEditUserModal(userId) {
    const user = this.usuarios.find(u => u.id === userId);
    if (!user) return;

    const roles = [
      { value: 'admin', label: 'Administrador' },
      { value: 'gerente', label: 'Gerente' },
      { value: 'vendedor', label: 'Vendedor' },
      { value: 'repartidor', label: 'Repartidor' },
      { value: 'administrativo', label: 'Administrativo' },
    ];

    document.getElementById('modalContainer').innerHTML = `
      <div class="modal-overlay" id="editUserModal">
        <div class="modal" style="max-width:450px;">
          <div class="modal-header">
            <h2>Editar usuario</h2>
            <button class="modal-close" id="btnCloseEditUser">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="modal-body">
            <form id="formEditUser">
              <div class="form-group">
                <label class="form-label">Nombre</label>
                <input type="text" class="form-input" name="nombre" value="${this.esc(user.nombre)}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Rol</label>
                <select class="form-input" name="rol">
                  ${roles.map(r => `<option value="${r.value}" ${user.rol === r.value ? 'selected' : ''}>${r.label}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Zona asignada</label>
                <input type="text" class="form-input" name="zona_asignada" value="${this.esc(user.zona_asignada || '')}" placeholder="Ej: Zona Norte">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btnCancelEditUser">Cancelar</button>
            <button class="btn btn-primary" id="btnSaveEditUser">Guardar</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnCloseEditUser').addEventListener('click', () => this.closeModal());
    document.getElementById('btnCancelEditUser').addEventListener('click', () => this.closeModal());
    document.getElementById('editUserModal').addEventListener('click', (e) => {
      if (e.target.id === 'editUserModal') this.closeModal();
    });

    document.getElementById('btnSaveEditUser').addEventListener('click', async () => {
      const form = document.getElementById('formEditUser');
      const fd = new FormData(form);
      const btn = document.getElementById('btnSaveEditUser');
      btn.disabled = true;
      btn.textContent = 'Guardando...';

      try {
        const { error } = await supabase
          .from('usuarios')
          .update({
            nombre: fd.get('nombre').trim(),
            rol: fd.get('rol'),
            zona_asignada: fd.get('zona_asignada')?.trim() || null,
          })
          .eq('id', userId);
        if (error) throw error;
        Toast.success('Usuario actualizado');
        this.closeModal();
        await this.loadTab('usuarios');
      } catch (err) {
        Toast.error(err.message || 'Error al guardar');
        btn.disabled = false;
        btn.textContent = 'Guardar';
      }
    });
  },

  openInviteModal() {
    const roles = [
      { value: 'vendedor', label: 'Vendedor' },
      { value: 'administrativo', label: 'Administrativo' },
      { value: 'repartidor', label: 'Repartidor' },
      { value: 'gerente', label: 'Gerente' },
      { value: 'admin', label: 'Administrador' },
    ];

    document.getElementById('modalContainer').innerHTML = `
      <div class="modal-overlay" id="inviteModal">
        <div class="modal" style="max-width:480px;">
          <div class="modal-header">
            <h2>Invitar usuario</h2>
            <button class="modal-close" id="btnCloseInvite">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <!-- Vista: Formulario -->
          <div id="vistaFormInvite">
            <div class="modal-body">
              <p style="font-size:var(--font-size-sm);color:var(--gray-600);margin-bottom:1rem;">
                Completá los datos del nuevo usuario. Se generará un link de registro personalizado para compartirle.
              </p>
              <div id="inviteError" class="login-error hidden" style="margin-bottom:0.75rem;"></div>
              <form id="formInvitar">
                <div class="form-group">
                  <label class="form-label">Nombre completo *</label>
                  <input type="text" class="form-input" name="nombre" required placeholder="Nombre del colaborador">
                </div>
                <div class="form-group">
                  <label class="form-label">Email *</label>
                  <input type="email" class="form-input" name="email" required placeholder="email@empresa.com">
                </div>
                <div class="form-group">
                  <label class="form-label">Rol *</label>
                  <select class="form-input" name="rol" required>
                    ${roles.map(r => `<option value="${r.value}">${r.label}</option>`).join('')}
                  </select>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" id="btnCancelInvite">Cancelar</button>
              <button class="btn btn-primary" id="btnEnviarInvite">Generar link de invitación</button>
            </div>
          </div>

          <!-- Vista: Link generado -->
          <div id="vistaLinkInvite" class="hidden">
            <div class="modal-body">
              <div style="text-align:center;padding:1rem 0;">
                <div style="font-size:2rem;margin-bottom:0.5rem;">✅</div>
                <h3 style="margin-bottom:0.5rem;">¡Invitación creada!</h3>
                <p style="font-size:var(--font-size-sm);color:var(--gray-600);margin-bottom:1rem;">
                  Compartí este link con el usuario. Es válido por <strong>7 días</strong> y solo puede usarse una vez.
                </p>
              </div>
              <div class="invite-link-box">
                <input type="text" class="form-input" id="inviteLinkInput" readonly style="font-size:var(--font-size-xs);">
                <button class="btn btn-secondary btn-sm" id="btnCopiarLink">Copiar</button>
              </div>
              <p style="font-size:var(--font-size-xs);color:var(--gray-400);margin-top:0.5rem;">
                Al abrir el link, el usuario verá un formulario para establecer su contraseña e ingresar al sistema.
              </p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-primary" id="btnCerrarLinkInvite">Listo</button>
            </div>
          </div>

        </div>
      </div>
    `;

    const close = () => this.closeModal();
    document.getElementById('btnCloseInvite').addEventListener('click', close);
    document.getElementById('btnCancelInvite').addEventListener('click', close);
    document.getElementById('inviteModal').addEventListener('click', (e) => {
      if (e.target.id === 'inviteModal') close();
    });
    document.getElementById('btnCerrarLinkInvite')?.addEventListener('click', close);

    document.getElementById('btnEnviarInvite').addEventListener('click', async () => {
      const form = document.getElementById('formInvitar');
      if (!form.checkValidity()) { form.reportValidity(); return; }

      const fd = new FormData(form);
      const nombre = fd.get('nombre').trim();
      const email = fd.get('email').trim().toLowerCase();
      const rol = fd.get('rol');
      const orgId = window.App?.organization?.id;
      const userId = window.App?.userProfile?.id;
      const errorDiv = document.getElementById('inviteError');

      const btn = document.getElementById('btnEnviarInvite');
      btn.disabled = true;
      btn.textContent = 'Generando...';
      errorDiv.classList.add('hidden');

      try {
        const { data, error } = await supabase
          .from('invitaciones')
          .insert({ organizacion_id: orgId, email, nombre, rol, created_by: userId })
          .select('token')
          .single();
        if (error) throw error;

        const link = `${window.location.origin}${window.location.pathname}?invite=${data.token}`;
        document.getElementById('vistaFormInvite').classList.add('hidden');
        document.getElementById('vistaLinkInvite').classList.remove('hidden');
        document.getElementById('inviteLinkInput').value = link;
      } catch (err) {
        errorDiv.textContent = err.message?.includes('duplicate') || err.message?.includes('unique')
          ? 'Ya existe una invitación pendiente para ese email.'
          : (err.message || 'Error al generar la invitación');
        errorDiv.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = 'Generar link de invitación';
      }
    });

    document.getElementById('btnCopiarLink')?.addEventListener('click', () => {
      const input = document.getElementById('inviteLinkInput');
      navigator.clipboard.writeText(input.value).then(() => {
        const btn = document.getElementById('btnCopiarLink');
        btn.textContent = '¡Copiado!';
        setTimeout(() => { btn.textContent = 'Copiar'; }, 2000);
      });
    });
  },

  // ========================================
  // TAB: LISTAS DE PRECIOS
  // ========================================

  async renderListasTab(content) {
    const orgId = window.App?.organization?.id;
    try {
      const { data, error } = await supabase
        .from('listas_precios')
        .select('*')
        .eq('organizacion_id', orgId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      this.listasPrecios = data || [];
    } catch (err) {
      console.error('Error cargando listas:', err);
      this.listasPrecios = [];
    }

    // Contar productos por lista
    let conteos = {};
    try {
      const listaIds = this.listasPrecios.map(l => l.id);
      if (listaIds.length > 0) {
        const { data } = await supabase
          .from('precios_por_lista')
          .select('lista_precios_id')
          .in('lista_precios_id', listaIds);
        if (data) {
          data.forEach(p => {
            conteos[p.lista_precios_id] = (conteos[p.lista_precios_id] || 0) + 1;
          });
        }
      }
    } catch (err) { /* ignore */ }

    // Contar clientes por lista
    let conteoClientes = {};
    try {
      const { data } = await supabase
        .from('clientes')
        .select('lista_precios_id')
        .eq('organizacion_id', orgId)
        .not('lista_precios_id', 'is', null);
      if (data) {
        data.forEach(c => {
          conteoClientes[c.lista_precios_id] = (conteoClientes[c.lista_precios_id] || 0) + 1;
        });
      }
    } catch (err) { /* ignore */ }

    content.innerHTML = `
      <div class="config-section">
        <div class="config-section-header">
          <h3>Listas de precios</h3>
          <button class="btn btn-primary btn-sm" id="btnNuevaLista">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nueva lista
          </button>
        </div>

        ${this.listasPrecios.length === 0 ? `
          <div class="config-empty">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            <h3>No hay listas de precios</h3>
            <p>Creá tu primera lista para asignar precios diferenciados a tus clientes.</p>
          </div>
        ` : `
          <div class="listas-grid">
            ${this.listasPrecios.map(l => `
              <div class="lista-card ${!l.activa ? 'inactiva' : ''}">
                <div class="lista-card-header">
                  <h4>${this.esc(l.nombre)}</h4>
                  <span class="badge-estado-user ${l.activa ? 'activo' : 'inactivo'}">${l.activa ? 'Activa' : 'Inactiva'}</span>
                </div>
                ${l.descripcion ? `<p class="lista-desc">${this.esc(l.descripcion)}</p>` : ''}
                <div class="lista-meta">
                  <span>${conteos[l.id] || 0} productos con precio</span>
                  <span>${conteoClientes[l.id] || 0} clientes asignados</span>
                </div>
                <div class="lista-actions">
                  <button class="btn btn-sm btn-secondary btn-edit-lista" data-id="${l.id}">Editar</button>
                  <button class="btn btn-sm btn-secondary btn-precios-lista" data-id="${l.id}" data-nombre="${this.esc(l.nombre)}">Ver precios</button>
                  <button class="btn btn-sm btn-danger-outline btn-delete-lista" data-id="${l.id}" data-nombre="${this.esc(l.nombre)}">Eliminar</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}

        <div class="config-info-box" style="margin-top:1rem;">
          <strong>Tip:</strong> Los precios por lista se configuran desde el modal de cada producto.
          Acá podés ver un resumen y gestionar las listas.
        </div>
      </div>
    `;

    document.getElementById('btnNuevaLista')?.addEventListener('click', () => this.openListaModal());

    content.querySelectorAll('.btn-edit-lista').forEach(btn => {
      btn.addEventListener('click', () => this.openListaModal(btn.dataset.id));
    });

    content.querySelectorAll('.btn-precios-lista').forEach(btn => {
      btn.addEventListener('click', () => this.openPreciosListaModal(btn.dataset.id, btn.dataset.nombre));
    });

    content.querySelectorAll('.btn-delete-lista').forEach(btn => {
      btn.addEventListener('click', () => this.confirmarEliminarLista(btn.dataset.id, btn.dataset.nombre));
    });
  },

  openListaModal(listaId = null) {
    const lista = listaId ? this.listasPrecios.find(l => l.id === listaId) : null;
    const isEdit = !!lista;

    document.getElementById('modalContainer').innerHTML = `
      <div class="modal-overlay" id="listaModal">
        <div class="modal" style="max-width:450px;">
          <div class="modal-header">
            <h2>${isEdit ? 'Editar lista' : 'Nueva lista de precios'}</h2>
            <button class="modal-close" id="btnCloseLista">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="modal-body">
            <form id="formLista">
              <div class="form-group">
                <label class="form-label">Nombre *</label>
                <input type="text" class="form-input" name="nombre" value="${this.esc(lista?.nombre || '')}" required placeholder="Ej: Mayorista, Minorista, VIP">
              </div>
              <div class="form-group">
                <label class="form-label">Descripción</label>
                <textarea class="form-input" name="descripcion" rows="2" placeholder="Descripción opcional...">${this.esc(lista?.descripcion || '')}</textarea>
              </div>
              <label class="form-check" style="margin-top:0.5rem;">
                <input type="checkbox" name="activa" ${lista?.activa !== false ? 'checked' : ''}>
                Lista activa
              </label>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btnCancelLista">Cancelar</button>
            <button class="btn btn-primary" id="btnSaveLista">${isEdit ? 'Guardar' : 'Crear'}</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnCloseLista').addEventListener('click', () => this.closeModal());
    document.getElementById('btnCancelLista').addEventListener('click', () => this.closeModal());
    document.getElementById('listaModal').addEventListener('click', (e) => {
      if (e.target.id === 'listaModal') this.closeModal();
    });

    document.getElementById('btnSaveLista').addEventListener('click', async () => {
      const form = document.getElementById('formLista');
      if (!form.checkValidity()) { form.reportValidity(); return; }

      const fd = new FormData(form);
      const btn = document.getElementById('btnSaveLista');
      btn.disabled = true;
      btn.textContent = 'Guardando...';

      try {
        const data = {
          nombre: fd.get('nombre').trim(),
          descripcion: fd.get('descripcion')?.trim() || null,
          activa: form.querySelector('[name="activa"]').checked,
        };

        if (isEdit) {
          const { error } = await supabase.from('listas_precios').update(data).eq('id', listaId);
          if (error) throw error;
          Toast.success('Lista actualizada');
        } else {
          data.organizacion_id = window.App?.userProfile?.organizacion_id;
          const { error } = await supabase.from('listas_precios').insert(data);
          if (error) throw error;
          Toast.success('Lista creada');
        }

        this.closeModal();
        await this.loadTab('listas');
      } catch (err) {
        Toast.error(err.message || 'Error al guardar');
        btn.disabled = false;
        btn.textContent = isEdit ? 'Guardar' : 'Crear';
      }
    });
  },

  async openPreciosListaModal(listaId, listaNombre) {
    let precios = [];
    try {
      const { data, error } = await supabase
        .from('precios_por_lista')
        .select('*, producto:producto_id(id, nombre, sku, precio_base)')
        .eq('lista_precios_id', listaId)
        .order('precio', { ascending: true });
      if (error) throw error;
      precios = data || [];
    } catch (err) {
      console.error('Error cargando precios:', err);
    }

    const moneda = window.App?.organization?.moneda || 'ARS';

    document.getElementById('modalContainer').innerHTML = `
      <div class="modal-overlay" id="preciosModal">
        <div class="modal" style="max-width:650px;">
          <div class="modal-header">
            <h2>Precios - ${this.esc(listaNombre)}</h2>
            <button class="modal-close" id="btnClosePrecios">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="modal-body">
            ${precios.length === 0 ? `
              <div style="text-align:center;padding:2rem;color:var(--gray-400);">
                <p>No hay productos con precio en esta lista.</p>
                <p style="font-size:var(--font-size-sm);margin-top:0.5rem;">Podés asignar precios desde el modal de edición de cada producto.</p>
              </div>
            ` : `
              <div class="precios-tabla-wrapper">
                <table class="precios-tabla">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>SKU</th>
                      <th>Precio Base</th>
                      <th>Precio Lista</th>
                      <th>Diferencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${precios.map(p => {
                      const base = Number(p.producto?.precio_base || 0);
                      const lista = Number(p.precio);
                      const diff = lista - base;
                      const diffPct = base > 0 ? ((diff / base) * 100).toFixed(1) : 0;
                      return `
                        <tr>
                          <td>${this.esc(p.producto?.nombre || '-')}</td>
                          <td><code>${p.producto?.sku || '-'}</code></td>
                          <td>${moneda} ${base.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                          <td><strong>${moneda} ${lista.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong></td>
                          <td><span class="${diff < 0 ? 'text-success' : diff > 0 ? 'text-danger' : ''}">${diff >= 0 ? '+' : ''}${diffPct}%</span></td>
                        </tr>`;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btnClosePrecios2">Cerrar</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnClosePrecios').addEventListener('click', () => this.closeModal());
    document.getElementById('btnClosePrecios2').addEventListener('click', () => this.closeModal());
    document.getElementById('preciosModal').addEventListener('click', (e) => {
      if (e.target.id === 'preciosModal') this.closeModal();
    });
  },

  confirmarEliminarLista(listaId, nombre) {
    document.getElementById('modalContainer').innerHTML = `
      <div class="modal-overlay" id="deleteListaModal">
        <div class="modal" style="max-width:450px;">
          <div class="modal-header">
            <h2>Eliminar lista</h2>
            <button class="modal-close" id="btnCloseDelLista">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="modal-body">
            <p>¿Estás seguro de eliminar la lista <strong>${this.esc(nombre)}</strong>?</p>
            <p style="color:var(--gray-500);font-size:var(--font-size-sm);margin-top:0.5rem;">Se eliminarán todos los precios asociados y los clientes que la tenían asignada quedarán sin lista.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btnCancelDelLista">Cancelar</button>
            <button class="btn btn-danger" id="btnConfirmDelLista">Eliminar</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnCloseDelLista').addEventListener('click', () => this.closeModal());
    document.getElementById('btnCancelDelLista').addEventListener('click', () => this.closeModal());
    document.getElementById('deleteListaModal').addEventListener('click', (e) => {
      if (e.target.id === 'deleteListaModal') this.closeModal();
    });

    document.getElementById('btnConfirmDelLista').addEventListener('click', async () => {
      try {
        // Limpiar clientes que tenían esta lista
        await supabase
          .from('clientes')
          .update({ lista_precios_id: null })
          .eq('lista_precios_id', listaId);

        const { error } = await supabase.from('listas_precios').delete().eq('id', listaId);
        if (error) throw error;
        Toast.success('Lista eliminada');
        this.closeModal();
        await this.loadTab('listas');
      } catch (err) {
        Toast.error(err.message || 'Error al eliminar');
      }
    });
  },

  // ========================================
  // HELPERS
  // ========================================

  closeModal() {
    const mc = document.getElementById('modalContainer');
    if (mc) mc.innerHTML = '';
  },

  esc(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // ========================================
  // TAB: MI PERFIL
  // ========================================

  async renderPerfilTab(content) {
    const user = window.App?.userProfile || {};

    content.innerHTML = `
      <div class="config-section">
        <div class="form-section">
          <div class="form-section-title">Datos personales</div>
          <form id="formPerfil">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nombre completo *</label>
                <input type="text" class="form-input" id="perfilNombre" value="${this.esc(user.nombre || '')}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" value="${this.esc(user.email || '')}" disabled>
                <span style="font-size:var(--font-size-xs);color:var(--gray-400);">El email no puede modificarse.</span>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Rol</label>
                <input type="text" class="form-input" value="${this.esc(user.rol || '')}" disabled>
              </div>
              <div class="form-group">
                <label class="form-label">Teléfono</label>
                <input type="tel" class="form-input" id="perfilTelefono" value="${this.esc(user.telefono || '')}" placeholder="Ej: +549 11 1234-5678">
              </div>
            </div>
            <div class="config-actions">
              <button type="submit" class="btn btn-primary" id="btnSavePerfil">Guardar datos</button>
            </div>
          </form>
        </div>

        <div class="form-section" style="margin-top:1.5rem;">
          <div class="form-section-title">Cambiar contraseña</div>
          <p style="font-size:var(--font-size-sm);color:var(--gray-600);margin-bottom:1rem;">
            Se enviará un email a <strong>${this.esc(user.email || '')}</strong> con el enlace para restablecer tu contraseña.
          </p>
          <form id="formPassword">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nueva contraseña *</label>
                <input type="password" class="form-input" id="perfilPassword" minlength="8" required placeholder="Mínimo 8 caracteres">
              </div>
              <div class="form-group">
                <label class="form-label">Confirmar contraseña *</label>
                <input type="password" class="form-input" id="perfilPasswordConfirm" minlength="8" required placeholder="Repetir contraseña">
              </div>
            </div>
            <div class="config-actions">
              <button type="submit" class="btn btn-secondary" id="btnSavePassword">Cambiar contraseña</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Guardar datos personales
    document.getElementById('formPerfil')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btnSavePerfil');
      const nombre = document.getElementById('perfilNombre').value.trim();
      const telefono = document.getElementById('perfilTelefono').value.trim();
      if (!nombre) return;

      btn.disabled = true;
      btn.textContent = 'Guardando...';
      try {
        const { error } = await supabase
          .from('usuarios')
          .update({ nombre, telefono: telefono || null })
          .eq('id', user.id);
        if (error) throw error;

        window.App.userProfile = { ...window.App.userProfile, nombre, telefono };
        // Actualizar nombre en sidebar
        const sidebarUser = document.querySelector('.sidebar-user-name');
        if (sidebarUser) sidebarUser.textContent = nombre;

        Toast.success('Datos guardados correctamente');
      } catch (err) {
        Toast.error(err.message || 'Error al guardar datos');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Guardar datos';
      }
    });

    // Cambiar contraseña via Supabase Auth
    document.getElementById('formPassword')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btnSavePassword');
      const pass = document.getElementById('perfilPassword').value;
      const confirm = document.getElementById('perfilPasswordConfirm').value;

      if (pass !== confirm) {
        Toast.error('Las contraseñas no coinciden');
        return;
      }
      if (pass.length < 8) {
        Toast.error('La contraseña debe tener al menos 8 caracteres');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Cambiando...';
      try {
        const { error } = await supabase.auth.updateUser({ password: pass });
        if (error) throw error;
        Toast.success('Contraseña actualizada correctamente');
        document.getElementById('perfilPassword').value = '';
        document.getElementById('perfilPasswordConfirm').value = '';
      } catch (err) {
        Toast.error(err.message || 'Error al cambiar contraseña');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Cambiar contraseña';
      }
    });
  },

  // ========================================
  // EXPORTAR TODOS LOS DATOS (ZIP)
  // ========================================

  async exportarDatos() {
    const btn = document.getElementById('btnExportarDatos');
    if (btn) { btn.disabled = true; btn.textContent = 'Preparando datos...'; }

    try {
      const orgId = window.App?.organization?.id;
      if (!orgId) throw new Error('No se pudo determinar la organización');

      // 1. Traer datos de todas las tablas en paralelo
      const [
        { data: clientes },
        { data: productos },
        { data: pedidos },
        { data: cobros },
        { data: usuarios },
        { data: interacciones },
      ] = await Promise.all([
        supabase.from('clientes').select('*').eq('organizacion_id', orgId).order('nombre_establecimiento'),
        supabase.from('productos').select('*').eq('organizacion_id', orgId).order('nombre'),
        supabase.from('pedidos').select('*, cliente:cliente_id(nombre_establecimiento), vendedor:vendedor_id(nombre)').eq('organizacion_id', orgId).order('created_at', { ascending: false }),
        supabase.from('cobros').select('*, cliente:cliente_id(nombre_establecimiento)').eq('organizacion_id', orgId).order('created_at', { ascending: false }),
        supabase.from('usuarios').select('id, nombre, email, rol, activo, created_at').eq('organizacion_id', orgId),
        supabase.from('interacciones').select('*, cliente:cliente_id(nombre_establecimiento), usuario:usuario_id(nombre)').eq('organizacion_id', orgId).order('created_at', { ascending: false }),
      ]);

      const toCSV = (rows, cols) => {
        if (!rows || rows.length === 0) return 'Sin datos\n';
        const BOM = '\uFEFF';
        const header = cols.map(c => c.label).join(';');
        const body = rows.map(r =>
          cols.map(c => {
            let v = c.format ? c.format(r) : (c.key.split('.').reduce((o, k) => o?.[k], r) ?? '');
            v = String(v ?? '');
            return (v.includes(';') || v.includes('"') || v.includes('\n'))
              ? '"' + v.replace(/"/g, '""') + '"'
              : v;
          }).join(';')
        ).join('\n');
        return BOM + header + '\n' + body;
      };

      const fecha = new Date().toISOString().split('T')[0];

      const archivos = [
        {
          nombre: `clientes_${fecha}.csv`,
          contenido: toCSV(clientes, [
            { key: 'nombre_establecimiento', label: 'Nombre' },
            { key: 'tipo_cliente', label: 'Tipo' },
            { key: 'estado_lead', label: 'Estado' },
            { key: 'ciudad', label: 'Ciudad' },
            { key: 'telefono', label: 'Teléfono' },
            { key: 'email', label: 'Email' },
            { key: 'saldo_pendiente', label: 'Saldo Pendiente' },
            { key: 'linea_credito', label: 'Línea de Crédito' },
            { key: 'fecha_ultima_compra', label: 'Última Compra' },
            { key: 'created_at', label: 'Creado' },
          ]),
        },
        {
          nombre: `productos_${fecha}.csv`,
          contenido: toCSV(productos, [
            { key: 'sku', label: 'SKU' },
            { key: 'nombre', label: 'Nombre' },
            { key: 'categoria', label: 'Categoría' },
            { key: 'precio_base', label: 'Precio Base' },
            { key: 'stock_actual', label: 'Stock Actual' },
            { key: 'stock_minimo', label: 'Stock Mínimo' },
            { key: 'proveedor', label: 'Proveedor' },
            { label: 'Activo', format: r => r.activo ? 'Sí' : 'No' },
          ]),
        },
        {
          nombre: `pedidos_${fecha}.csv`,
          contenido: toCSV(pedidos, [
            { key: 'numero_pedido', label: 'N° Pedido' },
            { label: 'Cliente', format: r => r.cliente?.nombre_establecimiento || '' },
            { label: 'Vendedor', format: r => r.vendedor?.nombre || '' },
            { key: 'estado', label: 'Estado' },
            { key: 'total', label: 'Total' },
            { key: 'metodo_pago', label: 'Método Pago' },
            { key: 'fecha_entrega_programada', label: 'Entrega Programada' },
            { key: 'fecha_entrega_real', label: 'Entrega Real' },
            { key: 'created_at', label: 'Creado' },
          ]),
        },
        {
          nombre: `cobros_${fecha}.csv`,
          contenido: toCSV(cobros, [
            { label: 'Cliente', format: r => r.cliente?.nombre_establecimiento || '' },
            { key: 'monto', label: 'Monto' },
            { key: 'metodo', label: 'Método Pago' },
            { key: 'referencia', label: 'Referencia' },
            { key: 'notas', label: 'Notas' },
            { key: 'created_at', label: 'Fecha' },
          ]),
        },
        {
          nombre: `usuarios_${fecha}.csv`,
          contenido: toCSV(usuarios, [
            { key: 'nombre', label: 'Nombre' },
            { key: 'email', label: 'Email' },
            { key: 'rol', label: 'Rol' },
            { label: 'Activo', format: r => r.activo ? 'Sí' : 'No' },
            { key: 'created_at', label: 'Creado' },
          ]),
        },
        {
          nombre: `interacciones_${fecha}.csv`,
          contenido: toCSV(interacciones, [
            { label: 'Cliente', format: r => r.cliente?.nombre_establecimiento || '' },
            { label: 'Usuario', format: r => r.usuario?.nombre || '' },
            { key: 'tipo', label: 'Tipo' },
            { key: 'contenido', label: 'Contenido' },
            { key: 'resultado', label: 'Resultado' },
            { key: 'duracion', label: 'Duración (min)' },
            { key: 'created_at', label: 'Fecha' },
          ]),
        },
      ];

      // 2. Cargar JSZip desde CDN
      if (btn) btn.textContent = 'Comprimiendo...';
      if (!window.JSZip) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
          s.onload = resolve;
          s.onerror = () => reject(new Error('No se pudo cargar JSZip'));
          document.head.appendChild(s);
        });
      }

      // 3. Armar ZIP
      const zip = new window.JSZip();
      const carpeta = zip.folder(`crm_backup_${fecha}`);
      archivos.forEach(f => carpeta.file(f.nombre, f.contenido));

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `crm_backup_${fecha}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      Toast.success(`Backup exportado: ${archivos.length} archivos CSV en un ZIP`);
    } catch (err) {
      console.error('Error exportando datos:', err);
      Toast.error(err.message || 'Error al exportar datos');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Exportar todos los datos (ZIP)'; }
    }
  },
};

export default ConfiguracionPage;
