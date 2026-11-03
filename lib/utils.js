const axios = require('axios');
const pino = require('pino');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const OWNER_NUMBER = '6283176204764';
const logger = pino({ level: 'silent' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jidNum = (jid) => String(jid || '').split('@')[0].split(':')[0];
const isOwner = (sender) => String(sender || '').includes(OWNER_NUMBER);

function normalizeNumber(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = '62' + d.slice(1);
  return d;
}

const WRAPPERS = [
  'ephemeralMessage', 'viewOnceMessage', 'viewOnceMessageV2',
  'viewOnceMessageV2Extension', 'documentWithCaptionMessage', 'editedMessage'
];

function unwrap(message) {
  let m = message;
  for (let i = 0; i < 6 && m; i++) {
    const k = WRAPPERS.find((w) => m[w]);
    if (!k) break;
    m = m[k].message;
  }
  return m || {};
}

function getBody(message) {
  const m = unwrap(message);
  return (
    m.conversation ||
    (m.extendedTextMessage && m.extendedTextMessage.text) ||
    (m.imageMessage && m.imageMessage.caption) ||
    (m.videoMessage && m.videoMessage.caption) ||
    (m.documentMessage && m.documentMessage.caption) ||
    ''
  );
}

function getContext(message) {
  const m = unwrap(message);
  for (const k of Object.keys(m)) {
    const c = m[k] && m[k].contextInfo;
    if (c) return c;
  }
  return null;
}

function getQuoted(msg) {
  const c = getContext(msg.message);
  if (!c || !c.quotedMessage) return null;
  return {
    key: {
      remoteJid: msg.key.remoteJid,
      id: c.stanzaId,
      participant: c.participant,
      fromMe: false
    },
    message: c.quotedMessage
  };
}

const MEDIA_TYPES = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'];
function getMedia(message) {
  const m = unwrap(message);
  const type = MEDIA_TYPES.find((t) => m[t]);
  return type ? { type, content: m[type] } : null;
}

async function dl(sock, msg) {
  return downloadMediaMessage(
    { key: msg.key, message: unwrap(msg.message) },
    'buffer',
    {},
    { logger, reuploadRequest: sock.updateMediaMessage }
  );
}

async function isAdmin(sock, gid, sender) {
  try {
    const meta = await sock.groupMetadata(gid);
    const n = jidNum(sender);
    const p = meta.participants.find((x) => jidNum(x.id) === n);
    return !!(p && p.admin);
  } catch {
    return false;
  }
}

function formatPair(code) {
  const c = String(code || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return c.length > 4 ? c.slice(0, 4) + '-' + c.slice(4) : c;
}

async function getPP(sock, jid) {
  try {
    const url = await sock.profilePictureUrl(jid, 'image');
    if (!url) return null;
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
    return Buffer.from(res.data);
  } catch {
    return null;
  }
}

// Target dari: mention, reply, atau nomor yang diketik
function getTarget(msg, q) {
  const c = getContext(msg.message);
  if (c && c.mentionedJid && c.mentionedJid[0]) return c.mentionedJid[0];
  if (c && c.quotedMessage && c.participant) return c.participant;
  const d = normalizeNumber(q);
  return d.length >= 8 ? d + '@s.whatsapp.net' : null;
}

async function requireGroupStaff(sock, from, msg, ctx, opt = {}) {
  const say = (text) => sock.sendMessage(from, { text }, { quoted: msg });
  if (!ctx.isGroup) { await say('Fitur ini hanya bisa dipakai di grup.'); return false; }
  const ok = ctx.fromMe || isOwner(ctx.senderNum) || (await isAdmin(sock, from, ctx.sender));
  if (!ok) { await say('Fitur ini khusus admin grup atau owner.'); return false; }
  if (opt.needBotAdmin && !(await isAdmin(sock, from, sock.user.id))) {
    await say('Jadikan bot sebagai admin grup terlebih dahulu.');
    return false;
  }
  return true;
}

module.exports = {
  OWNER_NUMBER, logger, sleep, jidNum, isOwner, normalizeNumber,
  unwrap, getBody, getContext, getQuoted, getMedia, dl, isAdmin,
  formatPair, getPP, getTarget, requireGroupStaff
};
