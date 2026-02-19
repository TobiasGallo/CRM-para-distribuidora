-- ========================================
-- CRM DISTRIBUIDORA - NOTAS INTERNAS EN CLIENTE
-- Agrega columna notas_internas a clientes
-- Ejecutar en Supabase SQL Editor
-- ========================================

-- Agregar columna (si no existe)
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS notas_internas TEXT;

-- La columna queda cubierta por las RLS existentes de clientes
-- (SELECT, INSERT, UPDATE, DELETE según rol de la organización)
