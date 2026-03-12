-- ========================================
-- FIX: Trigger handle_new_user
-- La migración 19 rompió el flujo de invitaciones:
-- buscaba 'invite_token' en metadata pero login.js
-- siempre envió 'organizacion_id' + 'rol'.
-- Esta migración restaura la lógica correcta
-- manteniendo la sanitización de slug de la migración 19.
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id     UUID;
  v_org_nombre TEXT;
  v_base_slug  TEXT;
  v_slug       TEXT;
  v_counter    INTEGER := 0;
  v_rol        TEXT;
BEGIN
  -- 1. Si viene con organizacion_id → usuario invitado a org existente
  v_org_id := (NEW.raw_user_meta_data->>'organizacion_id')::UUID;

  IF v_org_id IS NOT NULL THEN
    v_rol := COALESCE(NEW.raw_user_meta_data->>'rol', 'vendedor');

    INSERT INTO public.usuarios (id, organizacion_id, email, nombre, rol)
    VALUES (
      NEW.id,
      v_org_id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
      v_rol
    );

    RETURN NEW;
  END IF;

  -- 2. Usuario nuevo (owner): crear su propia organización
  v_org_nombre := COALESCE(
    NEW.raw_user_meta_data->>'nombre_organizacion',
    NEW.raw_user_meta_data->>'org_nombre',
    split_part(NEW.email, '@', 1)
  );

  -- Slug sanitizado (mantiene lógica de migración 19)
  v_base_slug := public.sanitize_slug(v_org_nombre);
  IF v_base_slug = '' THEN
    v_base_slug := 'org';
  END IF;
  v_slug := v_base_slug;

  -- Garantizar slug único
  WHILE EXISTS (SELECT 1 FROM public.organizaciones WHERE slug = v_slug) LOOP
    v_counter := v_counter + 1;
    v_slug    := v_base_slug || '-' || v_counter;
  END LOOP;

  INSERT INTO public.organizaciones (nombre, slug)
  VALUES (v_org_nombre, v_slug)
  RETURNING id INTO v_org_id;

  INSERT INTO public.usuarios (id, organizacion_id, email, nombre, rol)
  VALUES (
    NEW.id,
    v_org_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', v_org_nombre),
    'owner'
  );

  -- Listas de precios por defecto
  INSERT INTO public.listas_precios (organizacion_id, nombre) VALUES
    (v_org_id, 'Tarifa A'),
    (v_org_id, 'Tarifa B'),
    (v_org_id, 'Tarifa C');

  RETURN NEW;
END;
$$;
