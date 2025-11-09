const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const archiver = require('archiver');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.ensureDirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const id = req.body.id || uuidv4().slice(0, 12);
    cb(null, `${id}__${file.originalname}`);
  }
});
const upload = multer({ storage });

// === СТРАНИЦЫ ===
app.get('/', (req, res) => res.send(getMainPage(false)));
app.get('/pro', (req, res) => res.send(getProPage(true)));
app.get('/about', (req, res) => res.send(getAboutPage(false)));

// Главная страница (структура как fileport.io)
function getMainPage(isPro) {
  const proBadge = isPro ? '<span class="pro-badge">PRO</span>' : '';
  const controls = isPro ? `
    <div class="controls">
      <select id="expires">
        <option value="3600">1 час</option>
        <option value="86400">1 день</option>
        <option value="604800" selected>7 дней</option>
      </select>
      <input type="password" id="password" placeholder="Пароль (опционально)" />
    </div>` : '';
  const proStats = isPro ? `
    <div id="proStats" class="pro-stats">
      <p>Последний IP: <span id="lastIP">-</span></p>
      <p>Время скачивания: <span id="lastTime">-</span></p>
    </div>` : '';
  const installBtn = '<button class="install-btn" id="installBtn" style="display:none">Установить как app</button>';

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FASTDROP — 200 ГБ за секунды</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#0a0a1a">
  <style>
    :root{--p:#00d4ff;--s:#00ff88;--bg:#0a0a1a;--c:#1a1a2e;--t:#e2e8f0;--tl:#94a3b8;--g:linear-gradient(135deg,#00d4ff,#00ff88)}
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--t);min-height:100vh;transition:all .3s}
    header{background:var(--c);border-bottom:1px solid rgba(0,212,255,.2);position:sticky;top:0;z-index:100}
    nav{display:flex;justify-content:space-between;align-items:center;padding:14px 24px;max-width:1200px;margin:0 auto}
    .logo{font-size:22px;font-weight:800;background:var(--g);-webkit-background-clip:text;-webkit-text-fill-color:transparent;cursor:pointer}
    .tabs{display:flex;gap:20px}
    .tab{font-size:14px;color:var(--tl);cursor:pointer;padding:8px 12px;position:relative;font-weight:600;transition:all .3s;border-radius:8px;text-decoration:none}
    .tab:hover{color:var(--t);background:rgba(255,255,255,.05)}
    .tab.active{color:var(--t);font-weight:700;background:rgba(0,212,255,.15)}
    main{max-width:1200px;margin:0 auto;padding:20px}
    .hero{text-align:center;padding:40px 20px}
    .hero h1{font-size:38px;font-weight:800;background:var(--g);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px}
    .hero p{font-size:16px;color:var(--tl);font-weight:500}
    .box{background:var(--c);border-radius:20px;padding:36px;box-shadow:0 16px 32px rgba(0,212,255,.15);border:1px solid rgba(0,212,255,.2);margin:20px 0}
    h2{font-size:26px;font-weight:700;background:var(--g);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:18px;text-align:center}
    .dz{border:3px dashed var(--p);border-radius:16px;padding:48px;text-align:center;cursor:pointer;transition:all .3s;position:relative}
    .dz:hover{border-color:var(--s);background:rgba(0,255,136,.08);transform:translateY(-2px)}
    .dz i{font-size:48px;color:var(--p);margin-bottom:12px;display:block;animation:float 3s infinite}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
    .dz p{font-size:16px;color:var(--tl);margin-bottom:16px;font-weight:500}
    .select-buttons{display:flex;gap:12px;justify-content:center;margin-top:12px}
    .controls{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:16px 0}
    select,input[type="password"]{padding:10px;border-radius:8px;border:1px solid var(--tl);background:var(--c);color:var(--t);font-size:14px}
    .prog{margin-top:24px;display:none}
    .bar{height:12px;background:rgba(255,255,255,.1);border-radius:6px;overflow:hidden;position:relative}
    .fill{height:100%;background:var(--g);width:0%;transition:width .3s}
    .speed{position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:12px;color:var(--tl);font-weight:600}
    .ptxt{text-align:center;margin-top:8px;font-size:14px;color:var(--tl);font-weight:600}
    .preview-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:12px;margin:16px 0}
    .preview-item{position:relative;border-radius:8px;overflow:hidden;border:1px solid var(--tl)}
    .preview-item img{width:100%;height:100%;object-fit:cover}
    .preview-name{font-size:11px;text-align:center;padding:4px;color:var(--tl);background:var(--c);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .res{margin-top:24px;padding:20px;background:rgba(0,255,136,.12);border-radius:12px;border:1px solid rgba(0,255,136,.3);display:none}
    .res input{width:100%;padding:12px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:8px;color:var(--t);font-family:monospace;margin:8px 0;font-size:14px}
    button{background:var(--g);color:#000;border:none;padding:12px 28px;border-radius:10px;font-weight:700;cursor:pointer;transition:all .3s;font-size:15px}
    button:hover{transform:translateY(-2px);box-shadow:0 8px 16px rgba(0,212,255,.3)}
    .copy-btn,.qr-btn{margin:4px;padding:10px 18px;font-size:13px;border-radius:8px;font-weight:600}
    .copy-btn{background:var(--p);color:#000}
    .qr-btn{background:#ff6b6b;color:white}
    .qrcode{margin-top:12px;text-align:center;display:none}
    .counter{margin-top:10px;font-size:13px;color:var(--tl);font-weight:500}
    .pro-stats p{font-size:13px;color:var(--tl);margin:4px 0;text-align:center}
    .stats-section{margin:60px 0;text-align:center}
    .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:20px}
    .stat h3{font-size:32px;font-weight:800;color:var(--p);margin-bottom:4px}
    .stat p{font-size:13px;color:var(--tl);font-weight:500}
    .premium-section{margin:40px 0;padding:24px;background:var(--g);color:#000;border-radius:12px;text-align:center}
    .premium-section h2{font-size:22px;margin-bottom:12px;color:#000;-webkit-text-fill-color:#000;background:none}
    .premium-section p{font-size:15px;margin-bottom:16px}
    .premium-section button{background:#000;color:white}
    .list{list-style:none;margin:16px 0}
    .list li{margin:8px 0;font-size:15px;display:flex;align-items:center;gap:8px}
    footer{text-align:center;padding:32px;color:var(--tl);font-size:13px}
    footer a{color:var(--p);text-decoration:none;font-weight:600}
  </style>
</head>
<body data-theme="dark">
  <header>
    <nav>
      <div class="logo" onclick="location.href='/'">FASTDROP</div>
      <div class="tabs">
        <a href="/" class="tab active">Главная</a>
        <a href="/pro" class="tab">PRO</a>
        <a href="/about" class="tab">О нас</a>
      </div>
    </nav>
  </header>
  <main>
    <div class="hero">
      <h1>FASTDROP</h1>
      <p>200 ГБ бесплатно • 7 дней • Без аккаунта</p>
    </div>
    <div class="box">
      <h2>Загрузи файл</h2>
      <div class="dz" id="dropzone">
        <i class="fas fa-cloud-upload-alt"></i>
        <p>Перетащи файлы или папку</p>
        <input type="file" id="fileInputFiles" style="display:none" multiple />
        <input type="file" id="fileInputFolder" style="display:none" webkitdirectory />
        <div class="select-buttons">
          <button onclick="document.getElementById('fileInputFiles').click()">Файлы</button>
          <button onclick="document.getElementById('fileInputFolder').click()">Папка</button>
        </div>
      </div>
      ${controls}
      <div id="preview" class="preview-grid" style="display:none"></div>
      <div class="prog" id="progress" style="display:none">
        <div class="bar"><div class="fill" id="fill"></div><div class="speed" id="speed">0 МБ/с</div></div>
        <div class="ptxt" id="percent">0%</div>
      </div>
      <div class="res" id="result" style="display:none">
        <p><i class="fas fa-check-circle"></i> Готово!</p>
        <input type="text" id="link" readonly/>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:8px">
          <button class="copy-btn" onclick="copyLink()">COPY</button>
          <button class="qr-btn" onclick="showQR()">QR</button>
        </div>
        <div class="qrcode" id="qrcode"></div>
        <p class="counter">Скачиваний: <span id="downloads">0</span></p>
        ${proStats}
      </div>
    </div>
    <div class="premium-section">
      <h2>PRO версия</h2>
      <p>Навсегда • Пароль • 1 Гбит/с</p>
      <button onclick="location.href='/pro'">Перейти в PRO</button>
    </div>
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat"><h3>127482</h3><p>Файлов</p></div>
        <div class="stat"><h3>89 ТБ</h3><p>Передано</p></div>
        <div class="stat"><h3>42819</h3><p>Пользователей</p></div>
        <div class="stat"><h3>500 Мбит/с</h3><p>Скорость</p></div>
      </div>
    </div>
  </main>
  <footer>
    © 2025 FASTDROP
  </footer>
  <script>
    let deferredPrompt;
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'block';
      });
      installBtn.addEventListener('click', () => {
        deferredPrompt.prompt();
      });
    }

    const dropzone = document.getElementById('dropzone');
    if (dropzone) {
      const fileInputFiles = document.getElementById('fileInputFiles');
      const fileInputFolder = document.getElementById('fileInputFolder');
      const preview = document.getElementById('preview');
      const progress = document.getElementById('progress');
      const fill = document.getElementById('fill');
      const speedEl = document.getElementById('speed');
      const percent = document.getElementById('percent');
      const result = document.getElementById('result');
      const link = document.getElementById('link');
      const qrcode = document.getElementById('qrcode');
      const downloads = document.getElementById('downloads');
      const lastIP = document.getElementById('lastIP');
      const lastTime = document.getElementById('lastTime');

      let startTime, lastLoaded = 0;

      ['dragover', 'dragenter'].forEach(e => dropzone.addEventListener(e, ev => { ev.preventDefault(); dropzone.style.borderColor = '#00ff88'; }));
      ['dragleave', 'drop'].forEach(e => dropzone.addEventListener(e, () => dropzone.style.borderColor = '#00d4ff'));
      dropzone.addEventListener('drop', e => { e.preventDefault(); handleFiles(e.dataTransfer.files); });
      fileInputFiles.addEventListener('change', () => handleFiles(fileInputFiles.files));
      fileInputFolder.addEventListener('change', () => handleFiles(fileInputFolder.files));

      function handleFiles(files) {
        if (!files.length) return;
        preview.innerHTML = ''; preview.style.display = 'grid';
        Array.from(files).forEach(f => {
          const div = document.createElement('div'); div.className = 'preview-item';
          if (f.type.startsWith('image/')) {
            const img = document.createElement('img'); img.src = URL.createObjectURL(f); div.appendChild(img);
          } else {
            div.innerHTML = '<i class="fas fa-file" style="font-size:32px;color:var(--tl);margin:20px"></i>';
          }
          const name = document.createElement('div'); name.className = 'preview-name'; name.textContent = f.name;
          div.appendChild(name); preview.appendChild(div);
        });
        uploadFiles(files);
      }

      function uploadFiles(files) {
        const id = uuidv4().slice(0, 12);
        const formData = new FormData();
        formData.append('id', id);
        if (document.getElementById('expires')) formData.append('expires', document.getElementById('expires').value);
        if (document.getElementById('password')) formData.append('password', document.getElementById('password').value);
        Array.from(files).forEach(f => formData.append('file', f));

        progress.style.display = 'block'; result.style.display = 'none';
        dropzone.innerHTML = '<i class="fas fa-spinner fa-spin"></i><p>Загружаем...</p>';

        startTime = Date.now(); lastLoaded = 0;

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload', true);
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) {
            const p = (e.loaded / e.total) * 100;
            fill.style.width = p + '%';
            percent.textContent = Math.round(p) + '%';
            const elapsed = (Date.now() - startTime) / 1000;
            const speed = elapsed > 0 ? (e.loaded - lastLoaded) / (1024 * 1024 * elapsed) : 0;
            speedEl.textContent = speed.toFixed(1) + ' МБ/с';
            lastLoaded = e.loaded; startTime = Date.now();
          }
        };
        xhr.onload = () => {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            link.value = location.origin + '/' + data.id;
            result.style.display = 'block'; progress.style.display = 'none';
            dropzone.innerHTML = '<i class="fas fa-check"></i><p>Готово!</p><div class="select-buttons"><button onclick="document.getElementById(\'fileInputFiles\').click()">Ещё файлы</button><button onclick="document.getElementById(\'fileInputFolder\').click()">Ещё папка</button></div>';
            pollDownloads(data.id);
          }
        };
        xhr.send(formData);
      }

      function copyLink() { link.select(); document.execCommand('copy'); alert('Скопировано!'); }
      function showQR() { qrcode.style.display = 'block'; new QRCode(qrcode, { text: link.value, width: 120, height: 120, colorDark: "#00ff88", colorLight: "#1a1a2e" }); }

      function pollDownloads(id) {
        setInterval(() => {
          fetch('/stats/' + id).then(r => r.json()).then(d => {
            downloads.textContent = d.downloads || 0;
            if (lastIP) lastIP.textContent = d.lastIP || '-';
            if (lastTime) lastTime.textContent = d.lastTime ? new Date(d.lastTime).toLocaleString() : '-';
          });
        }, 3000);
      }
    }
  </script>
