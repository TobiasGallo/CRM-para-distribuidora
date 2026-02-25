# CRM PARA DISTRIBUIDORA DE ALIMENTOS - ESPECIFICACIONES COMPLETAS

## 📋 RESUMEN EJECUTIVO

Sistema CRM diseñado específicamente para una distribuidora de alimentos que necesita gestionar ventas, logística de entregas, control financiero y comunicación multicanal con clientes del sector HORECA (hoteles, restaurantes, cafeterías), supermercados y tiendas minoristas.

---

## 🎯 MÓDULOS PRINCIPALES

### 1. MÓDULO DE COMUNICACIÓN (CORAZÓN DEL SISTEMA)

#### 1.1 Integración de WhatsApp
**Funcionalidades:**
- Envío de mensajes desde la ficha del cliente usando plantillas pre-aprobadas
- Historial completo de chats guardado en el CRM
- Persistencia de conversaciones al cambiar de vendedor
- Mensaje automático de bienvenida para nuevos leads:
  ```
  ¡Hola! Gracias por contactar con [Distribuidora]. 👋
  Queremos darte la mejor atención. Por favor, déjanos estos datos:
  📍 Nombre del Negocio:
  📍 Ciudad / Localidad:
  📦 ¿Qué productos te interesan más?
  ```
- Distribución automática de consultas a diferentes vendedores

#### 1.2 Telefonía Integrada (Click-to-Call)
**Funcionalidades:**
- Al pulsar el número del cliente, se lanza la llamada
- Registro automático de duración de llamadas
- Ventana emergente al finalizar para anotar resultado:
  - "No contestó"
  - "Llamar mañana"
  - "Pedido realizado"
  - Notas personalizadas

#### 1.3 Email Tracking
**Funcionalidades:**
- Notificación en tiempo real cuando un cliente abre un presupuesto
- Tracking de clics en enlaces enviados
- Historial completo de emails en la ficha del cliente

---

### 2. GESTIÓN VISUAL DE OPORTUNIDADES (PIPELINE KANBAN)

#### 2.1 Tablero de Embudo de Ventas
**Etapas del Embudo:**
1. Contacto Inicial
2. Calificación
3. Presupuesto Enviado
4. Negociación
5. Primer Pedido
6. Cliente Activo

**Funcionalidades del Pipeline:**
- **Tarjetas de Tracción:** Cada negocio es una tarjeta arrastrable
- **Sistema de Alertas:** Tarjetas que llevan mucho tiempo sin moverse se resaltan o cambian de color
- **Campos Obligatorios por Etapa:** 
  - Para pasar de "Presupuesto" a "Cierre" → Obligatorio subir documento firmado
  - Para pasar a "Negociación" → Obligatorio registrar método de pago
- **Cálculo de Probabilidad:** 
  - Valor del pedido × Probabilidad de cierre = Pronóstico de Ventas
  - Ejemplo: $10,000 × 60% = $6,000 proyectado

#### 2.2 Visualización
- Tablero tipo Trello/Kanban
- Drag & drop entre etapas
- Contador de días en cada etapa
- Valor total por columna

---

### 3. AUTOMATIZACIÓN DE FLUJOS (WORKFLOWS)

#### 3.1 Reglas de Asignación Automática
**Criterios de Asignación:**
- Por código postal → vendedor de zona específica
- Por tipo de producto → especialista en categoría
- Por provincia → equipo de ventas nacionales vs. locales
- Por tamaño de cuenta → vendedor junior vs. senior

**Algoritmo de Asignación:**
```
SI Ciudad coincide con ruta propia 
  → Asignar a vendedor de calle de esa zona
SI Ciudad es de otra provincia 
  → Asignar a equipo Inside Sales
SI Producto es específico 
  → Asignar a especialista en categoría
```

#### 3.2 Seguimientos Automáticos
**Triggers Configurables:**
- Si presupuesto no se acepta en 48 horas → WhatsApp/Email automático
- Si cliente no compra en X días → Recordatorio al vendedor
- Si pedido pendiente > 3 días → Alerta a supervisor
- Recordatorio de próxima visita programada

#### 3.3 Sistema de Tareas Encadenadas
- Al cerrar una tarea → Obligatorio programar siguiente acción
- Nunca un cliente se queda sin acción pendiente
- Timeline de próximas acciones por vendedor

#### 3.4 Notificaciones Push
**Al vendedor:**
```
🔔 Nuevo Lead Asignado: 
[Nombre del Negocio] en [Ciudad]
Le interesan [Productos]
Toca aquí para ver WhatsApp y llamar
```

---

### 4. FICHA COMPLETA DEL CLIENTE

#### 4.1 Cabecera de Identidad
**Datos Principales:**
- Nombre del establecimiento
- Logo/foto del negocio
- Tipo de cliente (Segmentación):
  - HORECA (Hotel/Restaurante/Cafetería)
  - Supermercado
  - Tienda Minorista
  - Mayorista
- Razón social
- Estado del Lead:
  - Prospecto
  - Negociación
  - Cliente Activo
  - En Pausa
  - Inactivo

**Botones de Acción Rápida:**
- 🟢 WhatsApp → Abrir chat con plantilla de pedido
- 📞 Llamar → Registro automático
- 📧 Email → Enviar presupuesto
- 📍 Cómo llegar → Google Maps con ruta de reparto
- 🔄 Repetir último pedido

#### 4.2 Perfil Logístico (Exclusivo Distribución)
**Configuración de Entregas:**
- **Días de reparto asignados:** Ej: Lunes y Jueves
- **Ventana horaria de recepción:** 08:00 - 11:00 AM
- **Requerimientos de temperatura:**
  - ¿Tiene cámara de frío?
  - ¿Requiere producto congelado?
  - ¿Requiere producto seco?
- **Coordenadas GPS exactas:** Punto de descarga
- **Ubicación GPS completa**
- **Día de visita del vendedor**
- **Lista de precios asignada:** Tarifa A/B/C según volumen
- **Observaciones de entrega:**
  - "Entrar por callejón trasero"
  - "Preguntar por el Chef Luis"
  - "No reciben después de las 10 AM"
  - "Revisar mercancía en el momento"

#### 4.3 Control Financiero y Crédito
**Sistema de Semáforo:**
- 🟢 **Verde:** Cliente al día, puede comprar sin límites
- 🟡 **Amarillo:** Factura vencida < 7 días, advertencia
- 🔴 **Rojo:** Morosidad > 7 días, bloqueo automático de nuevos pedidos

**Datos Financieros:**
- **Línea de crédito:** Límite máximo de deuda
- **Saldo pendiente actual:** Cuánto debe hoy
- **Días de crédito:** 15/30/45/60 días
- **Método de pago preferido:**
  - Transferencia bancaria
  - Efectivo al recibir
  - Recibo domiciliado
  - Tarjeta de crédito
- **Historial de pagos:** Puntualidad, retrasos promedio
- **Alertas de vencimiento:**
  - ⚠️ Vencimiento de Deuda: $450.00 (7 días de retraso)

#### 4.4 Inteligencia de Ventas
**Análisis Predictivo:**
- **Último pedido:** Fecha y productos con botón "Repetir Pedido"
- **Productos frecuentes:** Top 5 productos que siempre compra
- **Frecuencia de compra:** Cada cuántos días compra
- **Ticket promedio:** Valor medio de sus pedidos
- **Estacionalidad:** Productos que compra por temporada
- **Sugerencias de IA/Venta Cruzada:**
  - "Este cliente compra hamburguesas pero no pan → Ofrecerlo hoy"
  - "Hace 15 días que no compra aceite → Recordarle"
  - "Compra más en verano → Preparar stock de bebidas"
- **Próxima visita programada:** Fecha y recordatorio automático
- **Última compra:** Desglose completo
  - Ejemplo: 50kg Pollo, 20L Aceite, 10 Cajas Leche

#### 4.5 Historial de Interacciones (Timeline)
**Registro Cronológico de TODO:**
- Llamadas realizadas (fecha, duración, resultado)
- Mensajes de WhatsApp (conversación completa)
- Emails enviados y abiertos
- Pedidos realizados
- Incidencias reportadas
- Cambios de estado
- Visitas del vendedor
- Notas del vendedor

**Ejemplo de Timeline:**
```
15/Oct - 10:00: Llamada realizada. 
Cliente pide presupuesto de nueva línea de lácteos.

12/Oct - 09:30: Incidencia reportada. 
2 cajas de tomate llegaron golpeadas. 
(Solucionado con abono de $25)

10/Oct - 14:20: Pedido entregado. 
Conforme. Firmado por Chef Luis.

08/Oct - 08:15: WhatsApp enviado. 
Confirmación de pedido para el 10/Oct.
```

---

### 5. GESTIÓN DE PRODUCTOS

#### 5.1 Catálogo de Productos
**Información por Producto:**
- SKU (Código único)
- Nombre comercial
- Descripción
- Categoría (Conservas, Lácteos, Snacks, Legumbres, etc.)
- Stock actual
- Stock mínimo (alerta de reposición)
- Fecha de vencimiento
- Temperatura de almacenamiento
- Formato/Presentación (Caja/Kg)
- Precio base
- Precios por lista (A/B/C)
- Imagen del producto
- Proveedor

#### 5.2 Gestión de Inventario
- Control de stock en tiempo real
- Alertas de productos por vencer
- Alertas de stock bajo
- Historial de movimientos

---

### 6. GESTIÓN DE PEDIDOS

#### 6.1 Creación de Pedidos
**Proceso:**
1. Seleccionar cliente
2. Agregar productos del catálogo
3. Aplicar lista de precios del cliente
4. Calcular total automático
5. Seleccionar método de pago
6. Asignar a vendedor
7. Programar fecha de entrega
8. Generar PDF del pedido

#### 6.2 Estados del Pedido
1. **Pendiente:** Recién creado, esperando procesamiento
2. **En Preparación:** Siendo armado en almacén
3. **En Ruta:** En el camión de reparto
4. **Entregado:** Recibido por el cliente
5. **Cancelado:** Pedido anulado
6. **Con Incidencia:** Problema reportado

#### 6.3 Información del Pedido
- Cliente
- Vendedor asignado
- Repartidor asignado
- Estado actual
- Fecha de creación
- Fecha de entrega programada
- Fecha de entrega real
- Lista de productos (cantidad, precio, subtotal)
- Total del pedido
- Método de pago
- Observaciones especiales
- Ruta asignada

---

### 7. GESTIÓN DE RUTAS Y REPARTIDORES

#### 7.1 Planificación de Rutas
**Datos de Ruta:**
- Nombre de ruta: "Norte - Camión 03"
- Repartidor asignado
- Vehículo (camión/camioneta)
- Fecha y horario de salida
- Secuencia de paradas (optimizada por GPS)
- Lista de pedidos a entregar
- Tiempo estimado total
- Kilometraje estimado

#### 7.2 Tracking en Tiempo Real
- Ubicación GPS del repartidor
- Paradas completadas
- Paradas pendientes
- Tiempo estimado de llegada a próxima parada
- Actualizaciones de estado:
  - "Salió del almacén - 08:00"
  - "Entregó en Hotel Central - 08:45"
  - "En camino a Restaurante El Fogón"

#### 7.3 App Móvil para Repartidores
**Funcionalidades:**
- Ver lista de entregas del día
- Navegar a cada cliente (Google Maps)
- Marcar pedido como "Entregado"
- Capturar firma digital del cliente
- Tomar foto de la entrega
- Reportar incidencias (producto dañado, cliente ausente)
- Comunicación con central

---

### 8. REPORTES Y ANALYTICS

#### 8.1 Dashboard Gerencial
**Métricas en Tiempo Real:**
- Ventas del día/semana/mes
- Pedidos pendientes vs. entregados
- Morosidad total
- Top 10 clientes por facturación
- Top 10 productos más vendidos
- Productos con bajo stock
- Productos próximos a vencer
- Performance por vendedor
- Tasa de conversión del pipeline
- Valor promedio del ticket

#### 8.2 Reportes Específicos
- **Reporte de Ventas por Vendedor**
- **Reporte de Entregas por Ruta**
- **Reporte de Morosidad**
- **Reporte de Productos Más Vendidos**
- **Reporte de Clientes Inactivos**
- **Reporte de Incidencias**
- **Pronóstico de Ventas** (basado en pipeline)

