/* ========================================
   MANEJO ROBUSTO DE ERRORES
   Sesión expirada, red caída, errores API
   ======================================== */

import Toast from './toast.js';

const ErrorHandler = {
  _banner: null,
  _isOffline: false,

  /**
   * Inicializar listeners de red y sesión
   */
  init() {
    // Detectar cuando se pierde/recupera la conexión
    window.addEventListener('offline', () => this.showOffline());
    window.addEventListener('online', () => this.hideOffline());

    // Estado inicial
    if (!navigator.onLine) {
      this.showOffline();
    }
  },

  /**
   * Mostrar banner de sin conexión
   */
  showOffline() {
    if (this._isOffline) return;
    this._isOffline = true;

    this._showBanner(
      'Sin conexión a internet. Los cambios no se guardarán hasta que vuelvas a conectarte.',
      null
    );
  },

  /**
   * Ocultar banner de sin conexión
   */
  hideOffline() {
    if (!this._isOffline) return;
    this._isOffline = false;
    this._removeBanner();
    Toast.success('Conexión restablecida');
  },

  /**
   * Manejar error de sesión expirada
   */
  handleSessionExpired() {
    this._showBanner(
      'Tu sesión ha expirado. Recargá la página para iniciar sesión nuevamente.',
      () => window.location.reload()
    );
  },

  /**
   * Manejar errores de Supabase de forma centralizada
   * @param {Error} error - Error de Supabase
   * @param {string} context - Contexto descriptivo (ej: "cargando clientes")
   * @returns {boolean} - true si el error fue manejado (no mostrar toast adicional)
   */
  handle(error, context = '') {
    if (!error) return false;

    const msg = error.message || String(error);
    const code = error.code || error.status;

    // Sesión expirada / JWT inválido
    if (
      code === 401 || code === 403 ||
      msg.includes('JWT') ||
      msg.includes('token') ||
      msg.includes('not authenticated') ||
      msg.includes('Invalid Refresh Token') ||
      msg.includes('refresh_token_not_found')
    ) {
      this.handleSessionExpired();
      return true;
    }

    // Sin conexión
    if (
      msg.includes('Failed to fetch') ||
      msg.includes('NetworkError') ||
      msg.includes('ERR_INTERNET_DISCONNECTED') ||
      msg.includes('ERR_NETWORK') ||
      !navigator.onLine
    ) {
      if (!this._isOffline) {
        Toast.error('Error de red. Verificá tu conexión a internet.');
      }
      return true;
    }

    // Rate limit
    if (code === 429) {
      Toast.warning('Demasiadas solicitudes. Esperá unos segundos e intentá de nuevo.');
      return true;
    }

    // Error genérico con contexto
    const contextMsg = context ? ` al ${context}` : '';
    console.error(`Error${contextMsg}:`, error);
    Toast.error(`Error${contextMsg}: ${msg}`);
    return false;
  },

  /**
   * Wrapper para operaciones async con manejo de errores
   * @param {Function} fn - Función async a ejecutar
   * @param {string} context - Contexto descriptivo
   * @returns {*} - Resultado de la función o null si hubo error
   */
  async wrap(fn, context = '') {
    try {
      return await fn();
    } catch (err) {
      this.handle(err, context);
      return null;
    }
  },

  /**
   * Mostrar banner fijo en la parte superior
   */
  _showBanner(message, onRetry) {
    this._removeBanner();

    const banner = document.createElement('div');
    banner.className = 'error-banner';
    banner.id = 'errorBanner';
    banner.innerHTML = `
      <span>${message}</span>
      ${onRetry ? '<button class="btn-retry">Recargar</button>' : ''}
    `;

    if (onRetry) {
      banner.querySelector('.btn-retry').addEventListener('click', onRetry);
    }

    document.body.prepend(banner);
    this._banner = banner;
  },

  /**
   * Remover banner
   */
  _removeBanner() {
    if (this._banner) {
      this._banner.remove();
      this._banner = null;
    }
    document.getElementById('errorBanner')?.remove();
  },
};

export default ErrorHandler;
