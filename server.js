app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>FASTDROP • 200 ГБ бесплатно</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" href="/icon.png">
  <meta name="theme-color" content="#00d4ff">
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
  <style>
    :root { --p:#00d4ff; --bg:#0a0a1a; --c:#1a1a2e; --t:#e2e8f0; --tl:#94a3b8; --s:#00ff88; --g:linear-gradient(90deg,#00d4ff,#00ff88); }
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--t);min-height:100vh;overflow-x:hidden}
    header{background:var(--c);border-bottom:1px solid rgba(0,212,255,.2);position:sticky;top:0;z-index:100}
    nav{display:flex;justify-content:space-between;align-items:center;padding:16px 24px;max-width:1200px;margin:0 auto}
    .logo{font-size:24px;font-weight:700;background:var(--g);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .tabs{display:flex;gap:24px}
    .tab{font-size:15px;color:var(--tl);cursor:pointer;padding:8px 0;position:relative;transition:all .3s}
    .tab.active{color:var(--t);font-weight:600}
    .tab.active::after{content:'';position:absolute;bottom:-1px;left:0;width:100%;height:2px;background:var(--g);border-radius:1px}
    .tab:hover{color:var(--t)}
    main{max-width:1200px;margin:0 auto;padding:40px 24px}
    .hero{text-align:center;margin-bottom:60px}
    .hero h1{font-size:42px;font-weight:700;background:var(--g);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:12px}
    .hero p{font-size:18px;color:var(--tl);margin-bottom:32px}
    .stats{display:flex;justify-content:center;gap:40px;margin:40px 0;flex-wrap:wrap}
    .stat{text-align:center}
    .stat h3{font-size:36px;font-weight:700;color:var(--p);margin-bottom:8px}
    .stat p{font-size:15px;color:var(--tl)}
    .box{background:var(--c);border-radius:24px;padding:40px;box-shadow:0 20px 40px rgba(0,212,255,.1);border:1px solid rgba(0,212,255,.2);margin-bottom:40px}
    h2{font-size:28px;font-weight:700;background:var(--g);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:20px;text-align:center}
    .dz{border:3px dashed var(--p);border-radius:16px;padding:48px;text-align:center;cursor:pointer;transition:all .3s;position:relative;overflow:hidden}
    .dz:hover{border-color:var(--s);background:rgba(0,255,136,.05);transform:translateY(-4px);box-shadow:0 12px 24px rgba(0,212,255,.3)}
    .dz.dragover{border-color:var(--s);background:rgba(0,255,136,.15);animation:p 1.5s infinite}
    @keyframes p{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
    .dz i{font-size:48px;color:var(--p);margin-bottom:16px;display:block;animation:bounce 2s infinite}
    @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    .dz p{color:var(--tl);margin-bottom:16px}
    .prog{margin-top:20px;display:none}
    .bar{height:10px;background:rgba(255,255,255,.1);border-radius:5px;overflow:hidden}
    .fill{height:100%;background:var(--g);width:0%;transition:width .3s;border-radius:5px}
    .ptxt{text-align:center;margin-top:8px;font-size:14px;color:var(--tl);font-weight:600}
    .res{margin-top:24px;padding:20px;background:rgba(0,255,136,.1);border-radius:12px;border:1px solid rgba(0,255,136,.3);display:none}
    .res input{width:100%;padding:14px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:10px;color:white;font-family:monospace;margin:10px 0;font-size:15px}
    button{background:var(--g);color:#0a0a1a;border:none;padding:14px 28px;border-radius:10px;font-weight:700;cursor:pointer;transition:all .3s;font-size:16px}
    button:hover{transform:translateY(-3px);box-shadow:0 10px 20px rgba(0,212,255,.4)}
    .copy-btn,.qr-btn{margin:4px;padding:10px 20px;font-size:14px;border-radius:8px}
    .copy-btn{background:var(--p);color:#000}
    .qr-btn{background:#ff6b6b;color:white}
    .qrcode{margin-top:16px;text-align:center;display:none}
    .counter{margin-top:12px;font-size:13px;color:var(--tl)}
    .preview-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px;margin-top:20px}
    .preview-item{position:relative;overflow:hidden;border-radius:8px}
    .preview-item img{width:100%;height:100%;object-fit:cover;border-radius:8px}
    .preview-name{position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.7);color:white;font-size:12px;padding:4px 8px;text-align:center}
    .premium{background:linear-gradient(135deg,#1a1a2e,#2d1b69);border-radius:20px;padding:32px;margin:40px 0;text-align:center;color:var(--t)}
    .premium h3{font-size:26px;margin-bottom:12px;background:var(--g);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .premium p{font-size:16px;color:var(--tl);margin-bottom:24px}
    .price{font-size:36px;font-weight:700;color:var(--s);margin-bottom:16px}
    .features{list-style:none;text-align:left;display:inline-block}
    .features li{margin:12px 0;font-size:15px;color:var(--tl)}
    .features li i{color:var(--s);margin-right:8px}
    .btn-premium{background:var(--s);color:#000;padding:16px 40px;border-radius:12px;font-weight:700;font-size:18px}
    .btn-premium:hover{transform:scale(1.05);box-shadow:0 15px 30px rgba(0,255,136,.4)}
    footer{text-align:center;padding:40px;color:var(--tl);font-size:14px}
    @media (max-width:768px){
      .stats{gap:20px}
      .stat h3{font-size:28px}
      .hero h1{font-size:36px}
      .box{padding:32px}
      .dz{padding:40px}
      .dz i{font-size:40px}
    }
  </style>
</head>
<body>
  <header>
    <nav>
      <div class="logo">FASTDROP</div>
      <div class="tabs">
        <div class="tab active" onclick="showTab('home')">Главная</div>
        <div class="tab" onclick="showTab('premium')">Премиум</div>
        <div class="tab" onclick="showTab('about')">О нас</div>
      </div>
    </nav>
  </header>

  <main>
    <div id="home" class="tab-content">
      <div class="hero">
        <h1>FASTDROP</h1>
        <p>До 200 ГБ • Бесплатно • 7 дней</p>
        <div class="stats">
          <div class="stat"><h3>127 482</h3><p>Файлов отправлено</p></div>
          <div class="stat"><h3>89.2 ТБ</h3><p>Передано данных</p></div>
          <div class="stat"><h3>42 819</h3><p>Довольных пользователей</p></div>
        </div>
      </div>

      <div class="box">
        <h2>Отправь файл — забудь</h2>
        <div class="dz" id="dz">
          <i class="fas fa-cloud-upload-alt"></i>
          <p>Перетащи или кликни</p>
          <input type="file" id="fileInput" style="display:none" multiple/>
          <button onclick="document.getElementById('fileInput').click()">ВЫБРАТЬ ФАЙЛ</button>
        </div>
        <div id="preview" class="preview-grid" style="display:none"></div>
        <div class="prog" id="progress">
          <div class="bar"><div class="fill" id="fill"></div></div>
          <div class="ptxt" id="percent">0%</div>
        </div>
        <div class="res" id="result">
          <p><i class="fas fa-check-circle" style="color:#00ff88"></i> Готово! Ссылка:</p>
          <input type="text" id="link" readonly/>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:10px">
            <button class="copy-btn" onclick="copyLink()">Copy</button>
            <button class="qr-btn" onclick="showQR()">QR</button>
          </div>
          <div class="qrcode" id="qrcode"></div>
          <p class="counter">Загрузок: <span id="downloads">0</span></p>
          <p style="font-size:12px;margin-top:8px;color:var(--tl)">Клик → скачивание на Рабочий стол</p>
        </div>
      </div>

      <div class="premium">
        <h3>Хочешь больше?</h3>
        <p>Премиум — без рекламы, файлы навсегда, приоритетная скорость</p>
        <div class="price">99 ₽ / месяц</div>
        <ul class="features">
          <li><i class="fas fa-infinity"></i> Безлимитное хранение</li>
          <li><i class="fas fa-shield-alt"></i> Пароль на каждый файл</li>
          <li><i class="fas fa-tachometer-alt"></i> Скорость до 1 Гбит/с</li>
          <li><i class="fas fa-chart-line"></i> Подробная статистика</li>
        </ul>
        <button class="btn-premium">Оформить премиум</button>
      </div>
    </div>

    <div id="premium" class="tab-content" style="display:none">
      <h2 style="text-align:center">Премиум — для тех, кто ценит время</h2>
      <div style="max-width:800px;margin:0 auto">
        <div class="premium" style="background:linear-gradient(135deg,#2d1b69,#1a1a2e)">
          <h3>FASTDROP PRO</h3>
          <div class="price">99 ₽ / месяц</div>
          <p style="margin:20px 0">Или 999 ₽ / год (экономия 17%)</p>
          <ul class="features">
            <li><i class="fas fa-infinity"></i> Файлы хранятся <strong>навсегда</strong></li>
            <li><i class="fas fa-lock"></i> Защита паролем для каждого файла</li>
            <li><i class="fas fa-bolt"></i> Приоритетная загрузка (до 1 Гбит/с)</li>
            <li><i class="fas fa-chart-bar"></i> Статистика: кто, когда, откуда</li>
            <li><i class="fas fa-headset"></i> Приоритетная поддержка 24/7</li>
            <li><i class="fas fa-gift"></i> Без рекламы навсегда</li>
          </ul>
          <button class="btn-premium">Купить PRO</button>
        </div>
      </div>
    </div>

    <div id="about" class="tab-content" style="display:none">
      <h2 style="text-align:center">Почему FASTDROP?</h2>
      <div style="max-width:800px;margin:0 auto;text-align:center">
        <p style="font-size:18px;color:var(--tl);margin:30px 0">
          Мы создали сервис, которого не хватало: <strong>быстрый, простой, безлимитный</strong>.<br>
          Никаких аккаунтов, никаких лимитов, никаких ожиданий.
        </p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px;margin-top:40px">
          <div><i class="fas fa-rocket" style="font-size:48px;color:var(--p);margin-bottom:16px"></i><h3>Мгновенно</h3><p>Файл 100 ГБ — за 3 минуты</p></div>
          <div><i class="fas fa-shield-alt" style="font-size:48px;color:var(--s);margin-bottom:16px"></i><h3>Безопасно</h3><p>Автоудаление через 7 дней</p></div>
          <div><i class="fas fa-mobile-alt" style="font-size:48px;color:var(--p);margin-bottom:16px"></i><h3>На любом устройстве</h3><p>PWA — как приложение</p></div>
        </div>
      </div>
    </div>
  </main>

  <footer>
    © 2025 FASTDROP • <a href="#" style="color:var(--p)">Политика конфиденциальности</a>
  </footer>

  <script>
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    function showTab(id) {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.style.display = 'none');
      document.querySelector(\`[onclick="showTab('\${id}')"]\`).classList.add('active');
      document.getElementById(id).style.display = 'block';
    }

    const dropzone = document.getElementById('dz');
    const fileInput = document.getElementById('fileInput');
    const preview = document.getElementById('preview');
    const progress = document.getElementById('progress');
    const fill = document.getElementById('fill');
    const percent = document.getElementById('percent');
    const result = document.getElementById('result');
    const link = document.getElementById('link');
    const qrcode = document.getElementById('qrcode');
    const downloads = document.getElementById('downloads');
    let startTime;

    ['dragover', 'dragenter'].forEach(e => dropzone.addEventListener(e, ev => { ev.preventDefault(); dropzone.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach(e => dropzone.addEventListener(e, () => dropzone.classList.remove('dragover')));
    dropzone.addEventListener('drop', e => { e.preventDefault(); handleFiles(e.dataTransfer.files); });
    fileInput.addEventListener('change', () => handleFiles(fileInput.files));

    function handleFiles(files) {
      preview.innerHTML = '';
      preview.style.display = 'grid';
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = e => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = \`<img src="\${e.target.result}"><div class="preview-name">\${file.name}</div>\`;
            preview.appendChild(div);
          };
          reader.readAsDataURL(file);
        }
      });
      uploadFiles(files);
    }

    function uploadFiles(files) {
      const formData = new FormData();
      Array.from(files).forEach((file, i) => formData.append(\`file\${i}\`, file));
      progress.style.display = 'block';
      result.style.display = 'none';
      dropzone.innerHTML = '<i class="fas fa-spinner fa-spin"></i><p>Загружаем...</p>';
      startTime = Date.now();

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/upload', true);
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          const p = (e.loaded / e.total) * 100;
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = elapsed > 0 ? (e.loaded / 1024 / 1024 / elapsed).toFixed(1) : 0;
          fill.style.width = p + '%';
          percent.textContent = Math.round(p) + '% • ' + speed + ' МБ/с';
        }
      };
      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          link.value = location.href + data.id;
          result.style.display = 'block';
          progress.style.display = 'none';
          dropzone.innerHTML = '<i class="fas fa-check"></i><p>Готово!</p><button onclick="document.getElementById(\'fileInput\').click()">ЕЩЁ</button>';
          fetchDownloads(data.id);
        }
      };
      xhr.send(formData);
    }

    function copyLink() { link.select(); document.execCommand('copy'); alert('Скопировано!'); }
    function showQR() { qrcode.style.display = 'block'; new QRCode(qrcode, { text: link.value, width: 120, height: 120, colorDark: "#00ff88", colorLight: "#1a1a2e" }); }
    function fetchDownloads(id) { fetch('/stats/' + id).then(r => r.json()).then(d => downloads.textContent = d.downloads || 0); }

    if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }
  </script>
</body>
</html>
  `);
});
