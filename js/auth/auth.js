/* ========================================
   MÓDULO DE AUTENTICACIÓN (MULTI-TENANT)
   ======================================== */

import supabase from '../config/supabase.js';

const Auth = {
  // Cache del perfil y organización para no consultar en cada operación
  _profile: null,
  _organization: null,

  /**
   * Iniciar sesión con email y password
   */
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Limpiar cache al hacer login
    this._profile = null;
    this._organization = null;

    return data;
  },

  /**
   * Cerrar sesión
   */
  async logout() {
    this._profile = null;
    this._organization = null;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Obtener sesión actual
   */
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  /**
   * Obtener usuario actual de auth
   */
  async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  /**
   * Obtener perfil del usuario (con rol, organizacion_id, etc.)
   * Usa cache para evitar queries repetidas
   */
  async getUserProfile(forceRefresh = false) {
    if (this._profile && !forceRefresh) return this._profile;

    const user = await this.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    this._profile = data;
    return data;
  },

  /**
   * Obtener la organización del usuario actual
   * Incluye branding (nombre, logo, colores)
   */
  async getOrganization(forceRefresh = false) {
    if (this._organization && !forceRefresh) return this._organization;

    const profile = await this.getUserProfile();
    if (!profile) return null;

    const { data, error } = await supabase
      .from('organizaciones')
      .select('*')
      .eq('id', profile.organizacion_id)
      .single();

    if (error) throw error;

    this._organization = data;
    return data;
  },

  /**
   * Obtener el organizacion_id del usuario actual (shortcut)
   */
  async getOrgId() {
    const profile = await this.getUserProfile();
    return profile?.organizacion_id;
  },

  /**
   * Escuchar cambios en la autenticación
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        this._profile = null;
        this._organization = null;
      }
      callback(event, session);
    });
  },
};

export default Auth;
