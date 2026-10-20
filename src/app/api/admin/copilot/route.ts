import { NextRequest, NextResponse } from 'next/server'
import { verifyStaffRequest } from '@/lib/auth/pin-security'

export const dynamic = 'force-dynamic'

interface CopilotAction {
  label: string
  action: 'switch_tab' | 'open_new_product'
  targetTab?: 'products' | 'categories' | 'daily_menu' | 'ai_import' | 'loyalty'
}

interface LocalKnowledgeTopic {
  keywords: string[]
  reply: string
  actions?: CopilotAction[]
}

const LOCAL_KNOWLEDGE: LocalKnowledgeTopic[] = [
  {
    keywords: ['agotado', 'disponible', 'disponibilidad', 'stock', 'pausar', 'quitar'],
    reply: 'Para marcar un plato como agotado al instante, entra en la pestaña **Carta & Platos** y pulsa el interruptor de encendido/apagado (botón verde/rojo) que aparece en la esquina de la tarjeta del plato. El cambio se sincroniza en tiempo real en la carta QR de los comensales.',
    actions: [
      { label: 'Ir a Carta & Platos', action: 'switch_tab', targetTab: 'products' },
    ],
  },
  {
    keywords: ['precio', 'cambiar precio', 'subir precio', 'editar plato', 'modificar plato', 'descripcion', 'foto'],
    reply: 'Puedes editar el precio, nombre, descripción o foto de cualquier plato pulsando el botón de **Editar (icono de lápiz)** en su tarjeta. Se abrirá el formulario completo donde puedes actualizar los datos y guardar los cambios.',
    actions: [
      { label: 'Ver Carta de Platos', action: 'switch_tab', targetTab: 'products' },
    ],
  },
  {
    keywords: ['nuevo plato', 'crear plato', 'añadir plato', 'agregar plato', 'poner plato', 'nuevo'],
    reply: 'Para añadir un plato nuevo, pulsa el botón cian **+ Añadir Nuevo Plato** situado en la parte superior del catálogo. Podrás indicar su nombre, categoría, precio, descripción, alérgenos y foto.',
    actions: [
      { label: '➕ Crear Nuevo Plato', action: 'open_new_product' },
      { label: 'Ver Carta de Platos', action: 'switch_tab', targetTab: 'products' },
    ],
  },
  {
    keywords: ['alergeno', 'alérgenos', 'gluten', 'lactosa', 'vegano', 'intolerancia', 'alergia'],
    reply: 'Dentro del modal de edición o creación de cada plato dispones del selector oficial de los **14 alérgenos de la Unión Europea** (gluten, lácteos, huevos, frutos secos, etc.). Los alérgenos marcados aparecerán con insignias claras en la carta digital del comensal.',
    actions: [
      { label: 'Ver Carta de Platos', action: 'switch_tab', targetTab: 'products' },
    ],
  },
  {
    keywords: ['categoria', 'categoría', 'seccion', 'sección', 'ordenar', 'reordenar', 'organizar'],
    reply: 'En la pestaña **Categorías** puedes crear nuevas secciones (ej. Entrantes, Carnes, Postres), renombrarlas o cambiar su orden de visualización en la carta usando las flechas de posición.',
    actions: [
      { label: 'Gestionar Categorías', action: 'switch_tab', targetTab: 'categories' },
    ],
  },
  {
    keywords: ['ia', 'importar', 'escanear', 'digitalizar', 'carta fisica', 'pdf', 'foto carta', 'digitalizador'],
    reply: 'El **Digitalizador con IA** te permite pegar el texto de tu carta física o menú en bruto. La inteligencia artificial detectará automáticamente los nombres, precios, descripciones y alérgenos para cargarlos en Fluxo en un solo clic.',
    actions: [
      { label: 'Abrir Digitalizador con IA', action: 'switch_tab', targetTab: 'ai_import' },
    ],
  },
  {
    keywords: ['menu del dia', 'menú del día', 'menu', 'primero', 'segundo', 'almuerzo', 'laborables'],
    reply: 'En la pestaña **Menú del Día** puedes configurar los primeros platos, segundos, postre/bebida, precio cerrado y seleccionar qué días de la semana está activo. Los comensales solo lo verán en sus móviles durante los días y turnos autorizados.',
    actions: [
      { label: 'Configurar Menú del Día', action: 'switch_tab', targetTab: 'daily_menu' },
    ],
  },
  {
    keywords: ['fidelizacion', 'fidelización', 'puntos', 'sellos', 'premio', 'recompensa', 'clientes', 'promocion'],
    reply: 'En la pestaña **Fidelización** puedes configurar la cartilla digital de sellos (ej. 1 sello cada 50€ de consumo y postre gratis al completar 5 sellos). También puedes consultar la lista de clientes, restablecer puntos a 0 o eliminar perfiles.',
    actions: [
      { label: 'Ir a Fidelización & Clientes', action: 'switch_tab', targetTab: 'loyalty' },
    ],
  },
  {
    keywords: ['csv', 'excel', 'exportar', 'descargar clientes', 'base de datos', 'correos', 'emails'],
    reply: 'Puedes descargar la base de datos de comensales fidelizados en formato CSV con un clic pulsando el botón **Exportar CSV** en la pestaña de Fidelización.',
    actions: [
      { label: 'Ir a Fidelización & Exportar', action: 'switch_tab', targetTab: 'loyalty' },
    ],
  },
  {
    keywords: ['mozo', 'cocina', 'comandero', 'kds', 'pedido', 'comanda', 'validar'],
    reply: 'El flujo de pedidos de Fluxo funciona así: el comensal pide desde la carta QR (`pending_validation`), el mozo valida la comanda desde el Comandero (`pending`), cocina la prepara en la pantalla táctil (`preparing`) y al terminar avisa al mozo para entregarla en sala (`ready` / `delivered`).',
    actions: [
      { label: 'Ver Carta de Platos', action: 'switch_tab', targetTab: 'products' },
    ],
  },
]

