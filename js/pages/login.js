/* ========================================
   PÁGINA DE LOGIN
   ======================================== */

import Auth from '../auth/auth.js';
import supabase from '../config/supabase.js';

const LoginPage = {
  render() {
    return `
      <div class="login-page">
        <div class="login-card">
          <div class="login-header">
            <h1>CRM Distribuidora</h1>
            <p>Iniciá sesión para continuar</p>
          </div>

          <div id="loginError" class="login-error hidden"></div>
          <div id="loginSuccess" class="login-success hidden"></div>

          <!-- Vista: Login -->
          <div id="vistaLogin">
            <form id="loginForm" class="login-form">
              <div class="form-group">
                <label class="form-label" for="email">Email</label>
                <input
                  type="email"
                  id="email"
                  class="form-input"
                  placeholder="tu@email.com"
                  required
                  autocomplete="email"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="password">Contraseña</label>
                <input
                  type="password"
                  id="password"
                  class="form-input"
                  placeholder="Tu contraseña"
                  required
                  autocomplete="current-password"
                />
              </div>

              <button type="submit" class="btn btn-primary login-btn" id="loginBtn">
                Iniciar Sesión
              </button>
            </form>

            <div class="login-forgot">
              <button type="button" class="btn-link" id="btnMostrarReset">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>

          <!-- Vista: Reset Password -->
          <div id="vistaReset" class="hidden">
            <p style="font-size:var(--font-size-sm);color:var(--gray-600);margin-bottom:1rem;">
              Ingresá tu email y te enviamos un enlace para restablecer tu contraseña.
            </p>
            <form id="resetForm" class="login-form">
              <div class="form-group">
                <label class="form-label" for="resetEmail">Email</label>
                <input
                  type="email"
                  id="resetEmail"
                  class="form-input"
                  placeholder="tu@email.com"
                  required
                  autocomplete="email"
                />
              </div>
              <button type="submit" class="btn btn-primary login-btn" id="resetBtn">
                Enviar enlace
              </button>
            </form>
            <div class="login-forgot" style="margin-top:0.75rem;">
              <button type="button" class="btn-link" id="btnVolverLogin">
                ← Volver al login
              </button>
            </div>
          </div>

          <!-- Vista: Registro por invitación -->
          <div id="vistaInvite" class="hidden">
            <div id="inviteInfo"></div>
            <div id="inviteError" class="login-error hidden" style="margin-bottom:0.75rem;"></div>
            <form id="inviteForm" class="login-form">
              <div class="form-group">
                <label class="form-label">Nombre</label>
                <input type="text" id="inviteNombre" class="form-input" disabled>
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" id="inviteEmail" class="form-input" disabled>
              </div>
              <div class="form-group">
                <label class="form-label">Nueva contraseña *</label>
                <input type="password" id="invitePassword" class="form-input" minlength="8" required placeholder="Mínimo 8 caracteres">
              </div>
              <div class="form-group">
                <label class="form-label">Confirmar contraseña *</label>
                <input type="password" id="invitePasswordConfirm" class="form-input" minlength="8" required placeholder="Repetir contraseña">
              </div>
              <button type="submit" class="btn btn-primary login-btn" id="btnRegistrarInvite">
                Crear cuenta
              </button>
            </form>
          </div>

          <div class="login-footer">
            CRM Distribuidora de Alimentos
          </div>
        </div>
      </div>
    `;
  },

  _esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  async checkInvite() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');
    if (!token) return;

    document.getElementById('vistaLogin').classList.add('hidden');
    document.getElementById('vistaReset').classList.add('hidden');
    const vistaInvite = document.getElementById('vistaInvite');
    if (!vistaInvite) return;
    vistaInvite.classList.remove('hidden');

    const infoDiv = document.getElementById('inviteInfo');
    infoDiv.innerHTML = '<div style="text-align:center;padding:1rem">Verificando invitación...</div>';

    try {
      const { data, error } = await supabase.rpc('get_invitacion_by_token', { p_token: token });
      if (error || !data?.length) throw new Error('Invitación no encontrada');
      const inv = data[0];

      if (inv.usado) { infoDiv.innerHTML = '<div style="color:var(--danger);text-align:center;padding:0.5rem;">Esta invitación ya fue utilizada.</div>'; return; }
      if (new Date(inv.expires_at) < new Date()) { infoDiv.innerHTML = '<div style="color:var(--danger);text-align:center;padding:0.5rem;">Esta invitación expiró.</div>'; return; }

      infoDiv.innerHTML = `
        <div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:var(--radius);padding:0.75rem 1rem;margin-bottom:1rem;">
          <div style="font-size:var(--font-size-xs);color:var(--gray-500);">Fuiste invitado/a a:</div>
          <div style="font-weight:600;">${this._esc(inv.org_nombre)}</div>
          <div style="font-size:var(--font-size-sm);color:var(--gray-500);">Rol: ${inv.rol} · ${inv.email}</div>
        </div>
      `;

      document.getElementById('inviteEmail').value = inv.email;
      document.getElementById('inviteNombre').value = inv.nombre;
      const form = document.getElementById('inviteForm');
      form.dataset.token = token;
      form.dataset.orgId = inv.org_id;
      form.dataset.rol = inv.rol;
      form.dataset.nombre = inv.nombre;
    } catch (err) {
      console.error('Error verificando invitación:', err);
      infoDiv.innerHTML = `<div style="color:var(--danger);text-align:center;padding:0.5rem;">No se pudo verificar la invitación. Contactá al administrador.</div>`;
    }
  },

  initEvents(onLoginSuccess) {
    const errorDiv = document.getElementById('loginError');
    const successDiv = document.getElementById('loginSuccess');

    // Verificar ?invite= en URL
    this.checkInvite();

    // Registro por invitación
    document.getElementById('inviteForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const email = document.getElementById('inviteEmail').value;
      const password = document.getElementById('invitePassword').value;
      const confirm = document.getElementById('invitePasswordConfirm').value;
      const errDiv = document.getElementById('inviteError');
      errDiv.classList.add('hidden');

      if (password !== confirm) { errDiv.textContent = 'Las contraseñas no coinciden'; errDiv.classList.remove('hidden'); return; }
      if (password.length < 8) { errDiv.textContent = 'Mínimo 8 caracteres'; errDiv.classList.remove('hidden'); return; }

      const btn = document.getElementById('btnRegistrarInvite');
      btn.disabled = true; btn.textContent = 'Creando cuenta...';

      try {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              organizacion_id: form.dataset.orgId,
              rol: form.dataset.rol,
              nombre: form.dataset.nombre,
            },
          },
        });
        if (signUpError) throw signUpError;

        await supabase.rpc('usar_invitacion', { p_token: form.dataset.token });
        window.history.replaceState({}, '', window.location.pathname);

        // Intentar login directo (funciona si email confirmation está desactivado)
        const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
        if (!loginErr) { onLoginSuccess(); return; }

        // Con confirmación de email activada: mostrar mensaje
        document.getElementById('vistaInvite').classList.add('hidden');
        document.getElementById('vistaLogin').classList.remove('hidden');
        successDiv.textContent = '¡Cuenta creada! Revisá tu email para confirmar y luego iniciá sesión.';
        successDiv.classList.remove('hidden');
      } catch (err) {
        errDiv.textContent = err.message || 'Error al crear la cuenta';
        errDiv.classList.remove('hidden');
        btn.disabled = false; btn.textContent = 'Crear cuenta';
      }
    });

    // Cambiar entre vistas login ↔ reset
    document.getElementById('btnMostrarReset')?.addEventListener('click', () => {
      document.getElementById('vistaLogin').classList.add('hidden');
      document.getElementById('vistaReset').classList.remove('hidden');
      errorDiv.classList.add('hidden');
      successDiv.classList.add('hidden');
    });

    document.getElementById('btnVolverLogin')?.addEventListener('click', () => {
      document.getElementById('vistaReset').classList.add('hidden');
      document.getElementById('vistaLogin').classList.remove('hidden');
      errorDiv.classList.add('hidden');
      successDiv.classList.add('hidden');
    });

    // Submit login
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorDiv.classList.add('hidden');
      const loginBtn = document.getElementById('loginBtn');
      loginBtn.disabled = true;
      loginBtn.textContent = 'Ingresando...';

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      try {
        await Auth.login(email, password);
        onLoginSuccess();
      } catch (err) {
        errorDiv.textContent = getErrorMessage(err.message);
        errorDiv.classList.remove('hidden');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Iniciar Sesión';
      }
    });

    // Submit reset
    document.getElementById('resetForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorDiv.classList.add('hidden');
      successDiv.classList.add('hidden');
      const resetBtn = document.getElementById('resetBtn');
      resetBtn.disabled = true;
      resetBtn.textContent = 'Enviando...';

      const email = document.getElementById('resetEmail').value.trim();

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}${window.location.pathname}`,
        });
        if (error) throw error;

        successDiv.textContent = `Se envió un enlace a ${email}. Revisá tu bandeja de entrada.`;
        successDiv.classList.remove('hidden');
        document.getElementById('resetForm').reset();
      } catch (err) {
        errorDiv.textContent = err.message || 'Error al enviar el email. Intentá de nuevo.';
        errorDiv.classList.remove('hidden');
      } finally {
        resetBtn.disabled = false;
        resetBtn.textContent = 'Enviar enlace';
      }
    });
  },
};

function getErrorMessage(code) {
  const messages = {
    'Invalid login credentials': 'Email o contraseña incorrectos',
    'Email not confirmed': 'Confirmá tu email antes de ingresar',
    'Too many requests': 'Demasiados intentos, esperá un momento',
  };
  return messages[code] || 'Error al iniciar sesión. Intentá de nuevo.';
}

export default LoginPage;
