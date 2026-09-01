import { NextRequest, NextResponse } from 'next/server'
import { MOCK_RESTAURANTS, MOCK_PRODUCTS } from '@/lib/supabase/mock-fallback'

export const dynamic = 'force-dynamic'

interface MonthlyReportData {
  slug: string
  restaurant_name: string
  month: string
  generated_at: string
  plan_tier: string
  kpis: {
    total_revenue_eur: number
    total_orders_count: number
    average_ticket_eur: number
    total_guests_served: number
    table_turnover_rate: number
    monthly_growth_rate_pct: number
    service_efficiency_score: number
  }
  congestion_hours: {
    peak_window: string
    bottleneck_summary: string
    distribution: Array<{
      time_slot: string
      label: string
      order_count: number
      revenue_eur: number
      percentage: number
      congestion_level: 'low' | 'medium' | 'high' | 'peak'
    }>
  }
  table_times: {
    avg_waiter_validation_sec: number
    avg_kitchen_prep_sec: number
    avg_delivery_sec: number
    avg_table_stay_min: number
    time_saved_per_table_min: number
    total_hours_saved_month: number
  }
  bcg_matrix: {
    summary: string
    stars: Array<{ id: string; name: string; sales_count: number; revenue_eur: number; category: string }>
    cash_cows: Array<{ id: string; name: string; sales_count: number; revenue_eur: number; category: string }>
    question_marks: Array<{ id: string; name: string; sales_count: number; revenue_eur: number; category: string }>
    dogs: Array<{ id: string; name: string; sales_count: number; revenue_eur: number; category: string }>
  }
  terrace_extra_revenue: {
    second_rounds_drinks_eur: number
    desserts_coffee_upselling_eur: number
    total_extra_revenue_eur: number
    incremental_ticket_pct: number
    summary: string
  }
  ai_suggestions: Array<{
    id: string
    category: 'staffing' | 'menu_engineering' | 'upselling' | 'kitchen_speed'
    title: string
    description: string
    estimated_impact_eur: string
    priority: 'high' | 'medium' | 'critical'
  }>
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'
    const month = searchParams.get('month') || '2026-09'

    const restInfo = MOCK_RESTAURANTS[slug] || MOCK_RESTAURANTS['burger-gourmet']
    const products = MOCK_PRODUCTS[slug] || MOCK_PRODUCTS['burger-gourmet'] || []

    // 1. Datos Base Calculados según el Perfil Gastronómico
    let baseRevenue = 18450.0
    let baseOrders = 542
    let baseAvgTicket = 34.04
    let guestsMultiplier = 2.4

    if (slug === 'taperia-casco-antigo') {
      baseRevenue = 22180.0
      baseOrders = 680
      baseAvgTicket = 32.61
      guestsMultiplier = 2.6
    } else if (slug === 'terraza-malecon') {
      baseRevenue = 16920.0
      baseOrders = 710
      baseAvgTicket = 23.83
      guestsMultiplier = 2.2
    }

    // 2. Franjas Horarias de Mayor Congestión
    const congestionDistribution = [
      {
        time_slot: '13:00 - 16:30',
        label: 'Comida / Almuerzo',
        order_count: Math.round(baseOrders * 0.44),
        revenue_eur: Number((baseRevenue * 0.46).toFixed(2)),
        percentage: 44,
        congestion_level: 'high' as const,
      },
      {
        time_slot: '17:00 - 20:00',
        label: 'Tardeo & Picoteo Terraza',
        order_count: Math.round(baseOrders * 0.16),
        revenue_eur: Number((baseRevenue * 0.14).toFixed(2)),
        percentage: 16,
        congestion_level: 'medium' as const,
      },
      {
        time_slot: '20:30 - 23:30',
        label: 'Cenas & Cócteles',
        order_count: Math.round(baseOrders * 0.36),
        revenue_eur: Number((baseRevenue * 0.38).toFixed(2)),
        percentage: 36,
        congestion_level: 'peak' as const,
      },
      {
        time_slot: 'Otras Horas',
        label: 'Apertura / Desayunos',
        order_count: Math.round(baseOrders * 0.04),
        revenue_eur: Number((baseRevenue * 0.02).toFixed(2)),
        percentage: 4,
        congestion_level: 'low' as const,
      },
    ]

    // 3. Matriz BCG Dinámica clasificada por productos
    const starsList = products.slice(0, 2).map((p, idx) => ({
      id: p.id,
      name: p.name,
      sales_count: 140 - idx * 25,
      revenue_eur: Number(((140 - idx * 25) * p.price).toFixed(2)),
      category: 'Plato Estrella (Alta Rotación y Alto Margen)',
    }))

