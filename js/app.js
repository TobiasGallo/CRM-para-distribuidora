/* ========================================
   APP PRINCIPAL - CRM Distribuidora
   Arquitectura MULTI-TENANT
   ======================================== */

import Auth from './auth/auth.js';
import Router from './utils/router.js';
import Toast from './utils/toast.js';
import Sidebar from './components/sidebar.js';
import Navbar from './components/navbar.js';
import LoginPage from './pages/login.js';
import DashboardPage from './pages/dashboard.js';
import ClientesPage from './pages/clientes.js';
import ProductosPage from './pages/productos.js';
import PedidosPage from './pages/pedidos.js';
import PipelinePage from './pages/pipeline.js';
import LogisticaPage from './pages/logistica.js';
import ReportesPage from './pages/reportes.js';
import ConfiguracionPage from './pages/configuracion.js';
import Permissions from './utils/permissions.js';
import ErrorHandler from './utils/error-handler.js';
import Onboarding from './utils/onboarding.js';

const App = {
  // Datos globales accesibles desde cualquier módulo
  organization: null,
  userProfile: null,
  _authSub: null, // Suscripción onAuthStateChange para evitar listeners duplicados

  async init() {
    Toast.init();
    ErrorHandler.init();

    // Registrar suscripción ANTES de verificar la sesión para no perder
    // el evento PASSWORD_RECOVERY que puede dispararse al parsear el hash
    this._authSub = Auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        this.organization = null;
        this.userProfile = null;
        this.showLogin();
      } else if (event === 'PASSWORD_RECOVERY') {
        // Usuario llegó desde link de reseteo: mostrar form de nueva contraseña
        this.showPasswordResetForm();
      }
    });

    // Si la URL tiene type=recovery, el SDK Supabase procesa el token
    // y dispara PASSWORD_RECOVERY en onAuthStateChange. Mostramos login
    // como pantalla de espera; el evento se encarga del resto.
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    if (hashParams.get('type') === 'recovery') {
      this.showLogin();
      return;
    }

    // Flujo normal: verificar sesión activa
    const session = await Auth.getSession();
    if (session) {
      await this.loadApp();
    } else {
      this.showLogin();
    }
  },

  /**
   * Mostrar pantalla de login
   */
  showLogin() {
    document.getElementById('app').innerHTML = LoginPage.render();
    LoginPage.initEvents(() => this.loadApp());
  },

  /**
   * Mostrar formulario de nueva contraseña (flujo reset de contraseña)
   */
  showPasswordResetForm() {
    document.getElementById('app').innerHTML = LoginPage.renderPasswordReset();
    LoginPage.initPasswordResetEvents(() => this.loadApp());
  },

  /**
   * Cargar la aplicación principal
   * 1. Obtiene perfil del usuario
   * 2. Obtiene datos de la organización
   * 3. Aplica branding personalizado
   * 4. Renderiza la interfaz
   */
  async loadApp() {
    try {
      this.userProfile = await Auth.getUserProfile();
      this.organization = await Auth.getOrganization();
    } catch (err) {
      console.error('Error al obtener datos del usuario:', err);
      // Si no se pueden cargar los datos (sesión expirada, red caída, etc.)
      // redirigir al login en vez de renderizar la app con estado nulo
      this.showLogin();
      return;
    }

    // Aplicar branding de la organización (colores, nombre)
    this.applyBranding();

    // Renderizar layout
    document.getElementById('app').innerHTML = `
      <div class="app-container">
        ${Sidebar.render(this.userProfile, this.organization)}
        <div class="main-wrapper">
          ${Navbar.render()}
          <main class="main-content" id="pageContent">
            <div class="loader"><div class="spinner"></div></div>
          </main>
        </div>
      </div>
    `;

    // Inicializar eventos de componentes
    Sidebar.initEvents();
    Navbar.initEvents();

    // Registrar rutas
    Router.register('dashboard', (el) => DashboardPage.render(el));

    // Placeholder para rutas futuras
    const placeholder = (name) => (el) => {
      el.innerHTML = `
        <div class="card">
          <div class="card-body text-center">
            <h2>${name}</h2>
            <p class="text-muted">Módulo en desarrollo</p>
          </div>
        </div>
      `;
    };

    Router.register('clientes', (el) => ClientesPage.render(el));
    Router.register('productos', (el) => ProductosPage.render(el));
    Router.register('pedidos', (el) => PedidosPage.render(el));
    Router.register('pipeline', (el) => PipelinePage.render(el));
    Router.register('rutas', (el) => LogisticaPage.render(el));
    Router.register('reportes', (el) => ReportesPage.render(el));
    Router.register('configuracion', (el) => ConfiguracionPage.render(el));

    // Iniciar router
    Router.init('#pageContent');

    // Verificar si mostrar onboarding
    if (await Onboarding.shouldShow()) {
      Onboarding.show();
    }
  },

  /**
   * Aplicar colores y branding de la organización
   * Sobreescribe las CSS variables con los colores de la org
   */
  applyBranding() {
    if (!this.organization) return;

    const root = document.documentElement;
    const org = this.organization;

    if (org.color_primario) {
      root.style.setProperty('--primary', org.color_primario);
    }
    if (org.color_secundario) {
      root.style.setProperty('--primary-hover', org.color_secundario);
    }

    // Actualizar título de la pestaña del navegador
    document.title = `CRM - ${org.nombre}`;

    // Actualizar favicon si la org tiene uno
    if (org.favicon_url) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = org.favicon_url;
    }
  },
};

// Hacer App accesible globalmente para que otros módulos puedan leer organization/userProfile
window.App = App;

// Iniciar la app cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => App.init());
