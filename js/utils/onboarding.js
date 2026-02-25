/* ========================================
   FLUJO DE ONBOARDING
   Guía inicial para organizaciones nuevas
   ======================================== */

import supabase from '../config/supabase.js';
import Toast from './toast.js';

const Onboarding = {
  currentStep: 0,
  totalSteps: 3,

  steps: [
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      title: 'Bienvenido a tu CRM',
      description: 'Este sistema te ayuda a gestionar clientes, productos, pedidos, rutas y mucho m\u00e1s. Todo est\u00e1 dise\u00f1ado para distribuidoras de alimentos.',
      action: 'Siguiente',
    },
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
      title: 'Configur\u00e1 tu empresa',
      description: 'Personalizá los colores, el logo y los datos de tu organizaci\u00f3n desde Configuraci\u00f3n. Tambi\u00e9n pod\u00e9s invitar usuarios con distintos roles: vendedor, repartidor, gerente, etc.',
      action: 'Siguiente',
    },
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      title: 'Empez\u00e1 a cargar datos',
      description: 'Ahora pod\u00e9s empezar a crear tus primeros clientes, agregar productos al cat\u00e1logo y generar pedidos. Desde el Dashboard vas a poder ver toda la actividad.',
      action: 'Empezar',
    },
  ],

  /**
   * Verificar si debe mostrar onboarding
   * Se muestra si la organización no tiene clientes ni productos
   */
  async shouldShow() {
    try {
      const orgId = window.App?.userProfile?.organizacion_id;
      if (!orgId) return false;

      // Solo mostrar a owner/admin: otros roles no pueden configurar la org ni invitar usuarios
      const rol = window.App?.userProfile?.rol;
      if (!['owner', 'admin'].includes(rol)) return false;

      // Verificar si ya vio el onboarding (guardado en localStorage)
      const key = `onboarding_done_${orgId}`;
      if (localStorage.getItem(key)) return false;

      // Verificar si tiene datos
      const [{ count: clientesCount }, { count: productosCount }] = await Promise.all([
        supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('organizacion_id', orgId),
        supabase.from('productos').select('id', { count: 'exact', head: true }).eq('organizacion_id', orgId),
      ]);

      // Mostrar solo si no tiene ni clientes ni productos
      return (clientesCount || 0) === 0 && (productosCount || 0) === 0;
    } catch {
      return false;
    }
  },

  /**
   * Mostrar el flujo de onboarding
   */
  show() {
    this.currentStep = 0;
    this.renderStep();
  },

  renderStep() {
    const step = this.steps[this.currentStep];
    const isLast = this.currentStep === this.totalSteps - 1;

    // Remover anterior
    document.getElementById('onboardingOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'onboarding-overlay';
    overlay.id = 'onboardingOverlay';

    overlay.innerHTML = `
      <div class="onboarding-card">
        <div class="onboarding-step-indicator">
          ${this.steps.map((_, i) => {
            let cls = 'onboarding-step-dot';
            if (i < this.currentStep) cls += ' completed';
            if (i === this.currentStep) cls += ' active';
            return `<div class="${cls}"></div>`;
          }).join('')}
        </div>
        <div class="onboarding-icon">${step.icon}</div>
        <h2>${step.title}</h2>
        <p>${step.description}</p>
        <div class="onboarding-actions">
          ${!isLast ? '<button class="btn btn-secondary" id="onbSkip">Omitir</button>' : ''}
          <button class="btn btn-primary" id="onbAction">${step.action}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('onbAction').addEventListener('click', () => {
      if (isLast) {
        this.complete();
      } else {
        this.currentStep++;
        this.renderStep();
      }
    });

    document.getElementById('onbSkip')?.addEventListener('click', () => {
      this.complete();
    });
  },

  /**
   * Marcar onboarding como completado
   */
  complete() {
    const orgId = window.App?.userProfile?.organizacion_id;
    if (orgId) {
      localStorage.setItem(`onboarding_done_${orgId}`, 'true');
    }
    document.getElementById('onboardingOverlay')?.remove();
    Toast.success('Todo listo. Empezá a usar tu CRM.');
  },
};

export default Onboarding;
