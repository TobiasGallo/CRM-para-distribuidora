-- ========================================
-- CRM DISTRIBUIDORA - HISTORIAL DE PRECIOS
-- Registro de cambios de precio por producto
-- Ejecutar en Supabase SQL Editor
-- ========================================

CREATE TABLE IF NOT EXISTS public.historial_precios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacion_id UUID NOT NULL REFERENCES public.organizaciones(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  precio_anterior DECIMAL(12,2) NOT NULL,
  precio_nuevo DECIMAL(12,2) NOT NULL,
  changed_by UUID REFERENCES public.usuarios(id),
  changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_historial_precios_prod ON public.historial_precios(producto_id);
CREATE INDEX IF NOT EXISTS idx_historial_precios_org ON public.historial_precios(organizacion_id);

ALTER TABLE public.historial_precios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "historial_precios_select_org" ON public.historial_precios
  FOR SELECT USING (organizacion_id = public.get_user_org_id());

CREATE POLICY "historial_precios_insert_org" ON public.historial_precios
  FOR INSERT WITH CHECK (organizacion_id = public.get_user_org_id());