</body>
</html>`;
}

// PRO страница
function getProPage(isPro) {
  return getMainPage(isPro); // Reuse main with PRO features
}

// О нас
function getAboutPage(isPro) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FASTDROP — О нас</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <style>
    :root{--p:#00d4ff;--s:#00ff88;--bg:#0a0a1a;--c:#1a1a2e;--t:#e2e8f0;--tl:#94a3b8;--g:linear-gradient(135deg,#00d4ff,#00ff88)}
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--t);min-height:100vh}
    header{background:var(--c);border-bottom:1px solid rgba(0,212,255,.2);position:sticky;top:0;z-index:100}
    nav{display:flex;justify-content:space-between;align-items:center;padding:14px 24px;max-width:1200px;margin:0 auto}
    .logo{font-size:22px;font-weight:800;background:var(--g);-webkit-background-clip:text;-webkit-text-fill-color:transparent;cursor:pointer}
    .tabs{display:flex;gap:20px}
    .tab{font-size:14px;color:var(--tl);cursor:pointer;padding:8px 12px;position:relative;font-weight:600;transition:all .3s;border-radius:8px;text-decoration:none}
    .tab:hover{color:var(--t);background:rgba(255,255,255,.05)}
    .tab.active{color:var(--t);font-weight:700;background:rgba(0,212,255,.15)}
    main{max-width:1200px;margin:0 auto;padding:20px}
    .box{background:var(--c);border-radius:20px;padding:36px;box-shadow:0 16px 32px rgba(0,212,255,.15);border:1px solid rgba(0,212,255,.2);margin:20px 0}
    h2{font-size:26px;font-weight:700;background:var(--g);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:18px;text-align:center}
    p{font-size:16px;color:var(--tl);text-align:center}
    footer{text-align:center;padding:32px;color:var(--tl);font-size:13px}
  </style>
</head>
<body data-theme="dark">
  <header>
    <nav>
      <div class="logo" onclick="location.href='/'">FASTDROP</div>
      <div class="tabs">
        <a href="/" class="tab">Главная</a>
        <a href="/pro" class="tab">PRO</a>
        <a href="/about" class="tab active">О нас</a>
      </div>
    </nav>
  </header>
  <main>
    <div class="box">
      <h2>О FASTDROP</h2>
      <p>Быстрый обмен файлами до 200 ГБ. Без регистрации. Без рекламы.</p>
      <p style="margin-top:16px">support@fastdrop.ru</p>
    </div>
  </main>
  <footer>
    © 2025 FASTDROP
  </footer>
</body>
</html>`;
}

