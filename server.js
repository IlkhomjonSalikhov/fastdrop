const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs-extra');
const app = express();

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = '/app/uploads';
fs.ensureDirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const id = uuidv4().slice(0, 12);
    cb(null, id + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>FASTDROP • 500 МБ</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>fastdrop</text></svg>">
  <style>
    :root { --p:#00d4ff; --bg:#0a0a1a; --c:#1a1a2e; --t:#e2e8f0; --tl:#94a3b8; --s:#00ff88; --grad:linear-gradient(135deg,#00d4ff,#00ff88); }
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--t);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
    .box{background:var(--c);border-radius:32px;padding:48px;max-width:540px;width:100%;box-shadow:0 25px 50px rgba(0,212,255,.15);border:1px solid rgba(0,212,255,.2);backdrop-filter:blur(12px)}
    h1{font-size:36px;font-weight:700;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-align:center;margin-bottom:8px}
    .sub{color:var(--tl);text-align:center;margin-bottom:32px;font-size:15px}
    .dz{border:3px dashed var(--p);border-radius:24px;padding:60px;text-align:center;cursor:pointer;transition:all .4s;position:relative;overflow:hidden}
    .dz:hover{border-color:var(--s);background:rgba(0,255,136,.05);transform:translateY(-6px);box-shadow:0 20px 40px rgba(0,212,255,.4)}
    .dz.dragover{border-color:var(--s);background:rgba(0,255,136,.15);animation:p 1.5s infinite}
    @keyframes p{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
    .cloud{font-size:64px;color:var(--p);margin-bottom:20px;animation:bounce 2s infinite}
    @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
    .dz p{color:var(--tl);margin-bottom:16px;font-size:16px}
    button{background:var(--grad);color:#0a0a1a;border:none;padding:16px 36px;border-radius:16px;font-weight:700;cursor:pointer;transition:all .3s;font-size:18px;box-shadow:0 8px 20px rgba(0,212,255,.3)}
    button:hover{transform:translateY(-4px);box-shadow:0 12px 28px rgba(0,212,255,.5)}
    .prog{margin-top:24px;display:none}
    .bar{height:12px;background:rgba(255,255,255,.1);border-radius:6px;overflow:hidden}
    .fill{height:100%;background:var(--grad);width:0%;transition:width .2s;border-radius:6px}
    .ptxt{text-align:center;margin-top:10px;font-size:15px;color:var(--tl);font-weight:600}
    .res{margin-top:32px;padding:24px;background:rgba(0,255,136,.1);border-radius:16px;border:1px solid rgba(0,255,136,.3);display:none;animation:f .5s}
    @keyframes f{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
    .res input{width:100%;padding:16px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:12px;color:white;font-family:monospace;margin:12px 0;font-size:16px}
    .res button{margin:6px 4px;padding:10px 20px;font-size:15px;border-radius:10px}
    .copy-btn{background:#00d4ff;color:#000}
    .pass-btn{background:#ff6b6b;color:white}
    .controls{display:flex;gap:12px;align-items:center;margin-bottom:16px;flex-wrap:wrap}
    .controls select,.controls input{padding:12px;border-radius:10px;border:1px solid var(--p);background:var(--c);color:var(--t)}
    .file-list{margin-top:16px;max-height:120px;overflow-y:auto;padding:8px;background:rgba(255,255,255,.05);border-radius:10px;display:none}
    .file-item{font-size:14px;color:var(--tl);margin:4px 0;display:flex;justify-content:space-between}
    .counter{margin-top:12px;font-size:14px;color:var(--tl)}
    @media (max-width:480px){.box{padding:32px}h1{font-size:30px}.dz{padding:48px}.cloud{font-size:56px}}
  </style>
</head>
<body>
  <div class="box">
    <h1>FASTDROP</h1>
    <p class="sub">До 500 МБ • Бесплатно • 7 дней</p>

    <div class="controls">
      <select id="expire">
        <option value="3600">1 час</option>
        <option value="86400">1 день</option>
        <option value="604800" selected>7 дней</option>
      </select>
      <input type="text" id="password" placeholder="Пароль (необязательно)" />
      <button onclick="document.getElementById('fileInput').click()">ВЫБРАТЬ ФАЙЛЫ</button>
    </div>

    <div class="dz" id="dz">
      <div class="cloud">cloud_upload</div>
      <p>Перетащи или кликни</p>
      <input type="file" id="fileInput" multiple style="display:none"/>
    </div>

    <div class="file-list" id="fileList"></div>

    <div class="prog" id="progress">
      <div class="bar"><div class="fill" id="fill"></div></div>
      <div class="ptxt" id="percent">0%</div>
    </div>

    <div class="res" id="result">
      <p>Готово! Ссылка:</p>
      <input type="text" id="link" readonly/>
      <button class="copy-btn" onclick="copyLink()">Копировать</button>
      <button class="pass-btn" onclick="togglePassword()">Пароль</button>
      <div class="pass-input" id="passInput" style="display:none">
        <input type="text" id="passwordShow" placeholder="Пароль: ..." readonly />
      </div>
      <p class="counter">Загрузок: <span id="downloads">0</span></p>
      <p style="font-size:12px;margin-top:8px;color:var(--tl)">Клик → скачивание на Рабочий стол</p>
    </div>
  </div>

  <script>
    const dropzone = document.getElementById('dz');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const progress = document.getElementById('progress');
    const fill = document.getElementById('fill');
    const percent = document.getElementById('percent');
    const result = document.getElementById('result');
    const link = document.getElementById('link');
    const passInput = document.getElementById('passInput');
    const passwordShow = document.getElementById('passwordShow');
    const downloads = document.getElementById('downloads');

    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', updateFileList);

    ['dragover', 'dragenter'].forEach(e => dropzone.addEventListener(e, ev => { ev.preventDefault(); dropzone.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach(e => dropzone.addEventListener(e, () => dropzone.classList.remove('dragover')));
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length) {
        fileInput.files = files;
        updateFileList();
        uploadFiles();
      }
    });

    function updateFileList() {
      const files = fileInput.files;
      fileList.innerHTML = '';
      if (files.length === 0) {
        fileList.style.display = 'none';
        return;
      }
      fileList.style.display = 'block';
      for (let file of files) {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.innerHTML = \`\${file.name} <span>\${(file.size / 1024 / 1024).toFixed(1)} МБ</span>\`;
        fileList.appendChild(div);
      }
      uploadFiles();
    }

    function uploadFiles() {
      const files = fileInput.files;
      if (!files.length) return;

      const formData = new FormData();
      for (let file of files) formData.append('files', file);
      formData.append('expire', document.getElementById('expire').value);
      const pass = document.getElementById('password').value.trim();
      if (pass) formData.append('password', pass);

      progress.style.display = 'block';
      result.style.display = 'none';
      dropzone.innerHTML = '<div class="cloud">hourglass_top</div><p>Загружаем...</p>';

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/upload');
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          const p = (e.loaded / e.total) * 100;
          fill.style.width = p + '%';
          percent.textContent = Math.round(p) + '%';
        }
      };
      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          link.value = location.href + data.id + (pass ? '?p=' + pass : '');
          if (pass) passwordShow.value = pass;
          result.style.display = 'block';
          progress.style.display = 'none';
          dropzone.innerHTML = '<div class="cloud">check_circle</div><p>Готово!</p><button onclick="document.getElementById(\'fileInput\').click()">ЕЩЁ</button>';
          fetchDownloads(data.id);
        }
      };
      xhr.send(formData);
    }

    function copyLink() {
      link.select();
      document.execCommand('copy');
      alert('Скопировано!');
    }

    function togglePassword() {
      passInput.style.display = passInput.style.display === 'block' ? 'none' : 'block';
    }

    function fetchDownloads(id) {
      fetch('/stats/' + id).then(r => r.json()).then(d => {
        downloads.textContent = d.downloads || 0;
      });
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  </script>
</body>
</html>
  `);
});

// МУЛЬТИЗАГРУЗКА
app.post('/upload', upload.array('files'), (req, res) => {
  const id = uuidv4().slice(0, 12);
  const expire = parseInt(req.body.expire) || 604800;
  const password = req.body.password || null;

  const meta = {
    files: req.files.map(f => ({ name: f.originalname, size: f.size, filename: f.filename })),
    password,
    downloads: 0,
    expire: Date.now() + expire * 1000
  };
  fs.writeJsonSync(path.join(UPLOAD_DIR, id + '.json'), meta);

  setTimeout(() => {
    req.files.forEach(f => fs.remove(path.join(UPLOAD_DIR, f.filename)).catch(() => {}));
    fs.remove(path.join(UPLOAD_DIR, id + '.json')).catch(() => {});
  }, expire * 1000);

  res.json({ id });
});

// СКАЧИВАНИЕ
app.get('/:id', (req, res) => {
  const id = req.params.id.split('?')[0];
  const metaPath = path.join(UPLOAD_DIR, id + '.json');
  if (!fs.existsSync(metaPath)) return res.status(404).send('Файл удалён');
  const meta = fs.readJsonSync(metaPath);
  const pass = req.query.p;

  if (meta.password && meta.password !== pass) {
    return res.send('<h1>Введите пароль</h1><input type="text" id="p"><button onclick="location.href=location.pathname+\'?p=\'+document.getElementById(\'p\').value">OK</button>');
  }

  if (meta.files.length === 1) {
    const file = meta.files[0];
    const filePath = path.join(UPLOAD_DIR, file.filename);
    meta.downloads++;
    fs.writeJsonSync(metaPath, meta);
    return res.download(filePath, file.name);
  }

  // Если несколько — ZIP (позже добавим)
  res.send('<h2>Скачайте файлы:</h2>' + meta.files.map(f => 
    `<p><a href="/dl/${id}/${f.filename}">${f.name} (${(f.size/1024/1024).toFixed(1)} МБ)</a></p>`
  ).join(''));
});

app.get('/dl/:id/:filename', (req, res) => {
  const metaPath = path.join(UPLOAD_DIR, req.params.id + '.json');
  if (!fs.existsSync(metaPath)) return res.status(404).send('Файл удалён');
  const meta = fs.readJsonSync(metaPath);
  meta.downloads++;
  fs.writeJsonSync(metaPath, meta);
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  const file = meta.files.find(f => f.filename === req.params.filename);
  res.download(filePath, file.name);
});

app.get('/stats/:id', (req, res) => {
  const metaPath = path.join(UPLOAD_DIR, req.params.id + '.json');
  if (!fs.existsSync(metaPath)) return res.json({ downloads: 0 });
  const meta = fs.readJsonSync(metaPath);
  res.json({ downloads: meta.downloads || 0 });
});

app.get('/manifest.json', (req, res) => {
  res.json({
    name: "FASTDROP",
    short_name: "FASTDROP",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a1a",
    theme_color: "#00d4ff",
    icons: [{ src: "/icon.png", sizes: "192x192", type: "image/png" }]
  });
});

app.get('/sw.js', (req, res) => {
  res.send(`self.addEventListener('install', e => self.skipWaiting());`);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('FASTDROP 3.0 запущен на порту ' + PORT);
});
