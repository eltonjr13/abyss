import { cpSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, 'dist');
mkdirSync(output, { recursive: true });
for (const name of ['index.html', 'styles.css', 'script.js', 'ocean.js', 'ambient.js', 'assets', 'privacidade.html', 'termos.html', 'suporte.html']) {
  if (existsSync(path.join(root, name))) cpSync(path.join(root, name), path.join(output, name), { recursive: true });
}
console.log('Landing pronta em dist.');