---

### 9. GESTIÓN DE USUARIOS Y ROLES

#### 9.1 Tipos de Usuario
1. **Administrador:**
   - Acceso completo al sistema
   - Configuración de parámetros
   - Gestión de usuarios
   - Todos los reportes

2. **Gerente de Ventas:**
   - Ver todos los clientes y vendedores
   - Asignar leads
   - Reportes completos
   - No puede cambiar configuración

3. **Vendedor:**
   - Ver solo sus clientes asignados
   - Crear/editar pedidos
   - Actualizar estados del pipeline
   - Registrar interacciones
   - No ve datos financieros de la empresa

4. **Repartidor:**
   - Ver solo sus rutas del día
   - Actualizar estado de entregas
   - Reportar incidencias
   - No ve precios

5. **Administrativo/Facturación:**
   - Ver todos los clientes
   - Gestión de pagos y créditos
   - Bloqueo/desbloqueo de clientes
   - Reportes financieros

---

### 10. SISTEMA DE CALIFICACIÓN Y ALERTAS

#### 10.1 Scoring de Clientes
**Calificación Automática (1-5 estrellas):**
- Volumen de compras
- Frecuencia de pedidos
- Puntualidad en pagos
- Años como cliente
- Sin incidencias

#### 10.2 Alertas Inteligentes
**Al Vendedor:**
- 🔴 Cliente hace 30 días sin comprar
- ⚠️ Cliente con deuda próxima a vencer
- 🟢 Oportunidad de venta cruzada
- 📞 Recordatorio de llamada programada

**Al Gerente:**
- 📊 Meta mensual en riesgo
- 💰 Morosidad superó 10%
- 📉 Ventas por debajo del promedio
- 🚚 Ruta retrasada

**Al Almacén:**
- 📦 Stock crítico de producto
- ⏰ Productos próximos a vencer
- 📋 Pedidos listos para despacho

---

## 📊 ESTRUCTURA DE BASE DE DATOS SUGERIDA

### Tablas Principales:

#### 1. **Clientes**
```
- id (PK)
- nombre_establecimiento
- razon_social
- tipo_cliente (HORECA/Supermercado/Tienda)
- estado_lead (Prospecto/Activo/Inactivo)
- ubicacion_gps
- direccion_completa
- ciudad
- provincia
- codigo_postal
- telefono
- email
- dias_reparto []
- ventana_horaria_inicio
- ventana_horaria_fin
- tiene_camara_frio (boolean)
- requiere_congelado (boolean)
- observaciones_entrega
- lista_precios_id (FK)
- linea_credito
- dias_credito
- saldo_pendiente
- metodo_pago_preferido
- vendedor_asignado_id (FK)
- fecha_creacion
- fecha_ultima_compra
- scoring (1-5)
```

#### 2. **Productos**
```
- id (PK)
- sku
- nombre
- descripcion
- categoria
- stock_actual
- stock_minimo
- fecha_vencimiento
- temperatura_almacenamiento
- formato_presentacion
- precio_base
- imagen_url
- proveedor_id (FK)
- activo (boolean)
```

#### 3. **Pedidos**
```
- id (PK)
- cliente_id (FK)
- vendedor_id (FK)
- repartidor_id (FK)
- estado (Pendiente/En preparación/En ruta/Entregado/Cancelado)
- fecha_creacion
- fecha_entrega_programada
- fecha_entrega_real
- total
- metodo_pago
- observaciones
- ruta_id (FK)
```

#### 4. **Productos_Pedido** (relación muchos a muchos)
```
- id (PK)
- pedido_id (FK)
- producto_id (FK)
- cantidad
- precio_unitario
- subtotal
```

#### 5. **Rutas**
```
- id (PK)
- nombre
- repartidor_id (FK)
- vehiculo
- fecha
- hora_salida
- secuencia_paradas []
- estado (Pendiente/En curso/Completada)
- km_estimados
```

#### 6. **Interacciones** (Timeline)
```
- id (PK)
- cliente_id (FK)
- usuario_id (FK)
- tipo (llamada/whatsapp/email/visita/nota/incidencia)
- fecha_hora
- duracion (para llamadas)
- contenido (texto de la interacción)
- resultado
- adjuntos_urls []
```

#### 7. **Usuarios**
```
- id (PK)
- nombre
- email
- password (hash)
- rol (Admin/Gerente/Vendedor/Repartidor/Administrativo)
- zona_asignada
- telefono
- activo (boolean)
```

#### 8. **Pipeline_Oportunidades**
```
- id (PK)
- cliente_id (FK)
- etapa (Contacto/Calificación/Presupuesto/Negociación/Cierre)
- valor_estimado
- probabilidad_cierre (%)
- fecha_entrada_etapa
- dias_en_etapa
- vendedor_id (FK)
- proxima_accion
- fecha_proxima_accion
```

#### 9. **Listas_Precios**
```
- id (PK)
- nombre (Tarifa A/B/C)
- descripcion
```

#### 10. **Precios_Por_Lista** (relación muchos a muchos)
```
- id (PK)
- producto_id (FK)
- lista_precios_id (FK)
- precio
```

#### 11. **Automatizaciones**
```
- id (PK)
- nombre
- trigger_tipo
- trigger_condicion
- accion_tipo
- accion_detalles (JSON)
- activa (boolean)
```

#### 12. **Notificaciones**
```
- id (PK)
- usuario_id (FK)
- tipo
- titulo
- mensaje
- fecha_hora
- leida (boolean)
- link_accion
```

---

## 💻 ANÁLISIS DE VIABILIDAD TÉCNICA

### ¿Es Posible con HTML, CSS, JavaScript y Supabase?

**RESPUESTA: SÍ, ES COMPLETAMENTE VIABLE** ✅

Sin embargo, necesitarás complementar con algunas tecnologías adicionales para funcionalidades específicas:

---

### STACK TECNOLÓGICO RECOMENDADO

#### ✅ **BACKEND: Supabase** (Perfecto para este proyecto)
**Características que cubre:**
- **Base de datos PostgreSQL:** Todas las tablas descritas
- **Autenticación:** Sistema de usuarios con roles
- **Row Level Security (RLS):** Control de permisos por rol
- **Storage:** Almacenamiento de imágenes de productos y documentos
- **Realtime:** Actualizaciones en tiempo real del pipeline
- **Edge Functions:** Para lógica compleja del servidor
- **API REST automática:** CRUD completo sin código extra

**Funcionalidades de Supabase que usarías:**
```sql
-- Ejemplo de política RLS para vendedores
CREATE POLICY "Vendedores solo ven sus clientes"
ON clientes FOR SELECT
USING (auth.uid() = vendedor_asignado_id);

-- Trigger para alertas automáticas
CREATE TRIGGER alerta_stock_bajo
AFTER UPDATE ON productos
FOR EACH ROW
WHEN (NEW.stock_actual < NEW.stock_minimo)
EXECUTE FUNCTION enviar_alerta_stock();
```

#### ✅ **FRONTEND: Framework JavaScript Moderno**
**Opciones recomendadas (elige una):**

1. **React + Vite** (Recomendado)
   - Componentes reutilizables
   - Ecosystem maduro
   - Librerías para todo (drag & drop, charts, etc.)

2. **Vue.js** (Alternativa excelente)
   - Más simple que React
   - Curva de aprendizaje suave

3. **Angular** (Tu caso actual)
   - Ya tienes conocimiento
   - Robusto para aplicaciones enterprise
   - TypeScript nativo

**Librerías UI recomendadas:**
- **Para Pipeline Kanban:** `react-beautiful-dnd` o `@dnd-kit/core`
- **Para Charts:** `Chart.js` o `Recharts`
- **Para Tablas:** `TanStack Table` (react-table)
- **Para UI Components:** `Material-UI`, `Ant Design`, o `Shadcn/ui`
- **Para Mapas:** `Leaflet` o `Google Maps API`

---

### 🔌 INTEGRACIONES DE TERCEROS NECESARIAS

#### 1. **WhatsApp Business API** ⚠️ (CRÍTICO)
**Opciones:**
- **Twilio:** Proveedor principal de WhatsApp API
  - Costo: ~$0.005 por mensaje
  - Requiere WhatsApp Business Account aprobado
  - Documentación excelente
  
- **Meta WhatsApp Cloud API:** Directo desde Meta
  - Más barato pero más complejo de configurar
  - Requiere Facebook Business Manager

**Implementación:**
```javascript
// Ejemplo con Twilio
const sendWhatsApp = async (to, message) => {
  await fetch('https://api.twilio.com/2010-04-01/Accounts/ACCOUNT_SID/Messages.json', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`)}`
    },
    body: new URLSearchParams({
      From: 'whatsapp:+14155238886',
      To: `whatsapp:${to}`,
      Body: message
    })
  });
};
```

#### 2. **Telefonía (Click-to-Call)** ⚠️
**Opciones:**
- **Twilio Voice:** Mismo proveedor de WhatsApp
  - ~$0.013/minuto
  - SDK de JavaScript para llamadas browser-to-phone
  - Grabación de llamadas incluida

- **Alternativas:** Vonage, Plivo, Bandwidth

**Implementación:**
```javascript
// Twilio Client para llamadas desde navegador
import { Device } from '@twilio/voice-sdk';

const device = new Device(twilioToken);
device.on('ready', () => {
  // Listo para llamar
});

// Hacer llamada
device.connect({ 
  To: '+5492236123456',
  ClientId: 'vendedor-juan'
});
```

#### 3. **Email con Tracking** ✅
**Opciones:**
- **SendGrid:** Excelente para transaccional + tracking
  - API simple
  - Tracking de aperturas y clics incluido
  - 100 emails/día gratis

- **Alternativas:** Mailgun, Amazon SES

**Implementación:**
```javascript
// SendGrid con tracking
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'cliente@restaurante.com',
  from: 'ventas@distribuidora.com',
  subject: 'Presupuesto #1234',
  html: '<strong>Tu presupuesto...</strong>',
  trackingSettings: {
    clickTracking: { enable: true },
    openTracking: { enable: true }
  }
};

await sgMail.send(msg);
```

#### 4. **Geolocalización y Mapas** ✅
**Opciones:**
- **Google Maps Platform:**
  - Geocoding API: Convertir direcciones a coordenadas
  - Directions API: Calcular rutas optimizadas
  - Maps JavaScript API: Mostrar mapas interactivos
  - $200 crédito mensual gratis

- **Alternativa:** Mapbox (más económico, muy bueno)

**Implementación:**
```javascript
// Calcular ruta optimizada
const calculateRoute = async (waypoints) => {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?
     origin=${waypoints[0]}&
     destination=${waypoints[waypoints.length - 1]}&
     waypoints=optimize:true|${waypoints.slice(1, -1).join('|')}&
     key=${GOOGLE_MAPS_API_KEY}`
  );
  return response.json();
};
```

#### 5. **Notificaciones Push** ✅
**Opciones:**
- **Firebase Cloud Messaging (FCM):** Gratis
- **OneSignal:** Gratis hasta 10k usuarios
- **Pusher Beams:** Buena integración

#### 6. **Generación de PDFs** ✅
**Opciones:**
- **jsPDF:** Cliente-side, simple
- **Puppeteer:** Servidor-side, más potente
- **PDFKit:** Node.js, muy completo

```javascript
// Generar PDF de pedido
import jsPDF from 'jspdf';

