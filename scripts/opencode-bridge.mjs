import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

const cwd = process.cwd()
const bridgeDir = path.join(cwd, '.opencode-bridge')
const promptFile = path.join(bridgeDir, 'prompt-input.md')
const outputFile = path.join(bridgeDir, 'opencode-output.md')

if (!fs.existsSync(promptFile)) {
  console.error(`[opencode-bridge] Error: No se encontro el archivo de prompt: ${promptFile}`)
  process.exit(1)
}

const promptText = fs.readFileSync(promptFile, 'utf8').trim()
if (!promptText) {
  console.error(`[opencode-bridge] Error: El archivo de prompt esta vacio.`)
  process.exit(1)
}

function findOpencodeExecutable() {
  const isWindows = process.platform === 'win32'
  const appDataRoaming = process.env.APPDATA || ''
  const candidates = [
    'opencode.cmd',
    'opencode',
    path.join(appDataRoaming, 'npm', 'opencode.cmd'),
    path.join(appDataRoaming, 'npm', 'opencode')
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return isWindows ? 'opencode.cmd' : 'opencode'
}

const opencodeBin = findOpencodeExecutable()
const args = ['run', '--auto', promptText]

const child = spawn(opencodeBin, args, {
  cwd,
  env: {
    ...process.env,
    NO_COLOR: '1'
  },
  shell: true,
  stdio: ['pipe', 'pipe', 'pipe']
})

let fullOutput = ''

function stripAnsi(str) {
  // Regex para limpiar secuencias de escape ANSI
  return str.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '')
}

child.stdout.on('data', (data) => {
  const text = data.toString('utf8')
  fullOutput += text
  process.stdout.write(text)
})

child.stderr.on('data', (data) => {
  const text = data.toString('utf8')
  fullOutput += text
  process.stderr.write(text)
})

child.on('close', (code) => {
  const cleanOutput = stripAnsi(fullOutput).trim()
  fs.writeFileSync(outputFile, cleanOutput, 'utf8')
  if (code !== 0) {
    console.error(`\n[opencode-bridge] Proceso terminado con codigo de salida: ${code}`)
    process.exit(code || 1)
  }
})

child.on('error', (err) => {
  console.error(`[opencode-bridge] Error al ejecutar opencode:`, err)
  process.exit(1)
})
