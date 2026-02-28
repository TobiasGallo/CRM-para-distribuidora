-- ========================================
-- CRM DISTRIBUIDORA - PRODUCTOS: unidad_medida + sku nullable
-- Correcciones detectadas en auditoría:
--   1. La columna unidad_medida faltaba en la tabla productos pero
--      era usada en dashboard.js, import-csv.js y productos.js.
--   2. SKU era NOT NULL, lo que hacía fallar la importación CSV
--      cuando el archivo no incluía esa columna. PostgreSQL permite
--      múltiples NULL en columnas UNIQUE, así que se puede relajar
--      la restricción sin perder la unicidad entre registros con SKU.
-- Ejecutar en Supabase SQL Editor
-- ========================================

-- 1. Agregar columna unidad_medida (si no existe)
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS unidad_medida TEXT DEFAULT 'unidades';

-- 2. Permitir SKU nulo para productos sin código externo
--    (la restricción UNIQUE(organizacion_id, sku) sigue aplicando
--     a los valores no nulos; PostgreSQL ignora los NULL en UNIQUE)
ALTER TABLE public.productos
  ALTER COLUMN sku DROP NOT NULL;
