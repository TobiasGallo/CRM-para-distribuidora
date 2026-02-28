-- ========================================
-- CRM DISTRIBUIDORA - FIX: numero_pedido secuencial por organización
-- numero_pedido era SERIAL (secuencia global), por lo que en un entorno
-- multi-tenant los pedidos de cada organización tenían números
-- discontínuos (ej: #1, #5, #12 en vez de #1, #2, #3) porque los
-- IDs eran consumidos por otras organizaciones.
-- Este script:
--   1. Elimina el DEFAULT de la secuencia global
--   2. Crea un trigger que calcula MAX(numero_pedido)+1 por org
--      antes de cada INSERT, garantizando numeración consecutiva
--      dentro de cada organización.
-- NOTA: los registros existentes no se modifican.
-- Ejecutar en Supabase SQL Editor
-- ========================================

-- 1. Quitar el DEFAULT de la secuencia global
ALTER TABLE public.pedidos
  ALTER COLUMN numero_pedido DROP DEFAULT;

-- 2. Función: calcula el siguiente número de pedido para la org
CREATE OR REPLACE FUNCTION public.set_numero_pedido_por_org()
RETURNS TRIGGER AS $$
BEGIN
  NEW.numero_pedido := (
    SELECT COALESCE(MAX(numero_pedido), 0) + 1
    FROM public.pedidos
    WHERE organizacion_id = NEW.organizacion_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger: se ejecuta ANTES de cada INSERT
DROP TRIGGER IF EXISTS trg_numero_pedido_por_org ON public.pedidos;

CREATE TRIGGER trg_numero_pedido_por_org
  BEFORE INSERT ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_numero_pedido_por_org();
