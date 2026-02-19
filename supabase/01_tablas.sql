-- ========================================
-- CRM DISTRIBUIDORA - CREACIÓN DE TABLAS
-- Arquitectura MULTI-TENANT
-- Ejecutar en Supabase SQL Editor
-- ========================================

-- ========================================
-- 0. TABLA ORGANIZACIONES (MULTI-TENANT)
-- Cada cliente que compra el CRM es una organización.
-- Todas las demás tablas referencian a esta.
-- ========================================
CREATE TABLE public.organizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identidad
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- ej: "distribuidora-lopez" (para URLs, subdominios)
  logo_url TEXT,
  favicon_url TEXT,

  -- Personalización visual
  color_primario TEXT DEFAULT '#2563eb',
  color_secundario TEXT DEFAULT '#1e40af',

  -- Datos de la empresa
  razon_social TEXT,
  cuit TEXT,
  direccion TEXT,
  telefono TEXT,
  email_contacto TEXT,
  sitio_web TEXT,

  -- Configuración
  moneda TEXT DEFAULT 'ARS',
  zona_horaria TEXT DEFAULT 'America/Argentina/Buenos_Aires',
  config JSONB DEFAULT '{}', -- configuraciones extra flexibles

  -- Plan / suscripción
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  max_usuarios INTEGER DEFAULT 5,
  activa BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1. TABLA USUARIOS (extiende auth.users de Supabase)
CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organizacion_id UUID NOT NULL REFERENCES public.organizaciones(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  rol TEXT NOT NULL CHECK (rol IN ('owner', 'admin', 'gerente', 'vendedor', 'repartidor', 'administrativo')),
  zona_asignada TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABLA LISTAS DE PRECIOS
CREATE TABLE public.listas_precios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacion_id UUID NOT NULL REFERENCES public.organizaciones(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABLA CLIENTES
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacion_id UUID NOT NULL REFERENCES public.organizaciones(id) ON DELETE CASCADE,
  nombre_establecimiento TEXT NOT NULL,
  razon_social TEXT,
  tipo_cliente TEXT NOT NULL CHECK (tipo_cliente IN ('horeca', 'supermercado', 'tienda', 'mayorista')),
  estado_lead TEXT DEFAULT 'prospecto' CHECK (estado_lead IN ('prospecto', 'negociacion', 'activo', 'en_pausa', 'inactivo')),

  -- Ubicación
  direccion_completa TEXT,
  ciudad TEXT,
  provincia TEXT,
  codigo_postal TEXT,
  ubicacion_gps TEXT,

  -- Contacto
  telefono TEXT,
  email TEXT,

  -- Logística
  dias_reparto TEXT[],
  ventana_horaria_inicio TIME,
  ventana_horaria_fin TIME,
  tiene_camara_frio BOOLEAN DEFAULT false,
  requiere_congelado BOOLEAN DEFAULT false,
  requiere_seco BOOLEAN DEFAULT false,
  observaciones_entrega TEXT,
  dia_visita_vendedor TEXT,

  -- Financiero
  lista_precios_id UUID REFERENCES public.listas_precios(id),
  linea_credito DECIMAL(12,2) DEFAULT 0,
  dias_credito INTEGER DEFAULT 0,
  saldo_pendiente DECIMAL(12,2) DEFAULT 0,
  metodo_pago_preferido TEXT CHECK (metodo_pago_preferido IN ('transferencia', 'efectivo', 'recibo_domiciliado', 'tarjeta')),

  -- Relaciones
  vendedor_asignado_id UUID REFERENCES public.usuarios(id),

  -- Métricas
  scoring INTEGER DEFAULT 0 CHECK (scoring >= 0 AND scoring <= 5),
  fecha_ultima_compra TIMESTAMPTZ,

  -- Logo/foto
  logo_url TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABLA PRODUCTOS
CREATE TABLE public.productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacion_id UUID NOT NULL REFERENCES public.organizaciones(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT NOT NULL,
  stock_actual INTEGER DEFAULT 0,
  stock_minimo INTEGER DEFAULT 0,
  fecha_vencimiento DATE,
  temperatura_almacenamiento TEXT,
  formato_presentacion TEXT,
  precio_base DECIMAL(10,2) NOT NULL,
  imagen_url TEXT,
  proveedor TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organizacion_id, sku) -- SKU único por organización, no global
);

-- 5. TABLA PRECIOS POR LISTA
CREATE TABLE public.precios_por_lista (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacion_id UUID NOT NULL REFERENCES public.organizaciones(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  lista_precios_id UUID NOT NULL REFERENCES public.listas_precios(id) ON DELETE CASCADE,
  precio DECIMAL(10,2) NOT NULL,
  UNIQUE(producto_id, lista_precios_id)
);

-- 6. TABLA PEDIDOS
CREATE TABLE public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacion_id UUID NOT NULL REFERENCES public.organizaciones(id) ON DELETE CASCADE,
  numero_pedido SERIAL,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id),
  vendedor_id UUID REFERENCES public.usuarios(id),
  repartidor_id UUID REFERENCES public.usuarios(id),
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_preparacion', 'en_ruta', 'entregado', 'cancelado', 'con_incidencia')),
  fecha_entrega_programada TIMESTAMPTZ,
  fecha_entrega_real TIMESTAMPTZ,
  total DECIMAL(12,2) DEFAULT 0,
  metodo_pago TEXT,
  observaciones TEXT,
  ruta_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. TABLA PRODUCTOS_PEDIDO (detalle del pedido)
CREATE TABLE public.productos_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacion_id UUID NOT NULL REFERENCES public.organizaciones(id) ON DELETE CASCADE,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES public.productos(id),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL
);

