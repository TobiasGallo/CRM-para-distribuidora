-- ========================================
-- CRM DISTRIBUIDORA - TABLA INVITACIONES
-- Sistema de invitación de usuarios por token
-- Ejecutar en Supabase SQL Editor
-- ========================================

CREATE TABLE IF NOT EXISTS public.invitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacion_id UUID NOT NULL REFERENCES public.organizaciones(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'vendedor'
    CHECK (rol IN ('admin', 'gerente', 'vendedor', 'repartidor', 'administrativo')),
  token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  usado BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  created_by UUID REFERENCES public.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitaciones_org ON public.invitaciones(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_invitaciones_token ON public.invitaciones(token);

-- RLS
ALTER TABLE public.invitaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitaciones_select_org" ON public.invitaciones
  FOR SELECT USING (organizacion_id = public.get_user_org_id());

CREATE POLICY "invitaciones_insert_org" ON public.invitaciones
  FOR INSERT WITH CHECK (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin')
  );

CREATE POLICY "invitaciones_update_org" ON public.invitaciones
  FOR UPDATE USING (organizacion_id = public.get_user_org_id());

-- Función pública (sin auth) para leer una invitación por token
-- Usada desde la pantalla de registro del invitado
CREATE OR REPLACE FUNCTION public.get_invitacion_by_token(p_token UUID)
RETURNS TABLE(
  org_id UUID,
  org_nombre TEXT,
  email TEXT,
  nombre TEXT,
  rol TEXT,
  usado BOOLEAN,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.organizacion_id,
    o.nombre,
    i.email,
    i.nombre,
    i.rol,
    i.usado,
    i.expires_at
  FROM public.invitaciones i
  JOIN public.organizaciones o ON o.id = i.organizacion_id
  WHERE i.token = p_token;
END;
$$;

-- Función para marcar invitación como usada (llamada tras signup)
CREATE OR REPLACE FUNCTION public.usar_invitacion(p_token UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.invitaciones SET usado = true WHERE token = p_token;
END;
$$;
