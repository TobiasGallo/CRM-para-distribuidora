-- ========================================
-- CRM DISTRIBUIDORA - COBROS: COLUMNA pedido_id
-- Vinculación opcional de un cobro a un pedido específico
-- Ejecutar en Supabase SQL Editor
-- ========================================

ALTER TABLE public.cobros
  ADD COLUMN IF NOT EXISTS pedido_id UUID REFERENCES public.pedidos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cobros_pedido ON public.cobros(pedido_id);
