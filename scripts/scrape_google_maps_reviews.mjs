import { chromium } from 'playwright'
import fs from 'fs'

async function extractReviews() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    locale: 'es-ES',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  })
  const page = await context.newPage()

  try {
    await page.goto('https://www.google.com/maps/search/Bar+Jara-Tusas+Noia/@42.784,-8.889,17z', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    try {
      const acceptBtn = page.locator('button:has-text("Aceptar todo"), button:has-text("Acepto"), button:has-text("Aceptar")')
      if (await acceptBtn.count() > 0) {
        await acceptBtn.first().click()
        await page.waitForTimeout(2000)
      }
    } catch (e) {}

    const reviewsTab = page.locator('button[role="tab"]:has-text("Reseñas"), button:has-text("Reseñas")')
    if (await reviewsTab.count() > 0) {
      await reviewsTab.first().click()
      await page.waitForTimeout(2500)
    }

    // Click "Más" on truncated review texts to expand them
    const moreButtons = page.locator('button:has-text("Más"), button[aria-label*="Más"]')
    const moreCount = await moreButtons.count()
    for (let i = 0; i < Math.min(moreCount, 10); i++) {
      try {
        await moreButtons.nth(i).click({ timeout: 1000 })
      } catch (e) {}
    }
    await page.waitForTimeout(1000)

    const reviews = await page.evaluate(() => {
      const results = []
      // Select review containers
      const cards = document.querySelectorAll('div[data-review-id], div.jJc9Ad')
      for (const card of cards) {
        const authorEl = card.querySelector('div.d4r55, .WNxFfd, button[data-href*="contrib"]')
        const author = authorEl ? authorEl.textContent.trim() : 'Cliente Google'
        
        const ratingEl = card.querySelector('span[role="img"][aria-label*="estrella"], span.kvMYJc')
        let rating = 5
        if (ratingEl) {
          const aria = ratingEl.getAttribute('aria-label') || ''
          const m = aria.match(/([1-5])/)
          if (m) rating = parseInt(m[1], 10)
        }

        const dateEl = card.querySelector('span.rsqaWe, span.xRk2Ne')
        const date = dateEl ? dateEl.textContent.trim() : 'Reciente'

        const textEl = card.querySelector('span.wiI7pd, .MyEned')
        const text = textEl ? textEl.textContent.trim() : ''

        if (text && text.length > 15 && rating >= 4) {
          results.push({ author, rating, text, date, source: 'google' })
        }
      }
      return results
    })

    console.log('Extracted reviews:', JSON.stringify(reviews, null, 2))
    fs.writeFileSync('out/google_maps_reviews.json', JSON.stringify(reviews, null, 2), 'utf8')
  } finally {
    await browser.close()
  }
}

extractReviews().catch(console.error)
