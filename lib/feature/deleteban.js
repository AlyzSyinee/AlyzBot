const { getTarget, jidNum, requireGroupStaff } = require('../utils');

module.exports = {
  name: 'deleteban',
  async run(sock, from, msg, args, q, ctx) {
    if (!(await requireGroupStaff(sock, from, msg, ctx))) return;
    const jid = getTarget(msg, q);
    if (!jid) return sock.sendMessage(from, { text: 'Format: .deleteban <nomor> (atau reply/tag orangnya)' }, { quoted: msg });

    const num = jidNum(jid);
    const set = ctx.bannedInGroup.get(from);
    if (!set || !set.delete(num)) {
      return sock.sendMessage(from, { text: num + ' tidak sedang di-ban.' }, { quoted: msg });
    }
    await sock.sendMessage(from, { text: 'Status ban ' + num + ' dihapus.' }, { quoted: msg });
  }
};
