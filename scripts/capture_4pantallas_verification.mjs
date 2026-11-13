import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

async function run() {
  const artifactDir = 'C:/Users/mima7/.gemini/antigravity/brain/17139457-db03-4eaa-ae68-837e5d15d266'
  const outDir = path.resolve('out')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  console.log('Launching browser...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  })
  const page = await context.newPage()

  // 1. Hero
  console.log('Navigating to http://localhost:3000/web/bar-jaratusas...')
  await page.goto('http://localhost:3000/web/bar-jaratusas', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  console.log('Capturing Hero...')
  const heroPathOut = path.join(outDir, 'cauce-4s-01-hero.png')
  const heroPathArt = path.join(artifactDir, 'cauce-4s-01-hero.png')
  await page.screenshot({ path: heroPathOut })
  fs.copyFileSync(heroPathOut, heroPathArt)

  // 2. Marquee
  console.log('Scrolling to tragos-carta...')
  const marqueeSection = page.locator('#tragos-carta')
  await marqueeSection.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1000)
  const marqueePathOut = path.join(outDir, 'cauce-4s-02-marquee.png')
  const marqueePathArt = path.join(artifactDir, 'cauce-4s-02-marquee.png')
  await page.screenshot({ path: marqueePathOut })
  fs.copyFileSync(marqueePathOut, marqueePathArt)

  // 3. Spaces & WhatsApp
  console.log('Scrolling to espacios...')
  const spacesSection = page.locator('#espacios')
  await spacesSection.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1000)
  const spacesPathOut = path.join(outDir, 'cauce-4s-03-spaces.png')
  const spacesPathArt = path.join(artifactDir, 'cauce-4s-03-spaces.png')
  await page.screenshot({ path: spacesPathOut })
  fs.copyFileSync(spacesPathOut, spacesPathArt)

  console.log('Scrolling to WhatsApp configurator...')
  const waSection = page.locator('#contacto-whatsapp')
  await waSection.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1000)
  const waPathOut = path.join(outDir, 'cauce-4s-04-whatsapp.png')
  const waPathArt = path.join(artifactDir, 'cauce-4s-04-whatsapp.png')
  await page.screenshot({ path: waPathOut })
  fs.copyFileSync(waPathOut, waPathArt)

  // 4. Carta Viva Mesa 0
  console.log('Navigating to http://localhost:3000/p/bar-jaratusas?mesa=0...')
  await page.goto('http://localhost:3000/p/bar-jaratusas?mesa=0', { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)

  const mesa0PathOut = path.join(outDir, 'cauce-4s-05-mesa0.png')
  const mesa0PathArt = path.join(artifactDir, 'cauce-4s-05-mesa0.png')
  await page.screenshot({ path: mesa0PathOut })
  fs.copyFileSync(mesa0PathOut, mesa0PathArt)

  // Mobile viewport check
  console.log('Testing mobile viewport (iPhone 14 Pro)...')
  const mobileContext = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    isMobile: true
  })
  const mobPage = await mobileContext.newPage()
  await mobPage.goto('http://localhost:3000/web/bar-jaratusas', { waitUntil: 'networkidle' })
  await mobPage.waitForTimeout(1500)

  const mobHeroPathOut = path.join(outDir, 'cauce-4s-06-mobile-hero.png')
  const mobHeroPathArt = path.join(artifactDir, 'cauce-4s-06-mobile-hero.png')
  await mobPage.screenshot({ path: mobHeroPathOut })
  fs.copyFileSync(mobHeroPathOut, mobHeroPathArt)

  await mobPage.goto('http://localhost:3000/p/bar-jaratusas?mesa=0', { waitUntil: 'networkidle' })
  await mobPage.waitForTimeout(2500)

  const mobMesa0PathOut = path.join(outDir, 'cauce-4s-07-mobile-mesa0.png')
  const mobMesa0PathArt = path.join(artifactDir, 'cauce-4s-07-mobile-mesa0.png')
  await mobPage.screenshot({ path: mobMesa0PathOut })
  fs.copyFileSync(mobMesa0PathOut, mobMesa0PathArt)

  await browser.close()
  console.log('Verification captures completed successfully.')
}

run().catch(err => {
  console.error('Error during capture:', err)
  process.exit(1)
})
