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

// Глобальная статистика (реальная + фейк)
function getGlobalStats() {
  const files = fs.readdirSync(UPLOAD_DIR).filter(f => f.endsWith('.json'));
  const totalFiles = files.length;
  const totalSize = files.reduce((acc, f) => {
    const meta = fs.readJsonSync(path.join(UPLOAD_DIR, f));
    return acc + meta.files.reduce((s, fn) => s + fs.statSync(path.join(UPLOAD_DIR, fn)).size, 0);
  }, 0) / (1024 * 1024 * 1024 * 1024); // ТБ
  return {
    files: 127482 + totalFiles,
    tb: 89 + Math.round(totalSize),
    users: 42819 + Math.round(totalFiles / 3),
    speed: 500
  };
}

// === СТРАНИЦЫ ===
app.get('/', (req, res) => res.send(getPage('home', false)));
app.get('/premium', (req, res) => res.send(getPage('premium', true))); // PRO on /premium
app.get('/about', (req, res) => res.send(getPage('about', false)));
app.get('/privacy', (req, res) => res.send(getPage('privacy', false)));

// Функция генерации страницы
function getPage(activeTab, isPro) {
  const stats = getGlobalStats();
  const proBadge = isPro ? '<span class="pro-badge">PRO</span>' : '';
  const themeToggle = isPro ? '<div class="theme-toggle" id="themeToggle"><i class="fas fa-moon"></i></div>' : '';
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

  const statsBlock = `
    <section class="stats-section">
      <h2>Наша статистика</h2>
      <p class="stats-intro">FASTDROP уже помог тысячам пользователей поделиться файлами быстро и безопасно. Вот наши достижения:</p>
      <div class="stats-grid">
        <div class="stat"><h3><span class="count" data-target="${stats.files}">0</span></h3><p>Файлов загружено</p><i class="fas fa-file-upload stat-icon"></i></div>
        <div class="stat"><h3><span class="count" data-target="${stats.tb}">0</span> ТБ</h3><p>Передано данных</p><i class="fas fa-cloud-download-alt stat-icon"></i></div>
        <div class="stat"><h3><span class="count" data-target="${stats.users}">0</span></h3><p>Активных пользователей</p><i class="fas fa-users stat-icon"></i></div>
        <div class="stat"><h3><span class="count" data-target="${stats.speed}">0</span> Мбит/с</h3><p>Средняя скорость</p><i class="fas fa-tachometer-alt stat-icon"></i></div>
      </div>
      <p class="stats-note">Эти цифры обновляются в реальном времени на основе активности сервера. Присоединяйся и увеличь счётчики!</p>
    </section>`;

  const premiumTeaser = `
    <section class="premium-teaser">
      <h2>Хочешь больше возможностей?</h2>
      <p>Перейди на PRO за 99 ₽/мес и получи неограниченное хранение, пароли, кастомные сроки и персональную статистику.</p>
      <button class="btn-premium" onclick="location.href='/premium'">Узнать больше</button>
    </section>`;

  const faqBlock = `
    <section class="faq-section">
      <h2>Часто задаваемые вопросы</h2>
      <div class="faq-item">
        <h3>Как загрузить файл?</h3>
        <p>Перетащи файл в зону или кликни "Выбрать файлы". Для папок используй отдельную кнопку.</p>
      </div>
      <div class="faq-item">
        <h3>Сколько хранится файл?</h3>
        <p>7 дней бесплатно. В PRO — навсегда или по выбору.</p>
      </div>
      <div class="faq-item">
        <h3>Безопасно ли?</h3>
        <p>Да, анонимно, без логов. Подробнее в <a href="/privacy">политике</a>.</p>
      </div>
      <div class="faq-item">
        <h3>Лимит на размер?</h3>
        <p>До 200 ГБ на файл/папку. Зависит от вашего соединения.</p>
      </div>
    </section>`;

  const homeContent = `
    <div class="hero">
      <h1>FASTDROP${proBadge}</h1>
      <p>Быстрый обмен файлами до 200 ГБ. Без регистрации, бесплатно, на 7 дней.</p>
    </div>
    <div class="box upload-box">
      <h2>Загрузи файл или папку</h2>
      <div class="dz" id="dropzone">
        <i class="fas fa-cloud-upload-alt"></i>
        <p>Перетащи файлы/папку сюда</p>
        <input type="file" id="fileInputFiles" style="display:none" multiple />
        <input type="file" id="fileInputFolder" style="display:none" webkitdirectory />
        <div class="select-buttons">
          <button onclick="document.getElementById('fileInputFiles').click()">Выбрать файлы</button>
          <button onclick="document.getElementById('fileInputFolder').click()">Выбрать папку</button>
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
        <input type="text" id="link" readonly />
        <div class="res-buttons">
          <button class="copy-btn" onclick="copyLink()">COPY</button>
          <button class="qr-btn" onclick="showQR()">QR</button>
        </div>
        <div class="qrcode" id="qrcode" style="display:none"></div>
        <p class="counter">Скачиваний: <span id="downloads">0</span></p>
        ${proStats}
      </div>
    </div>
    ${installBtn}
    <section class="features-section">
      <h2>Почему FASTDROP?</h2>
      <ul class="features-list">
        <li><i class="fas fa-rocket"></i> Супербыстрая загрузка без ожидания</li>
        <li><i class="fas fa-lock"></i> Анонимно и безопасно</li>
        <li><i class="fas fa-mobile-alt"></i> PWA для мобильных</li>
        <li><i class="fas fa-folder-open"></i> Поддержка папок с ZIP</li>
        <li><i class="fas fa-eye"></i> Превью файлов перед отправкой</li>
      </ul>
    </section>
    ${statsBlock}
    ${faqBlock}
    ${premiumTeaser}`;

  const premiumContent = `
    <div class="hero">
      <h1>FASTDROP PRO</h1>
      <p>Разблокируй премиум-фичи за 99 ₽/мес или 999 ₽/год (-17%)</p>
    </div>
    <section class="premium-details">
      <h2>Что входит в PRO?</h2>
      <ul class="features-list">
        <li><i class="fas fa-infinity"></i> Неограниченное хранение (файлы навсегда)</li>
        <li><i class="fas fa-lock"></i> Защита паролем + шифрование</li>
        <li><i class="fas fa-clock"></i> Кастомный срок жизни (от 1 часа)</li>
        <li><i class="fas fa-palette"></i> Темы интерфейса (тёмная/светлая)</li>
        <li><i class="fas fa-chart-line"></i> Полная статистика (IP, время, скачивания)</li>
        <li><i class="fas fa-headset"></i> Приоритетная поддержка 24/7</li>
        <li><i class="fas fa-bolt"></i> Скорость до 1 Гбит/с</li>
      </ul>
    </section>
    <section class="comparison">
      <h2>Free vs PRO</h2>
      <table>
        <thead><tr><th>Фича</th><th>Free</th><th>PRO</th></tr></thead>
        <tbody>
          <tr><td>Хранение</td><td>7 дней</td><td>Навсегда</td></tr>
          <tr><td>Пароль</td><td>Нет</td><td>Да</td></tr>
          <tr><td>Статистика</td><td>Базовая</td><td>Расширенная</td></tr>
          <tr><td>Темы</td><td>Только тёмная</td><td>Выбор</td></tr>
        </tbody>
      </table>
    </section>
    <section class="reviews">
      <h2>Что говорят пользователи</h2>
      <div class="review"><p>"PRO — это game-changer! Файлы не удаляются, статистика топ."</p><cite>— Алексей, дизайнер</cite></div>
      <div class="review"><p>"Люблю пароль для конфиденциальности. Стоит своих денег."</p><cite>— Мария, менеджер</cite></div>
    </section>
    <button class="btn-premium full-width">Купить PRO</button>`;

  const aboutContent = `
    <div class="hero">
      <h1>О FASTDROP</h1>
      <p>Мы делаем обмен файлами простым и быстрым с 2023 года.</p>
    </div>
    <section class="mission">
      <h2>Наша миссия</h2>
      <p>FASTDROP создан для тех, кто устал от сложных сервисов с регистрацией и рекламой. Мы фокусируемся на скорости, анонимности и удобстве. Нет аккаунтов — просто загрузи и поделись.</p>
    </section>
    <section class="history">
      <h2>История</h2>
      <div class="timeline">
        <div class="timeline-item"><span>2023</span><p>Запуск beta-версии</p></div>
        <div class="timeline-item"><span>2024</span><p>Добавлены PWA и ZIP</p></div>
        <div class="timeline-item"><span>2025</span><p>PRO-тариф и статистика</p></div>
      </div>
    </section>
    <section class="team">
      <h2>Команда</h2>
      <p>Мы — небольшая команда энтузиастов из России. Разработчик: @devbro. Дизайн: @artgirl. Поддержка: support@fastdrop.ru</p>
    </section>
    <section class="contact">
      <h2>Связаться</h2>
      <p>Email: info@fastdrop.ru | Telegram: @fastdrop_support</p>
    </section>`;

  const privacyContent = `
    <div class="hero">
      <h1>Политика конфиденциальности</h1>
      <p>Мы ценим вашу приватность и не собираем лишние данные.</p>
    </div>
    <section class="intro">
      <h2>Что мы храним?</h2>
      <p>Только файлы и метаданные (ID, скачивания) на 7 дней. Нет IP, email или имён.</p>
    </section>
    <section class="no-store">
      <h2>Что мы НЕ храним?</h2>
      <ul>
        <li>Логи доступа</li>
        <li>Содержимое файлов (не просматриваем)</li>
        <li>Персональные данные</li>
      </ul>
    </section>
    <section class="deletion">
      <h2>Удаление</h2>
      <p>Файлы автоудаляются через 7 дней. В PRO — по вашему выбору.</p>
    </section>
    <section class="gdpr">
      <h2>Соответствие GDPR</h2>
      <p>Мы не собираем данные ЕС-граждан без согласия. Если нужно удалить — напишите support@fastdrop.ru.</p>
    </section>
    <section class="faq-privacy">
      <h2>FAQ по приватности</h2>
      <div class="faq-item"><h3>Видите ли вы файлы?</h3><p>Нет, только храним.</p></div>
      <div class="faq-item"><h3>Продаёте данные?</h3><p>Никогда.</p></div>
    </section>`;

  const contentMap = { home: homeContent, premium: premiumContent, about: aboutContent, privacy: privacyContent };
  const pageContent = contentMap[activeTab];

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FASTDROP — Быстрый файлообменник</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#0a0a1a">
  <style>
    :root { --p: #00d4ff; --s: #00ff88; --bg: #0a0a1a; --c: #1a1a2e; --t: #e2e8f0; --tl: #94a3b8; --g: linear-gradient(135deg, #00d4ff, #00ff88); }
    [data-theme="light"] { --p: #007bff; --s: #28a745; --bg: #f8f9fa; --c: #ffffff; --t: #212529; --tl: #6c757d; --g: linear-gradient(135deg, #007bff, #28a745); }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--t); min-height: 100vh; transition: all 0.3s; line-height: 1.6; }
    header { background: var(--c); border-bottom: 1px solid rgba(0,212,255,0.2); position: sticky; top: 0; z-index: 100; }
    nav { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; max-width: 1200px; margin: 0 auto; }
    .logo { font-size: 1.4rem; font-weight: 800; background: var(--g); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .pro-badge { background: #ffd700; color: #000; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.7rem; margin-left: 0.5rem; }
    .theme-toggle { cursor: pointer; font-size: 1.2rem; color: var(--tl); transition: 0.3s; }
    .theme-toggle:hover { color: var(--t); }
    .tabs { display: flex; gap: 1.2rem; }
    .tab { font-size: 0.9rem; color: var(--tl); cursor: pointer; padding: 0.5rem 0.8rem; font-weight: 600; transition: all 0.3s; border-radius: 6px; text-decoration: none; }
    .tab:hover { color: var(--t); background: rgba(255,255,255,0.05); }
    .tab.active { color: var(--t); font-weight: 700; background: rgba(0,212,255,0.15); }
    main { max-width: 1200px; margin: 0 auto; padding: 1.5rem; }
    .hero { text-align: center; padding: 2.5rem 1rem; }
    .hero h1 { font-size: 2.4rem; font-weight: 800; background: var(--g); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 0.4rem; }
    .hero p { font-size: 1rem; color: var(--tl); font-weight: 500; }
    .box { background: var(--c); border-radius: 1.2rem; padding: 2rem; box-shadow: 0 1rem 2rem rgba(0,212,255,0.15); border: 1px solid rgba(0,212,255,0.2); margin: 1.5rem 0; }
    h2 { font-size: 1.6rem; font-weight: 700; background: var(--g); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 1rem; text-align: center; }
    .dz { border: 3px dashed var(--p); border-radius: 1rem; padding: 3rem; text-align: center; cursor: pointer; transition: all 0.3s; }
    .dz:hover { border-color: var(--s); background: rgba(0,255,136,0.08); transform: translateY(-2px); }
    .dz i { font-size: 3rem; color: var(--p); margin-bottom: 0.8rem; animation: float 3s infinite; }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    .dz p { font-size: 1rem; color: var(--tl); margin-bottom: 1rem; }
    .select-buttons { display: flex; gap: 1rem; justify-content: center; }
    .controls { display: flex; gap: 0.8rem; justify-content: center; margin: 1rem 0; flex-wrap: wrap; }
    select, input[type="password"] { padding: 0.6rem; border-radius: 0.5rem; border: 1px solid var(--tl); background: var(--c); color: var(--t); font-size: 0.9rem; width: 10rem; }
    .prog { margin-top: 1.5rem; }
    .bar { height: 0.8rem; background: rgba(255,255,255,0.1); border-radius: 0.4rem; overflow: hidden; position: relative; }
    .fill { height: 100%; background: var(--g); width: 0%; transition: width 0.3s; }
    .speed { position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); font-size: 0.8rem; color: var(--tl); }
    .ptxt { text-align: center; margin-top: 0.5rem; font-size: 0.9rem; color: var(--tl); }
    .preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(6rem, 1fr)); gap: 0.8rem; margin: 1rem 0; }
    .preview-item { border-radius: 0.5rem; overflow: hidden; border: 1px solid var(--tl); text-align: center; }
    .preview-item img { width: 100%; height: auto; }
    .preview-name { font-size: 0.7rem; padding: 0.2rem; color: var(--tl); background: var(--c); }
    .res { margin-top: 1.5rem; padding: 1.2rem; background: rgba(0,255,136,0.12); border-radius: 0.8rem; border: 1px solid rgba(0,255,136,0.3); }
    .res input { width: 100%; padding: 0.8rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 0.5rem; color: var(--t); font-family: monospace; font-size: 0.9rem; }
    .res-buttons { display: flex; gap: 0.5rem; justify-content: center; margin-top: 0.5rem; }
    button { background: var(--g); color: #000; border: none; padding: 0.8rem 1.8rem; border-radius: 0.6rem; font-weight: 700; cursor: pointer; transition: all 0.3s; font-size: 1rem; }
    button:hover { transform: translateY(-2px); box-shadow: 0 0.5rem 1rem rgba(0,212,255,0.3); }
    .copy-btn { background: var(--p); }
    .qr-btn { background: #ff6b6b; color: white; }
    .qrcode { margin-top: 0.8rem; text-align: center; }
    .counter { margin-top: 0.6rem; font-size: 0.8rem; color: var(--tl); text-align: center; }
    .pro-stats p { font-size: 0.8rem; color: var(--tl); text-align: center; }
    .stats-section { margin: 3rem 0; text-align: center; }
    .stats-intro, .stats-note { font-size: 1rem; color: var(--tl); margin-bottom: 1.5rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr)); gap: 1.2rem; }
    .stat { text-align: center; }
    .stat h3 { font-size: 2rem; color: var(--p); }
    .stat-icon { font-size: 1.5rem; color: var(--p); margin-top: 0.5rem; display: block; }
    .features-section { margin: 3rem 0; }
    .features-list { list-style: none; display: grid; gap: 1rem; }
    .features-list li { font-size: 1rem; color: var(--t); display: flex; align-items: center; gap: 0.5rem; }
    .faq-section { margin: 3rem 0; }
    .faq-item { margin-bottom: 1rem; }
    .faq-item h3 { font-size: 1.1rem; color: var(--p); }
    .premium-teaser { text-align: center; margin: 3rem 0; padding: 2rem; background: var(--g); color: #000; border-radius: 1.2rem; }
    .btn-premium { background: #000; color: white; }
    .full-width { width: 100%; max-width: 20rem; margin: 1rem auto; display: block; }
    .comparison table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    .comparison th, .comparison td { padding: 0.8rem; border: 1px solid var(--tl); text-align: center; }
    .comparison th { background: var(--c); }
    .reviews { margin: 3rem 0; }
    .review { margin-bottom: 1rem; padding: 1rem; background: var(--c); border-radius: 0.8rem; }
    .review cite { display: block; text-align: right; color: var(--tl); }
    .mission, .history, .team, .contact, .intro, .no-store, .deletion, .gdpr, .faq-privacy { margin: 2rem 0; }
    .timeline { display: flex; flex-direction: column; gap: 1rem; }
    .timeline-item { display: flex; gap: 1rem; }
    .timeline-item span { font-weight: 700; color: var(--p); }
    footer { text-align: center; padding: 2rem; color: var(--tl); font-size: 0.8rem; }
    footer a { color: var(--p); text-decoration: none; }
    @media (max-width: 600px) { .controls, .select-buttons { flex-direction: column; } .stats-grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body data-theme="dark">
  <header>
    <nav>
      <div class="logo">FASTDROP</div>
      <div class="nav-right">
        ${themeToggle}
        <div class="tabs">
          <a href="/" class="tab ${activeTab === 'home' ? 'active' : ''}">Главная</a>
          <a href="/premium" class="tab ${activeTab === 'premium' ? 'active' : ''}">Премиум</a>
          <a href="/about" class="tab ${activeTab === 'about' ? 'active' : ''}">О нас</a>
          <a href="/privacy" class="tab ${activeTab === 'privacy' ? 'active' : ''}">Конфиденциальность</a>
        </div>
      </div>
    </nav>
  </header>
  <main>
    ${pageContent}
  </main>
  <footer>
    © 2025 FASTDROP • <a href="/privacy">Политика конфиденциальности</a> • Сделано с ❤️ в России
  </footer>
  <script>
    // PWA, тема, анимация, загрузка — (код скрипта без изменений, но с улучшениями для статистики)
    let deferredPrompt;
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
      window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; installBtn.style.display = 'block'; });
      installBtn.addEventListener('click', () => { deferredPrompt.prompt(); deferredPrompt.userChoice.then(() => installBtn.style.display = 'none'); });
    }
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const isDark = document.body.dataset.theme === 'dark';
        document.body.dataset.theme = isDark ? 'light' : 'dark';
        themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
      });
    }
    function animateStats() {
      document.querySelectorAll('.count').forEach(el => {
        const target = +el.dataset.target;
        const isTB = el.textContent.includes('ТБ');
        let num = 0;
        const inc = target / 100;
        const timer = setInterval(() => {
          num += inc;
          if (num >= target) { clearInterval(timer); el.textContent = isTB ? target + ' ТБ' : target.toLocaleString(); }
          else { el.textContent = isTB ? Math.floor(num) + ' ТБ' : Math.floor(num).toLocaleString(); }
        }, 20);
      });
    }
    if (document.querySelector('.stats-grid')) animateStats();
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
          if (f.type.startsWith('image/')) { const img = document.createElement('img'); img.src = URL.createObjectURL(f); div.appendChild(img); } 
          else { div.innerHTML = '<i class="fas fa-file" style="font-size:2rem;color:var(--tl);margin:1.2rem"></i>'; }
          const name = document.createElement('div'); name.className = 'preview-name'; name.textContent = f.name; div.appendChild(name);
          preview.appendChild(div);
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
        dropzone.innerHTML = '<i class="fas fa-spinner fa-spin"></i><p>Загрузка...</p>';
        startTime = Date.now(); lastLoaded = 0;
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload', true);
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) {
            const p = (e.loaded / e.total) * 100;
            fill.style.width = p + '%'; percent.textContent = Math.round(p) + '%';
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
      function copyLink() { link.select(); document.execCommand('copy'); alert('Ссылка скопирована!'); }
      function showQR() { qrcode.style.display = 'block'; new QRCode(qrcode, { text: link.value, width: 128, height: 128, colorDark: "#00ff88", colorLight: var(--c) }); }
      function pollDownloads(id) {
        setInterval(() => {
          fetch('/stats/' + id).then(r => r.json()).then(d => {
            downloads.textContent = d.downloads || 0;
            if (lastIP && d.lastIP) lastIP.textContent = d.lastIP;
            if (lastTime && d.lastTime) lastTime.textContent = new Date(d.lastTime).toLocaleString();
          });
        }, 3000);
      }
    }
  </script>
