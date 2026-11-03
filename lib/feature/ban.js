const { getTarget, jidNum, isOwner, requireGroupStaff } = require('../utils');

module.exports = {
  name: 'ban',
  async run(sock, from, msg, args, q, ctx) {
    if (!(await requireGroupStaff(sock, from, msg, ctx, { needBotAdmin: true }))) return;
    const jid = getTarget(msg, q);
    if (!jid) return sock.sendMessage(from, { text: 'Format: .ban <nomor> (atau reply/tag orangnya)' }, { quoted: msg });

    const num = jidNum(jid);
    if (isOwner(num)) return sock.sendMessage(from, { text: 'Owner tidak bisa di-ban.' }, { quoted: msg });

    if (!ctx.bannedInGroup.has(from)) ctx.bannedInGroup.set(from, new Set());
    ctx.bannedInGroup.get(from).add(num);
    await sock.sendMessage(from, { text: num + ' di-ban. Pesannya akan otomatis dihapus.' }, { quoted: msg });
  }
};
