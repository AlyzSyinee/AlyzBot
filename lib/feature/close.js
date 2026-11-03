const { requireGroupStaff } = require('../utils');

module.exports = {
  name: 'close',
  async run(sock, from, msg, args, q, ctx) {
    if (!(await requireGroupStaff(sock, from, msg, ctx, { needBotAdmin: true }))) return;
    await sock.groupSettingUpdate(from, 'announcement');
    await sock.sendMessage(from, { text: 'Grup ditutup. Hanya admin yang bisa mengirim pesan.' }, { quoted: msg });
  }
};