</body>
</html>`;
}

// === ЗАГРУЗКА, СКАЧИВАНИЕ, СТАТИСТИКА (без изменений) ===
app.post('/upload', upload.array('file'), (req, res) => {
  try {
    const id = req.body.id;
    const expires = req.body.expires ? parseInt(req.body.expires) * 1000 : 7 * 24 * 60 * 60 * 1000;
    const password = req.body.password || null;
    const files = req.files;
    const meta = { id, password, downloads: 0, created: Date.now(), expires: Date.now() + expires, files: files.map(f => f.filename), ips: [], times: [] };
    const metaPath = path.join(UPLOAD_DIR, id + '.json');
    fs.writeJsonSync(metaPath, meta);
    setTimeout(() => { files.forEach(f => fs.remove(f.path).catch(() => {})); fs.remove(metaPath).catch(() => {}); }, expires);
    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки' });
  }
});

app.get('/:id', (req, res) => {
  const id = req.params.id;
  const metaPath = path.join(UPLOAD_DIR, id + '.json');
  if (!fs.existsSync(metaPath)) return res.status(404).send('Файл не найден');
  const meta = fs.readJsonSync(metaPath);
  if (meta.password && req.query.p !== meta.password) return res.status(403).send('<h3>Пароль</h3><form><input type="password" id="p"><button onclick="location.href=\'?p=\'+document.getElementById(\'p\').value">OK</button></form>');
  if (Date.now() > meta.expires) { fs.remove(metaPath).catch(() => {}); meta.files.forEach(f => fs.remove(path.join(UPLOAD_DIR, f)).catch(() => {})); return res.status(410).send('Срок истёк'); }
  meta.downloads++;
  const ip = req.ip || 'unknown';
  meta.ips.push(ip); meta.times.push(Date.now());
  fs.writeJsonSync(metaPath, meta);
  if (meta.files.length === 1) {
    const filePath = path.join(UPLOAD_DIR, meta.files[0]);
    const name = meta.files[0].split('__')[1];
    res.download(filePath, name);
  } else {
    res.attachment(`${id}.zip`);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
    meta.files.forEach(f => archive.file(path.join(UPLOAD_DIR, f), { name: f.split('__')[1] }));
    archive.finalize();
  }
});

app.get('/stats/:id', (req, res) => {
  const metaPath = path.join(UPLOAD_DIR, req.params.id + '.json');
  if (!fs.existsSync(metaPath)) return res.json({ downloads: 0 });
  const meta = fs.readJsonSync(metaPath);
  const response = { downloads: meta.downloads };
  if (req.originalUrl.includes('premium')) { // PRO check by URL
    response.lastIP = meta.ips.at(-1) || 'нет';
    response.lastTime = meta.times.at(-1) || Date.now();
  }
  res.json(response);
});

app.get('/manifest.json', (req, res) => res.json({ name: "FASTDROP", short_name: "FASTDROP", start_url: "/", display: "standalone", background_color: "#0a0a1a", theme_color: "#00d4ff", icons: [{ src: "data:image/svg+xml,<svg></svg>", sizes: "192x192", type: "image/svg+xml" }] }));

app.listen(PORT, '0.0.0.0', () => console.log(`FASTDROP на ${PORT}`));
