-- ========================================
-- CRM DISTRIBUIDORA - FIX: RLS invitaciones con TO authenticated
-- La policy invitaciones_select_org le faltaba la cláusula TO authenticated,
-- siendo inconsistente con el resto de las policies del proyecto.
-- Ejecutar en Supabase SQL Editor
-- ========================================

-- Eliminar y recrear la policy con TO authenticated
DROP POLICY IF EXISTS "invitaciones_select_org" ON public.invitaciones;

CREATE POLICY "invitaciones_select_org" ON public.invitaciones
  FOR SELECT TO authenticated
  USING (organizacion_id = public.get_user_org_id());
