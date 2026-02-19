-- ========================================
-- TRIGGER: Crear organización + perfil de usuario
-- cuando se registra un nuevo usuario en auth.
--
-- FLUJO MULTI-TENANT:
-- 1. Si el metadata incluye organizacion_id → se une a esa org (invitado)
-- 2. Si NO incluye organizacion_id → se crea una org nueva (es owner)
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
  user_rol TEXT;
  org_nombre TEXT;
  org_slug TEXT;
BEGIN
  -- Verificar si viene con organizacion_id (usuario invitado a una org existente)
  org_id := (NEW.raw_user_meta_data->>'organizacion_id')::UUID;

  IF org_id IS NOT NULL THEN
    -- Usuario invitado: se une a la organización existente
    user_rol := COALESCE(NEW.raw_user_meta_data->>'rol', 'vendedor');
  ELSE
    -- Usuario nuevo: crear su propia organización
    org_nombre := COALESCE(NEW.raw_user_meta_data->>'nombre_organizacion', 'Mi Distribuidora');
    org_slug := LOWER(REPLACE(REPLACE(org_nombre, ' ', '-'), '.', '')) || '-' || SUBSTR(gen_random_uuid()::TEXT, 1, 8);

    INSERT INTO public.organizaciones (nombre, slug)
    VALUES (org_nombre, org_slug)
    RETURNING id INTO org_id;

    user_rol := 'owner';

    -- Crear listas de precios por defecto para la nueva org
    INSERT INTO public.listas_precios (organizacion_id, nombre, descripcion) VALUES
      (org_id, 'Tarifa A', 'Clientes mayoristas - Mejor precio'),
      (org_id, 'Tarifa B', 'Clientes regulares - Precio estándar'),
      (org_id, 'Tarifa C', 'Clientes minoristas - Precio lista');
  END IF;

  -- Crear perfil del usuario
  INSERT INTO public.usuarios (id, organizacion_id, nombre, email, rol)
  VALUES (
    NEW.id,
    org_id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email),
    NEW.email,
    user_rol
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger en auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