    const cashCowsList = products.slice(2, 4).map((p, idx) => ({
      id: p.id,
      name: p.name,
      sales_count: 180 - idx * 30,
      revenue_eur: Number(((180 - idx * 30) * p.price).toFixed(2)),
      category: 'Vaca Lechera (Volumen constante de ventas)',
    }))

    const questionMarksList = products.slice(4, 6).map((p, idx) => ({
      id: p.id,
      name: p.name,
      sales_count: 45 - idx * 10,
      revenue_eur: Number(((45 - idx * 10) * p.price).toFixed(2)),
      category: 'Dilema / Oportunidad (Alto margen, potenciar rotación)',
    }))

    const dogsList = products.slice(6, 8).map((p, idx) => ({
      id: p.id,
      name: p.name,
      sales_count: 14 - idx * 4,
      revenue_eur: Number(((14 - idx * 4) * p.price).toFixed(2)),
      category: 'Baja Rotación (Candidato a reformulación)',
    }))

    // 4. Ingresos Extras de Terraza y Re-pedidos QR
    const secondRounds = Number((baseRevenue * 0.124).toFixed(2))
    const dessertUpselling = Number((baseRevenue * 0.088).toFixed(2))
    const totalExtra = Number((secondRounds + dessertUpselling).toFixed(2))

    // 5. Sugerencias Inteligentes por IA
    const aiSuggestions = [
      {
        id: 'sug-1',
        category: 'staffing' as const,
        title: 'Refuerzo de mozos en franja pico de 14:00 a 15:30',
        description:
          'El 44% de los pedidos de comida se concentran en un margen de 90 minutos. Reducir el tiempo de validación a menos de 1 minuto aumentará la rotación de mesas en un +12%.',
        estimated_impact_eur: '+840 €/mes',
        priority: 'high' as const,
      },
      {
        id: 'sug-2',
        category: 'upselling' as const,
        title: 'Activar botón "Repetir Bebidas" en Tardeo y Terraza',
        description:
          'Las mesas de terraza muestran un 38% de intención de segunda ronda. El aviso interactivo tras 20 minutos de consumo incrementa el ticket medio en +3,80 €.',
        estimated_impact_eur: '+1.250 €/mes',
        priority: 'critical' as const,
      },
      {
        id: 'sug-3',
        category: 'menu_engineering' as const,
        title: `Revisar precio o presentación de "${dogsList[0]?.name || 'Plato de Baja Rotación'}"`,
        description:
          'Este plato registra una baja demanda respecto a su coste de mise en place. Se recomienda cambiarlo por una sugerencia de temporada o ajustar su visibilidad en carta.',
        estimated_impact_eur: '+420 €/mes',
        priority: 'medium' as const,
      },
    ]

    const report: MonthlyReportData = {
      slug,
      restaurant_name: restInfo.name,
      month,
      generated_at: new Date().toISOString(),
      plan_tier: 'Plan Full & Suite (99€/mes)',
      kpis: {
        total_revenue_eur: baseRevenue,
        total_orders_count: baseOrders,
        average_ticket_eur: baseAvgTicket,
        total_guests_served: Math.round(baseOrders * guestsMultiplier),
        table_turnover_rate: 2.4,
        monthly_growth_rate_pct: 14.8,
        service_efficiency_score: 94.2,
      },
      congestion_hours: {
        peak_window: '21:00 - 22:30 (Cenas de Viernes a Domingo)',
        bottleneck_summary: 'El 80% de la facturación se concentra en las franjas de Comida (13:00-16:30) y Cenas (20:30-23:30).',
        distribution: congestionDistribution,
      },
      table_times: {
        avg_waiter_validation_sec: 48,
        avg_kitchen_prep_sec: 740,
        avg_delivery_sec: 95,
        avg_table_stay_min: 46,
        time_saved_per_table_min: 21.5,
        total_hours_saved_month: Math.round((baseOrders * 21.5) / 60),
      },
      bcg_matrix: {
        summary: 'Clasificación estratégica del catálogo para maximizar el margen de explotación en cocina.',
        stars: starsList,
        cash_cows: cashCowsList,
        question_marks: questionMarksList,
        dogs: dogsList,
      },
      terrace_extra_revenue: {
        second_rounds_drinks_eur: secondRounds,
        desserts_coffee_upselling_eur: dessertUpselling,
        total_extra_revenue_eur: totalExtra,
        incremental_ticket_pct: 21.2,
        summary: `La función de pedidos QR y re-orden capturó ${totalExtra} € adicionales en el mes (+21.2% de facturación incremental).`,
      },
      ai_suggestions: aiSuggestions,
    }

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
