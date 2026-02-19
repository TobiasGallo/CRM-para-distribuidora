-- ========================================
-- CRM DISTRIBUIDORA - TABLA COBROS
-- Registrar pagos de clientes contra su saldo_pendiente
-- Ejecutar en Supabase SQL Editor
-- ========================================

-- 1. TABLA COBROS
CREATE TABLE IF NOT EXISTS public.cobros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacion_id UUID NOT NULL REFERENCES public.organizaciones(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.usuarios(id),
  monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
  metodo TEXT NOT NULL DEFAULT 'efectivo'
    CHECK (metodo IN ('efectivo', 'transferencia', 'cheque', 'tarjeta', 'otro')),
  referencia TEXT,         -- nro de transferencia, cheque, etc.
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cobros_org ON public.cobros(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_cobros_cliente ON public.cobros(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cobros_fecha ON public.cobros(created_at);

-- 2. RLS
ALTER TABLE public.cobros ENABLE ROW LEVEL SECURITY;

-- SELECT: solo de la propia organización
CREATE POLICY "cobros_select_org" ON public.cobros
  FOR SELECT USING (organizacion_id = public.get_user_org_id());

-- INSERT: solo de la propia organización
CREATE POLICY "cobros_insert_org" ON public.cobros
  FOR INSERT WITH CHECK (organizacion_id = public.get_user_org_id());

-- UPDATE: solo admins/gerentes/owner
CREATE POLICY "cobros_update_org" ON public.cobros
  FOR UPDATE USING (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin', 'gerente')
  );

-- DELETE: solo admins/owner
CREATE POLICY "cobros_delete_org" ON public.cobros
  FOR DELETE USING (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin')
  );
