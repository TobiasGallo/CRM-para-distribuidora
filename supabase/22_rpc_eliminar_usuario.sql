-- ========================================
-- RPC: eliminar_usuario_completo
-- Hard delete de auth.users (CASCADE limpia public.usuarios).
-- Solo owner/admin pueden usarlo. No se puede eliminar
-- al propio usuario ni al owner de la org.
-- ========================================

CREATE OR REPLACE FUNCTION public.eliminar_usuario_completo(p_usuario_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF public.get_user_rol() NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Sin permisos para eliminar usuarios';
  END IF;

  IF p_usuario_id = auth.uid() THEN
    RAISE EXCEPTION 'No podés eliminar tu propio usuario';
  END IF;

  IF (SELECT rol FROM public.usuarios WHERE id = p_usuario_id) = 'owner' THEN
    RAISE EXCEPTION 'No se puede eliminar al propietario de la organización';
  END IF;

  DELETE FROM auth.users WHERE id = p_usuario_id;
END;
$$;
