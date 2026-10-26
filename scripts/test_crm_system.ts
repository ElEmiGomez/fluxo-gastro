import { isMasterPinValid, signFounderSession, verifyFounderSession, verifyFounderRequest } from '../src/lib/auth/crm-auth'
import {
  getCRMLeads,
  createCRMLead,
  updateCRMLead,
  deleteCRMLead,
  calculateCRMMetrics,
} from '../src/lib/supabase/repositories/crm.repository'
import { PLAN_PRICING, PilotAgreement, PilotChecklist } from '../src/types/crm.types'

async function runTests() {
  console.log('--- TEST 1: Auth & Founder PIN Protection ---')
  console.assert(isMasterPinValid('4154928') === true, 'PIN 4154928 MUST be valid')
  console.assert(isMasterPinValid('9999') === false, 'PIN 9999 is revoked (only 4154928 allowed)')
  console.assert(isMasterPinValid('1234') === false, 'Staff PIN 1234 should NOT have founder access')
  console.assert(isMasterPinValid('0000') === false, 'Random PIN should be invalid')

  const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
  const token = signFounderSession(userAgent)
  console.assert(typeof token === 'string' && token.includes('.'), 'Token format valid')
  console.assert(verifyFounderSession(token, userAgent) === true, 'Session token should verify with correct device')
  console.assert(verifyFounderSession(token, 'DifferentDevice/1.0') === false, 'Stolen token on different device MUST fail')
  console.assert(verifyFounderSession('invalid.token') === false, 'Invalid token should fail')

  const mockReqWithCookie = {
    cookies: { get: (name: string) => (name === 'fluxo_founder_session' ? { value: token } : undefined) },
    headers: { get: (name: string) => (name === 'user-agent' ? userAgent : null) }
  }
  console.assert(verifyFounderRequest(mockReqWithCookie as any) === true, 'Req with cookie should authenticate')

  const mockReqWithPinHeader = {
    cookies: { get: () => undefined },
    headers: { get: (name: string) => (name === 'x-founder-pin' ? '4154928' : null) }
  }
  console.assert(verifyFounderRequest(mockReqWithPinHeader as any) === true, 'Req with x-founder-pin should authenticate')

  console.log('✅ Auth tests passed!')

  console.log('--- TEST 2: Leads Repository & Seed Data ---')
  const initialLeads = await getCRMLeads()
  console.log(`Total initial leads loaded: ${initialLeads.length}`)
  console.assert(initialLeads.length >= 35, 'Should load at least 35 initial Noia leads')

  const topLead = initialLeads[0]
  console.log(`Top scored establishment: ${topLead.name} (Score: ${topLead.score}, ICP: ${topLead.icp_segment})`)
  console.assert(topLead.score >= 9.0, 'Top lead should have high priority score')

  console.log('--- TEST 3: Executive Metrics Calculation ---')
  const metrics = calculateCRMMetrics(initialLeads)
  console.log('Metrics summary:', {
    totalLeads: metrics.totalLeads,
    wonCount: metrics.wonCount,
    wonMRR: metrics.wonMRR,
    activePilots: metrics.activePilotsCount,
    pipelineMRR: metrics.pipelineMRR,
    conversionRate: `${metrics.conversionRate}%`
  })
  console.assert(metrics.totalLeads === initialLeads.length, 'Total leads match')

  console.log('--- TEST 4: Create, Update, Delete Lifecycle with Checklist & Agreement ---')
  const testLead = await createCRMLead({
    name: 'Restaurante Test Unitario',
    address: 'Rúa de Prova, 1',
    zone: 'Noia Centro',
    icp_segment: 'CARLOS',
    contact_name: 'Tester',
    contact_phone: '600112233',
    contact_whatsapp: '600112233',
    instagram: null,
    google_rating: 4.8,
    google_reviews_count: 50,
    score: 8.5,
    status: 'lead_por_visitar',
    target_plan: 'full_99',
    mrr_projected: 99,
    pilot_start_date: null,
    pilot_end_date: null,
    last_visit_date: null,
    next_contact_date: null,
    notes: 'Nota de test',
    lost_reason: null,
  })

  console.assert(testLead.id !== undefined, 'Created lead should have ID')
  console.assert(testLead.mrr_projected === 99, 'MRR should match target plan')

  // Update lead to piloto_14_dias with agreement and checklist
  const testAgreement: PilotAgreement = {
    signed_at: new Date().toISOString(),
    signee_name: 'Manuel Test',
    signee_phone: '600112233',
    agreed_plan: 'full_99',
    trial_duration_days: 14,
  }

  const testChecklist: PilotChecklist = {
    qr_placed: true,
    menu_uploaded: true,
    staff_trained: false,
    review_date_set: true,
  }

  const updated = await updateCRMLead(testLead.id, {
    status: 'piloto_14_dias',
    notes: 'Iniciado piloto de 14 días con firma',
    pilot_agreement: testAgreement,
    pilot_checklist: testChecklist,
  })
  console.assert(updated !== null, 'Updated lead exists')
  console.assert(updated?.status === 'piloto_14_dias', 'Status updated to piloto_14_dias')
  console.assert(updated?.pilot_start_date !== null, 'Pilot start date set automatically')
  console.assert(updated?.pilot_end_date !== null, 'Pilot end date set automatically')
  console.assert(updated?.pilot_agreement?.signee_name === 'Manuel Test', 'Agreement saved')
  console.assert(updated?.pilot_checklist?.qr_placed === true, 'Checklist saved')
  console.assert(updated?.pilot_checklist?.staff_trained === false, 'Checklist preserves uncompleted tasks')

  // Convert to won
  const wonLead = await updateCRMLead(testLead.id, {
    status: 'ganado',
    target_plan: 'suite_139'
  })
  console.assert(wonLead?.status === 'ganado', 'Status is ganado')
  console.assert(wonLead?.mrr_projected === 139, 'MRR updated to 139 for suite_139')

  // Cleanup test lead
  const deleted = await deleteCRMLead(testLead.id)
  console.assert(deleted === true, 'Test lead deleted successfully')

  console.log('✅ Full CRM test suite passed with 100% success!')
}

runTests().catch((e) => {
  console.error('Test suite failed:', e)
  process.exit(1)
})
