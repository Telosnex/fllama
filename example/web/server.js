const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8080;
const root = path.resolve(__dirname, '../build/web');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function send(res, statusCode, headers, body) {
  res.writeHead(statusCode, {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    ...headers,
  });
  res.end(body);
}

http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = path.resolve(root, `.${urlPath}`);

  if (!filePath.startsWith(root)) {
    send(res, 403, { 'Content-Type': 'text/plain' }, 'Forbidden');
    return;
  }

  if (!fs.existsSync(filePath)) {
    filePath = path.join(root, 'index.html');
  }

  if (fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, { 'Content-Type': 'text/plain' }, 'Not found');
      return;
    }
    const contentType = mimeTypes[path.extname(filePath)] || 'application/octet-stream';
    send(res, 200, { 'Content-Type': contentType }, data);
  });
}).listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Serving ${root}`);
});
