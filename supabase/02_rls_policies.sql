-- ========================================
-- CRM DISTRIBUIDORA - ROW LEVEL SECURITY
-- Arquitectura MULTI-TENANT
-- Ejecutar DESPUÉS de 01_tablas.sql
-- ========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.organizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rutas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listas_precios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precios_por_lista ENABLE ROW LEVEL SECURITY;

-- ========================================
-- FUNCIONES HELPER MULTI-TENANT
-- ========================================

-- Obtener la organizacion_id del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
  SELECT organizacion_id FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Obtener el rol del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_user_rol()
RETURNS TEXT AS $$
  SELECT rol FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ========================================
-- POLÍTICAS: ORGANIZACIONES
-- ========================================

-- Cada usuario solo ve su propia organización
CREATE POLICY "org_select" ON public.organizaciones
  FOR SELECT TO authenticated
  USING (id = public.get_user_org_id());

-- Solo owner puede actualizar datos de la organización
CREATE POLICY "org_update" ON public.organizaciones
  FOR UPDATE TO authenticated
  USING (id = public.get_user_org_id() AND public.get_user_rol() = 'owner');

-- ========================================
-- POLÍTICAS: USUARIOS
-- ========================================

-- Solo ver usuarios de mi organización
CREATE POLICY "usuarios_select" ON public.usuarios
  FOR SELECT TO authenticated
  USING (organizacion_id = public.get_user_org_id());

-- Solo owner/admin puede crear usuarios en su org
CREATE POLICY "usuarios_insert" ON public.usuarios
  FOR INSERT TO authenticated
  WITH CHECK (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin')
  );

-- Owner/admin puede editar usuarios de su org, cualquiera puede editar su propio perfil
CREATE POLICY "usuarios_update" ON public.usuarios
  FOR UPDATE TO authenticated
  USING (
    organizacion_id = public.get_user_org_id()
    AND (public.get_user_rol() IN ('owner', 'admin') OR id = auth.uid())
  );

-- Solo owner puede eliminar usuarios
CREATE POLICY "usuarios_delete" ON public.usuarios
  FOR DELETE TO authenticated
  USING (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() = 'owner'
  );

-- ========================================
-- POLÍTICAS: CLIENTES
-- ========================================

-- Solo ver clientes de mi organización + filtro por rol
CREATE POLICY "clientes_select" ON public.clientes
  FOR SELECT TO authenticated
  USING (
    organizacion_id = public.get_user_org_id()
    AND (
      public.get_user_rol() IN ('owner', 'admin', 'gerente', 'administrativo')
      OR vendedor_asignado_id = auth.uid()
    )
  );

CREATE POLICY "clientes_insert" ON public.clientes
  FOR INSERT TO authenticated
  WITH CHECK (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin', 'gerente', 'vendedor')
  );

CREATE POLICY "clientes_update" ON public.clientes
  FOR UPDATE TO authenticated
  USING (
    organizacion_id = public.get_user_org_id()
    AND (
      public.get_user_rol() IN ('owner', 'admin', 'gerente')
      OR vendedor_asignado_id = auth.uid()
    )
  );

CREATE POLICY "clientes_delete" ON public.clientes
  FOR DELETE TO authenticated
  USING (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin')
  );

-- ========================================
-- POLÍTICAS: PRODUCTOS
-- ========================================

CREATE POLICY "productos_select" ON public.productos
  FOR SELECT TO authenticated
  USING (organizacion_id = public.get_user_org_id());

CREATE POLICY "productos_insert" ON public.productos
  FOR INSERT TO authenticated
  WITH CHECK (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin', 'gerente')
  );

CREATE POLICY "productos_update" ON public.productos
  FOR UPDATE TO authenticated
  USING (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin', 'gerente')
  );

CREATE POLICY "productos_delete" ON public.productos
  FOR DELETE TO authenticated
  USING (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin')
  );

-- ========================================
-- POLÍTICAS: PEDIDOS
-- ========================================

CREATE POLICY "pedidos_select" ON public.pedidos
  FOR SELECT TO authenticated
  USING (
    organizacion_id = public.get_user_org_id()
    AND (
      public.get_user_rol() IN ('owner', 'admin', 'gerente', 'administrativo')
      OR vendedor_id = auth.uid()
      OR repartidor_id = auth.uid()
    )
  );

CREATE POLICY "pedidos_insert" ON public.pedidos
  FOR INSERT TO authenticated
  WITH CHECK (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin', 'gerente', 'vendedor')
  );

CREATE POLICY "pedidos_update" ON public.pedidos
  FOR UPDATE TO authenticated
  USING (
    organizacion_id = public.get_user_org_id()
    AND (
      public.get_user_rol() IN ('owner', 'admin', 'gerente', 'administrativo')
      OR vendedor_id = auth.uid()
      OR repartidor_id = auth.uid()
    )
  );

