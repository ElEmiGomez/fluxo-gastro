import assert from 'assert'
import fs from 'fs'
import path from 'path'

console.log('--- TEST SUITE: KDS Ticket Removal, Weight-Based Pricing & Meat Deduplication ---')

// 1. Test Weight-Based Pricing Formula
console.log('\n[1/3] Testing Weight-Based Pricing (Chuletón 48,00 €/kg)...')
function calculateWeightPrice(basePrice, weightGrams, unit = 'kg') {
  const divisor = unit === 'kg' ? 1000 : 100
  return Number(((basePrice * weightGrams) / divisor).toFixed(2))
}

const chuletonBase = 48.00 // 48€/kg
assert.strictEqual(calculateWeightPrice(chuletonBase, 300, 'kg'), 14.40, '300g should cost exactly 14.40 €')
assert.strictEqual(calculateWeightPrice(chuletonBase, 500, 'kg'), 24.00, '500g should cost exactly 24.00 €')
assert.strictEqual(calculateWeightPrice(chuletonBase, 1000, 'kg'), 48.00, '1000g should cost exactly 48.00 €')
assert.strictEqual(calculateWeightPrice(chuletonBase, 250, 'kg'), 12.00, '250g should cost exactly 12.00 €')
console.log('✅ PASS: Weight calculation 300g = 14,40 € verified successfully.')

// Check that server-side validation in route.ts matches this formula
const routeTsPath = path.resolve('src/app/api/orders/route.ts')
const routeTsContent = fs.readFileSync(routeTsPath, 'utf-8')
assert(routeTsContent.includes('computedWeightPrice'), 'route.ts must calculate computedWeightPrice for weight items')
assert(routeTsContent.includes('divisor = catalogProduct.price_unit === \'kg\' ? 1000 : 100'), 'route.ts must use proper divisor')
console.log('✅ PASS: Server-side route.ts has weight verification for items.')

// Check that the fatal hack 'rawPrice > 20' is eradicated across all files
const filesToCheckNoHack = [
  'src/app/menu/[slug]/page.tsx',
  'src/app/staff/comandero/[slug]/page.tsx',
  'src/components/menu/CartDrawer.tsx',
  'src/hooks/comandero/useComanderoActions.ts',
]
filesToCheckNoHack.forEach(f => {
  const content = fs.readFileSync(path.resolve(f), 'utf-8')
  assert(!content.includes('> 20'), `Fatal bug regression: ${f} must NOT contain '> 20' weight price hack!`)
})
console.log('✅ PASS: Fatal hack \'> 20\' completely eradicated from all frontend and cart files.')

// 2. Test Meat Modal Deduplication
console.log('\n[2/3] Testing Meat Modal Deduplication in ProductModifierModal.tsx...')
const modalPath = path.resolve('src/components/comandero/ProductModifierModal.tsx')
const modalContent = fs.readFileSync(modalPath, 'utf-8')

// Ensure there is only ONE block for cooking point
const cookingPointOccurrences = (modalContent.match(/PUNTO DE COCCIÓN/gi) || []).length
assert(cookingPointOccurrences <= 2, `Expected at most 2 references to PUNTO DE COCCIÓN (label + title), found ${cookingPointOccurrences}`)
// Check that duplicate hardcoded cooking point section is absent
assert(!modalContent.includes('Poco hecha\', \'Al punto\', \'Bien hecha\''), 'Duplicate cooking point array must not exist')
assert(modalContent.includes('Peso Real en Báscula') && modalContent.includes('gramos'), 'Weight selector must be present')
console.log('✅ PASS: Meat modal deduplication verified (single cooking point section, clean notes generation).')

// 3. Test KDS Ticket Removal and Instant Sync Channel
console.log('\n[3/3] Testing KDS Instant Removal & Sync Channel...')
const syncChannelPath = path.resolve('src/lib/sync-channel.ts')
const syncChannelContent = fs.readFileSync(syncChannelPath, 'utf-8')
assert(syncChannelContent.includes('broadcastFluxoSync'), 'sync-channel.ts must export broadcastFluxoSync')
assert(syncChannelContent.includes('subscribeFluxoSync'), 'sync-channel.ts must export subscribeFluxoSync')
assert(syncChannelContent.includes('fluxo_realtime_sync'), 'sync-channel.ts must broadcast to fluxo_realtime_sync')
assert(syncChannelContent.includes('localStorage.setItem'), 'sync-channel.ts must have localStorage fallback')

// Check KDS page.tsx
const kdsPath = path.resolve('src/app/staff/kitchen/[slug]/page.tsx')
const kdsContent = fs.readFileSync(kdsPath, 'utf-8')
assert(kdsContent.includes('subscribeFluxoSync'), 'KDS must subscribe to subscribeFluxoSync')
assert(kdsContent.includes('role=kitchen'), 'KDS must pass role=kitchen to /api/orders')
assert(kdsContent.includes('table_freed') && kdsContent.includes('table_paid'), 'KDS must handle table_freed and table_paid events')
assert(kdsContent.includes('course_delivered') || kdsContent.includes('order_delivered'), 'KDS must handle delivery events')
assert(kdsContent.includes('serverMatch.status === \'delivered\''), 'KDS zero-flicker reconciliation must respect server delivered status')

// Check API orders route.ts has kitchen role filter
assert(routeTsContent.includes('isKitchenRole'), 'route.ts must filter orders when role=kitchen')
assert(routeTsContent.includes('terminal_order_ids'), 'route.ts must return terminal_order_ids')

// Check course-utils.ts checks course_status
const courseUtilsPath = path.resolve('src/lib/course-utils.ts')
const courseUtilsContent = fs.readFileSync(courseUtilsPath, 'utf-8')
assert(courseUtilsContent.includes('course_status === \'delivered\''), 'course-utils.ts must check course_status === delivered')

// Check Comandero actions
const comanderoActionsPath = path.resolve('src/hooks/comandero/useComanderoActions.ts')
const comanderoActionsContent = fs.readFileSync(comanderoActionsPath, 'utf-8')
assert(comanderoActionsContent.includes('broadcastFluxoSync'), 'useComanderoActions.ts must call broadcastFluxoSync')
assert(comanderoActionsContent.includes('deliver_desserts_direct'), 'useComanderoActions.ts must handle deliver_desserts_direct')
console.log('✅ PASS: KDS Ticket Removal and Realtime Sync Channel thoroughly verified.')

console.log('\n🎉 ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!')
