-- ========================================
-- CRM DISTRIBUIDORA - FIX: Slug sanitizado con tildes y ñ
-- El trigger anterior no convertía ñ, tildes (á,é,í,ó,ú,ü),
-- generando slugs con caracteres no-ASCII en la URL.
-- Reemplaza el trigger handle_new_user del archivo 03.
-- Ejecutar en Supabase SQL Editor
-- ========================================

-- Función auxiliar de sanitización de texto para slug
CREATE OR REPLACE FUNCTION public.sanitize_slug(input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRANSLATE(
          input,
          'áàäâãåÁÀÄÂÃÅéèëêÉÈËÊíìïîÍÌÏÎóòöôõÓÒÖÔÕúùüûÚÙÜÛñÑçÇ',
          'aaaaaaaaaaaaeeeeeeeeiiiiiiiioooooooooouuuuuuuunncc'
        ),
        '[^a-z0-9\s-]', '', 'g'  -- eliminar caracteres no alfanuméricos
      ),
      '[\s]+', '-', 'g'           -- reemplazar espacios por guiones
    )
  );
$$;

-- Reemplazar el trigger function con sanitización de slug
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id    UUID;
  v_org_nombre TEXT;
  v_base_slug  TEXT;
  v_slug       TEXT;
  v_counter    INTEGER := 0;
  v_rol        TEXT;
  v_invite     RECORD;
BEGIN
  -- 1. Leer el token de invitación (si existe) desde raw_user_meta_data
  IF NEW.raw_user_meta_data->>'invite_token' IS NOT NULL THEN
    SELECT * INTO v_invite
    FROM public.invitaciones
    WHERE token = NEW.raw_user_meta_data->>'invite_token'
      AND usada = false
      AND expires_at > now()
    LIMIT 1;

    IF FOUND THEN
      -- Usuario invitado: asignar a la organización existente
      v_org_id := v_invite.organizacion_id;
      v_rol    := v_invite.rol;

      INSERT INTO public.usuarios (id, organizacion_id, email, nombre, rol)
      VALUES (
        NEW.id,
        v_org_id,
        NEW.email,
        COALESCE(v_invite.nombre, split_part(NEW.email, '@', 1)),
        v_rol
      );

      -- Marcar invitación como usada
      UPDATE public.invitaciones
      SET usada = true, used_at = now(), used_by = NEW.id
      WHERE token = v_invite.token;

      RETURN NEW;
    END IF;
  END IF;

  -- 2. Usuario nuevo (owner): crear organización propia
  v_org_nombre := COALESCE(
    NEW.raw_user_meta_data->>'org_nombre',
    split_part(NEW.email, '@', 1)
  );

  -- Generar slug sanitizado
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
  VALUES (NEW.id, v_org_id, NEW.email, v_org_nombre, 'owner');

  RETURN NEW;
END;
$$;