-- ========================================
-- POLÍTICAS: PRODUCTOS_PEDIDO
-- ========================================

CREATE POLICY "productos_pedido_select" ON public.productos_pedido
  FOR SELECT TO authenticated
  USING (organizacion_id = public.get_user_org_id());

CREATE POLICY "productos_pedido_insert" ON public.productos_pedido
  FOR INSERT TO authenticated
  WITH CHECK (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin', 'gerente', 'vendedor')
  );

CREATE POLICY "productos_pedido_update" ON public.productos_pedido
  FOR UPDATE TO authenticated
  USING (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin', 'gerente', 'vendedor')
  );

CREATE POLICY "productos_pedido_delete" ON public.productos_pedido
  FOR DELETE TO authenticated
  USING (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin', 'gerente')
  );

-- ========================================
-- POLÍTICAS: RUTAS
-- ========================================

CREATE POLICY "rutas_select" ON public.rutas
  FOR SELECT TO authenticated
  USING (
    organizacion_id = public.get_user_org_id()
    AND (
      public.get_user_rol() IN ('owner', 'admin', 'gerente')
      OR repartidor_id = auth.uid()
    )
  );

CREATE POLICY "rutas_insert" ON public.rutas
  FOR INSERT TO authenticated
  WITH CHECK (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin', 'gerente')
  );

CREATE POLICY "rutas_update" ON public.rutas
  FOR UPDATE TO authenticated
  USING (
    organizacion_id = public.get_user_org_id()
    AND (
      public.get_user_rol() IN ('owner', 'admin', 'gerente')
      OR repartidor_id = auth.uid()
    )
  );

CREATE POLICY "rutas_delete" ON public.rutas
  FOR DELETE TO authenticated
  USING (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin', 'gerente')
  );

-- ========================================
-- POLÍTICAS: INTERACCIONES
-- ========================================

CREATE POLICY "interacciones_select" ON public.interacciones
  FOR SELECT TO authenticated
  USING (organizacion_id = public.get_user_org_id());

CREATE POLICY "interacciones_insert" ON public.interacciones
  FOR INSERT TO authenticated
  WITH CHECK (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin', 'gerente', 'vendedor')
  );

-- ========================================
-- POLÍTICAS: PIPELINE
-- ========================================

CREATE POLICY "pipeline_select" ON public.pipeline_oportunidades
  FOR SELECT TO authenticated
  USING (
    organizacion_id = public.get_user_org_id()
    AND (
      public.get_user_rol() IN ('owner', 'admin', 'gerente')
      OR vendedor_id = auth.uid()
    )
  );

CREATE POLICY "pipeline_insert" ON public.pipeline_oportunidades
  FOR INSERT TO authenticated
  WITH CHECK (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin', 'gerente', 'vendedor')
  );

CREATE POLICY "pipeline_update" ON public.pipeline_oportunidades
  FOR UPDATE TO authenticated
  USING (
    organizacion_id = public.get_user_org_id()
    AND (
      public.get_user_rol() IN ('owner', 'admin', 'gerente')
      OR vendedor_id = auth.uid()
    )
  );

-- ========================================
-- POLÍTICAS: NOTIFICACIONES
-- ========================================

CREATE POLICY "notificaciones_select" ON public.notificaciones
  FOR SELECT TO authenticated
  USING (organizacion_id = public.get_user_org_id() AND usuario_id = auth.uid());

CREATE POLICY "notificaciones_update" ON public.notificaciones
  FOR UPDATE TO authenticated
  USING (organizacion_id = public.get_user_org_id() AND usuario_id = auth.uid());

CREATE POLICY "notificaciones_insert" ON public.notificaciones
  FOR INSERT TO authenticated
  WITH CHECK (organizacion_id = public.get_user_org_id());

-- ========================================
-- POLÍTICAS: LISTAS DE PRECIOS
-- ========================================

CREATE POLICY "listas_precios_select" ON public.listas_precios
  FOR SELECT TO authenticated
  USING (organizacion_id = public.get_user_org_id());

CREATE POLICY "listas_precios_insert" ON public.listas_precios
  FOR INSERT TO authenticated
  WITH CHECK (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin', 'gerente')
  );

CREATE POLICY "listas_precios_update" ON public.listas_precios
  FOR UPDATE TO authenticated
  USING (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin', 'gerente')
  );

-- ========================================
-- POLÍTICAS: PRECIOS POR LISTA
-- ========================================

CREATE POLICY "precios_lista_select" ON public.precios_por_lista
  FOR SELECT TO authenticated
  USING (organizacion_id = public.get_user_org_id());

CREATE POLICY "precios_lista_insert" ON public.precios_por_lista
  FOR INSERT TO authenticated
  WITH CHECK (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin', 'gerente')
  );

CREATE POLICY "precios_lista_update" ON public.precios_por_lista
  FOR UPDATE TO authenticated
  USING (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin', 'gerente')
  );