// Бэкэнд (без изменений)
app.post('/upload', upload.array('file'), (req, res) => {
  try {
    const id = req.body.id;
    const expires = req.body.expires ? parseInt(req.body.expires) * 1000 : 7 * 24 * 60 * 60 * 1000;
    const password = req.body.password || null;
    const files = req.files;

    const meta = {
      id, password, downloads: 0, created: Date.now(), expires: Date.now() + expires,
      files: files.map(f => f.filename), ips: [], times: []
    };

    const metaPath = path.join(UPLOAD_DIR, id + '.json');
    fs.writeJsonSync(metaPath, meta);

    setTimeout(() => {
      files.forEach(f => fs.remove(f.path).catch(() => {}));
      fs.remove(metaPath).catch(() => {});
    }, expires);

    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/:id', (req, res) => {
  const id = req.params.id;
  const metaPath = path.join(UPLOAD_DIR, id + '.json');
  if (!fs.existsSync(metaPath)) return res.status(404).send('Файл удалён');

  const meta = fs.readJsonSync(metaPath);
  if (meta.password && req.query.p !== meta.password) {
    return res.status(403).send(`<h3>Требуется пароль</h3><form><input type="password" id="p"><button onclick="location.href='?p='+document.getElementById('p').value">OK</button></form>`);
  }

  if (Date.now() > meta.expires) {
    fs.remove(metaPath).catch(() => {});
    meta.files.forEach(f => fs.remove(path.join(UPLOAD_DIR, f)).catch(() => {}));
    return res.status(410).send('Срок истёк');
  }

  meta.downloads++;
  const ip = req.ip || '?.?.?.?';
  meta.ips.push(ip); meta.times.push(Date.now());
  fs.writeJsonSync(metaPath, meta);

  if (meta.files.length === 1) {
    const filePath = path.join(UPLOAD_DIR, meta.files[0]);
    const name = meta.files[0].split('__')[1];
    res.download(filePath, name);
  } else {
    res.attachment(`${id}.zip`);
    const archive = archiver('zip');
    archive.pipe(res);
    meta.files.forEach(f => {
      const filePath = path.join(UPLOAD_DIR, f);
      const name = f.split('__')[1];
      archive.file(filePath, { name });
    });
    archive.finalize();
  }
});

app.get('/stats/:id', (req, res) => {
  const metaPath = path.join(UPLOAD_DIR, req.params.id + '.json');
  if (!fs.existsSync(metaPath)) return res.json({ downloads: 0 });
  const meta = fs.readJsonSync(metaPath);
  const response = { downloads: meta.downloads };
  if (location.pathname.includes('pro')) {
    response.lastIP = meta.ips[meta.ips.length - 1] || '?.?.?.?';
    response.lastTime = meta.times[meta.times.length - 1] || Date.now();
  }
  res.json(response);
});

app.get('/manifest.json', (req, res) => {
  res.json({
    name: "FASTDROP",
    short_name: "FASTDROP",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a1a",
    theme_color: "#00d4ff",
    icons: [{ src: "data:image/svg+xml,%3Csvg%3E%3C/svg%3E", sizes: "192x192", type: "image/svg+xml" }]
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('FASTDROP на ' + PORT);
});
