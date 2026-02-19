/* ========================================
   IMPORT CSV - Carga masiva de datos
   Soporta: Clientes, Productos
   ======================================== */

import supabase from '../config/supabase.js';
import Toast from './toast.js';

const ImportCSV = {

  // ========================================
  // ENTRADA PÚBLICA: abrir modal de import
  // ========================================

  open(tipo) {
    if (tipo !== 'clientes' && tipo !== 'productos') return;
    this._tipo = tipo;
    this._rows = [];
    this._renderModal();
  },

  // ========================================
  // MODAL PRINCIPAL
  // ========================================

  _renderModal() {
    const existing = document.getElementById('importCsvModal');
    if (existing) existing.remove();

    const titles = { clientes: 'Importar Clientes', productos: 'Importar Productos' };
    const ejemplos = {
      clientes: `nombre_establecimiento,tipo_cliente,ciudad,telefono,email,estado_lead\n"Restaurante El Sol","horeca","Buenos Aires","1122334455","sol@mail.com","activo"\n"Super Norte","supermercado","Córdoba","3512345678","","prospecto"`,
      productos: `sku,nombre,categoria,precio_base,stock_actual,stock_minimo,unidad_medida,proveedor\n"LECH001","Leche Entera 1L","Lácteos","850","100","20","litros","Lácteos SA"\n"PAN002","Pan de Molde 500g","Panificados","420","50","10","unidades","Panader SA"`,
    };

    const container = document.createElement('div');
    container.id = 'importCsvModal';
    container.className = 'modal-overlay';
    container.innerHTML = `
      <div class="modal" style="max-width:700px;">
        <div class="modal-header">
          <h2>${titles[this._tipo]}</h2>
          <button class="modal-close" id="btnCloseImportModal">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="modal-body">

          <div class="info-box" style="margin-bottom:1rem;padding:0.75rem 1rem;background:var(--primary-light);border-radius:var(--radius-md);border-left:3px solid var(--primary);">
            <strong>Formato requerido:</strong> CSV con separador coma o punto y coma. Primera fila = encabezados.
            <br><small>Podés exportar desde Excel como "CSV UTF-8".</small>
          </div>

          <div id="importStep1">
            <div class="form-group">
              <label class="form-label">Seleccionar archivo CSV</label>
              <input type="file" class="form-input" id="importFileInput" accept=".csv,.txt">
            </div>
            <div class="form-group">
              <label class="form-label">Ejemplo de formato</label>
              <pre style="background:var(--gray-100);border-radius:var(--radius-md);padding:0.75rem;font-size:12px;overflow-x:auto;white-space:pre-wrap;">${ejemplos[this._tipo]}</pre>
            </div>
            <button class="btn btn-sm btn-ghost" id="btnDownloadTemplate">⬇ Descargar plantilla CSV</button>
          </div>

          <div id="importStep2" style="display:none;">
            <div id="importPreviewInfo" style="margin-bottom:0.75rem;font-size:var(--font-size-sm);color:var(--gray-600);"></div>
            <div style="overflow-x:auto;max-height:300px;border:1px solid var(--gray-200);border-radius:var(--radius-md);">
              <table class="rep-table" id="importPreviewTable" style="font-size:12px;"></table>
            </div>
            <div id="importErrors" style="margin-top:0.75rem;"></div>
          </div>

          <div id="importStep3" style="display:none;">
            <div class="text-center" style="padding:2rem">
              <div class="spinner" style="margin:0 auto 1rem;"></div>
              <p id="importProgress">Importando...</p>
            </div>
          </div>

          <div id="importStep4" style="display:none;">
            <div id="importResult" class="text-center" style="padding:1.5rem;"></div>
          </div>

        </div>
        <div class="modal-footer" id="importFooter">
          <button class="btn btn-secondary" id="btnCancelImport">Cancelar</button>
          <button class="btn btn-primary" id="btnNextImport" disabled>Previsualizar</button>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    // Eventos
    document.getElementById('btnCloseImportModal').addEventListener('click', () => container.remove());
    document.getElementById('btnCancelImport').addEventListener('click', () => container.remove());
    container.addEventListener('click', (e) => { if (e.target === container) container.remove(); });

    document.getElementById('importFileInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        document.getElementById('btnNextImport').disabled = false;
      }
    });

    document.getElementById('btnNextImport').addEventListener('click', () => this._handleNextClick());
    document.getElementById('btnDownloadTemplate').addEventListener('click', () => this._downloadTemplate());
  },

  // ========================================
  // FLUJO DE PASOS
  // ========================================

  async _handleNextClick() {
    const btn = document.getElementById('btnNextImport');
    const step1 = document.getElementById('importStep1');
    const step2 = document.getElementById('importStep2');
    const step3 = document.getElementById('importStep3');
    const step4 = document.getElementById('importStep4');

    // Paso 1 → 2: parsear y previsualizar
    if (step1.style.display !== 'none' && step2.style.display === 'none') {
      const file = document.getElementById('importFileInput').files[0];
      if (!file) return;

      const text = await file.text();
      const { rows, errors } = this._parseCSV(text);
      this._rows = rows;

      step1.style.display = 'none';
      step2.style.display = '';
      this._renderPreview(rows, errors);
      btn.textContent = errors.length > 0 && rows.length === 0 ? 'Hay errores' : `Importar ${rows.length} registros`;
      btn.disabled = rows.length === 0;
      return;
    }

    // Paso 2 → 3: importar
    if (step2.style.display !== 'none') {
      step2.style.display = 'none';
      step3.style.display = '';
      document.getElementById('importFooter').style.display = 'none';

      const result = await this._doImport(this._rows);

      step3.style.display = 'none';
      step4.style.display = '';
      document.getElementById('importFooter').innerHTML = '<button class="btn btn-primary" id="btnFinishImport">Cerrar</button>';
      document.getElementById('btnFinishImport').addEventListener('click', () => {
        document.getElementById('importCsvModal')?.remove();
        // Refrescar la página actual
        window.dispatchEvent(new CustomEvent('crm:import-done', { detail: { tipo: this._tipo } }));
      });

      const resultEl = document.getElementById('importResult');
      if (result.ok > 0) {
        resultEl.innerHTML = `
          <div style="font-size:2.5rem;margin-bottom:0.5rem">✅</div>
          <h3 style="color:var(--success)">${result.ok} registros importados</h3>
          ${result.errors > 0 ? `<p style="color:var(--danger);margin-top:0.5rem">${result.errors} registros con error (omitidos)</p>` : ''}
        `;
      } else {
        resultEl.innerHTML = `
          <div style="font-size:2.5rem;margin-bottom:0.5rem">❌</div>
          <h3 style="color:var(--danger)">No se pudo importar ningún registro</h3>
          <p class="text-muted">Revisá el formato del archivo</p>
        `;
      }
    }
  },

  // ========================================
  // PARSEO CSV
  // ========================================

  _parseCSV(text) {
    const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
    if (lines.length < 2) return { rows: [], errors: ['El archivo debe tener al menos una fila de datos'] };

    // Detectar separador (coma o punto y coma)
    const sep = lines[0].includes(';') ? ';' : ',';

    const headers = this._parseLine(lines[0], sep).map(h => h.toLowerCase().trim().replace(/\s+/g, '_'));
    const errors = [];
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = this._parseLine(lines[i], sep);
      const row = {};
      headers.forEach((h, j) => { row[h] = (values[j] || '').trim(); });

      const validationError = this._validateRow(row, i + 1);
      if (validationError) {
        errors.push(validationError);
      } else {
        rows.push(row);
      }
    }

    return { rows, errors };
  },

  _parseLine(line, sep) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === sep && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  },

  _validateRow(row, lineNum) {
    if (this._tipo === 'clientes') {
      if (!row.nombre_establecimiento) return `Fila ${lineNum}: nombre_establecimiento es obligatorio`;
    }
    if (this._tipo === 'productos') {
      if (!row.nombre) return `Fila ${lineNum}: nombre es obligatorio`;
      if (row.precio_base && isNaN(parseFloat(row.precio_base))) return `Fila ${lineNum}: precio_base debe ser un número`;
    }
    return null;
  },

  // ========================================
  // PREVIEW
  // ========================================

  _renderPreview(rows, errors) {
    const info = document.getElementById('importPreviewInfo');
    const table = document.getElementById('importPreviewTable');
    const errorsEl = document.getElementById('importErrors');

    info.textContent = `${rows.length} registros válidos${errors.length > 0 ? `, ${errors.length} con errores (omitidos)` : ''}`;

    if (rows.length === 0) {
      table.innerHTML = '<tr><td class="text-center text-muted">Sin registros válidos</td></tr>';
    } else {
      const cols = Object.keys(rows[0]);
      const preview = rows.slice(0, 10);
      table.innerHTML = `
        <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>
          ${preview.map(r => `<tr>${cols.map(c => `<td>${r[c] || ''}</td>`).join('')}</tr>`).join('')}
          ${rows.length > 10 ? `<tr><td colspan="${cols.length}" class="text-center text-muted">...y ${rows.length - 10} más</td></tr>` : ''}
        </tbody>
      `;
    }

    if (errors.length > 0) {
      errorsEl.innerHTML = `
        <details>
          <summary style="cursor:pointer;font-size:var(--font-size-sm);color:var(--danger)">${errors.length} errores encontrados (click para ver)</summary>
          <ul style="font-size:var(--font-size-xs);color:var(--danger);margin-top:0.5rem;padding-left:1.25rem;">
            ${errors.map(e => `<li>${e}</li>`).join('')}
          </ul>
        </details>
      `;
    }
  },

  // ========================================
  // IMPORTACIÓN EN SUPABASE
  // ========================================

  async _doImport(rows) {
    const orgId = window.App?.organization?.id;
    if (!orgId) return { ok: 0, errors: rows.length };

    let ok = 0;
    let errors = 0;
    const BATCH = 50;

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH).map(r => this._mapRow(r, orgId));
      document.getElementById('importProgress').textContent =
        `Importando ${Math.min(i + BATCH, rows.length)} de ${rows.length}...`;

      const table = this._tipo === 'clientes' ? 'clientes' : 'productos';
      const { data, error } = await supabase.from(table).insert(batch).select('id');
      if (error) {
        errors += batch.length;
        console.error('Import batch error:', error);
      } else {
        ok += data.length;
      }
    }

    return { ok, errors };
  },

  _mapRow(row, orgId) {
    if (this._tipo === 'clientes') {
      const tiposValidos = ['horeca', 'supermercado', 'tienda', 'mayorista'];
      const estadosValidos = ['prospecto', 'negociacion', 'activo', 'en_pausa', 'inactivo'];
      return {
        organizacion_id: orgId,
        nombre_establecimiento: row.nombre_establecimiento || row.nombre || '',
        razon_social: row.razon_social || null,
        tipo_cliente: tiposValidos.includes(row.tipo_cliente) ? row.tipo_cliente : 'horeca',
        estado_lead: estadosValidos.includes(row.estado_lead) ? row.estado_lead : 'prospecto',
        ciudad: row.ciudad || null,
        provincia: row.provincia || null,
        telefono: row.telefono || null,
        email: row.email || null,
        direccion_completa: row.direccion || row.direccion_completa || null,
        cuit: row.cuit || null,
        scoring: parseInt(row.scoring) || 3,
        linea_credito: parseFloat(row.linea_credito) || 0,
        saldo_pendiente: parseFloat(row.saldo_pendiente) || 0,
        dias_credito: parseInt(row.dias_credito) || 0,
      };
    }

    if (this._tipo === 'productos') {
      return {
        organizacion_id: orgId,
        sku: row.sku || null,
        nombre: row.nombre || '',
        categoria: row.categoria || 'General',
        precio_base: parseFloat(row.precio_base) || 0,
        stock_actual: parseInt(row.stock_actual) || 0,
        stock_minimo: parseInt(row.stock_minimo) || 0,
        unidad_medida: row.unidad_medida || 'unidades',
        proveedor: row.proveedor || null,
        activo: row.activo === 'false' || row.activo === '0' ? false : true,
        fecha_vencimiento: row.fecha_vencimiento || null,
        descripcion: row.descripcion || null,
      };
    }
  },

  // ========================================
  // DESCARGAR PLANTILLA
  // ========================================

  _downloadTemplate() {
    const templates = {
      clientes: 'nombre_establecimiento,razon_social,tipo_cliente,estado_lead,ciudad,provincia,telefono,email,direccion_completa,cuit,scoring,linea_credito,dias_credito\n"Restaurante Ejemplo","Ej SRL","horeca","activo","Buenos Aires","CABA","1122334455","ej@mail.com","Av. Siempreviva 742","30123456789","3","50000","30"',
      productos: 'sku,nombre,categoria,precio_base,stock_actual,stock_minimo,unidad_medida,proveedor,descripcion\n"PROD001","Nombre del Producto","Categoría","1000","100","10","unidades","Proveedor SA","Descripción opcional"',
    };

    const blob = new Blob([templates[this._tipo]], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantilla_${this._tipo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

export default ImportCSV;