const generatePedidoPDF = (pedido) => {
  const doc = new jsPDF();
  doc.text(`Pedido #${pedido.id}`, 10, 10);
  doc.text(`Cliente: ${pedido.cliente.nombre}`, 10, 20);
  // ... más contenido
  doc.save(`pedido_${pedido.id}.pdf`);
};
```

---

### 🏗️ ARQUITECTURA RECOMENDADA

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (SPA)                       │
│  React/Angular/Vue + TailwindCSS + Material UI          │
│                                                          │
│  Módulos:                                               │
│  ├── Dashboard / Analytics                              │
│  ├── Pipeline Kanban                                    │
│  ├── Gestión de Clientes                               │
│  ├── Gestión de Pedidos                                │
│  ├── Gestión de Productos                              │
│  ├── Rutas y Logística                                 │
│  └── Configuración y Usuarios                          │
└─────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────┐
│                 SUPABASE (BaaS)                         │
│                                                          │
│  ├── PostgreSQL Database                                │
│  ├── Authentication (JWT)                               │
│  ├── Row Level Security                                 │
│  ├── Storage (Imágenes/Docs)                           │
│  ├── Realtime Subscriptions                            │
│  └── Edge Functions                                     │
└─────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ↓                       ↓
    ┌───────────────────┐   ┌──────────────────┐
    │  INTEGRACIONES    │   │  SERVICIOS CLOUD │
    │                   │   │                  │
    │ • Twilio          │   │ • Google Maps    │
    │   (WhatsApp/Tel)  │   │ • SendGrid       │
    │ • Firebase (Push) │   │ • Cloudinary     │
    └───────────────────┘   └──────────────────┘
```

---

### 📱 CONSIDERACIONES MOBILE

Para que los repartidores y vendedores usen el sistema en campo:

#### Opción 1: **Progressive Web App (PWA)** ✅ Recomendado
- Misma base de código
- Instalable en iOS/Android
- Funciona offline (con Service Workers)
- Acceso a GPS, cámara, notificaciones
- Más económico

#### Opción 2: **App Nativa**
- React Native / Flutter
- Mejor performance
- Más costoso de desarrollar y mantener

---

### 💰 COSTOS MENSUALES ESTIMADOS

#### **Infraestructura Base:**
- Supabase Pro: $25/mes (incluye auth + DB + storage + realtime)
- Vercel/Netlify (hosting): Gratis tier suficiente al inicio
- **Total base: ~$25/mes**

#### **Integraciones (variable según uso):**
- WhatsApp (Twilio): ~$50-200/mes (500-2000 mensajes)
- Llamadas (Twilio): ~$30-100/mes (200-700 minutos)
- Google Maps: Gratis hasta $200 crédito/mes
- SendGrid: Gratis hasta 100 emails/día
- **Total integraciones: ~$80-300/mes según volumen**

#### **TOTAL ESTIMADO: $105-325/mes**
(Muy económico comparado con CRMs comerciales que cuestan $50-150/usuario/mes)

---

### ⚡ FUNCIONALIDADES AVANZADAS

#### 1. **Inteligencia Artificial (Opcional)**
Si quieres las sugerencias predictivas tipo "Este cliente compra X pero no Y":

**Opciones:**
- **OpenAI API:** Para análisis de patrones y sugerencias
- **TensorFlow.js:** Modelos de ML en el navegador
- **Supabase + pgvector:** Base de datos vectorial para embeddings

```javascript
// Ejemplo: Sugerencia de venta cruzada con OpenAI
const getSuggestion = async (clienteHistory) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: "Eres un analista de ventas. Sugiere productos complementarios."
    }, {
      role: "user",
      content: `Historial: ${JSON.stringify(clienteHistory)}`
    }]
  });
  return response.choices[0].message.content;
};
```

#### 2. **Reconocimiento de Voz**
Para que vendedores dicten notas:
- **Web Speech API:** Nativo del navegador (gratis)
- **Google Speech-to-Text:** Más preciso

#### 3. **Firma Digital**
Para que repartidores capturen firma del cliente:
- **signature_pad:** Librería JS gratuita
- Canvas HTML5

---

### 🎯 ROADMAP DE DESARROLLO SUGERIDO

#### **Fase 1: MVP (2-3 meses)**
- Sistema de autenticación y roles
- CRUD de clientes con ficha básica
- CRUD de productos
- CRUD de pedidos simple
- Pipeline Kanban básico
- Dashboard con métricas principales

#### **Fase 2: Logística (1-2 meses)**
- Gestión de rutas
- Asignación de repartidores
- Tracking GPS básico
- App móvil PWA para repartidores

#### **Fase 3: Comunicación (2-3 meses)**
- Integración WhatsApp
- Integración telefonía
- Email tracking
- Timeline de interacciones completo

#### **Fase 4: Automatización (1-2 meses)**
- Workflows automáticos
- Reglas de asignación
- Alertas inteligentes
- Sistema de notificaciones completo

#### **Fase 5: Inteligencia (1-2 meses)**
- Sugerencias de IA
- Análisis predictivo
- Reportes avanzados
- Optimización de rutas con IA

**TIEMPO TOTAL ESTIMADO: 7-12 meses para versión completa**

---

### ✅ CONCLUSIÓN

**¿Es viable con HTML, CSS, JavaScript y Supabase?**

**SÍ, TOTALMENTE VIABLE** con las siguientes consideraciones:

#### **Stack Final Recomendado:**
```
FRONTEND: React + TypeScript + Vite
          TailwindCSS + shadcn/ui
          
BACKEND:  Supabase (PostgreSQL + Auth + Storage + Realtime)
          
COMUNICACIÓN: 
          • Twilio (WhatsApp + Telefonía)
          • SendGrid (Email)
          
MAPAS:    Google Maps Platform o Mapbox

EXTRAS:   
          • jsPDF (Generación PDFs)
          • Chart.js (Gráficos)
          • @dnd-kit/core (Drag & drop)
          • Firebase Cloud Messaging (Push notifications)
```

#### **Ventajas de este Stack:**
✅ Económico (~$100-300/mes vs $5000/mes de CRMs comerciales)
✅ Escalable (Supabase crece contigo)
✅ Moderno (React + Supabase = stack 2025)
✅ Mantenible (Todo en JavaScript/TypeScript)
✅ Realtime (Actualizaciones instantáneas)
✅ Seguro (RLS de PostgreSQL)

#### **Desafíos Principales:**
⚠️ Integración WhatsApp requiere cuenta Business aprobada
⚠️ Sistema de rutas con IA es complejo
⚠️ Testing exhaustivo necesario
⚠️ Curva de aprendizaje de Supabase RLS

**VEREDICTO FINAL: Proyecto 100% realizable con las tecnologías propuestas.**

El único componente que NO podrías hacer con solo HTML/CSS/JS vanilla es el backend, pero Supabase lo resuelve perfectamente sin necesidad de crear un servidor tradicional.


Stack Tecnológico Recomendado
Dado que querés usar HTML, CSS y JavaScript (sin frameworks) + Supabase, te recomiendo:

Capa	Tecnología	Por qué
Base de datos	Supabase (PostgreSQL)	Auth, RLS, Realtime, Storage, API REST automática - todo incluido
Frontend	HTML + CSS + JavaScript vanilla	Sin complejidad de frameworks, control total
Estilos	CSS puro + variables CSS	Temas, responsividad, sin dependencias
Drag & Drop	SortableJS	Librería liviana, sin dependencias, perfecta para el Kanban
Gráficos	Chart.js	Simple, buena documentación, funciona con JS vanilla
PDFs	jsPDF	Genera PDFs desde el navegador
Mapas	Leaflet (gratis) o Google Maps	Para rutas y GPS de repartidores
Hosting	Netlify o Vercel	Gratis para sitios estáticos
Para las integraciones externas (más adelante):

WhatsApp/Telefonía: Twilio (vía Supabase Edge Functions)
Email tracking: SendGrid
Notificaciones Push: Firebase Cloud Messaging
Paso a paso para desarrollar

FASE 1 - Base y Autenticación
Crear proyecto en Supabase
Diseñar la estructura de carpetas del proyecto
Configurar las tablas en Supabase (Usuarios, Clientes, Productos)
Configurar autenticación (login/registro) con Supabase Auth
Implementar sistema de roles (Admin, Gerente, Vendedor, Repartidor, Administrativo)
Crear layout principal (sidebar, navbar, contenido)
Implementar Row Level Security (RLS) para cada rol

FASE 2 - CRUD de Clientes
Listado de clientes con búsqueda y filtros
Ficha completa del cliente (datos, logística, financiero)
Sistema de semáforo de crédito (verde/amarillo/rojo)
Scoring automático de clientes (1-5 estrellas)
Botones de acción rápida (WhatsApp, llamar, email, Maps)

FASE 3 - Productos y Pedidos
CRUD de productos con catálogo
Control de stock (alertas de mínimo y vencimiento)
Listas de precios (Tarifa A/B/C)
Creación de pedidos (seleccionar cliente, agregar productos, calcular total)
Estados del pedido (Pendiente → En Preparación → En Ruta → Entregado)
Generación de PDF del pedido con jsPDF

FASE 4 - Pipeline Kanban
Tablero Kanban con drag & drop (SortableJS)
Etapas del embudo (Contacto → Calificación → Presupuesto → Negociación → Cierre → Activo)
Campos obligatorios por etapa
Alertas de tarjetas estancadas
Cálculo de probabilidad y pronóstico de ventas

FASE 5 - Dashboard y Reportes
Dashboard gerencial con métricas en tiempo real (Chart.js)
Reportes: ventas por vendedor, morosidad, productos más vendidos
Top 10 clientes y productos
Tasa de conversión del pipeline

FASE 6 - Logística y Rutas
CRUD de rutas con asignación de repartidores
Mapa interactivo con Leaflet
Tracking GPS del repartidor
Vista móvil (PWA) para repartidores: lista de entregas, marcar entregado, foto, firma

FASE 7 - Comunicación e Integraciones
Timeline de interacciones por cliente
Integración WhatsApp (Twilio vía Edge Functions)
Click-to-Call (telefonía)
Email tracking con SendGrid
Notificaciones push

FASE 8 - Automatización e IA
Workflows automáticos (seguimientos, asignación por zona)
Alertas inteligentes (cliente sin comprar, deuda por vencer, stock bajo)
Sugerencias de venta cruzada
Optimización de rutas


