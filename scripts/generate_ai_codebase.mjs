/**
 * Generador de contexto completo del codebase para IA
 * Consolida el código fuente en flujo_codebase_for_ai.txt
 */

import fs from 'node:fs';
import path from 'node:path';

const outputFile = path.resolve('fluxo_codebase_for_ai.txt');

const includedExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.md', '.sql', '.css', '.py']);
const ignoredDirs = new Set(['.git', '.next', 'node_modules', '.agents', '.cursor', '.vscode', 'backups', 'test-results', 'playwright-report']);
const ignoredFiles = new Set(['package-lock.json', 'tsconfig.tsbuildinfo', 'fluxo_codebase_for_ai.txt']);

function walk(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        walk(fullPath, fileList);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (includedExtensions.has(ext) && !ignoredFiles.has(entry.name)) {
        // Skip large data / backup files
        const stat = fs.statSync(fullPath);
        if (stat.size < 200 * 1024) { // < 200 KB
          fileList.push(fullPath);
        }
      }
    }
  }
  return fileList;
}

const allFiles = walk(path.resolve('.'));
allFiles.sort();

let output = '# FLUXO GASTRONOMIC SYSTEM - FULL CODEBASE FOR AI ANALYSIS\n';
output += `# Generated at: ${new Date().toISOString()}\n`;
output += `# Total files included: ${allFiles.length}\n\n`;

for (const f of allFiles) {
  const rel = path.relative(path.resolve('.'), f);
  output += '================================================================================\n';
  output += `FILE: ${rel}\n`;
  output += '================================================================================\n';
  try {
    const content = fs.readFileSync(f, 'utf8');
    output += content;
    if (!content.endsWith('\n')) output += '\n';
  } catch (err) {
    output += `[Error reading file: ${err.message}]\n`;
  }
  output += '\n';
}

fs.writeFileSync(outputFile, output, 'utf8');
const stats = fs.statSync(outputFile);
console.log(`✔ flujo_codebase_for_ai.txt actualizado exitosamente con ${allFiles.length} archivos (${(stats.size / 1024).toFixed(1)} KB).`);
