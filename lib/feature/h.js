const { requireGroupStaff } = require('../utils');

module.exports = {
  name: 'h',
  async run(sock, from, msg, args, q, ctx) {
    if (!(await requireGroupStaff(sock, from, msg, ctx))) return;
    const meta = await sock.groupMetadata(from);
    const mentions = meta.participants.map((p) => p.id);
    await sock.sendMessage(from, { text: q || '@everyone', mentions }, { quoted: msg });
  }
};
