import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.jpg':'image/jpeg', '.png':'image/png', '.woff2':'font/woff2' };
http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const route = decodeURIComponent(url.pathname);
    const relative = route === '/' ? 'index.html' : route.slice(1);
    const target = path.resolve(root, relative);
    if (!target.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    const body = await readFile(target);
    response.writeHead(200, {'Content-Type': types[path.extname(target)] ?? 'application/octet-stream', 'Cache-Control': 'no-store'}).end(body);
  } catch { response.writeHead(404).end('Página não encontrada'); }
}).listen(4317, '127.0.0.1', () => console.log('Local: http://127.0.0.1:4317/'));
