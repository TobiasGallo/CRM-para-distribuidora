-- ========================================
-- CRM DISTRIBUIDORA - RPC STOCK ATÓMICO
-- Decrementa stock de todos los productos de un pedido
-- en una sola operación atómica (sin TOCTOU race condition)
-- Ejecutar en Supabase SQL Editor
-- ========================================

CREATE OR REPLACE FUNCTION public.decrementar_stock_pedido(p_pedido_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id UUID;
  v_linea  RECORD;
BEGIN
  v_org_id := public.get_user_org_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Verificar que el pedido pertenece a la organización del usuario
  IF NOT EXISTS (
    SELECT 1 FROM public.pedidos
    WHERE id = p_pedido_id AND organizacion_id = v_org_id
  ) THEN
    RAISE EXCEPTION 'Pedido no encontrado o sin acceso';
  END IF;

  -- Decrementar stock de cada producto del pedido en una sola UPDATE por producto
  -- GREATEST(0, ...) evita stock negativo
  FOR v_linea IN
    SELECT producto_id, SUM(cantidad) AS total_cantidad
    FROM public.productos_pedido
    WHERE pedido_id = p_pedido_id
    GROUP BY producto_id
  LOOP
    UPDATE public.productos
    SET stock_actual = GREATEST(0, stock_actual - v_linea.total_cantidad)
    WHERE id = v_linea.producto_id
      AND organizacion_id = v_org_id;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrementar_stock_pedido TO authenticated;
