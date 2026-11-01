import fs from 'fs'

const files = [
  'public/casamar-da-vila.html',
  'public/casamar.html',
  'templates/carta.html'
]

const html = fs.readFileSync('public/casamar-da-vila.html', 'utf8')
const match = html.match(/src="(data:image\/png;base64,[^"]+)"/)

if (!match) {
  console.error('Base64 logo not found in casamar-da-vila.html')
  process.exit(1)
}

const logoDataUri = match[1]
console.log('Logo Data URI found! Length:', logoDataUri.length)

const faviconSnippet = `  <link rel="icon" type="image/png" href="${logoDataUri}">
  <link rel="shortcut icon" type="image/png" href="${logoDataUri}">
  <link rel="apple-touch-icon" href="${logoDataUri}">`

for (const f of files) {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8')
    content = content.replace(
      /<link rel="icon"[^>]*>/,
      faviconSnippet
    )
    fs.writeFileSync(f, content, 'utf8')
    console.log(`Updated favicon in ${f}`)
  }
}

// También guardar favicon PNG como archivo físico en public/favicon-casamar.png
const base64Data = logoDataUri.replace(/^data:image\/png;base64,/, '')
fs.writeFileSync('public/favicon-casamar.png', Buffer.from(base64Data, 'base64'))
console.log('Saved public/favicon-casamar.png')