Prioridad	Item
~~Alta	Configuración (#1), Listas de precios (#2), Permisos por rol (#11)~~ ✅ COMPLETADO
~~Media	Notificaciones (#4), Exportación CSV (#5), Validaciones (#7)~~ ✅ COMPLETADO
~~Baja	Búsqueda global (#3), Filtros avanzados (#6), Empty states (#9), Onboarding (#13), Sort tablas, PDF reportes, Error handler, Loading states~~ ✅ COMPLETADO

---

## 🏗️ ESTADO DE IMPLEMENTACIÓN

### Stack tecnológico real utilizado
| Capa | Tecnología | Notas |
|------|-----------|-------|
| Frontend | HTML + CSS + JavaScript vanilla (ES Modules) | Sin frameworks, SPA con hash router |
| Base de datos | Supabase (PostgreSQL) | Auth, RLS, Realtime, API REST |
| Estilos | CSS puro + CSS Variables | Branding dinámico por organización |
| Gráficos | Chart.js 4.x (carga lazy desde CDN) | Dual CDN fallback (jsdelivr + cdnjs) |
| PDFs | jsPDF 2.5.2 (carga lazy desde CDN) | Generación cliente-side |
| Mapas | Leaflet (carga lazy desde CDN) | Rutas y GPS |
| Drag & Drop | SortableJS (carga lazy desde CDN) | Pipeline Kanban |
| Hosting | GitHub Pages / cualquier hosting estático | Repo: https://github.com/TobiasGallo/CRM-para-distribuidora.git |

### Arquitectura
- **Multi-tenant**: Todas las tablas tienen `organizacion_id` + RLS
- **SPA**: Navegación por hash (`#/dashboard`, `#/clientes`, etc.)
- **ES Modules**: `import`/`export` entre archivos JS
- **Lazy loading**: Librerías CDN se cargan bajo demanda
- **Branding dinámico**: CSS Variables sobrescritas por colores de la organización

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
CRM-Alex/
├── index.html                          # Entry point - carga CSS y app.js
├── css/
│   ├── variables.css                   # CSS Variables globales (colores, spacing, tipografía)
│   ├── styles.css                      # Estilos base, layout, utilidades, responsive
│   └── components/
│       ├── login.css                   # Pantalla de login
│       ├── sidebar.css                 # Sidebar + backdrop mobile + drawer
│       ├── navbar.css                  # Navbar superior
│       ├── dashboard.css               # Dashboard con stat cards y gráficos
│       ├── clientes.css                # Listado, filtros, tabla, ficha, modal
│       ├── productos.css               # Listado, filtros, tabla, modal
│       ├── pedidos.css                 # Listado, filtros, tabla, detalle, PDF
│       ├── pipeline.css                # Kanban board con drag & drop
│       ├── logistica.css               # Rutas, mapa, paradas
│       ├── reportes.css                # 6 tabs de reportes con gráficos
│       └── configuracion.css           # Tabs org/usuarios/listas, modales
├── js/
│   ├── app.js                          # Entry point JS - init, routing, branding
│   ├── config/
│   │   └── supabase.js                 # Cliente Supabase (URL + anon key)
│   ├── auth/
│   │   └── auth.js                     # Login, logout, sesión, perfil, organización (cache)
│   ├── utils/
│   │   ├── router.js                   # SPA Router (hash-based, register/navigate/handleRoute)
│   │   ├── toast.js                    # Notificaciones toast (success/error/warning)
│   │   ├── permissions.js              # Sistema de permisos por rol (matriz módulo×acción)
│   │   ├── notifications.js            # Campana + panel desplegable notificaciones
│   │   ├── csv.js                      # Exportación CSV de listados
│   │   ├── validate.js                 # Validaciones visuales inline en formularios
│   │   ├── error-handler.js            # Manejo centralizado: offline, sesión, network, rate limit
│   │   ├── global-search.js            # Búsqueda global Ctrl+K (clientes + productos + pedidos)
│   │   └── onboarding.js               # Wizard de bienvenida para organizaciones nuevas
│   ├── components/
│   │   ├── sidebar.js                  # Sidebar con nav dinámico por permisos, mobile drawer
│   │   └── navbar.js                   # Navbar + campana notificaciones + panel
│   └── pages/
│       ├── login.js                    # Formulario de login
│       ├── dashboard.js                # KPIs, gráficos Chart.js, rankings, alertas
│       ├── clientes.js                 # CRUD completo + ficha detallada + semáforo crédito
│       ├── productos.js                # CRUD completo + precios por lista + stock
│       ├── pedidos.js                  # CRUD + cambio de estados + edición líneas + PDF
│       ├── pipeline.js                 # Kanban drag&drop con SortableJS
│       ├── logistica.js                # Rutas + mapa Leaflet + paradas + repartidores
│       ├── reportes.js                 # 6 tabs: Ventas, Vendedores, Productos, Morosidad, Inactivos, Entregas
│       └── configuracion.js            # 3 tabs: Organización, Usuarios, Listas de Precios
└── supabase/
    ├── 01_tablas.sql                   # CREATE TABLE de todas las tablas + índices + triggers
    ├── 02_rls_policies.sql             # Row Level Security policies por tabla
    ├── 03_trigger_nuevo_usuario.sql    # Trigger para crear perfil en tabla usuarios al registrarse
    ├── 04_cobros.sql                   # Tabla cobros + RLS (pagos/cobros vinculados a clientes)
    ├── 05_notas_cliente.sql            # Columna notas_internas en clientes
    ├── 06_devoluciones.sql             # Tablas devoluciones + devoluciones_lineas + RLS
    ├── 07_metas_vendedor.sql           # Tabla metas_vendedor (mes/año/monto) + RLS
    ├── 08_cobros_pedido_id.sql         # ALTER TABLE cobros ADD COLUMN pedido_id (migración)
    ├── 09_pedidos_descuento.sql        # ALTER TABLE pedidos ADD columnas descuento_tipo/valor/monto
    ├── 10_invitaciones.sql             # Tabla invitaciones + RPCs get_invitacion_by_token / usar_invitacion
    └── 11_historial_precios.sql        # Tabla historial_precios + índices + RLS (cambios de precio)
```

---

## ✅ FASES COMPLETADAS

### FASE 1 - Base y Autenticación ✅
- [x] Proyecto Supabase configurado
- [x] Tablas creadas: organizaciones, usuarios, clientes, productos, pedidos, productos_pedido, rutas, interacciones, pipeline_oportunidades, notificaciones, listas_precios, precios_por_lista
- [x] RLS policies para todas las tablas (doble filtro: org_id + rol)
- [x] Trigger para crear usuario en tabla `usuarios` al registrarse en Supabase Auth
- [x] Login con email/password
- [x] Layout: sidebar colapsable + navbar + main content
- [x] Roles: owner, admin, gerente, vendedor, repartidor, administrativo
- [x] Branding dinámico por organización (colores, logo, favicon, nombre)

### FASE 2 - CRUD de Clientes ✅
- [x] Listado paginado con búsqueda y filtros (tipo, estado)
- [x] Crear / editar cliente con formulario completo
- [x] Ficha detallada del cliente (datos, logística, financiero, métricas)
- [x] Semáforo de crédito (verde/amarillo/rojo): Verde = saldo ≤ 0 o crédito no vencido; Amarillo = vencido ≤ 7 días; Rojo = vencido > 7 días. Lógica basada en `fecha_ultima_compra + dias_credito` vs hoy (no en días de inactividad)
- [x] Scoring con estrellas (0-5)
- [x] Botones de acción rápida: WhatsApp, llamar, email, Google Maps
- [x] Asignación de vendedor y lista de precios
- [x] Eliminar con confirmación

### FASE 3 - Productos y Pedidos ✅
- [x] CRUD de productos con SKU, categoría, stock, vencimiento
- [x] Precios por lista de precios (sección en modal de producto)
- [x] Control visual de stock (badges: ok, bajo, sin stock)
- [x] Alertas de vencimiento próximo
- [x] CRUD de pedidos: seleccionar cliente, buscar/agregar productos, calcular total
- [x] Estados del pedido: Pendiente → En Preparación → En Ruta → Entregado / Cancelado / Incidencia
- [x] Edición completa del pedido (cambiar estado, vendedor, líneas, método pago)
- [x] Al crear pedido: `clientes.saldo_pendiente` se incrementa automáticamente con el total
- [x] Al entregar pedido (desde Pedidos o Logística): `clientes.fecha_ultima_compra` se actualiza automáticamente
- [x] Lista de precios del cliente aplicada automáticamente al agregar productos (consulta `precios_por_lista` al seleccionar cliente, usa precio lista cuando existe)
- [x] Remito de entrega (sin precios): botón en detalle del pedido, impresión directa vía `window.print()`
- [x] Generación de PDF del pedido con jsPDF (carga lazy, dual CDN fallback)

### FASE 4 - Pipeline Kanban ✅
- [x] Tablero Kanban con 6 etapas
- [x] Drag & drop entre columnas (SortableJS, carga lazy)
- [x] Tarjetas con cliente, vendedor, valor estimado, probabilidad
- [x] Crear / editar oportunidades
- [x] Valor total por columna
- [x] Días en etapa actual

### FASE 5 - Dashboard y Reportes ✅
- [x] Dashboard: KPIs (ventas, pedidos, clientes, ticket promedio)
- [x] Gráficos Chart.js: evolución de ventas, top productos, distribución estados
- [x] Rankings: top clientes, top productos
- [x] Alertas: stock bajo, clientes inactivos, pedidos pendientes
- [x] Selector de período (7/30/90 días)
- [x] Página de Reportes separada con 6 tabs:
  - Ventas: KPIs (Total Facturado **sin cancelados**, Entregado Efectivo, Ticket Promedio, Pedidos Activos, Tasa Cancelación), evolución diaria, métodos de pago, tabla detalle
  - Vendedores: KPIs, chart comparativo + barra de meta, tabla con tasa de éxito. Gestión de metas mensuales con upsert (modal para gerentes+)
  - Productos: KPIs, top 15 chart, donut categorías, tabla completa. **Filtro de período funciona correctamente** (dos-pasos: IDs de pedidos primero, luego `.in()` en líneas). Excluye pedidos cancelados.
  - Morosidad: KPIs, chart deuda por color, tabla con teléfono
  - Clientes Inactivos: KPIs por brackets (30/60/90 días), tabla
  - Entregas: KPIs, tabla repartidores, historial rutas
- [x] Exportar PDF de cualquier tab activo (jsPDF, lazy CDN)

### FASE 6 - Logística y Rutas ✅
- [x] CRUD de rutas con repartidor, vehículo, fecha
- [x] Mapa interactivo con Leaflet (carga lazy, dual CDN)
- [x] Agregar paradas (clientes con pedidos pendientes)
- [x] Reordenar paradas con drag & drop
- [x] Marcar paradas como completadas
- [x] KM estimados y estado de ruta

### Responsive y Mobile ✅
- [x] Sidebar como off-canvas drawer en mobile (< 768px) con backdrop
- [x] Hamburger toggle: mobile = drawer, desktop = collapse
- [x] Auto-cierre del sidebar al navegar en mobile
- [x] Todos los módulos con responsive a 768px y 480px
- [x] Tablas con overflow-x auto
- [x] Modales y formularios adaptados a mobile

### Configuración ✅
- [x] Página de Configuración con 3 tabs:

**Tab Organización:**
- [x] Editar datos de la empresa (nombre, razón social, CUIT, dirección)
- [x] Editar contacto (teléfono, email, sitio web)
- [x] Personalización visual: color pickers sincronizados con text input
- [x] URLs de logo y favicon
- [x] Preferencias: moneda (ARS/USD/EUR/CLP/MXN/COP/UYU), zona horaria
- [x] Al guardar: actualiza branding en vivo (colores CSS, nombre sidebar, título navegador)

**Tab Usuarios:**
- [x] Lista de todos los usuarios con avatar, nombre, email, rol, estado
- [x] Badge "Vos" en el usuario actual
- [x] Editar nombre, rol y zona asignada de cualquier usuario (excepto owner y self)
- [x] Activar/desactivar usuarios
- [x] Sistema de invitaciones completo: modal con nombre/email/rol, genera token en tabla `invitaciones`, muestra link copiable `?invite={token}`. El invitado abre el link, completa su registro con email y nombre prellenados, queda vinculado a la organización automáticamente
- [x] Info-box explicativo del flujo de invitación (corregido — antes decía "el usuario debe registrarse solo")

**Tab Listas de Precios:**
- [x] Crear nueva lista de precios (nombre, descripción, activa/inactiva)
- [x] Editar lista existente
- [x] Eliminar lista (limpia referencia en clientes)
- [x] Cards con conteo de productos con precio y clientes asignados
- [x] Modal "Ver precios" con tabla: producto, SKU, precio base, precio lista, diferencia %
- [x] Info box: los precios por producto se configuran desde el modal de cada producto

### Sistema de Permisos por Rol ✅

**Archivo:** `js/utils/permissions.js`

**Jerarquía de roles (nivel de acceso):**
```
owner (6) > admin (5) > gerente (4) > vendedor (3) > administrativo (2) > repartidor (1)
```

**Matriz de permisos (módulo × acción × roles permitidos):**

| Módulo | Acción | owner | admin | gerente | vendedor | administrativo | repartidor |
|--------|--------|:-----:|:-----:|:-------:|:--------:|:--------------:|:----------:|
| dashboard | ver | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| pipeline | ver/crear/editar | ✅ | ✅ | ✅ | ✅ | - | - |
| pipeline | eliminar | ✅ | ✅ | ✅ | - | - | - |
| clientes | ver | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| clientes | crear/editar | ✅ | ✅ | ✅ | ✅ | - | - |
| clientes | eliminar | ✅ | ✅ | ✅ | - | - | - |
| productos | ver | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| productos | crear/editar | ✅ | ✅ | ✅ | - | - | - |
| productos | eliminar | ✅ | ✅ | - | - | - | - |
| pedidos | ver | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| pedidos | crear/editar | ✅ | ✅ | ✅ | ✅ | - | - |
| pedidos | eliminar | ✅ | ✅ | ✅ | - | - | - |
| pedidos | cambiar_estado | ✅ | ✅ | ✅ | ✅ | - | ✅ |
| rutas | ver | ✅ | ✅ | ✅ | - | - | ✅ |
| rutas | crear/eliminar | ✅ | ✅ | ✅ | - | - | - |
| rutas | editar | ✅ | ✅ | ✅ | - | - | ✅ |
| reportes | ver | ✅ | ✅ | ✅ | - | - | - |
| reportes | ver_morosidad | ✅ | ✅ | ✅ | - | ✅ | - |
| configuracion | ver/editar_org | ✅ | ✅ | - | - | - | - |
| configuracion | gestionar_usuarios | ✅ | ✅ | - | - | - | - |
| configuracion | listas_precios | ✅ | ✅ | ✅ | - | - | - |

**Rutas del sidebar por rol:**

| Rol | Rutas visibles |
|-----|---------------|
| owner | Dashboard, Pipeline, Clientes, Productos, Pedidos, Rutas, Reportes, Configuración |
| admin | Dashboard, Pipeline, Clientes, Productos, Pedidos, Rutas, Reportes, Configuración |
| gerente | Dashboard, Pipeline, Clientes, Productos, Pedidos, Rutas, Reportes |
| vendedor | Dashboard, Pipeline, Clientes, Productos, Pedidos |
| administrativo | Dashboard, Clientes, Productos, Pedidos |
| repartidor | Dashboard, Pedidos, Rutas |

**Implementación en el frontend:**
- `Permissions.can(acción, módulo)` → verifica si el rol actual tiene permiso
- `Permissions.getVisibleRoutes()` → devuelve las rutas del sidebar para el rol
- `Permissions.isAdmin()` → shortcut para owner/admin
- `Permissions.hasMinRole(rol)` → verifica nivel mínimo de rol
- El sidebar se renderiza dinámicamente según permisos (método `buildNav()`)
- Los botones "Nuevo", "Editar", "Eliminar" se ocultan condicionalmente con `Permissions.can()`
- La página de Configuración bloquea acceso completo si no es admin/owner

**API del módulo:**
```javascript
import Permissions from './utils/permissions.js';

// Verificar permiso específico
if (Permissions.can('crear', 'productos')) { /* mostrar botón */ }

// Verificar nivel de rol
if (Permissions.hasMinRole('gerente')) { /* acceso gerente+ */ }

// Obtener rutas visibles
const routes = Permissions.getVisibleRoutes(); // ['dashboard', 'clientes', ...]
```

### Notificaciones In-App ✅

**Archivo:** `js/utils/notifications.js`

- [x] Campana en el navbar con badge de conteo (se oculta si es 0, muestra "9+" si >9)
- [x] Panel desplegable con lista de notificaciones (últimas 30)
- [x] Íconos por tipo: pedido (azul), stock (amarillo), cliente (verde), alerta (rojo), sistema (violeta)
- [x] Tiempo relativo ("Hace 5 min", "Hace 2h", "Hace 3 días")
- [x] Click en notificación → marcar como leída + navegar si tiene link_accion
- [x] Botón "Marcar leídas" → marca todas como leídas
- [x] Polling automático cada 60 segundos
- [x] Se cierra al hacer click fuera del panel
- [x] Responsive: en mobile el panel ocupa todo el ancho
- [x] Destroy al hacer logout (limpia interval y estado)

### Exportación CSV ✅

**Archivo:** `js/utils/csv.js`

- [x] Botón "CSV" en Clientes, Productos y Pedidos
- [x] Exporta TODOS los registros (sin paginación) respetando filtros activos
- [x] BOM UTF-8 para compatibilidad con Excel (tildes y eñes)
- [x] Separador punto y coma (;) para configuración regional español
- [x] Nombre del archivo con fecha: `clientes_20260217.csv`
- [x] Soporta dot notation para campos anidados (`vendedor.nombre`)
- [x] Soporta funciones format para campos calculados

**Columnas por módulo:**
- Clientes: 15 columnas (nombre, razón social, tipo, estado, contacto, dirección, vendedor, lista precios, crédito, scoring, días reparto)
- Productos: 10 columnas (SKU, nombre, categoría, formato, precio, stock, proveedor, vencimiento, estado)
- Pedidos: 10 columnas (número, cliente, vendedor, estado, total, método pago, fechas, observaciones)

### Validaciones Inline ✅

**Archivo:** `js/utils/validate.js`

- [x] Validación al enviar formulario con `Validate.form(form, rules)`
- [x] Validación en tiempo real (on blur) con `Validate.bindRealtime(form, rules)`
- [x] Borde rojo + mensaje de error debajo del campo inválido
- [x] Borde verde en campos válidos
- [x] Auto-limpieza del error al empezar a corregir (on input)
- [x] Focus automático en el primer campo con error
- [x] Scroll suave al campo con error

**Tipos de validación:**
- `required` — campo obligatorio
- `minLength` / `maxLength` — longitud mínima/máxima
- `type: 'email'` — formato de email
- `type: 'phone'` — teléfono (min 8 dígitos)
- `type: 'number'` — número con min/max
- `type: 'url'` — URL válida
- `custom` — función personalizada

**Formularios con validación:**
- Clientes: nombre (required, min 2), tipo (required), email (format), teléfono (format)
- Productos: SKU (required, min 2), nombre (required, min 2), categoría (required), precio base (required, >= 0)

---

## 🔧 GAPS PENDIENTES (fuera de fases)

### 🔴 Críticos para producción
- [x] **Registro de cobros/pagos** — Tab "Cobros" en ficha de cliente. Historial de cobros con fecha, monto, método, usuario. Actualización automática del saldo. Tabla `cobros` (ver `supabase/04_cobros.sql`).
- [x] **Timeline de interacciones manual** — Tab "Timeline" en ficha de cliente. Registro de llamadas, visitas, notas con tipo, contenido y resultado. Lazy-load al abrir el tab.
- [x] **Import CSV** — Modal completo con 4 pasos: subir → preview → importar → resultado. Soporta clientes y productos. Auto-detección de separador coma/punto y coma. Batch de 50 filas. Ver `js/utils/import-csv.js`.

### 🟡 Importantes pero no bloqueantes
- [x] **Gestión de devoluciones (NCR)** — Botón "Devolver" en pedidos entregados. Selección de productos y cantidades devueltas. Nota de crédito automática (reduce `saldo_pendiente` del cliente). Tabla `devoluciones` + `devoluciones_lineas` (ver `supabase/06_devoluciones.sql`).
- [x] **Duplicar pedido** — Botón "Duplicar" en detalle del pedido. Crea nuevo pedido con mismo cliente, productos y precios. Estado `pendiente`, número nuevo.
- [x] **Ajuste manual de stock** — Botón en cada fila de productos. Modal con tipo: entrada/salida/absoluto, cantidad y motivo. Actualización inmediata del stock local y en Supabase.
- [x] **Notas internas en ficha de cliente** — Tab "Notas" en ficha de cliente con textarea guardado en columna `notas_internas` (ver `supabase/05_notas_cliente.sql`). Visible para todos los roles.

### 🟢 Nice-to-have
- [x] **Impresión de hoja de ruta** — Botón "Imprimir" en detalle de ruta en Logística. Ventana HTML optimizada para print con encabezado, metadatos, tabla de paradas (nro, cliente, dirección, entregado, firma), resumen y auto-print al abrir.
- [x] **Metas de vendedor** — Tabla `metas_vendedor` (ver `supabase/07_metas_vendedor.sql`). Tab Vendedores en Reportes: grid de progreso con barra de color, columna Meta, barra en gráfico. Gerentes+ editan metas por mes desde modal con upsert.
- [x] **Export completo de datos** — Botón en Configuración > Organización (owner/admin). Descarga un ZIP con 5 CSVs: clientes, productos, pedidos (con líneas), cobros, usuarios. Usa JSZip cargado lazy desde CDN. Archivo: `crm_backup_YYYYMMDD.zip`.

---

## 🔧 GAPS ADICIONALES (detectados post-implementación)

### 🔴 Funcional crítico

- [x] **Historial de pedidos en ficha de cliente** — 5to tab "Pedidos" en ficha de cliente. Lista pedidos (número, fecha, estado badge, vendedor, total) con filtro por estado. Lazy-load al primer clic. Muestra hasta 50, badge con conteo.
- [x] **Verificación de línea de crédito al crear pedido** — Al seleccionar cliente en nuevo pedido, se muestra inline saldo pendiente, línea de crédito y disponible. Se actualiza en tiempo real al agregar/modificar productos. Warning en rojo si el total supera la disponibilidad.
- [x] **Alertas de stock bajo en Dashboard** — Widget dedicado (se oculta si no hay alertas) con badge de conteo. Dos grupos: "Sin stock" (rojo) y "Stock bajo" (amarillo). Cada producto muestra nombre, SKU, cantidad actual vs. mínimo. Link directo a la sección Productos.

### 🟡 Importantes

- [x] **Compartir pedido por WhatsApp** — Botón "WhatsApp" en footer del modal de detalle de pedido. Genera link `wa.me/?text=...` con mensaje formateado: org, número de pedido, cliente, fecha, fecha entrega, detalle de productos y total. Compatible con cualquier teléfono que tenga WhatsApp.
- [x] **Perfil propio del usuario** — Tab "Mi Perfil" en Configuración (accesible para todos los roles). Permite cambiar nombre + teléfono (UPDATE en tabla `usuarios`) y cambiar contraseña (via `supabase.auth.updateUser`). Actualiza nombre en sidebar en tiempo real sin recargar.

### 🟢 Nice-to-have

- [x] **Productos frecuentes al crear pedido** — Al seleccionar un cliente en "Nuevo Pedido", se cargan los últimos 8 pedidos del cliente, se extraen hasta 5 productos únicos y se muestran como chips clickeables antes del buscador. Al hacer clic en un chip se agrega la línea al pedido. `supabase/08_cobros_pedido_id.sql` no requerido para este feature.
- [x] **Cobro vinculado a pedido específico** — En el modal "Registrar Pago" se agrega campo select opcional con los pedidos activos del cliente (últimos 20, excluyendo cancelados). Se guarda `pedido_id` en tabla `cobros` (migración: `supabase/08_cobros_pedido_id.sql`). En la lista de cobros, se muestra badge con el número de pedido vinculado.

---

## 🔧 GAPS ADICIONALES II (detectados post-implementación)

### 🔴 Críticos — pueden bloquear el uso real

- [x] **Descuento en pedido** — Fila "Descuento" entre el listado de productos y el total. Select tipo (% / monto fijo) + input de valor. Se recalcula en tiempo real en `updateTotal()` y `updateDetalleTotal()`. Se guarda en nuevas columnas `descuento_tipo`, `descuento_valor`, `descuento_monto` (migración: `supabase/09_pedidos_descuento.sql`). Funciona en Nuevo Pedido y en edición de pedido existente.
- [x] **"Olvidé mi contraseña" desde el login** — Link "¿Olvidaste tu contraseña?" en la pantalla de login. Muestra vista alternativa con campo de email. Llama a `supabase.auth.resetPasswordForEmail()` con `redirectTo` al origen de la app. Muestra mensaje de éxito. Botón "← Volver al login" para cancelar.
- [x] **Invitación funcional de usuarios** — Modal "Invitar usuario" con formulario real: nombre, email, rol. Crea registro en tabla `invitaciones` con token UUID y expiración de 7 días. Muestra link copiable `{appURL}?invite={token}`. Al abrir el link, login.js detecta `?invite=`, llama RPC `get_invitacion_by_token()` (SECURITY DEFINER, sin auth), muestra formulario de registro con email/nombre prellenados y bloqueados. Al registrar, pasa `organizacion_id`, `rol`, `nombre` como metadata para el trigger. Marca invitación como usada via RPC `usar_invitacion()`. Migración: `supabase/10_invitaciones.sql`.

### 🟡 Importantes para el día a día

- [x] **Actualización masiva de precios** — Botón "Precios" en header de Productos. Modal con filtro por categoría (o todos), tipo de ajuste (% aumento / % descuento / valor fijo sumar / valor fijo restar) y preview de productos afectados. UPDATE masivo via upsert. Solo visible para admin/owner/gerente.
- [x] **Remito de entrega** (sin precios) — Botón "Remito" en footer del modal detalle de pedido. Abre ventana nueva con HTML de impresión: logo, datos cliente, tabla de productos con cantidades (sin precios), 3 líneas de firma (receptor, DNI, repartidor). Llama `window.print()` automáticamente.
- [x] **Resumen de cobros del día (cierre de caja)** — Widget "Cobros de hoy" en Dashboard (antes del panel de Alertas). Muestra total del día, cantidad de cobros (badge), desglose por método de pago ordenado por monto. No afecta filtro de período del dashboard.

### 🟢 Menores

- [x] **Historial de precios por producto** — Tabla `historial_precios` con precio anterior, nuevo, fecha y usuario. Al guardar un producto, si `precio_base` cambió se registra automáticamente. En el modal de edición aparece sección "Historial de precios" con los últimos 10 cambios (fecha, variación con color ▲▼, nombre del responsable). SQL: `supabase/11_historial_precios.sql`.
- [x] **Persistencia de filtros entre navegación** — `sessionStorage` en Productos, Pedidos y Clientes. Al volver a cualquier página los filtros activos se restauran tanto en el objeto interno como en los inputs del DOM. Se guardan en cada llamada a `loadProductos/loadPedidos/loadClientes`.

---

## 🔧 GAPS ADICIONALES III (auditoría post-implementación — bugs reales)

### 🔴 Críticos — datos incorrectos en operación diaria

- [x] **Lista de precios del cliente no aplica en pedidos** — `agregarLinea()` siempre usa `prod.precio_base`, ignorando `lista_precios_id` del cliente. Debe consultar `precios_por_lista` al seleccionar el cliente y usar ese precio si existe. Afecta: `pedidos.js` → `agregarLinea()` y el dropdown de búsqueda de productos.
- [x] **`organizacion_id` falta en líneas al duplicar pedido** — `duplicarPedido()` inserta en `productos_pedido` sin `organizacion_id`. Si la tabla tiene la columna `NOT NULL` o RLS filtra por organización, las líneas quedan invisibles o el insert falla. Afecta: `pedidos.js` → `duplicarPedido()`.

### 🟡 Importantes — datos clave siempre desactualizados

- [x] **`saldo_pendiente` no sube al crear un pedido** — `savePedido()` no actualiza `clientes.saldo_pendiente`. El control de crédito al crear pedidos (semáforo + límite) siempre muestra el saldo inicial, nunca la deuda acumulada real. Afecta: `pedidos.js` → `savePedido()`.
- [x] **`fecha_ultima_compra` nunca se actualiza al entregar** — Al cambiar estado a `entregado` (desde pedidos y desde logística) no se actualiza `clientes.fecha_ultima_compra`. Los reportes de inactividad y el semáforo de morosidad quedan siempre desactualizados. Afecta: `pedidos.js` → `updateEstado()` y `logistica.js` → cambio de estado de entrega.
- [x] **No hay listado global de devoluciones** — Se puede registrar una devolución desde el detalle de un pedido entregado, pero no existe ninguna pantalla/tab donde ver todas las devoluciones, su estado (`pendiente`/`aprobada`/`rechazada`) ni gestionarlas. Los datos se guardan pero son inaccesibles.
- [x] **Botón "Exportar todos los datos" sin implementar** — En Configuración existe el botón "Exportar todos los datos (ZIP)" con su event listener, pero el método `exportarDatos()` no existe. Lanza error en consola. Afecta: `configuracion.js`.
- [x] **"Total Facturado" en Reportes incluye pedidos cancelados** — En `tabVentas()`, la suma total no filtra por estado e incluye cancelados. Solo `totalEntregado` filtra correctamente. El KPI principal sobreestima ventas. Afecta: `reportes.js` → `tabVentas()`.
- [x] **Filtro de período ignorado en tab Productos de Reportes** — La query usa `.gte('pedido.created_at', desde)` sobre una relación, que no filtra correctamente en Supabase JS. El tab Productos devuelve datos históricos completos sin importar el período seleccionado. Afecta: `reportes.js` → `tabProductos()`.

### 🟢 Menores — engañan pero no bloquean

- [x] **Semáforo de crédito usa lógica de inactividad en lugar de deuda** — Marca "moroso" si pasaron más de `dias_credito` días desde la última compra, pero eso es *inactividad*, no deuda impaga. Un cliente que pagó todo y no compró en 60 días aparece como moroso. Afecta: `clientes.js` → `renderSemaforo()`.
- [x] **Mensaje de ayuda en Usuarios contradice el sistema de invitaciones** — El texto del info-box dice "el usuario debe registrarse solo primero", cuando el propio módulo tiene el flujo de invitaciones implementado. Afecta: `configuracion.js` → tab Usuarios.

---

## 🔧 GAPS ADICIONALES IV (auditoría profunda — sesión 14)

### 🔴 Críticos — features rotas silenciosamente

- [x] **`window.App.user` no existe (siempre `undefined`)** — `app.js` setea `window.App.userProfile`, pero cuatro lugares leen `window.App?.user?.rol` / `window.App?.user?.id`. Efectos: (a) botón "Gestionar metas" en Reportes nunca aparece para nadie; (b) sección "Exportar datos" en Configuración nunca renderiza; (c) `created_by` en invitaciones se guarda como `undefined`. Fix: cambiar `.user.` → `.userProfile.` en `reportes.js:298`, `configuracion.js:217`, `configuracion.js:585`, `configuracion.js:1116`.
- [x] **`saldo_pendiente` no se descuenta al cancelar pedido** — Cuando el estado cambia a `cancelado`, el total del pedido NO se resta del `saldo_pendiente` del cliente. Un pedido de $50.000 cancelado deja al cliente con $50.000 de deuda ficticia indefinidamente. Afecta: `pedidos.js` → `estadoSelector` click handler.
- [x] **`saldo_pendiente` no se ajusta al editar un pedido** — `guardarCambiosPedido()` actualiza el total del pedido en BD pero nunca toca `clientes.saldo_pendiente`. Si se agrega o quita producto a un pedido existente, el saldo del cliente queda con el monto original. Afecta: `pedidos.js` → `guardarCambiosPedido()`.

### 🟡 Importantes — datos incorrectos o UX bloqueada

- [x] **Filtro "stock bajo" en Productos silenciosamente roto** — `query.filter('stock_actual', 'lte', 'stock_minimo')` pasa el string `'stock_minimo'` como valor literal (Supabase JS no soporta comparación columna-a-columna). El filtro no devuelve resultados correctos. El mismo bug existe en el CSV export. Fix: cargar todos los productos con `stock_minimo > 0` y filtrar client-side. Afecta: `productos.js` → `loadProductos()` y `exportCSV()`.
- [x] **Búsqueda en Pedidos solo acepta número exacto** — `parseInt(search)` silencia cualquier búsqueda por nombre de cliente. Si el usuario escribe "garcia", no filtra nada. Fix: cuando el search no es número, buscar IDs de clientes con `nombre_establecimiento ilike %text%` y luego `.in('cliente_id', ids)`. Afecta: `pedidos.js` → `loadPedidos()`.
- [x] **Dashboard: link "Ver todos los cobros" lleva a ruta no registrada** — El widget de cobros enlaza a `#/cobros` que no existe en el router. Hace crash silencioso (muestra pantalla en blanco). Fix: cambiar a `#/clientes`. Afecta: `dashboard.js`.

### 🟢 Menores — mejoras de UX y auditoría

- [x] **`metodo_pago` no se pre-llena desde el cliente** — Al seleccionar un cliente en el modal de nuevo pedido, el select de "Método de pago" queda en blanco incluso si el cliente tiene `metodo_pago_preferido`. Requiere agregar la columna al `loadClientes()` y el pre-llenado en el change handler. Afecta: `pedidos.js`.
- [x] **Actualización masiva de precios no registra en `historial_precios`** — El bulk update guarda en `productos` pero no deja trazabilidad. Los cambios individuales sí se loguean. Fix: insertar en `historial_precios` por cada producto afectado con motivo "Actualización masiva". Afecta: `productos.js` → `openActualizarPreciosModal()`.

---

## 🔧 GAPS ADICIONALES VI (tercera auditoría profunda — sesión 16)

### 🔴 Crítico

- [x] **`savePedido` race condition en `saldo_pendiente`** (`pedidos.js:~1020`) — El saldo anterior se leía del cache en memoria `this.clientes.find()`, igual que el bug ya corregido en `saveCobro`. Si dos pedidos se crean al mismo tiempo para el mismo cliente, ambos leen el mismo saldo base y uno sobreescribe al otro. Fix: leer fresh con `SELECT saldo_pendiente` antes de sumar.

### 🟠 Altos

- [x] **`confirmarEliminar` pedido no ajusta `saldo_pendiente`** (`pedidos.js:~1841`) — Al borrar un pedido no cancelado, el cliente quedaba con deuda ficticia permanente. Fix: si `estado !== 'cancelado'`, restar `pedido.total` del `saldo_pendiente` del cliente (fresh read + update).
- [x] **`duplicarPedido` no suma `saldo_pendiente`** (`pedidos.js:~1897`) — El pedido duplicado se creaba como `pendiente` con un total, pero nunca se incrementaba el `saldo_pendiente` del cliente. Inconsistente con `savePedido`. Fix: fresh read + update igual que en savePedido.
- [x] **Notificación de nuevo pedido muestra `#undefined`** (`pedidos.js:~1032`) — `pedidoData.numero_pedido` es siempre `undefined` porque ese campo lo asigna la DB, no el código local. El insert solo retornaba `id`. Fix: cambiar a `.select('id, numero_pedido')` y usar `pedido.numero_pedido`.

### 🟡 Medios

- [x] **`exportCSV` de clientes ignora filtros avanzados** (`clientes.js:~660`) — El export aplicaba `search`, `tipo`, `estado` pero NO aplicaba `fechaDesde`, `fechaHasta`, `scoringMin`, `scoringMax`, `vendedor`. Fix: copiar los mismos filtros que usa `loadClientes()`.
- [x] **`guardarCambiosPedido` ajusta saldo de pedidos cancelados** (`pedidos.js:~1652`) — Si se editaba el total de un pedido ya cancelado (cuyo saldo ya fue descontado al cancelar), el diff se volvía a sumar al saldo corrompiendo los números. Fix: agregar `&& pedido.estado !== 'cancelado'` a la condición de ajuste.

### 🔵 Bajos

- [x] **`crm:import-done` con `{ once: true }` se consume** (`clientes.js:~577`, `productos.js:~512`) — Si el usuario importa CSV dos veces en la misma sesión sin navegar, la segunda importación no refresca la tabla (el listener fue consumido por la primera). Fix: eliminar `{ once: true }`.

**Archivos modificados:**
- `js/pages/pedidos.js` — savePedido race condition, eliminar descuenta saldo, duplicar suma saldo, notificación #undefined, guardar no ajusta cancelados
- `js/pages/clientes.js` — exportCSV aplica todos los filtros, import-done sin once
- `js/pages/productos.js` — import-done sin once

---

## 🔧 GAPS ADICIONALES XVI (decimotercera auditoría profunda — sesión 26)

### 🔴 Crítico — Data isolation en búsqueda global, configuración y exportación

#### `global-search.js` — 3 búsquedas sin `organizacion_id`
- **Archivo:** `js/utils/global-search.js` líneas 118-135
- **Problema:** Los 3 queries del buscador global (Ctrl+K) — clientes, productos y pedidos — no filtraban por `organizacion_id`. Cualquier usuario podía buscar y ver datos de otras organizaciones en tiempo real.
- **Fix:** `const orgId = window.App?.organization?.id;` + `.eq('organizacion_id', orgId)` en los 3 queries antes de `.or(...)` y `.limit()`.

#### `configuracion.js` — `renderUsuariosTab()` sin `organizacion_id`
- **Archivo:** `js/pages/configuracion.js` línea 315
- **Problema:** Query `supabase.from('usuarios').select('*')` traía todos los usuarios de todas las organizaciones. La pestaña Usuarios en Configuración mostraba empleados de otras empresas.
- **Fix:** `.eq('organizacion_id', orgId)` en el query.

#### `configuracion.js` — `renderListasTab()` sin `organizacion_id` (3 queries)
- **Archivo:** `js/pages/configuracion.js` líneas 631-661
- **Problema:** El query de `listas_precios` no filtraba por org. El conteo de productos por lista (`precios_por_lista`, tabla de join sin `organizacion_id` propio) se hacía sin scope. El conteo de clientes por lista (`clientes`) tampoco filtraba.
- **Fix:** `.eq('organizacion_id', orgId)` en `listas_precios` y en `clientes`. Para `precios_por_lista` (tabla de join): guard con `if (listaIds.length > 0)` + `.in('lista_precios_id', listaIds)` usando los IDs ya cargados de la org.

#### `configuracion.js` — `exportarDatos()` sin `organizacion_id` (bug crítico — exfiltración de datos)
- **Archivo:** `js/pages/configuracion.js` líneas 1106-1110
- **Problema:** La función de exportación ZIP ya tenía `const orgId = window.App?.organization?.id` declarado pero **no lo usaba** en ninguno de los 5 queries. Exportaba todos los clientes, productos, pedidos, cobros y usuarios de todas las organizaciones del sistema.
- **Fix:** `.eq('organizacion_id', orgId)` agregado a los 5 queries en el `Promise.all`.

#### `onboarding.js` — `shouldShow()` sin `organizacion_id` en conteos
- **Archivo:** `js/utils/onboarding.js` líneas 52-55
- **Problema:** Los 2 queries de conteo (clientes y productos) no filtraban por org. Si cualquier otra organización en el sistema tenía datos, el onboarding no aparecía para una org nueva vacía.
- **Fix:** `.eq('organizacion_id', orgId)` en ambos queries de `Promise.all`.

---

## 🔧 GAPS ADICIONALES XV (duodécima auditoría profunda — sesión 25)

### 🔴 Crítico — Data isolation (defensa en profundidad)

#### Falta `.eq('organizacion_id', orgId)` en todos los queries SELECT principales

- **Problema:** Todos los pages del CRM (excepto `reportes.js`, ya corregido en sesión 23) tenían sus queries de listado sin filtro explícito de `organizacion_id`. Si hay más de una organización en la DB, cada org puede ver datos de las demás (siempre que las políticas RLS de Supabase fallen o estén mal configuradas).
- **Archivos afectados y funciones:**
  - `js/pages/dashboard.js` — `loadKPIs()`, `loadChartVentas()`, `loadChartEstados()`, `loadChartVendedores()`, `loadChartPipeline()`, `loadTopClientes()`, `loadStockBajo()`, `loadAlertas()` (×4 queries), `loadCierreCaja()` — tablas: `pedidos`, `clientes`, `productos`, `pipeline_oportunidades`, `cobros`
  - `js/pages/clientes.js` — `loadClientes()` y `exportCSV()` — tabla: `clientes`
  - `js/pages/logistica.js` — `loadRutas()` — tabla: `rutas`
  - `js/pages/pipeline.js` — `loadOportunidades()` — tabla: `pipeline_oportunidades`
  - `js/pages/pedidos.js` — `loadPedidos()` — tabla: `pedidos`
  - `js/pages/productos.js` — `loadProductos()` (ambos paths: general y filtro stock bajo) — tabla: `productos`
- **Fix aplicado:** Agregar `const orgId = window.App?.organization?.id;` al inicio de cada función y `.eq('organizacion_id', orgId)` a cada query afectado.
- **Total de queries corregidos:** ~15 queries en 6 archivos.

---

## 🔧 GAPS ADICIONALES XIV (undécima auditoría profunda — sesión 24)

### 🟢 Bajos

#### `sidebar.js` — crash si `userProfile.nombre` es null
- **Archivo:** `js/components/sidebar.js` línea 10
- **Causa:** `userProfile.nombre.split(' ')` crashea con `TypeError` si `nombre` es `null` o `undefined`. El ternario solo guarda contra `userProfile === null/undefined`, no contra `nombre` nulo. Mismo patrón ya corregido en `configuracion.js` (sesión 21) para avatares de usuarios.
- **Fix aplicado:** `(userProfile.nombre || '').split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2) || '??'`

#### `onboarding.js` — se mostraba a todos los roles
- **Archivo:** `js/utils/onboarding.js`
- **Causa:** `shouldShow()` verificaba si había datos pero no el rol. Un `vendedor` o `repartidor` en una org nueva veía instrucciones para "invitar usuarios" y "configurar la organización" — funciones a las que no tienen acceso.
- **Fix aplicado:** Guard al inicio de `shouldShow()`: si rol no es `owner` ni `admin`, retorna `false`.

#### `login.js` — mensaje de error técnico de Supabase visible en invite check
- **Archivo:** `js/pages/login.js`
- **Causa:** El bloque `catch` del flujo de invitación mostraba `err.message` directamente. Si el RPC fallaba, mensajes internos de Supabase llegaban a la pantalla. El resto del login ya usa `getErrorMessage()` para mapear errores; este bloque no.
- **Fix aplicado:** `console.error(err)` + mensaje genérico al usuario.

---

## 🔧 GAPS ADICIONALES XIII (décima auditoría profunda — sesión 23)

### 🟡 Medios

#### `reportes.js` — todas las queries sin filtro de `organizacion_id` (7 queries)
- **Archivo:** `js/pages/reportes.js`
- **Causa:** Todos los tabs (ventas, vendedores, productos, morosidad, clientes inactivos, entregas) hacían sus queries a Supabase sin `.eq('organizacion_id', orgId)`. El resto del CRM aplica este filtro explícito como defensa en profundidad además del RLS. Reportes era el único módulo que confiaba ciegamente en RLS.
- **Tablas afectadas:** `pedidos` (3 queries), `metas_vendedor`, `clientes` (2 queries), `rutas`.
- **Fix aplicado:** `const orgId = window.App?.organization?.id;` + `.eq('organizacion_id', orgId)` en los 7 queries correspondientes.

#### `notifications.js` `load()` — sin filtro de `usuario_id`
- **Archivo:** `js/utils/notifications.js`
- **Causa:** La función `load()` traía notificaciones sin filtrar por `usuario_id`. Cada usuario debería ver solo sus propias notificaciones, pero la query retornaba todas las de la BD (o todas las de la org si RLS lo limitaba). La campana mostraría notificaciones de otros usuarios.
- **Fix aplicado:** `.eq('usuario_id', userId)` donde `userId = window.App?.userProfile?.id`.

### 🟢 Bajos

#### `notif.js` — utilidad de notificaciones solo integrada en pedidos.js y productos.js
- **Archivo:** `js/utils/notif.js` (nuevo, no commiteado)
- **Causa:** El archivo `notif.js` fue creado para generar notificaciones in-app desde cualquier módulo, pero solo `pedidos.js` y `productos.js` lo importaban. Acciones clave en otros módulos no generaban notificaciones.
- **Fix aplicado:**
  - `clientes.js`: importa `Notif` y llama `notifyManagers('success', 'Nuevo cliente', nombre, '#/clientes')` al crear un cliente.
  - `pipeline.js`: importa `Notif` y llama `notifyManagers('info', 'Nueva oportunidad en pipeline', valor, '#/pipeline')` al crear una oportunidad.
  - `logistica.js`: importa `Notif` y llama `notifyManagers('success', 'Ruta completada', nombre, '#/rutas')` al marcar una ruta como completada.

---

## 🔧 GAPS ADICIONALES XII (novena auditoría profunda — sesión 22)

### 🟡 Medios

#### `closeModal()` crash por null en 6 páginas con modales
- **Archivos:** `js/pages/pipeline.js`, `js/pages/clientes.js`, `js/pages/logistica.js`, `js/pages/pedidos.js`, `js/pages/productos.js`, `js/pages/configuracion.js`
- **Causa:** Todas las implementaciones de `closeModal()` hacen `document.getElementById('modalContainer').innerHTML = ''` sin null check. Si el usuario abre un modal y navega al dashboard o reportes (páginas sin `#modalContainer`) sin cerrarlo, el `_escHandler` queda colgado en `document`. Al presionar ESC → `closeModal()` → `TypeError: Cannot set properties of null`.
- **Fix aplicado:** `const mc = document.getElementById('modalContainer'); if (mc) mc.innerHTML = '';`

### 🟢 Bajos

#### Race condition en `notifications.js` — `open()` + `close()` rápido
- **Archivo:** `js/utils/notifications.js`
- **Causa:** `open()` usa `setTimeout(..., 10)` para registrar `_outsideClickHandler`. Si `close()` corre dentro de esos 10ms (doble click rápido), remueve `null` y el timeout después agrega un handler que nunca se limpia.
- **Fix aplicado:** Limpiar handler previo antes del setTimeout en `open()`.

#### Race condition en `global-search.js` — patrón idéntico
- **Archivo:** `js/utils/global-search.js`
- **Causa y fix:** Mismo patrón `setTimeout` / `_outsideHandler` que notifications.js.
- **Fix aplicado:** Limpiar handler previo antes del setTimeout en `open()`.

#### `clientes.js` — doble `_escHandler` sin limpiar en `openFicha()`
- **Archivo:** `js/pages/clientes.js`
- **Causa:** `openModalEditar/Nuevo` y `openFicha` ambos registran `_escHandler` en `document`. Si se abría ficha sin pasar por `closeModal()` (que elimina el handler anterior), el primer handler quedaba acumulado ya que la referencia `this._escHandler` se sobreescribía.
- **Fix aplicado:** Verificar y remover handler existente antes de registrar el nuevo en `openFicha()`.

---

## 🔧 GAPS ADICIONALES XI (octava auditoría profunda — sesión 21)

### 🔴 Altos

#### Perfil de usuario siempre muestra campos vacíos
- **Problema:** `renderPerfilTab()` inicializaba con `window.App?.user` (objeto auth raw de Supabase, solo contiene `id` y `email`). Los campos `nombre`, `telefono` y `rol` viven en `window.App?.userProfile` (tabla `usuarios`). Resultado: el formulario "Mi Perfil" siempre arrancaba vacío independientemente de los datos del usuario.
- **Fix:** Cambiado a `window.App?.userProfile || {}`.
- **Archivo:** `js/pages/configuracion.js` → `renderPerfilTab()`

### 🟡 Medios

#### `exportarDatos()` definido dos veces (código muerto)
- **Problema:** El objeto `ConfiguracionPage` tenía dos métodos con la misma clave `exportarDatos`. En JavaScript, la segunda definición pisa a la primera, dejando la primera (lines 953–1034, descargaba CSVs individuales sin ZIP) como código muerto inalcanzable.
- **Fix:** Eliminada la primera definición duplicada. Solo queda la implementación correcta con JSZip.
- **Archivo:** `js/pages/configuracion.js`

#### `loadChartEstados()` ignoraba el selector de período en el dashboard
- **Problema:** El gráfico de dona "Pedidos por Estado" hacía un `SELECT estado FROM pedidos` sin ningún filtro de fecha. Todos los demás gráficos del dashboard respetan `getDesde()`. Resultado: el gráfico mostraba distribución histórica acumulada sin importar el período seleccionado (7d, 30d, 90d, 1año).
- **Fix:** Aplicado el filtro `gte('created_at', desde)` igual que los demás gráficos.
- **Archivo:** `js/pages/dashboard.js` → `loadChartEstados()`

#### Crash en pestaña Usuarios si `nombre` es null
- **Problema:** `renderUsuariosTab()` calculaba el avatar con `u.nombre.split(' ').map(n => n[0])...`. Si algún usuario fue creado con invitación y no completó el registro, `nombre` puede ser null, causando `TypeError: Cannot read properties of null (reading 'split')` que destruye toda la pestaña.
- **Fix:** `(u.nombre || '?').split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2) || '?'`
- **Archivo:** `js/pages/configuracion.js` → `renderUsuariosTab()`

---

## 🔧 GAPS ADICIONALES X (séptima auditoría profunda — sesión 20)

### 🟡 Medios

- [x] **`p.sku.toLowerCase()` crashea si SKU es null** (`pedidos.js:~808`) — El buscador de productos en el modal de nuevo pedido y en el modal de detalle de pedido hacía `p.sku.toLowerCase()` sin ninguna guardia. Si algún producto en la DB tiene `sku = null` (campo opcional), el `Array.filter()` lanzaba `TypeError: Cannot read properties of null`, bloqueando completamente la búsqueda y dejando al usuario sin poder agregar productos al pedido. Fix: cambiar a `(p.sku || '').toLowerCase().includes(s)`. Aplica en las dos ocurrencias del patrón.

- [x] **`renderDetalleLineas()` reconstruye el DOM en cada keystroke, el input pierde el foco** (`pedidos.js:~1516-1531`) — Al editar cantidad o precio en el detalle de un pedido, el handler de `input` llamaba a `this.renderDetalleLineas()` que hacía `container.innerHTML = ...` reconstruyendo todo el DOM. El input en el que el usuario estaba escribiendo quedaba destruido y recreado, perdiendo el foco. El usuario solo podía ingresar un carácter a la vez (ej: para escribir "1250" había que hacer click 4 veces). Fix: reemplazar el nodo del container al inicio de cada llamada (cloneNode para limpiar listeners previos), usar un único listener delegado en el container, y en los eventos `input` solo actualizar el `<div class="subtotal-linea">` de la fila afectada sin reconstruir el DOM. El `renderDetalleLineas()` completo sólo se llama al eliminar una línea (acción discreta).

**Archivos modificados:**
- `js/pages/pedidos.js` — guard `(p.sku || '')` en dos ocurrencias; `renderDetalleLineas()` con delegación y actualización quirúrgica del subtotal

---

## 🔧 GAPS ADICIONALES IX (sexta auditoría profunda — sesión 19)

### 🟠 Altos

- [x] **`exportCSV` pedidos no aplica búsqueda por nombre de cliente** (`pedidos.js:~564`) — `loadPedidos()` hace un two-step para búsqueda de texto: busca en `clientes` por `nombre_establecimiento`, obtiene los IDs, y filtra pedidos con `cliente_id IN (ids)`. Pero `exportCSV()` usaba `query.or(\`numero_pedido.ilike.${s}\`)` — un ILIKE sobre un campo numérico que no devuelve resultados de texto. Efecto: usuario busca "Panadería García", ve 5 pedidos en la tabla, exporta CSV → 0 resultados. Fix: replicar el mismo two-step de `loadPedidos()` en el bloque `search` de `exportCSV()`.

### 🔵 Bajos

- [x] **Sin notificación al marcar pedido como "entregado"** (`pedidos.js:~1263`) — El sistema tenía notificaciones para nuevo pedido, cancelado y devolución pendiente, pero no para el evento de entrega. Al cambiar el estado a `entregado`, solo se actualizaba `fecha_entrega_real` y `fecha_ultima_compra` del cliente sin ninguna `Notif.notifyManagers()`. Fix: agregar notificación tipo `success` con `#${numero_pedido}`, nombre del cliente y monto.

**Archivos modificados:**
- `js/pages/pedidos.js` — búsqueda two-step en `exportCSV`; notificación `success` al entregar

---

## 🔧 GAPS ADICIONALES VIII (quinta auditoría profunda — sesión 18)

### 🟡 Medios

- [x] **Repartidor puede cambiar pedido a cualquier estado** (`pedidos.js:~1086`, `~1230`) — El array `estados` en `openDetalle()` se armaba con los 6 estados posibles sin filtrar por rol, y el click handler tampoco tenía ningún `Permissions.can()`. Un repartidor podía abrir un pedido y hacer click en "Cancelado" — la actualización llegaba a la DB sin objeción. Fix: si el rol es `repartidor`, se muestra solo `['en_ruta', 'entregado']`. Doble guard en el click handler: `if (esRepartidor && !['en_ruta', 'entregado'].includes(nuevoEstado)) return`.

### 🔵 Bajos

- [x] **Router SPA sin guard de permisos de ruta** (`router.js:~46`) — `Router.handleRoute()` llamaba directamente `this.routes[route](el)` sin verificar si el rol del usuario tiene acceso a esa ruta. Un repartidor que escribía `#/reportes` o `#/configuracion` manualmente en la URL obtenía acceso completo. El sidebar ocultaba los links pero no era un guard real. Fix: al inicio de `handleRoute()`, si `window.App.userProfile` ya está cargado y `!Permissions.canSeeRoute(route)`, se renderiza pantalla "Acceso denegado" y se retorna. Se agregó `import Permissions` a `router.js`.

**Archivos modificados:**
- `js/pages/pedidos.js` — estados filtrados por rol en `openDetalle`; guard en click handler
- `js/utils/router.js` — guard de permisos en `handleRoute`; `import Permissions`

---

## 🔧 GAPS ADICIONALES VII (cuarta auditoría profunda — sesión 17)

### 🟠 Altos

- [x] **`exportCSV` de pedidos ignora filtros avanzados** (`pedidos.js:~564`) — La exportación aplicaba solo `estado` y `search`. Los filtros `fechaDesde`, `fechaHasta`, `vendedor`, `totalMin` y `totalMax` se ignoraban silenciosamente: el CSV exportaba todos los pedidos aunque el usuario hubiera filtrado por rango de fechas o vendedor. Idéntico al bug corregido en `clientes.js` en GAPS VI. Fix: agregar los mismos 5 filtros que usa `loadPedidos()`.

### 🟡 Medios

- [x] **`window.addEventListener('crm:import-done')` se acumula al navegar** (`clientes.js:~575`, `productos.js:~511`) — El router llama `render()` → `initEvents()` cada vez que el usuario navega a la página. `window.addEventListener` apila los listeners sin reemplazarlos: después de navegar a Clientes 5 veces hay 5 handlers activos y `loadClientes()` se llama 5 veces por cada import. Fix: guardar la referencia en `this._importDoneHandler`, hacer `removeEventListener` antes de registrarlo nuevamente.
- [x] **Parada duplicada en ruta de logística** (`logistica.js:~474`) — `secuencia_paradas.push(parada)` sin verificar si `parada.pedido_id` ya existía en el array. El usuario podía agregar el mismo pedido dos veces a la misma ruta. Fix: chequear con `.some(p => p.pedido_id === parada.pedido_id)` y mostrar `Toast.warning` si ya está.

**Archivos modificados:**
- `js/pages/pedidos.js` — exportCSV aplica todos los filtros avanzados
- `js/pages/clientes.js` — import-done handler con remove/add para evitar acumulación
- `js/pages/productos.js` — import-done handler con remove/add para evitar acumulación
- `js/pages/logistica.js` — deduplicación de paradas al agregar a ruta

---

## ❌ FASES PENDIENTES

## 🔧 GAPS ADICIONALES V (segunda auditoría profunda — sesión 15)

### 🔴 Altos — features construidas pero incompletas

- [x] **Sistema de notificaciones sin emisores** — `notifications.js` tiene polling, badge, panel y marcar como leída completos, pero ningún módulo JS hace `supabase.from('notificaciones').insert()`. La tabla siempre estará vacía y la campana no sirve. Fix: crear `js/utils/notif.js` con `notifyManagers()` y dispararlo en: nuevo pedido, cancelar pedido, devolución registrada, stock bajo mínimo al ajustar. Afecta: `pedidos.js`, `clientes.js`, `productos.js`.
- [x] **Pipeline no sincroniza `estado_lead` del cliente** — Al mover una tarjeta del pipeline a `primer_pedido` o `cliente_activo`, el campo `clientes.estado_lead` no cambia. Un prospecto puede estar `cliente_activo` en el pipeline y `prospecto` en la tabla clientes. El semáforo, filtros y reportes de clientes quedan desincronizados. Fix: al soltar en `primer_pedido`/`cliente_activo`, hacer `UPDATE clientes SET estado_lead = 'activo'` para el `cliente_id` de la oportunidad. Afecta: `pipeline.js` → drop handler y `saveOportunidad()`.

### 🟡 Medios — datos incorrectos o UX incompleta

- [x] **"Quitar parada" deja pedidos en estado `en_ruta` sin ruta** — `_bindParadaEvents` solo hace `UPDATE pedidos SET ruta_id = null`, sin restaurar el estado. Un pedido no entregado queda como `en_ruta` indefinidamente; `loadPedidosSinRuta()` filtra solo `pendiente|en_preparacion`, por lo que el pedido desaparece de logística. Fix: si la parada no está entregada, hacer `UPDATE pedidos SET ruta_id = null, estado = 'en_preparacion'`. Afecta: `logistica.js` → `_bindParadaEvents()`.
- [x] **`saveCobro` tiene la misma race condition que `saldo_pendiente` en pedidos** — Lee `this.clientes.find()` (cache en memoria) para calcular el nuevo saldo antes de escribir. Si hubo otros cobros o pedidos desde otra sesión, el saldo calculado es incorrecto. Fix: hacer SELECT fresco desde Supabase antes de calcular. Afecta: `clientes.js` → `saveCobro()`.
- [x] **Devoluciones siempre creadas como `aprobada`** — `saveDevolucion()` inserta con `estado: 'aprobada'` hardcodeado. No hay workflow: pendiente → aprobada/rechazada. El listado global muestra badges de tres estados pero no hay botones para cambiarlos. Fix: crear con `estado: 'pendiente'` y agregar botones Aprobar/Rechazar en el listado para `owner/admin/gerente`. Afecta: `pedidos.js` → `saveDevolucion()` y `openModalDevoluciones()`.

### 🟢 Menores — UX y seguridad

- [x] **Hoja de ruta imprimible sin monto a cobrar por parada** — El repartidor lleva el papel sin saber cuánto cobrar en cada parada. Fix: agregar campo `total` a `secuencia_paradas` al crear la parada, y mostrarlo en `imprimirHojaRuta()`. Afecta: `logistica.js`.
- [x] **Sin permisos definidos para cobros** — `permissions.js` no tiene entrada para `cobros`. El botón "Registrar pago" en la ficha del cliente aparece para cualquier rol que pueda ver clientes (incluyendo repartidor). Fix: agregar `cobros: { crear: [...] }` en `permissions.js` y validar con `Permissions.can('crear', 'cobros')` en `clientes.js`. Afecta: `permissions.js`, `clientes.js`.

---

## ❌ FASES PENDIENTES

### FASE 7 - Comunicación e Integraciones
- [ ] Timeline de interacciones por cliente (tabla `interacciones` ya existe)
- [ ] Integración WhatsApp Business API (Twilio)
- [ ] Click-to-Call telefonía
- [ ] Email tracking (SendGrid)
- [ ] Notificaciones push (Firebase)

### FASE 8 - Automatización e IA
- [ ] Workflows automáticos (seguimientos, asignación por zona)
- [ ] Alertas inteligentes automáticas
- [ ] Sugerencias de venta cruzada (IA)
- [ ] Optimización de rutas (IA)

### Mejoras completadas (prioridad media) ✅
- [x] Notificaciones in-app: campana + badge + panel desplegable + polling 60s
- [x] Exportación CSV de listados (Clientes, Productos, Pedidos) con filtros
- [x] Validaciones visuales inline en formularios (Clientes, Productos)

### Mejoras completadas (prioridad baja) ✅
- [x] Ordenar tablas por columna (click en header) — Clientes, Productos, Pedidos. Server-side con `.order()` dinámico, clases `.th-sortable`, flechas ↑ ↓ ⇕
- [x] Empty states mejorados — CSS `.empty-state` + `.btn-loading` / `.spinner-inline` para loading states y protección doble-click
- [x] Loading states y protección doble-click — `btn.disabled = true` + clase `btn-loading`
- [x] Manejo robusto de errores — `js/utils/error-handler.js`: detecta offline/online, sesión expirada, rate limiting. Banner persistente y redirect automático al login
- [x] Búsqueda global desde navbar — `js/utils/global-search.js`: `Ctrl+K`, busca en paralelo clientes/productos/pedidos, debounce 300ms, navegación directa
- [x] Exportación de reportes a PDF — Botón PDF en Reportes. Genera con jsPDF: KPIs + tablas del tab activo, footer paginado
- [x] Filtros avanzados combinados — Panel colapsable "Avanzados" en Clientes/Productos/Pedidos con presets (localStorage) y badges removibles:
  - Clientes: fecha última compra, scoring mín/máx, vendedor
  - Productos: precio mín/máx, activo/inactivo
  - Pedidos: fecha desde/hasta, vendedor, total mín/máx
- [x] Flujo de onboarding — `js/utils/onboarding.js`: 3 pasos para orgs nuevas (0 clientes + 0 productos), se guarda en localStorage
