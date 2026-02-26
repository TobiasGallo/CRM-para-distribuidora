-- ========================================
-- CRM DISTRIBUIDORA - FIX: DELETE RLS FALTANTES
-- Políticas DELETE ausentes para pedidos y pipeline.
-- Sin estas políticas, la eliminación desde el cliente
-- falla silenciosamente por RLS aunque el rol tenga permiso.
-- Ejecutar en Supabase SQL Editor
-- ========================================

-- DELETE para pedidos: owner/admin/gerente
CREATE POLICY "pedidos_delete" ON public.pedidos
  FOR DELETE TO authenticated
  USING (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin', 'gerente')
  );

-- DELETE para pipeline_oportunidades: owner/admin/gerente
CREATE POLICY "pipeline_delete" ON public.pipeline_oportunidades
  FOR DELETE TO authenticated
  USING (
    organizacion_id = public.get_user_org_id()
    AND public.get_user_rol() IN ('owner', 'admin', 'gerente')
  );
