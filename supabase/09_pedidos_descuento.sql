-- ========================================
-- CRM DISTRIBUIDORA - PEDIDOS: DESCUENTO
-- Agrega campo de descuento opcional al pedido
-- Ejecutar en Supabase SQL Editor
-- ========================================

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS descuento_tipo TEXT DEFAULT 'porcentaje'
    CHECK (descuento_tipo IN ('porcentaje', 'monto')),
  ADD COLUMN IF NOT EXISTS descuento_valor DECIMAL(10,2) DEFAULT 0
    CHECK (descuento_valor >= 0),
  ADD COLUMN IF NOT EXISTS descuento_monto DECIMAL(12,2) DEFAULT 0
    CHECK (descuento_monto >= 0);

-- descuento_tipo: 'porcentaje' o 'monto'
-- descuento_valor: el número ingresado (ej: 10 para 10%, o 500 para $500)
-- descuento_monto: el monto calculado en $ que se descuenta del total bruto
