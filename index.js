const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const { loadFeatures } = require('./lib/loader');
const { isOwner, sleep, formatPair, jidNum, getBody } = require('./lib/utils');

const PORT = process.env.PORT || 3000;
const PREFIX = '.';
const COOLDOWN_MS = 30000;
const AUTH_ROOT = path.join(__dirname, 'auth');
const FEATURE_DIR = path.join(__dirname, 'lib', 'feature');
const logger = pino({ level: 'silent' });

const bots = new Map();          // number -> { sock, connected }
const bannedInGroup = new Map(); // groupId -> Set(number)
const selfMode = new Map();      // number -> boolean
const features = new Map();      // cmd -> { name, run }
global.lastPair = 0;

const getAuthDir = (number) => path.join(AUTH_ROOT, number);
const wipeAuth = (number) => fs.rmSync(getAuthDir(number), { recursive: true, force: true });

/* ---------- Fitur + hot reload ---------- */
loadFeatures(FEATURE_DIR, features);
console.log('[FEATURE] dimuat:', [...features.keys()].join(', '));
try {
  let t;
  fs.watch(FEATURE_DIR, () => {
    clearTimeout(t);
    t = setTimeout(() => {
      loadFeatures(FEATURE_DIR, features);
      console.log('[FEATURE] reload, total', features.size);
    }, 300);
  });
} catch (e) {
  console.log('[FEATURE] watch tidak aktif:', e.message);
}

/* ---------- Bot ---------- */
async function handleMessage(sock, number, msg) {
  if (!msg || !msg.message) return;
  const from = msg.key.remoteJid;
  if (!from || from === 'status@broadcast' || from.endsWith('@newsletter')) return;

  const isGroup = from.endsWith('@g.us');
  const fromMe = !!msg.key.fromMe;
  const sender = fromMe ? sock.user.id : (msg.key.participant || from);
  const senderNum = jidNum(sender);

  // member yang di-ban: pesannya dihapus (bot harus admin)
  if (isGroup && !fromMe && bannedInGroup.get(from) && bannedInGroup.get(from).has(senderNum)) {
    try { await sock.sendMessage(from, { delete: msg.key }); } catch {}
    return;
  }

  // self mode: hanya owner / akun bot sendiri
  if (selfMode.get(number) && !fromMe && !isOwner(senderNum)) return;

  const text = getBody(msg.message).trim();
  if (!text.startsWith(PREFIX)) return;

  const args = text.slice(PREFIX.length).trim().split(/\s+/);
  const cmd = (args.shift() || '').toLowerCase();
  const q = args.join(' ');
  if (!features.has(cmd)) return;

  try {
    await features.get(cmd).run(sock, from, msg, args, q, {
      number, isGroup, sender, senderNum, fromMe,
      bannedInGroup, selfMode, features, prefix: PREFIX
    });
  } catch (e) {
    console.log('[CMD ERROR]', cmd, e.message);
    try {
      await sock.sendMessage(from, { text: 'Terjadi kesalahan pada perintah .' + cmd + ': ' + e.message }, { quoted: msg });
    } catch {}
  }
}

async function createBot(number) {
  const dir = getAuthDir(number);
  fs.mkdirSync(dir, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(dir);

  let version;
  try { ({ version } = await fetchLatestBaileysVersion()); } catch {}

  const sock = makeWASocket({
    ...(version ? { version } : {}),
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
    logger,
    printQRInTerminal: false,
    browser: ['ALYZ BOT', 'Chrome', '1.0'],
    markOnlineOnConnect: false,
    syncFullHistory: false
  });

  const entry = { sock, connected: false, stopped: false };
  bots.set(number, entry);

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      entry.connected = true;
      console.log('[' + number + '] CONNECTED');
    }
    if (connection === 'close') {
      entry.connected = false;
      if (entry.stopped || bots.get(number) !== entry) return;
      const code = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output
        ? lastDisconnect.error.output.statusCode : undefined;
      console.log('[' + number + '] closed, code', code);

      if (code === DisconnectReason.loggedOut) {
        bots.delete(number);
        wipeAuth(number);
      } else if (!sock.authState.creds.registered) {
        // belum pernah berhasil pairing: jangan reconnect terus
        bots.delete(number);
        wipeAuth(number);
      } else {
        setTimeout(() => {
          if (bots.get(number) === entry) createBot(number).catch((e) => console.log('[reconnect]', e.message));
        }, 3000);
      }
    }
  });

  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const m of messages) handleMessage(sock, number, m).catch((e) => console.log('[MSG]', e.message));
  });

  return entry;
}

async function stopBot(number, { wipe = false } = {}) {
  const entry = bots.get(number);
  if (entry) {
    entry.stopped = true;
    try { entry.sock.end(undefined); } catch {}
    bots.delete(number);
  }
  if (wipe) wipeAuth(number);
}

async function restoreBots() {
  fs.mkdirSync(AUTH_ROOT, { recursive: true });
  for (const n of fs.readdirSync(AUTH_ROOT)) {
    if (!/^\d+$/.test(n)) continue;
    const cf = path.join(AUTH_ROOT, n, 'creds.json');
    if (!fs.existsSync(cf)) continue;
    try {
      const c = JSON.parse(fs.readFileSync(cf, 'utf8'));
      if (!c.registered) { wipeAuth(n); continue; }
    } catch { continue; }
    console.log('[RESTORE]', n);
    await createBot(n).catch((e) => console.log('[RESTORE ERROR]', n, e.message));
    await sleep(1500);
  }
}

/* ---------- Web + API ---------- */
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/media', express.static(path.join(__dirname, 'media')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/health', (req, res) => res.json({ ok: true, bots: bots.size }));

app.post('/api/pair', async (req, res) => {
  try {
    const number = String((req.body && req.body.number) || '').replace(/\D/g, '');
    if (number.length < 10 || number.length > 15) {
      return res.status(400).json({ error: 'Nomor tidak valid. Gunakan format 62xxxxxxxxxx.' });
    }

    const now = Date.now();
    const wait = COOLDOWN_MS - (now - global.lastPair);
    if (wait > 0) {
      return res.status(429).json({ error: 'Cooldown anti limit', retryAfter: Math.ceil(wait / 1000) });
    }

    const existing = bots.get(number);
    if (existing && existing.connected) {
      return res.json({ connected: true, message: 'Nomor ini sudah terhubung.' });
    }
    if (existing && existing.sock.authState.creds.registered) {
      return res.json({ connected: false, message: 'Sesi tersimpan, bot sedang menyambung ulang.' });
    }

    global.lastPair = now;
    if (existing) await stopBot(number, { wipe: true });
    else wipeAuth(number);

    const entry = await createBot(number);
    await sleep(3000); // beri waktu socket membuka koneksi ke WhatsApp
    const raw = await entry.sock.requestPairingCode(number);
    return res.json({ code: formatPair(raw) });
  } catch (e) {
    console.log('[PAIR ERROR]', e.message);
    return res.status(500).json({ error: 'Gagal membuat pairing code: ' + e.message });
  }
});

app.get('/api/status', (req, res) => {
  const number = String(req.query.number || '').replace(/\D/g, '');
  const entry = bots.get(number);
  res.json({ connected: !!(entry && entry.connected), exists: !!entry });
});

app.listen(PORT, () => {
  console.log('ALYZ BOT berjalan di port', PORT);
  restoreBots().catch((e) => console.log('[RESTORE]', e.message));
});
