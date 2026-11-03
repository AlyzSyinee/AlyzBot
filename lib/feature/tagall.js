const { jidNum, requireGroupStaff } = require('../utils');

module.exports = {
  name: 'tagall',
  async run(sock, from, msg, args, q, ctx) {
    if (!(await requireGroupStaff(sock, from, msg, ctx))) return;
    const meta = await sock.groupMetadata(from);
    const mentions = meta.participants.map((p) => p.id);
    const list = meta.participants.map((p) => '@' + jidNum(p.id)).join('\n');
    await sock.sendMessage(from, { text: '*TAG ALL*\n' + (q ? q + '\n' : '') + '\n' + list, mentions }, { quoted: msg });
  }
};
