const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');

const app = express();

// Порт для Railway
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = '/app/uploads';
fs.ensureDirSync(UPLOAD_DIR);

// Настройка загрузки
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const id = uuidv4().slice(0, 12);
    cb(null, id + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500 МБ
});

// Главная страница
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Fileport</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
  <style>
    :root { --p:#6366f1; --bg:#0f0f23; --c:#1a1a2e; --t:#e2e8f0; --tl:#94a3b8; --s:#10b981; }
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',sans-serif;background:linear-gradient(135deg,#0f0f23,#1a1a2e);color:var(--t);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
    .box{background:var(--c);border-radius:24px;padding:40px;max-width:500px;width:100%;box-shadow:0 20px 40px rgba(0,0,0,.3);animation:f 0.6s ease-out}
    @keyframes f{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
    h1{font-size:28px;font-weight:700;background:linear-gradient(90deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-align:center;margin-bottom:8px}
    .sub{color:var(--tl);text-align:center;margin-bottom:32px;font-size:14px}
    .dz{border:3px dashed #6366f1;border-radius:16px;padding:48px;text-align:center;cursor:pointer;transition:all .3s}
    .dz:hover{border-color:#8b5cf6;background:rgba(99,102,241,.05);transform:translateY(-4px);box-shadow:0 10px 20px rgba(99,102,241,.2)}
    .dz.dragover{border-color:var(--s);background:rgba(16,185,129,.1)}
    .dz i{font-size:48px;color:#6366f1;margin-bottom:16px;display:block}
    .dz p{color:var(--tl);margin-bottom:16px}
    .prog{margin-top:20px;display:none}
    .bar{height:8px;background:rgba(255,255,255,.1);border-radius:4px;overflow:hidden}
    .fill{height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);width:0%;transition:width .3s}
    .ptxt{text-align:center;margin-top:8px;font-size:14px;color:var(--tl)}
    .res{margin-top:24px;padding:20px;background:rgba(16,185,129,.1);border-radius:12px;border:1px solid rgba(16,185,129,.3);display:none}
    .res input{width:100%;padding:12px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:8px;color:white;font-family:monospace;margin-top:8px}
    button{background:linear-gradient(90deg,var(--p),#4f46e5);color:white;border:none;padding:12px 24px;border-radius:8px;font-weight:600;cursor:pointer;transition:all .3s}
    button:hover{transform:translateY(-2px);box-shadow:0 8px 16px rgba(99,102,241,.3)}
  </style>
</head>
<body>
  <div class="box">
    <h1>Fileport</h1>
    <p class="sub">До 500 МБ • Бесплатно • 7 дней</p>
    <div class="dz" id="dz">
      <i class="fas fa-cloud-upload-alt"></i>
      <p>Перетащи или кликни</p>
      <input type="file" id="f" style="display:none"/>
      <button onclick="document.getElementById('f').click()">Выбрать</button>
    </div>
    <div class="prog" id="prog">
      <div class="bar"><div class="fill" id="fill"></div></div>
      <div class="ptxt" id="ptxt">0%</div>
    </div>
    <div class="res" id="res">
      <p>Готово! Ссылка:</p>
      <input type="text" id="link" readonly/>
    </div>
  </div>

  <script>
    const dz = document.getElementById('dz'), f = document.getElementById('f'), prog = document.getElementById('prog'), fill = document.getElementById('fill'), ptxt = document.getElementById('ptxt'), res = document.getElementById('res'), link = document.getElementById('link');
    ['dragover','dragenter'].forEach(e=>dz.addEventListener(e,ev=>{ev.preventDefault();dz.classList.add('dragover')}));
    ['dragleave','drop'].forEach(e=>dz.addEventListener(e,ev=>dz.classList.remove('dragover')));
    dz.addEventListener('drop',e=>{e.preventDefault();upload(e.dataTransfer.files[0])});
    dz.addEventListener('click',()=>f.click());
    f.addEventListener('change',()=>{upload(f.files[0])});
    function upload(file){
      const fd=new FormData();fd.append('file',file);
      prog.style.display='block';res.style.display='none';
      dz.innerHTML='<i class="fas fa-spinner fa-spin"></i><p>Загружаем...</p>';
      const x=new XMLHttpRequest();x.open('POST','/upload');
      x.upload.onprogress=e=>{if(e.lengthComputable){const p=(e.loaded/e.total)*100;fill.style.width=p+'%';ptxt.textContent=Math.round(p)+'%'}};
      x.onload=()=>{if(x.status===200){const d=JSON.parse(x.responseText);link.value=location.href+d.id;res.style.display='block';prog.style.display='none';dz.innerHTML='<i class="fas fa-check"></i><p>Готово!</p><button onclick="document.getElementById(\'f\').click()">Ещё</button>'}};
      x.send(fd);
    }
  </script>
</body>
</html>
  `);
});

// Загрузка
app.post('/upload', upload.single('file'), (req, res) => {
  const id = req.file.filename.split('.')[0];
  const meta = {name: req.file.originalname, size: req.file.size, uploaded: new Date().toISOString()};
  fs.writeJsonSync(path.join(UPLOAD_DIR, id + '.json'), meta);
  setTimeout(() => {
    fs.remove(path.join(UPLOAD_DIR, id + path.extname(req.file.originalname))).catch(() => {});
    fs.remove(path.join(UPLOAD_DIR, id + '.json')).catch(() => {});
  }, 7 * 24 * 60 * 60 * 1000);
  res.json({ id });
});

// Страница скачивания
app.get('/:id', (req, res) => {
  const id = req.params.id;
  const metaPath = path.join(UPLOAD_DIR, id + '.json');
  if (!fs.existsSync(metaPath)) return res.status(404).send('Файл удалён');
  const meta = fs.readJsonSync(metaPath);
  const sizeMB = (meta.size / (1024 * 1024)).toFixed(1);
  res.send(`<html><head><title>${meta.name}</title><style>body{font-family:Arial;background:#0f0f23;color:#e2e8f0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}.c{background:#1a1a2e;padding:40px;border-radius:24px;text-align:center;max-width:400px}.btn{margin-top:20px;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:8px}</style></head><body><div class="c"><h2>${meta.name}</h2><p><strong>${sizeMB} МБ</strong></p><p>Скачивание через 2 сек...</p><a href="/dl/${id}" class="btn">СКАЧАТЬ</a></div><script>setTimeout(() => location.href="/dl/${id}", 2000);</script></body></html>`);
});

// Скачивание
app.get('/dl/:id', (req, res) => {
  const id = req.params.id;
  const metaPath = path.join(UPLOAD_DIR, id + '.json');
  if (!fs.existsSync(metaPath)) return res.status(404).send('Файл удалён');
  const meta = fs.readJsonSync(metaPath);
  const filePath = path.join(UPLOAD_DIR, id + path.extname(meta.name));
  res.setHeader('Content-Disposition', `attachment; filename="${meta.name}"`);
  res.sendFile(filePath);
});

// ВАЖНО: 0.0.0.0 + PORT
app.listen(PORT, '0.0.0.0', () => {
  console.log('Fileport запущен на порту ' + PORT);
});
