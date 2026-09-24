#!/usr/bin/env node
/* Direct photo intake server (byte-for-byte, zero processing).
 *
 * The chat attachment pipeline never delivered the user's file into this
 * sandbox, so this page receives the ORIGINAL bytes straight from the
 * user's browser through the live-preview proxy and writes them untouched
 * to public/images/sufi-ilham-portrait.<ext>.
 *
 *   node scripts/upload-server.mjs        (listens on 0.0.0.0:8080)
 *
 * Nothing is resized, cropped, recompressed or AI-processed: the request
 * body IS the file, stored as-is.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PUB = path.join(ROOT, 'public', 'images');
const PORT = Number(process.env.PORT || 8080);

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Upload author photo — exact bytes</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:grid; place-items:center; padding:2rem 1rem;
         font:16px/1.6 ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif;
         background:#f3f0e9; color:#191713; }
  .card { width:min(560px,100%); background:#fbf9f4; border:1px solid #d8d2c4; padding:2rem; }
  h1 { font-size:1.5rem; margin:0 0 .4rem; }
  p  { margin:.4rem 0; color:#5c564a; }
  #drop { margin-top:1.2rem; border:2px dashed #b3a98f; background:#f6f3ea; padding:2.4rem 1rem;
          text-align:center; cursor:pointer; }
  #drop.hot { border-color:#8a6d1f; background:#f1ecd9; }
  img#prev { max-width:100%; display:none; margin-top:1rem; border:1px solid #d8d2c4; }
  #status { margin-top:1rem; font-weight:600; }
  .ok { color:#2c6e31; } .err { color:#a12626; }
  code { background:#eee8d9; padding:.1rem .35rem; border:1px solid #d8d2c4; font-size:.85em; }
</style>
</head>
<body>
  <div class="card">
    <h1>Author photo — exact upload</h1>
    <p>Drop the photo here. It is sent <b>byte-for-byte</b> to the website folder:
       no crop, no resize, no compression, no AI.</p>
    <p>Saved as <code>public/images/sufi-ilham-portrait.&lt;ext&gt;</code> — publishing finishes automatically.</p>
    <div id="drop">
      <b>Drop your photo here</b><br />
      <span>or click to browse (PNG / JPG / WebP, any size)</span>
      <input id="file" type="file" accept="image/*" hidden />
    </div>
    <img id="prev" alt="preview of your exact photo" />
    <div id="status"></div>
  </div>
<script>
  const drop = document.getElementById('drop');
  const file = document.getElementById('file');
  const prev = document.getElementById('prev');
  const status = document.getElementById('status');
  const show = (msg, cls) => { status.textContent = msg; status.className = cls || ''; };

  const send = async (f) => {
    const ext = (f.name.match(/\\.(png|jpe?g|webp)$/i)?.[0] || '.jpg').toLowerCase();
    show('Uploading ' + f.name + ' …');
    prev.src = URL.createObjectURL(f);
    prev.style.display = 'block';
    try {
      const r = await fetch('/upload?ext=' + encodeURIComponent(ext), { method: 'POST', body: f });
      const j = await r.json();
      if (j.ok) show('Received ' + j.bytes.toLocaleString() + ' bytes as ' + j.name + '. Publishing now — done when the site shows it.', 'ok');
      else show('Upload failed: ' + (j.error || r.status), 'err');
    } catch (e) { show('Upload failed: ' + e.message, 'err'); }
  };

  drop.addEventListener('click', () => file.click());
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('hot'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('hot'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault(); drop.classList.remove('hot');
    const f = e.dataTransfer.files?.[0];
    if (f) send(f);
  });
  file.addEventListener('change', () => { if (file.files[0]) send(file.files[0]); });
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.end(PAGE);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/upload') {
    let ext = (url.searchParams.get('ext') || '.jpg').toLowerCase();
    if (ext === '.jpeg') ext = '.jpg';
    if (!['.png', '.jpg', '.webp'].includes(ext)) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'unsupported extension ' + ext }));
      return;
    }
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const buf = Buffer.concat(chunks);
        if (buf.length < 1024) throw new Error('file too small — nothing received');
        const name = `sufi-ilham-portrait${ext}`;
        fs.mkdirSync(PUB, { recursive: true });
        fs.writeFileSync(path.join(PUB, name), buf);
        console.log(`PORTRAIT_RECEIVED file=${name} bytes=${buf.length}`);
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: true, name, bytes: buf.length }));
      } catch (err) {
        console.log(`PORTRAIT_FAILED ${String((err && err.message) || err)}`);
        res.statusCode = 500;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: String(err) }));
      }
    });
    return;
  }

  res.statusCode = 404;
  res.end('not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`UPLOAD_SERVER_LISTENING port=${PORT}`);
});
