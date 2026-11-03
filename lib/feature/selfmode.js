const { isOwner } = require('../utils');

module.exports = {
  name: 'selfmode',
  async run(sock, from, msg, args, q, ctx) {
    if (!ctx.fromMe && !isOwner(ctx.senderNum)) {
      return sock.sendMessage(from, { text: 'Fitur ini khusus owner.' }, { quoted: msg });
    }
    const v = (args[0] || '').toLowerCase();
    if (v !== 'on' && v !== 'off') {
      return sock.sendMessage(from, { text: 'Gunakan: .selfmode on / .selfmode off' }, { quoted: msg });
    }
    ctx.selfMode.set(ctx.number, v === 'on');
    await sock.sendMessage(from, { text: 'Self mode ' + (v === 'on' ? 'AKTIF (hanya owner yang bisa memakai bot)' : 'NONAKTIF') }, { quoted: msg });
  }
};