function getLocalResponse(query: string, currentTab?: string): { reply: string; actions: CopilotAction[] } {
  const norm = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  for (const topic of LOCAL_KNOWLEDGE) {
    if (topic.keywords.some(kw => norm.includes(kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))) {
      return {
        reply: topic.reply,
        actions: topic.actions || [],
      }
    }
  }

  // Respuesta por defecto con accesos rápidos
  return {
    reply: 'Soy **Fluxo Copilot**, tu asistente de gestión gastronómica. Puedo ayudarte a gestionar platos, cambiar precios, marcar productos agotados, importar tu carta física con IA, configurar el menú del día o gestionar el programa de sellos y clientes fidelizados. ¿En qué sección te gustaría trabajar?',
    actions: [
      { label: '🍽️ Ver Carta & Platos', action: 'switch_tab', targetTab: 'products' },
      { label: '➕ Crear Nuevo Plato', action: 'open_new_product' },
      { label: '📝 Digitalizador IA', action: 'switch_tab', targetTab: 'ai_import' },
      { label: '⭐ Programa de Fidelización', action: 'switch_tab', targetTab: 'loyalty' },
    ],
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug = 'burger-gourmet', message = '', history = [], currentTab = 'products' } = body

    // 1. Verificación de seguridad de administrador
    if (!verifyStaffRequest(req, slug, ['admin'])) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado al asistente de administración' },
        { status: 401 }
      )
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'El mensaje de consulta no puede estar vacío' },
        { status: 400 }
      )
    }

    const cleanMessage = message.trim()

    // 2. Comprobar si existe GEMINI_API_KEY configurada para respuesta generativa
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (geminiApiKey) {
      try {
        const systemInstruction = `Eres 'Fluxo Copilot', el asistente inteligente de dirección y gestión gastronómica para el dueño del restaurante '${slug}' dentro del panel de administración de Fluxo.
Tu labor es responder dudas sobre la administración del restaurante de forma concisa, ejecutiva, directa y práctica, sin tecnicismos innecesarios ni analogías largas.
Áreas del sistema Fluxo que dominas:
1. 'products': Catálogo de platos, precios, disponibilidad rápida (on/off agotado), alérgenos UE y fotos.
2. 'categories': Organización y orden numérico de secciones de carta.
3. 'daily_menu': Menú del día por días de la semana, primeros, segundos y postre.
4. 'ai_import': Digitalizador de cartas con IA a partir de texto o escaneos.
5. 'loyalty': Programa de fidelización, cartilla de sellos, puntos, reseñas de Google Maps y exportación CSV.

Reglas de respuesta:
- Sé breve y claro (máximo 2 a 3 frases explicativas).
- Recomienda siempre la pestaña adecuada del panel.
- Termina indicando el siguiente paso exacto.`

        const contents = [
          ...history.slice(-4).map((h: any) => ({
            role: h.sender === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }],
          })),
          {
            role: 'user',
            parts: [{ text: `Pestaña actual: '${currentTab}'. Consulta del dueño: "${cleanMessage}"` }],
          },
        ]

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemInstruction }] },
              contents,
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 350,
              },
            }),
          }
        )

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json()
          const candidateText =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text
          if (candidateText) {
            // Deducir acciones interactivas basadas en el texto o consulta
            const localFallback = getLocalResponse(cleanMessage, currentTab)
            return NextResponse.json({
              success: true,
              source: 'gemini',
              reply: candidateText.trim(),
              actions: localFallback.actions,
            })
          }
        }
      } catch (geminiErr) {
        console.warn('[Copilot API] Fallback to local knowledge engine:', geminiErr)
      }
    }

    // 3. Motor local inteligente con base de conocimiento gastronómico instantánea
    const localResult = getLocalResponse(cleanMessage, currentTab)
    return NextResponse.json({
      success: true,
      source: 'local_engine',
      reply: localResult.reply,
      actions: localResult.actions,
    })
  } catch (error: any) {
    console.error('[POST /api/admin/copilot] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno en el asistente copilot' },
      { status: 500 }
    )
  }
}
