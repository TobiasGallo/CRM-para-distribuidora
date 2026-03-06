/* ========================================
   ASISTENTE IA - Groq (Llama 3)
   API key guardada en Supabase: organizaciones.gemini_api_key
   ======================================== */

import supabase from '../config/supabase.js';

const MODEL = 'llama3-groq-70b-8192-tool-use-preview';
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM = `Sos el asistente IA integrado en un CRM para distribuidoras. Tu nombre es "Asistente".
Respondé siempre en español, de forma clara y concisa. Usá los datos reales de la empresa consultando las funciones disponibles.

El CRM tiene estas secciones:
- Dashboard: KPIs generales (ventas, pedidos, clientes activos, cobros pendientes)
- Clientes: tipos (HORECA, Supermercado, Tienda, Mayorista), estados (activo, prospecto, inactivo, negociacion, en_pausa)
- Productos: catálogo con stock, precios y categorías
- Pedidos: estados (pendiente, en_preparacion, en_ruta, entregado, cancelado, con_incidencia)
- Pipeline: oportunidades de venta en tablero kanban por etapas
- Rutas: planificación de reparto y logística
- Reportes: análisis de ventas, vendedores, productos top, morosidad, clientes inactivos
- Configuración: datos de la organización, usuarios, listas de precios

Cuando pregunten por datos como ventas, clientes, pedidos, stock o pipeline, usá las funciones para obtener datos actualizados.
Para preguntas sobre cómo usar el sistema, explicá claramente.`;

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_ventas',
      description: 'Obtiene resumen de ventas del período. Usar para preguntas sobre facturación, ingresos, ventas totales.',
      parameters: {
        type: 'object',
        properties: {
          dias: { type: 'integer', description: 'Días hacia atrás (30, 60, 90, 365). Default: 30.' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_ranking_vendedores',
      description: 'Obtiene ranking de vendedores por ventas. Usar para preguntas sobre rendimiento, quién vendió más.',
      parameters: {
        type: 'object',
        properties: {
          dias: { type: 'integer', description: 'Días hacia atrás. Default: 30.' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_pedidos',
      description: 'Obtiene resumen de pedidos. Usar para preguntas sobre pedidos pendientes, en ruta, entregados.',
      parameters: {
        type: 'object',
        properties: {
          estado: { type: 'string', description: 'Estado: pendiente, en_preparacion, en_ruta, entregado, cancelado. Opcional.' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_clientes',
      description: 'Obtiene información de clientes. Usar para preguntas sobre cantidad, activos, inactivos, prospectos.',
      parameters: {
        type: 'object',
        properties: {
          estado: { type: 'string', description: 'Estado: activo, inactivo, prospecto, negociacion, en_pausa. Opcional.' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_stock_bajo',
      description: 'Obtiene productos con stock por debajo del mínimo. Usar para preguntas sobre inventario crítico.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_pipeline',
      description: 'Obtiene resumen del pipeline de oportunidades de venta por etapa y valor total.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_deudas',
      description: 'Obtiene clientes con saldo pendiente (morosos). Usar para preguntas sobre cobros, deudas.',
      parameters: { type: 'object', properties: {} }
    }
  }
];

async function runTool(name, args) {
  const orgId = window.App?.organization?.id;
  const moneda = window.App?.organization?.moneda || 'ARS';
  const fmt = (n) => `${moneda} ${Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;
  const dias = args?.dias || 30;
  const getDesde = () => { const d = new Date(); d.setDate(d.getDate() - dias); return d.toISOString(); };

  try {
    if (name === 'get_ventas') {
      const { data } = await supabase.from('pedidos')
        .select('total, estado')
        .eq('organizacion_id', orgId)
        .neq('estado', 'cancelado')
        .gte('created_at', getDesde());
      const total = data?.reduce((s, p) => s + (p.total || 0), 0) || 0;
      const entregados = data?.filter(p => p.estado === 'entregado').length || 0;
      return `Ventas últimos ${dias} días: ${fmt(total)} en ${data?.length || 0} pedidos (${entregados} entregados).`;
    }

    if (name === 'get_ranking_vendedores') {
      const { data } = await supabase.from('pedidos')
        .select('total, vendedor:usuarios(nombre)')
        .eq('organizacion_id', orgId)
        .neq('estado', 'cancelado')
        .gte('created_at', getDesde());
      const map = {};
      data?.forEach(p => { const n = p.vendedor?.nombre || 'Sin asignar'; map[n] = (map[n] || 0) + (p.total || 0); });
      const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
      if (!sorted.length) return 'Sin datos de vendedores para este período.';
      return `Ranking últimos ${dias} días:\n` + sorted.map(([n, t], i) => `${i + 1}. ${n}: ${fmt(t)}`).join('\n');
    }

    if (name === 'get_pedidos') {
      let q = supabase.from('pedidos').select('estado, total').eq('organizacion_id', orgId);
      if (args?.estado) q = q.eq('estado', args.estado);
      const { data } = await q;
      const map = {};
      data?.forEach(p => { map[p.estado] = (map[p.estado] || 0) + 1; });
      const total = data?.reduce((s, p) => s + (p.total || 0), 0) || 0;
      const lineas = Object.entries(map).map(([e, n]) => `${e}: ${n}`).join(', ');
      return `Pedidos: ${data?.length || 0} — ${lineas || 'ninguno'}. Valor total: ${fmt(total)}.`;
    }

    if (name === 'get_clientes') {
      let q = supabase.from('clientes').select('estado_lead, tipo_cliente').eq('organizacion_id', orgId);
      if (args?.estado) q = q.eq('estado_lead', args.estado);
      const { data } = await q;
      const porEstado = {}, porTipo = {};
      data?.forEach(c => {
        porEstado[c.estado_lead] = (porEstado[c.estado_lead] || 0) + 1;
        porTipo[c.tipo_cliente] = (porTipo[c.tipo_cliente] || 0) + 1;
      });
      const estados = Object.entries(porEstado).map(([e, n]) => `${e}: ${n}`).join(', ');
      const tipos = Object.entries(porTipo).map(([t, n]) => `${t}: ${n}`).join(', ');
      return `Clientes: ${data?.length || 0} total.\nPor estado: ${estados || 'sin datos'}.\nPor tipo: ${tipos || 'sin datos'}.`;
    }

    if (name === 'get_stock_bajo') {
      const { data } = await supabase.from('productos')
        .select('nombre, sku, stock_actual, stock_minimo')
        .eq('organizacion_id', orgId)
        .eq('activo', true);
      const bajos = (data || []).filter(p => (p.stock_actual || 0) <= (p.stock_minimo || 0));
      if (!bajos.length) return 'No hay productos con stock bajo actualmente.';
      return `Productos con stock bajo (${bajos.length}):\n` + bajos.slice(0, 10).map(p => `- ${p.nombre} (${p.sku || 'sin SKU'}): ${p.stock_actual} uds (mín: ${p.stock_minimo})`).join('\n');
    }

    if (name === 'get_pipeline') {
      const { data } = await supabase.from('pipeline_oportunidades')
        .select('etapa, valor_estimado')
        .eq('organizacion_id', orgId);
      const map = {};
      data?.forEach(o => { if (!map[o.etapa]) map[o.etapa] = { n: 0, v: 0 }; map[o.etapa].n++; map[o.etapa].v += o.valor_estimado || 0; });
      const total = data?.reduce((s, o) => s + (o.valor_estimado || 0), 0) || 0;
      const lineas = Object.entries(map).map(([e, v]) => `${e}: ${v.n} ops (${fmt(v.v)})`).join('\n');
      return `Pipeline: ${data?.length || 0} oportunidades, valor total ${fmt(total)}.\n${lineas || 'Sin etapas.'}`;
    }

    if (name === 'get_deudas') {
      const { data } = await supabase.from('clientes')
        .select('nombre_establecimiento, saldo_pendiente')
        .eq('organizacion_id', orgId)
        .gt('saldo_pendiente', 0)
        .order('saldo_pendiente', { ascending: false })
        .limit(10);
      if (!data?.length) return 'No hay clientes con saldo pendiente.';
      const total = data.reduce((s, c) => s + (c.saldo_pendiente || 0), 0);
      return `Clientes con deuda (top ${data.length}):\n` + data.map(c => `- ${c.nombre_establecimiento}: ${fmt(c.saldo_pendiente)}`).join('\n') + `\nTotal: ${fmt(total)}`;
    }
  } catch (err) {
    return `Error al consultar datos: ${err.message}`;
  }

  return 'Función no disponible.';
}

async function askGroq(messages, apiKey) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools: TOOLS,
      tool_choice: 'auto',
      temperature: 0.3,
      max_tokens: 1024
    })
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Groq ${res.status}: ${body?.error?.message || res.statusText}`);
  }
  return res.json();
}

const AiChat = {
  isOpen: false,
  messages: [], // formato OpenAI: [{role, content}]
  el: null,

  init() {
    const root = document.createElement('div');
    root.id = 'ai-chat-root';
    root.innerHTML = this._buildHTML();
    document.body.appendChild(root);
    this.el = root;

    root.querySelector('#ai-chat-btn').addEventListener('click', () => this.toggle());
    root.querySelector('#ai-chat-close').addEventListener('click', () => this.toggle());
    root.querySelector('#ai-chat-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = root.querySelector('#ai-chat-input');
      const text = input.value.trim();
      if (text) { input.value = ''; this.send(text); }
    });
  },

  toggle() {
    this.isOpen = !this.isOpen;
    this.el.querySelector('#ai-chat-panel').classList.toggle('open', this.isOpen);
    if (this.isOpen && !this.messages.length) {
      this._addBubble('assistant', '¡Hola! Soy tu asistente del CRM. Puedo consultarte datos de ventas, clientes, pedidos, stock y más. ¿En qué te ayudo?');
    }
    if (this.isOpen) setTimeout(() => this.el.querySelector('#ai-chat-input').focus(), 150);
  },

  async send(text) {
    const apiKey = window.App?.organization?.gemini_api_key;
    if (!apiKey) {
      this._addBubble('assistant', '⚠️ La API key no está configurada. Ejecutá el SQL en Supabase para activar el asistente.');
      return;
    }

    this._addBubble('user', text);
    this.messages.push({ role: 'user', content: text });

    const typingEl = this._addTyping();

    try {
      const fullMessages = [{ role: 'system', content: SYSTEM }, ...this.messages];
      let response = await askGroq(fullMessages, apiKey);
      let msg = response.choices?.[0]?.message;

      // Loop de function calling
      let iterations = 0;
      while (iterations++ < 5 && msg?.tool_calls?.length) {
        this.messages.push({ role: 'assistant', content: msg.content || null, tool_calls: msg.tool_calls });

        for (const call of msg.tool_calls) {
          let args = {};
          try { args = JSON.parse(call.function.arguments || '{}'); } catch {}
          const result = await runTool(call.function.name, args);
          this.messages.push({ role: 'tool', tool_call_id: call.id, content: result });
        }

        const next = await askGroq([{ role: 'system', content: SYSTEM }, ...this.messages], apiKey);
        msg = next.choices?.[0]?.message;
      }

      const reply = msg?.content || 'No pude generar una respuesta. Intentá de nuevo.';
      this.messages.push({ role: 'assistant', content: reply });
      typingEl.remove();
      this._addBubble('assistant', reply);

    } catch (err) {
      typingEl.remove();
      this._addBubble('assistant', `❌ Error: ${err.message}`);
      console.error('[AiChat]', err);
    }
  },

  _addBubble(role, text) {
    const list = this.el.querySelector('#ai-chat-messages');
    const div = document.createElement('div');
    div.className = `ai-msg ai-msg-${role === 'user' ? 'user' : 'model'}`;
    div.innerHTML = String(text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
  },

  _addTyping() {
    const list = this.el.querySelector('#ai-chat-messages');
    const div = document.createElement('div');
    div.className = 'ai-msg ai-msg-model ai-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
    return div;
  },

  _buildHTML() {
    return `
      <button id="ai-chat-btn" title="Asistente IA">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
      <div id="ai-chat-panel">
        <div id="ai-chat-header">
          <div style="display:flex;align-items:center;gap:10px;">
            <div id="ai-chat-avatar">IA</div>
            <div>
              <div style="font-weight:600;font-size:14px;line-height:1.2;">Asistente CRM</div>
              <div style="font-size:11px;opacity:0.75;">Llama 3 · en línea</div>
            </div>
          </div>
          <button id="ai-chat-close" title="Cerrar">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div id="ai-chat-messages"></div>
        <form id="ai-chat-form" autocomplete="off">
          <input id="ai-chat-input" type="text" placeholder="Preguntá algo..." maxlength="500" />
          <button type="submit" title="Enviar">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>
    `;
  }
};

export default AiChat;
