/* ========================================
   UTILIDAD DE NOTIFICACIONES IN-APP
   Crea notificaciones persistentes en la tabla
   para que la campana del navbar las muestre.
   ======================================== */

import supabase from '../config/supabase.js';

const Notif = {
  /**
   * Crea una notificación para todos los usuarios owner/admin/gerente
   * de la organización actual.
   *
   * @param {string} tipo       - Tipo visual: 'info' | 'warning' | 'success' | 'danger'
   * @param {string} titulo     - Título corto de la notificación
   * @param {string} [mensaje]  - Detalle adicional (opcional)
   * @param {string} [link]     - Hash de navegación, ej: '#/pedidos' (opcional)
   */
  async notifyManagers(tipo, titulo, mensaje = null, link = null) {
    try {
      const orgId = window.App?.organization?.id;
      if (!orgId) return;

      // Traer IDs de managers activos de la org
      const { data: managers } = await supabase
        .from('usuarios')
        .select('id')
        .eq('organizacion_id', orgId)
        .in('rol', ['owner', 'admin', 'gerente'])
        .eq('activo', true);

      if (!managers || managers.length === 0) return;

      const rows = managers.map(u => ({
        organizacion_id: orgId,
        usuario_id: u.id,
        tipo,
        titulo,
        mensaje,
        link_accion: link,
      }));

      await supabase.from('notificaciones').insert(rows);
    } catch (err) {
      // No bloquear el flujo principal si falla la notificación
      console.error('Error creando notificaciones:', err);
    }
  },

  /**
   * Crea una notificación solo para el usuario actual.
   */
  async notifySelf(tipo, titulo, mensaje = null, link = null) {
    try {
      const orgId = window.App?.organization?.id;
      const userId = window.App?.userProfile?.id;
      if (!orgId || !userId) return;

      await supabase.from('notificaciones').insert({
        organizacion_id: orgId,
        usuario_id: userId,
        tipo,
        titulo,
        mensaje,
        link_accion: link,
      });
    } catch (err) {
      console.error('Error creando notificación propia:', err);
    }
  },
};

export default Notif;
