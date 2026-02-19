-- ========================================
-- CRM DISTRIBUIDORA - METAS DE VENDEDOR
-- Objetivo mensual por vendedor ($)
-- Ejecutar en Supabase SQL Editor
-- ========================================

CREATE TABLE IF NOT EXISTS public.metas_vendedor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacion_id UUID NOT NULL REFERENCES public.organizaciones(id) ON DELETE CASCADE,
  vendedor_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio INTEGER NOT NULL CHECK (anio >= 2024),
  meta_monto DECIMAL(14,2) NOT NULL CHECK (meta_monto >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organizacion_id, vendedor_id, mes, anio)
);

CREATE INDEX IF NOT EXISTS idx_metas_org ON public.metas_vendedor(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_metas_vendedor ON public.metas_vendedor(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_metas_periodo ON public.metas_vendedor(anio, mes);

-- RLS
ALTER TABLE public.metas_vendedor ENABLE ROW LEVEL SECURITY;

-- SELECT: todos en la org
CREATE POLICY "metas_select_org" ON public.metas_vendedor
  FOR SELECT USING (organizacion_id = public.get_user_org_id());

-- INSERT / UPDATE: solo gerente+
CREATE POLICY "metas_insert_org" ON public.metas_vendedor
  FOR INSERT WITH CHECK (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin', 'gerente')
  );

CREATE POLICY "metas_update_org" ON public.metas_vendedor
  FOR UPDATE USING (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin', 'gerente')
  );

CREATE POLICY "metas_delete_org" ON public.metas_vendedor
  FOR DELETE USING (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin', 'gerente')
  );
