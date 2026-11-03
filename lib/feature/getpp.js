const { getPP, getTarget, jidNum } = require('../utils');

module.exports = {
  name: 'getpp',
  async run(sock, from, msg, args, q, ctx) {
    const jid = getTarget(msg, q) || ctx.sender;
    const buffer = await getPP(sock, jid);
    if (!buffer) {
      return sock.sendMessage(from, { text: 'Foto profil tidak ditemukan atau disembunyikan.' }, { quoted: msg });
    }
    await sock.sendMessage(from, { image: buffer, caption: 'Foto profil ' + jidNum(jid) }, { quoted: msg });
  }
};
