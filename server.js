const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // ← ВСЁ ИЗ public/

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.ensureDirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const id = uuidv4().slice(0, 12);
    cb(null, id + '__' + file.originalname);
  }
});
const upload = multer({ storage });

// === ЗАГРУЗКА ===
app.post('/upload', upload.array('file'), (req, res) => {
  try {
    const id = uuidv4().slice(0, 12);
    const files = req.files;
    const meta = { downloads: 0, uploaded: Date.now() };
    const metaPath = path.join(UPLOAD_DIR, id + '.json');
    fs.writeJsonSync(metaPath, meta);

    // Удаление через 7 дней
    setTimeout(() => {
      files.forEach(f => fs.remove(f.path).catch(() => {}));
      fs.remove(metaPath).catch(() => {});
    }, 7 * 24 * 60 * 60 * 1000);

    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// === СКАЧИВАНИЕ ===
app.get('/:id', (req, res) => {
  const id = req.params.id;
  const metaPath = path.join(UPLOAD_DIR, id + '.json');
  if (!fs.existsSync(metaPath)) return res.status(404).send('Файл удалён');

  const meta = fs.readJsonSync(metaPath);
  meta.downloads++;
  fs.writeJsonSync(metaPath, meta);

  const file = fs.readdirSync(UPLOAD_DIR).find(f => f.startsWith(id + '__'));
  if (!file) return res.status(404).send('Файл не найден');

  const filePath = path.join(UPLOAD_DIR, file);
  const name = file.split('__')[1];
  res.download(filePath, name);
});

// === СТАТИСТИКА ===
app.get('/stats/:id', (req, res) => {
  const metaPath = path.join(UPLOAD_DIR, req.params.id + '.json');
  if (!fs.existsSync(metaPath)) return res.json({ downloads: 0 });
  res.json(fs.readJsonSync(metaPath));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FASTDROP 17.0 — http://localhost:${PORT}`);
});
