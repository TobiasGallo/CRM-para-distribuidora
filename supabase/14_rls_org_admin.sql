-- ========================================
-- CRM DISTRIBUIDORA - FIX: RLS org_update para admin
-- La política org_update original solo permitía al rol 'owner'
-- actualizar los datos de la organización. Sin embargo, la lógica
-- de permisos del frontend (permissions.js) define editar_org para
-- ['owner', 'admin']. Con la policy anterior, un admin veía el
-- formulario de Configuración → Organización, podía editarlo y hacer
-- click en Guardar, pero el UPDATE retornaba 0 filas sin ningún error
-- visible (falla silenciosa por RLS).
-- Ejecutar en Supabase SQL Editor
-- ========================================

DROP POLICY IF EXISTS "org_update" ON public.organizaciones;

CREATE POLICY "org_update" ON public.organizaciones
  FOR UPDATE TO authenticated
  USING (
    id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin')
  );
