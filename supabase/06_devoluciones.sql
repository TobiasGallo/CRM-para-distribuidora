-- ========================================
-- CRM DISTRIBUIDORA - TABLA DEVOLUCIONES
-- NCR (Notas de Crédito) por devolución de productos
-- Ejecutar en Supabase SQL Editor
-- ========================================

-- 1. TABLA DEVOLUCIONES
CREATE TABLE IF NOT EXISTS public.devoluciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacion_id UUID NOT NULL REFERENCES public.organizaciones(id) ON DELETE CASCADE,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.usuarios(id),
  motivo TEXT,
  monto_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABLA LINEAS DE DEVOLUCIÓN
CREATE TABLE IF NOT EXISTS public.devoluciones_lineas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devolucion_id UUID NOT NULL REFERENCES public.devoluciones(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES public.productos(id),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_dev_org ON public.devoluciones(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_dev_pedido ON public.devoluciones(pedido_id);
CREATE INDEX IF NOT EXISTS idx_dev_cliente ON public.devoluciones(cliente_id);

-- 3. RLS
ALTER TABLE public.devoluciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devoluciones_lineas ENABLE ROW LEVEL SECURITY;

-- devoluciones: SELECT/INSERT para la org, UPDATE/DELETE para gerente+
CREATE POLICY "dev_select_org" ON public.devoluciones
  FOR SELECT USING (organizacion_id = public.get_user_org_id());

CREATE POLICY "dev_insert_org" ON public.devoluciones
  FOR INSERT WITH CHECK (organizacion_id = public.get_user_org_id());

CREATE POLICY "dev_update_org" ON public.devoluciones
  FOR UPDATE USING (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin', 'gerente')
  );

CREATE POLICY "dev_delete_org" ON public.devoluciones
  FOR DELETE USING (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin')
  );

-- devoluciones_lineas: se accede via join con devoluciones (permitir todo en org)
CREATE POLICY "dev_lineas_all" ON public.devoluciones_lineas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.devoluciones d
      WHERE d.id = devolucion_id
        AND d.organizacion_id = public.get_user_org_id()
    )
  );
