const { isOwner } = require('../utils');

module.exports = {
  name: 'p',
  async run(sock, from, msg, args, q, ctx) {
    if (!ctx.fromMe && !isOwner(ctx.senderNum)) {
      return sock.sendMessage(from, { text: 'Fitur ini khusus owner.' }, { quoted: msg });
    }
    const m = q.match(/^([\s\S]+)\s+(62\d{8,15})$/);
    if (!m) return sock.sendMessage(from, { text: 'Format: .p <text> <62xxxxxxxxxx>' }, { quoted: msg });

    const jid = m[2] + '@s.whatsapp.net';
    const check = await sock.onWhatsApp(jid);
    if (!check || !check[0] || !check[0].exists) {
      return sock.sendMessage(from, { text: 'Nomor ' + m[2] + ' tidak terdaftar di WhatsApp.' }, { quoted: msg });
    }
    await sock.sendMessage(jid, { text: m[1] });
    await sock.sendMessage(from, { text: 'Pesan terkirim ke ' + m[2] }, { quoted: msg });
  }
};
