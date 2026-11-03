const { OWNER_NUMBER } = require('../utils');

// ============================================================
// GANTI SAMPUL MENU DI SINI. Isi link gambar (http/https).
// Kosongkan ('') jika ingin menu teks saja.
// Catatan: media/QR.jpg BUKAN untuk menu, hanya untuk .order
// ============================================================
const MENU_COVER_LINK = 'https://imgur.com/a/Q2KRoyY';

const CATEGORIES = {
  MEDIA: ['rvo', 'toimg', 'tostc', 'toptv', 'getpp', 'alyzmusik'],
  GRUP: ['open', 'close', 'tagall', 'h', 'ban', 'deleteban', 'delete', 'alyzkudet'],
  UMUM: ['owner', 'order', 'info', 'p', 'selfmode']
};

module.exports = {
  name: 'menu',
  async run(sock, from, msg, args, q, ctx) {
    const names = [...ctx.features.keys()].filter((n) => n !== 'menu').sort();
    const used = new Set();
    const blocks = [];
    const addBlock = (title, list) => {
      if (!list.length) return;
      blocks.push(
        '┌──「 ' + title + ' 」\n' +
        list.map((n) => '│ ' + ctx.prefix + n).join('\n') +
        '\n└──────────────'
      );
    };

    for (const [title, list] of Object.entries(CATEGORIES)) {
      const present = list.filter((n) => names.includes(n));
      present.forEach((n) => used.add(n));
      addBlock(title, present);
    }
    addBlock('LAINNYA', names.filter((n) => !used.has(n)));

    const text = [
      '*ALYZ BOT*',
      '',
      'Owner  : ' + OWNER_NUMBER,
      'Bot    : ' + ctx.number,
      'Prefix : ' + ctx.prefix,
      'Fitur  : ' + names.length,
      '',
      blocks.join('\n\n'),
      '',
      'ALYZ BOT v3.0'
    ].join('\n');

    if (/^https?:\/\//i.test(MENU_COVER_LINK)) {
      try {
        await sock.sendMessage(from, { image: { url: MENU_COVER_LINK }, caption: text }, { quoted: msg });
        return;
      } catch (e) {
        console.log('[menu] cover gagal, kirim teks:', e.message);
      }
    }
    await sock.sendMessage(from, { text }, { quoted: msg });
  }
};
