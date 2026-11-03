const { requireGroupStaff } = require('../utils');

module.exports = {
  name: 'open',
  async run(sock, from, msg, args, q, ctx) {
    if (!(await requireGroupStaff(sock, from, msg, ctx, { needBotAdmin: true }))) return;
    await sock.groupSettingUpdate(from, 'not_announcement');
    await sock.sendMessage(from, { text: 'Grup dibuka. Semua member bisa mengirim pesan.' }, { quoted: msg });
  }
};
