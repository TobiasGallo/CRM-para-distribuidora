/* ========================================
   SISTEMA DE PERMISOS POR ROL
   Controla qué puede ver/hacer cada rol
   ======================================== */

const ROLE_HIERARCHY = {
  owner: 6,
  admin: 5,
  gerente: 4,
  vendedor: 3,
  administrativo: 2,
  repartidor: 1,
};

/**
 * Permisos por módulo y acción.
 * true = permitido, false = denegado
 * Si un módulo/acción no aparece, se deniega por defecto.
 */
const PERMISSIONS = {
  dashboard: {
    ver: ['owner', 'admin', 'gerente', 'vendedor', 'administrativo'],
  },
  pipeline: {
    ver: ['owner', 'admin', 'gerente', 'vendedor'],
    crear: ['owner', 'admin', 'gerente', 'vendedor'],
    editar: ['owner', 'admin', 'gerente', 'vendedor'],
    eliminar: ['owner', 'admin', 'gerente'],
  },
  clientes: {
    ver: ['owner', 'admin', 'gerente', 'vendedor', 'administrativo'],
    crear: ['owner', 'admin', 'gerente', 'vendedor'],
    editar: ['owner', 'admin', 'gerente', 'vendedor'],
    eliminar: ['owner', 'admin', 'gerente'],
  },
  productos: {
    ver: ['owner', 'admin', 'gerente', 'vendedor', 'administrativo'],
    crear: ['owner', 'admin', 'gerente'],
    editar: ['owner', 'admin', 'gerente'],
    eliminar: ['owner', 'admin'],
  },
  pedidos: {
    ver: ['owner', 'admin', 'gerente', 'vendedor', 'administrativo', 'repartidor'],
    crear: ['owner', 'admin', 'gerente', 'vendedor'],
    editar: ['owner', 'admin', 'gerente', 'vendedor'],
    eliminar: ['owner', 'admin', 'gerente'],
    cambiar_estado: ['owner', 'admin', 'gerente', 'vendedor', 'repartidor'],
  },
  rutas: {
    ver: ['owner', 'admin', 'gerente', 'repartidor'],
    crear: ['owner', 'admin', 'gerente'],
    editar: ['owner', 'admin', 'gerente', 'repartidor'],
    eliminar: ['owner', 'admin', 'gerente'],
  },
  cobros: {
    ver: ['owner', 'admin', 'gerente', 'administrativo'],
    crear: ['owner', 'admin', 'gerente', 'vendedor', 'administrativo'],
  },
  reportes: {
    ver: ['owner', 'admin', 'gerente'],
    ver_morosidad: ['owner', 'admin', 'gerente', 'administrativo'],
    ver_vendedores: ['owner', 'admin', 'gerente'],
  },
  configuracion: {
    ver: ['owner', 'admin'],
    editar_org: ['owner', 'admin'],
    gestionar_usuarios: ['owner', 'admin'],
    listas_precios: ['owner', 'admin', 'gerente'],
  },
};

/**
 * Rutas visibles en el sidebar según rol
 */
const SIDEBAR_ROUTES = {
  owner: ['dashboard', 'pipeline', 'clientes', 'productos', 'pedidos', 'rutas', 'reportes', 'configuracion'],
  admin: ['dashboard', 'pipeline', 'clientes', 'productos', 'pedidos', 'rutas', 'reportes', 'configuracion'],
  gerente: ['dashboard', 'pipeline', 'clientes', 'productos', 'pedidos', 'rutas', 'reportes'],
  vendedor: ['dashboard', 'pipeline', 'clientes', 'productos', 'pedidos'],
  administrativo: ['dashboard', 'clientes', 'productos', 'pedidos'],
  repartidor: ['dashboard', 'pedidos', 'rutas'],
};

const Permissions = {
  /**
   * Verificar si un rol tiene permiso para una acción en un módulo
   */
  can(action, module) {
    const userRole = this.getCurrentRole();
    if (!userRole) return false;

    const modulePerms = PERMISSIONS[module];
    if (!modulePerms) return false;

    const allowedRoles = modulePerms[action];
    if (!allowedRoles) return false;

    return allowedRoles.includes(userRole);
  },

  /**
   * Obtener el rol del usuario actual
   */
  getCurrentRole() {
    return window.App?.userProfile?.rol || null;
  },

  /**
   * Verificar si el usuario tiene al menos cierto nivel de rol
   */
  hasMinRole(minRole) {
    const userRole = this.getCurrentRole();
    if (!userRole) return false;
    return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minRole] || 0);
  },

  /**
   * Obtener las rutas visibles del sidebar para el rol actual
   */
  getVisibleRoutes() {
    const userRole = this.getCurrentRole();
    return SIDEBAR_ROUTES[userRole] || ['dashboard'];
  },

  /**
   * Verificar si una ruta es visible para el usuario actual
   */
  canSeeRoute(route) {
    return this.getVisibleRoutes().includes(route);
  },

  /**
   * Verificar si el usuario es owner o admin
   */
  isAdmin() {
    return this.hasMinRole('admin');
  },

  /**
   * Verificar si el usuario es owner
   */
  isOwner() {
    return this.getCurrentRole() === 'owner';
  },
};

export default Permissions;
export { PERMISSIONS, SIDEBAR_ROUTES, ROLE_HIERARCHY };
