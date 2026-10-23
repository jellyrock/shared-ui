// Serves a site's build the way production does (Caddy `file_server` on the VPS), so the
// browser tests see what visitors see: the site's production security headers, a 308 to the
// trailing-slash URL for directories, index.html for directories, and for a missing path the
// build's 404.html with status 404 (an empty 404 if the build has none). The first-party
// analytics proxy (/_a/*) is stubbed; it reverse-proxies to Umami in production.
//
// Usage: node serve-dist.mjs --root dist --port 4322 --headers tests/support/production-headers.json
// Paths are relative to the current directory. The headers file is a JSON object of header
// names to values; a "$comment" key is ignored.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    root: { type: 'string', default: 'dist' },
    port: { type: 'string', default: '4322' },
    headers: { type: 'string' },
  },
});
if (!values.headers) throw new Error('--headers <file> is required: the production security headers to send');

const root = path.resolve(values.root);
const port = Number(values.port);
const securityHeaders = JSON.parse(await readFile(path.resolve(values.headers), 'utf8'));
delete securityHeaders.$comment;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.wasm': 'application/wasm',
};

const send = (res, status, body, type, extra = {}) => {
  res.writeHead(status, { ...securityHeaders, 'Content-Type': type, ...extra });
  res.end(body);
};

const isFile = async (p) => (await stat(p).catch(() => null))?.isFile() ?? false;
const isDir = async (p) => (await stat(p).catch(() => null))?.isDirectory() ?? false;

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === '/_a/script.js') return send(res, 200, '', types['.js']);
  if (pathname.startsWith('/_a/')) return send(res, 204, '', types['.txt']);

  const target = path.join(root, pathname);
  if (target.startsWith(root)) {
    if (await isDir(target)) {
      if (!pathname.endsWith('/')) return send(res, 308, '', types['.txt'], { Location: `${pathname}/${url.search}` });
      const index = path.join(target, 'index.html');
      if (await isFile(index)) return send(res, 200, await readFile(index), types['.html']);
    } else if (await isFile(target)) {
      return send(res, 200, await readFile(target), types[path.extname(target)] ?? 'application/octet-stream');
    }
  }
  const notFound = path.join(root, '404.html');
  if (await isFile(notFound)) return send(res, 404, await readFile(notFound), types['.html']);
  return send(res, 404, '', types['.txt']);
}).listen(port, () => console.log(`Serving ${root} on http://localhost:${port}`));
