-- ========================================
-- CRM DISTRIBUIDORA - RPC TRANSACCIONAL: CREAR PEDIDO
-- Crea pedido + líneas + actualiza saldo del cliente
-- en una sola transacción atómica (sin riesgo de pedidos huérfanos)
-- Ejecutar en Supabase SQL Editor
-- ========================================

CREATE OR REPLACE FUNCTION public.crear_pedido(
  p_cliente_id           UUID,
  p_vendedor_id          UUID,
  p_fecha_entrega        DATE,
  p_metodo_pago          TEXT,
  p_observaciones        TEXT,
  p_total                DECIMAL,
  p_descuento_tipo       TEXT,
  p_descuento_valor      DECIMAL,
  p_descuento_monto      DECIMAL,
  p_lineas               JSONB  -- array de {producto_id, cantidad, precio_unitario, subtotal}
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id        UUID;
  v_pedido_id     UUID;
  v_numero_pedido INTEGER;
  v_linea         JSONB;
BEGIN
  v_org_id := public.get_user_org_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- 1. INSERT pedido
  INSERT INTO public.pedidos (
    organizacion_id,
    cliente_id,
    vendedor_id,
    fecha_entrega_programada,
    metodo_pago,
    observaciones,
    total,
    descuento_tipo,
    descuento_valor,
    descuento_monto,
    estado
  ) VALUES (
    v_org_id,
    p_cliente_id,
    p_vendedor_id,
    p_fecha_entrega,
    p_metodo_pago,
    p_observaciones,
    p_total,
    p_descuento_tipo,
    p_descuento_valor,
    p_descuento_monto,
    'pendiente'
  )
  RETURNING id, numero_pedido INTO v_pedido_id, v_numero_pedido;

  -- 2. INSERT líneas de producto
  FOR v_linea IN SELECT value FROM jsonb_array_elements(p_lineas)
  LOOP
    INSERT INTO public.productos_pedido (
      organizacion_id,
      pedido_id,
      producto_id,
      cantidad,
      precio_unitario,
      subtotal
    ) VALUES (
      v_org_id,
      v_pedido_id,
      (v_linea->>'producto_id')::UUID,
      (v_linea->>'cantidad')::INTEGER,
      (v_linea->>'precio_unitario')::DECIMAL,
      (v_linea->>'subtotal')::DECIMAL
    );
  END LOOP;

  -- 3. Actualizar saldo_pendiente del cliente (atómico, sin TOCTOU)
  IF p_cliente_id IS NOT NULL AND p_total > 0 THEN
    UPDATE public.clientes
    SET saldo_pendiente = saldo_pendiente + p_total
    WHERE id = p_cliente_id
      AND organizacion_id = v_org_id;
  END IF;

  RETURN jsonb_build_object(
    'id',            v_pedido_id,
    'numero_pedido', v_numero_pedido
  );
END;
$$;

-- Permiso para usuarios autenticados
GRANT EXECUTE ON FUNCTION public.crear_pedido TO authenticated;
