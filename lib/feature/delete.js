const { getContext, jidNum, requireGroupStaff } = require('../utils');

module.exports = {
  name: 'delete',
  async run(sock, from, msg, args, q, ctx) {
    const c = getContext(msg.message);
    if (!c || !c.stanzaId) return sock.sendMessage(from, { text: 'Reply pesan yang ingin dihapus dengan .delete' }, { quoted: msg });
    if (ctx.isGroup && !(await requireGroupStaff(sock, from, msg, ctx))) return;

    const participant = c.participant;
    const mine = jidNum(participant) === jidNum(sock.user.id);
    await sock.sendMessage(from, {
      delete: { remoteJid: from, fromMe: mine, id: c.stanzaId, participant }
    });
  }
};
