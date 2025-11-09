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

// === ГЛАВНАЯ ===
app.get('/', (req, res) => {
  res.send(getPage('home', false));
});

// === ПРЕМИУМ ===
app.get('/premium', (req, res) => {
  res.send(getPage('premium', false));
});

// === О НАС ===
app.get('/about', (req, res) => {
  res.send(getPage('about', false));
});

// === КОНФИДЕНЦИАЛЬНОСТЬ ===
app.get('/privacy', (req, res) => {
  res.send(getPage('privacy', false));
});

// === ФУНКЦИЯ СОЗДАНИЯ СТРАНИЦЫ ===
function getPage(activeTab, isPro = false) {
  const proBadge = isPro ? `<span class="pro-badge">PRO</span>` : '';
  const themeToggle = isPro ? `
    <div class="theme-toggle" id="themeToggle">
      <i class="fas fa-sun"></i>
    </div>` : '';

  const controls = isPro ? `
    <div class="controls">
      <select id="expires">
        <option value="3600">1 час</option>
        <option value="86400" selected>1 день</option>
        <option value="604800">7 дней</option>
      </select>
      <input type="password" id="password" placeholder="Пароль (необязательно)" />
    </div>` : '';

  const proStats = isPro ? `
    <div id="proStats" style="margin-top:12px;font-size:13px;color:var(--tl)">
      <p>IP: <span id="lastIP">-</span> • Время: <span id="lastTime">-</span></p>
    </div>` : '';

  const installBtn = `
    <button class="install-btn" id="installBtn" style="display:none">Установить как приложение</button>`;

  const statsBlock = `
    <div class="stats">
      <div class="stat"><h3><span class="count" data-target="127482">0</span></h3><p>Файлов</p></div>
      <div class="stat"><h3><span class="count" data-target="89">0</span> ТБ</h3><p>Передано</p></div>
      <div class="stat"><h3><span class="count" data-target="42819">0</span></h3><p>Пользователей</p></div>
      <div class="stat"><h3><span class="count" data-target="500">0</span> Мбит/с</h3><p>Скорость</p></div>
    </div>`;

  const premiumBlock = `
    <div class="premium">
      <h3>Хочешь больше?</h3>
      <div class="price">99 ₽ / месяц</div>
      <ul class="features">
        <li><i class="fas fa-infinity"></i> Файлы навсегда</li>
        <li><i class="fas fa-lock"></i> Пароль</li>
        <li><i class="fas fa-bolt"></i> 1 Гбит/с</li>
        <li><i class="fas fa-chart-bar"></i> Статистика</li>
        <li><i class="fas fa-palette"></i> Темы</li>
      </ul>
      <button class="btn-premium" onclick="location.href='/premium'">ОФОРМИТЬ</button>
    </div>`;

  const homeContent = `
    <div class="hero">
      <h1>FASTDROP${proBadge}</h1>
      <p>До 200 ГБ • Бесплатно • 7 дней • Без аккаунта</p>
    </div>
    <div class="box">
      <h2>Кидай файл — получай ссылку</h2>
      <div class="dz" id="dropzone">
        <i class="fas fa-cloud-upload-alt"></i>
        <p>Перетащи или кликни</p>
        <input type="file" id="fileInput" style="display:none" multiple webkitdirectory/>
        <button onclick="document.getElementById('fileInput').click()">ВЫБРАТЬ</button>
      </div>
      ${controls}
      <div id="preview" class="preview-grid" style="display:none"></div>
      <div class="prog" id="progress">
        <div class="bar"><div class="fill" id="fill"></div><div class="speed" id="speed">0 МБ/с</div></div>
        <div class="ptxt" id="percent">0%</div>
      </div>
      <div class="res" id="result">
        <p><i class="fas fa-check-circle" style="color:#00ff88"></i> Готово!</p>
        <input type="text" id="link" readonly/>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:8px">
          <button class="copy-btn" onclick="copyLink()">COPY</button>
          <button class="qr-btn" onclick="showQR()">QR</button>
        </div>
        <div class="qrcode" id="qrcode"></div>
        <p class="counter">Загрузок: <span id="downloads">0</span></p>
        ${proStats}
      </div>
    </div>
    ${installBtn}
    ${statsBlock}
    ${premiumBlock}`;

  const premiumContent = `
    <h2 style="text-align:center">FASTDROP PRO</h2>
    <div class="premium" style="max-width:500px;margin:30px auto">
      <div class="price">99 ₽ / месяц</div>
      <p>999 ₽ / год (-17%)</p>
      <ul class="features">
        <li><i class="fas fa-infinity"></i> Безлимитное хранение</li>
        <li><i class="fas fa-shield-alt"></i> Пароль + шифрование</li>
        <li><i class="fas fa-rocket"></i> Приоритетная скорость</li>
        <li><i class="fas fa-headset"></i> Поддержка 24/7</li>
        <li><i class="fas fa-palette"></i> Темы</li>
      </ul>
      <button class="btn-premium">КУПИТЬ</button>
    </div>`;

  const aboutContent = `
    <h2 style="text-align:center">О нас</h2>
    <p style="max-width:700px;margin:30px auto;color:var(--tl);line-height:1.8;font-size:15px;text-align:center">
      FASTDROP — это простой и быстрый способ делиться файлами до 200 ГБ.<br>
      Без регистрации. Без рекламы. Без лишних действий.
    </p>`;

  const privacyContent = `
    <h2 style="text-align:center">Конфиденциальность</h2>
    <div style="max-width:700px;margin:30px auto;color:var(--tl);line-height:1.8;font-size:15px">
      <p>Мы <strong>не храним</strong> файлы дольше 7 дней.</p>
      <p>Никаких аккаунтов. Никаких логов. Никаких данных.</p>
      <p>Файл удаляется автоматически — навсегда.</p>
      <p>Мы не видим содержимое. Не продаём данные.</p>
      <p>FASTDROP — это просто труба: ты → файл → получатель.</p>
    </div>`;

  const content = {
    home: homeContent,
    premium: premiumContent,
    about: aboutContent,
    privacy: privacyContent
  }[activeTab];

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
    [data-theme="light"]{--p:#007bff;--s:#28a745;--bg:#f8f9fa;--c:#ffffff;--t:#212529;--tl:#6c757d;--g:linear-gradient(135deg,#007bff,#28a745)}
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--t);min-height:100vh;transition:all .3s}
    header{background:var(--c);border-bottom:1px solid rgba(0,212,255,.2);position:sticky;top:0;z-index:100}
    nav{display:flex;justify-content:space-between;align-items:center;padding:14px 24px;max-width:1200px;margin:0 auto}
    .logo{font-size:22px;font-weight:800;background:var(--g);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .pro-badge{background:#ffd700;color:#000;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;margin-left:4px;vertical-align:middle}
    .theme-toggle{cursor:pointer;font-size:20px;color:var(--tl);transition:.3s}
    .theme-toggle:hover{color:var(--t)}
    .tabs{display:flex;gap:20px}
    .tab{font-size:14px;color:var(--tl);cursor:pointer;padding:8px 12px;position:relative;font-weight:600;transition:all .3s;border-radius:8px}
    .tab:hover{color:var(--t);background:rgba(255,255,255,.05)}
    .tab.active{color:var(--t);font-weight:700;background:rgba(0,212,255,.15)}
    .tab.active::after{content:'';position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:40px;height:2px;background:var(--g);border-radius:1px}
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
    .controls{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:16px 0}
    select, input[type="password"]{padding:10px;border-radius:8px;border:1px solid var(--tl);background:var(--c);color:var(--t);font-size:14px}
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
    .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:20px;margin:60px 0;text-align:center}
    .stat h3{font-size:32px;font-weight:800;color:var(--p);margin-bottom:4px}
    .stat p{font-size:13px;color:var(--tl);font-weight:500}
    .premium{background:var(--g);color:#000;padding:32px;border-radius:20px;text-align:center;margin:50px 0}
    .premium h3{font-size:24px;font-weight:800;margin-bottom:12px}
    .price{font-size:36px;font-weight:800;margin:16px 0}
    .features{list-style:none;display:inline-block;text-align:left;margin:16px 0}
    .features li{margin:8px 0;font-size:14px;font-weight:600}
    .features li i{color:#000;margin-right:8px}
    .btn-premium{background:#000;color:white;padding:14px 40px;border-radius:12px;font-weight:800;font-size:16px}
    .install-btn{display:none;background:var(--s);color:#000;padding:12px 24px;border-radius:12px;font-weight:700;margin:20px auto;width:max-content}
    footer{text-align:center;padding:32px;color:var(--tl);font-size:13px}
    footer a{color:var(--p);text-decoration:none;font-weight:600}
  </style>
</head>
<body data-theme="dark">
  <header>
    <nav>
      <div class="logo">FASTDROP${proBadge}</div>
      <div style="display:flex;gap:16px;align-items:center">
        ${themeToggle}
        <div class="tabs">
          <a href="/" class="tab ${activeTab==='home'?'active':''}">Главная</a>
          <a href="/premium" class="tab ${activeTab==='premium'?'active':''}">Премиум</a>
          <a href="/about" class="tab ${activeTab==='about'?'active':''}">О нас</a>
          <a href="/privacy" class="tab ${activeTab==='privacy'?'active':''}">Конфиденциальность</a>
        </div>
      </div>
    </nav>
  </header>
  <main>
    ${content}
  </main>
  <footer>
    © 2025 FASTDROP • <a href="/privacy">Политика конфиденциальности</a>
  </footer>

  <script>
    // PWA
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
        deferredPrompt.userChoice.then(() => installBtn.style.display = 'none');
      });
    }

    // Тема (только PRO)
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        themeToggle.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
      });
    }

    // Анимация счётчиков
    function animateStats() {
      document.querySelectorAll('.count').forEach(el => {
        const target = +el.dataset.target;
        const isTB = el.parentNode.innerHTML.includes('ТБ');
        let num = 0;
        const inc = target / 80;
        const timer = setInterval(() => {
          num += inc;
          if (num >= target) {
            el.textContent = isTB ? target + ' ТБ' : target.toLocaleString();
            clearInterval(timer);
          } else {
            el.textContent = isTB ? Math.floor(num) + ' ТБ' : Math.floor(num).toLocaleString();
          }
        }, 15);
      });
    }
    if (document.querySelector('.stats')) setTimeout(animateStats, 300);

    // Загрузка
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    if (dropzone && fileInput) {
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
      fileInput.addEventListener('change', () => handleFiles(fileInput.files));

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
            link.value = location.href + data.id;
            result.style.display = 'block'; progress.style.display = 'none';
            dropzone.innerHTML = '<i class="fas fa-check"></i><p>Готово!</p><button onclick="document.getElementById(\'fileInput\').click()">ЕЩЁ</button>';
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
            if (d.lastIP) { lastIP.textContent = d.lastIP; lastTime.textContent = new Date(d.lastTime).toLocaleString(); }
          });
        }, 3000);
      }
    }
  </script>
</body>
</html>`;
}

// === ЗАГРУЗКА, СКАЧИВАНИЕ, СТАТИСТИКА ===
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
  if (location.pathname.includes('premium')) {
    response.lastIP = meta.ips[meta.ips.length - 1] || '?.?.?.?';
    response.lastTime = meta.times[meta.times.length - 1] || Date.now();
  }
  res.json(response);
});

app.get('/manifest.json', (req, res) => {
  res.json({
    name: "FASTDROP", short_name: "FASTDROP", start_url: "/", display: "standalone",
    background_color: "#0a0a1a", theme_color: "#00d4ff",
    icons: [{ src: "data:image/svg+xml,%3Csvg%3E%3C/svg%3E", sizes: "192x192", type: "image/svg+xml" }]
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('FASTDROP 2.0 — http://localhost:' + PORT);
});