-- 8. TABLA RUTAS
CREATE TABLE public.rutas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacion_id UUID NOT NULL REFERENCES public.organizaciones(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  repartidor_id UUID REFERENCES public.usuarios(id),
  vehiculo TEXT,
  fecha DATE NOT NULL,
  hora_salida TIME,
  secuencia_paradas JSONB DEFAULT '[]',
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_curso', 'completada')),
  km_estimados DECIMAL(8,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- FK de pedidos -> rutas
ALTER TABLE public.pedidos
  ADD CONSTRAINT fk_pedidos_ruta FOREIGN KEY (ruta_id) REFERENCES public.rutas(id);

-- 9. TABLA INTERACCIONES (Timeline)
CREATE TABLE public.interacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacion_id UUID NOT NULL REFERENCES public.organizaciones(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.usuarios(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('llamada', 'whatsapp', 'email', 'visita', 'nota', 'incidencia')),
  duracion INTEGER,
  contenido TEXT,
  resultado TEXT,
  adjuntos_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. TABLA PIPELINE (Oportunidades)
CREATE TABLE public.pipeline_oportunidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacion_id UUID NOT NULL REFERENCES public.organizaciones(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  vendedor_id UUID REFERENCES public.usuarios(id),
  etapa TEXT DEFAULT 'contacto_inicial' CHECK (etapa IN ('contacto_inicial', 'calificacion', 'presupuesto', 'negociacion', 'primer_pedido', 'cliente_activo')),
  valor_estimado DECIMAL(12,2) DEFAULT 0,
  probabilidad_cierre INTEGER DEFAULT 0 CHECK (probabilidad_cierre >= 0 AND probabilidad_cierre <= 100),
  fecha_entrada_etapa TIMESTAMPTZ DEFAULT now(),
  proxima_accion TEXT,
  fecha_proxima_accion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. TABLA NOTIFICACIONES
CREATE TABLE public.notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacion_id UUID NOT NULL REFERENCES public.organizaciones(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensaje TEXT,
  leida BOOLEAN DEFAULT false,
  link_accion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índice de organizacion_id en TODAS las tablas (crítico para multi-tenant)
CREATE INDEX idx_usuarios_org ON public.usuarios(organizacion_id);
CREATE INDEX idx_clientes_org ON public.clientes(organizacion_id);
CREATE INDEX idx_productos_org ON public.productos(organizacion_id);
CREATE INDEX idx_pedidos_org ON public.pedidos(organizacion_id);
CREATE INDEX idx_productos_pedido_org ON public.productos_pedido(organizacion_id);
CREATE INDEX idx_rutas_org ON public.rutas(organizacion_id);
CREATE INDEX idx_interacciones_org ON public.interacciones(organizacion_id);
CREATE INDEX idx_pipeline_org ON public.pipeline_oportunidades(organizacion_id);
CREATE INDEX idx_notificaciones_org ON public.notificaciones(organizacion_id);
CREATE INDEX idx_listas_precios_org ON public.listas_precios(organizacion_id);
CREATE INDEX idx_precios_lista_org ON public.precios_por_lista(organizacion_id);

-- Índices de negocio
CREATE INDEX idx_organizaciones_slug ON public.organizaciones(slug);
CREATE INDEX idx_clientes_vendedor ON public.clientes(vendedor_asignado_id);
CREATE INDEX idx_clientes_estado ON public.clientes(estado_lead);
CREATE INDEX idx_clientes_tipo ON public.clientes(tipo_cliente);
CREATE INDEX idx_pedidos_cliente ON public.pedidos(cliente_id);
CREATE INDEX idx_pedidos_estado ON public.pedidos(estado);
CREATE INDEX idx_pedidos_vendedor ON public.pedidos(vendedor_id);
CREATE INDEX idx_pedidos_fecha ON public.pedidos(created_at);
CREATE INDEX idx_productos_categoria ON public.productos(categoria);
CREATE INDEX idx_interacciones_cliente ON public.interacciones(cliente_id);
CREATE INDEX idx_interacciones_fecha ON public.interacciones(created_at);
CREATE INDEX idx_pipeline_vendedor ON public.pipeline_oportunidades(vendedor_id);
CREATE INDEX idx_pipeline_etapa ON public.pipeline_oportunidades(etapa);
CREATE INDEX idx_notificaciones_usuario ON public.notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON public.notificaciones(leida);
CREATE INDEX idx_rutas_fecha ON public.rutas(fecha);
CREATE INDEX idx_rutas_repartidor ON public.rutas(repartidor_id);

-- ========================================
-- FUNCIÓN PARA ACTUALIZAR updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de updated_at
CREATE TRIGGER trg_organizaciones_updated BEFORE UPDATE ON public.organizaciones FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_usuarios_updated BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_productos_updated BEFORE UPDATE ON public.productos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pedidos_updated BEFORE UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_rutas_updated BEFORE UPDATE ON public.rutas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pipeline_updated BEFORE UPDATE ON public.pipeline_oportunidades FOR EACH ROW EXECUTE FUNCTION update_updated_at();
