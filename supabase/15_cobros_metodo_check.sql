-- ========================================
-- CRM DISTRIBUIDORA - FIX: cobros.metodo agrega debito y credito
-- El CHECK constraint original de la tabla cobros solo admitía:
--   ('efectivo', 'transferencia', 'cheque', 'tarjeta', 'otro')
-- Sin embargo, el código del dashboard (metodoLabel) y el formulario
-- de cobros en clientes.js ofrecen 'debito' y 'credito' como opciones.
-- Intentar registrar un cobro con esos métodos producía un error de
-- constraint silenciado en el frontend.
-- Se mantiene 'tarjeta' por compatibilidad con datos existentes.
-- Ejecutar en Supabase SQL Editor
-- ========================================

ALTER TABLE public.cobros
  DROP CONSTRAINT IF EXISTS cobros_metodo_check;

ALTER TABLE public.cobros
  ADD CONSTRAINT cobros_metodo_check
  CHECK (metodo IN ('efectivo', 'transferencia', 'cheque', 'debito', 'credito', 'tarjeta', 'otro'));
