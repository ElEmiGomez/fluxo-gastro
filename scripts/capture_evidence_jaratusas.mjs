import { chromium } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'

const brainDir = 'C:/Users/mima7/.gemini/antigravity/brain/17139457-db03-4eaa-ae68-837e5d15d266'

async function capture() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  
  await page.goto('http://localhost:3000/web/bar-jaratusas', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  // 1. Hero with man at the bar (Photo 3)
  await page.screenshot({ path: `${brainDir}/evidence-hero-man.png` })

  // 2. Drinks Carousel with new rustic wine image
  const drinks = page.locator('#tragos-carta')
  await drinks.scrollIntoViewIfNeeded()
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${brainDir}/evidence-wine-mockup.png` })

  // 3. Location & Map Card
  const hoursLocation = page.locator('#horarios-ubicacion')
  await hoursLocation.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${brainDir}/evidence-map-card.png` })

  await browser.close()
  console.log('✔ Nuevas capturas de verificación guardadas exitosamente')
}

capture().catch(err => {
  console.error(err)
  process.exit(1)
})
