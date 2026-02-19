/* ========================================
   UTILIDAD DE EXPORTACIÓN CSV
   Genera y descarga archivos CSV
   ======================================== */

const CSV = {
  /**
   * Exportar datos a CSV y descargar
   * @param {Array<Object>} data - Array de objetos con los datos
   * @param {Array<{key: string, label: string, format?: Function}>} columns - Definición de columnas
   * @param {string} filename - Nombre del archivo (sin extensión)
   */
  export(data, columns, filename) {
    if (!data || data.length === 0) {
      return false;
    }

    // BOM para que Excel reconozca UTF-8
    const BOM = '\uFEFF';

    // Header
    const header = columns.map(c => this._escapeField(c.label)).join(';');

    // Rows
    const rows = data.map(row => {
      return columns.map(col => {
        let value = col.format ? col.format(row) : this._getValue(row, col.key);
        return this._escapeField(value);
      }).join(';');
    });

    const csvContent = BOM + header + '\n' + rows.join('\n');

    // Descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${this._dateStamp()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  },

  /**
   * Obtener valor anidado de un objeto (soporta "vendedor.nombre")
   */
  _getValue(obj, key) {
    if (!key) return '';
    const keys = key.split('.');
    let val = obj;
    for (const k of keys) {
      val = val?.[k];
    }
    if (val === null || val === undefined) return '';
    if (Array.isArray(val)) return val.join(', ');
    return String(val);
  },

  /**
   * Escapar campo CSV (semicolon-separated, comillas dobles si contiene ; o ")
   */
  _escapeField(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(';') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  },

  /**
   * Fecha para el nombre del archivo
   */
  _dateStamp() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  },
};

export default CSV;
